#!/usr/bin/env node
"use strict";
// WireGen - electrical appliance hypothesis
// 
// ulrich.krispel@vc.fraunhofer.at
//
var fs = require('fs');
var path = require('path');
var util = require('util');
var pkg=require( path.join(__dirname, 'package.json') );
var program = require('commander');

var vec = require('./vec');
var wgutil = require('./wgutil');
var grammar = require('./grammar');
var graph = require('./graph');
var graph2d = require('./graph-2d');
var svgexport = require('./svgexport');

// globals
var TerminalSymbols = [];
var EndPoints = [];
var Symbols = [];
var Grammar = {};
var WALLS = {}

// -----------------------------------------------------
function readJSON(filename)
{
    return JSON.parse(fs.readFileSync(filename, "utf8"));
}
// grammar utility functions
function getTerminalByAttribute(T, label, attname, attvalue) {
    for (var t in T) {
        if (T[t].label == label) {
            var a = T[t].attributes;
            if (attname in a) {
                if (a[attname] == attvalue) {
                    return T[t];
                }
            }
        }
    }
    return null;
}
var mkdirSync = function (path) {
    try {
        fs.mkdirSync(path);
    } catch (e) {
        if (e.code != 'EEXIST') throw e;
    }
}

// Parse command line options
program
    .version(pkg.version)
    .option('-i, --input [json]', 'Set Input Symbols', 'input.json')
    .option('-g, --grammar [json]', 'Set Installation Zone Grammar', 'grammar.json')
    .option('-o, --output [dir]', 'Set Output Directory', './')
    .option('-p, --prefix [string]', 'Orthophoto prefix string', '')
    .option('-c, --ccw [boolean]', 'Orientation', false)
    .parse(process.argv);

// read installation zone grammar
console.log('reading installation zone grammar from %s', program.grammar);
Grammar = readJSON(program.grammar);
console.log('parsed %d grammar rules', Object.keys(Grammar).length);

// read semantic entities (input symbols)
console.log('* reading semantic entities from %s', program.input);
Symbols = readJSON(program.input);
console.log('parsed %d entities', Symbols.length);

console.log('Orientation is ' + program.ccw);
// adapt input

var WALLINPUT= {}
Symbols.forEach(function (s) {
    if (s.label == "WALL") {
        WALLINPUT[s.attributes.id] = s;
        var a = s.attributes;
        if (s.hasOwnProperty('left'))      { a['connleft'] = (program.ccw == "true" || program.ccw == true) ? s.left : s.right; }
        if (s.hasOwnProperty('right'))     { a['connright'] = (program.ccw == "true" || program.ccw == true) ? s.right : s.left; }
        if (s.hasOwnProperty('crosslink')) { a['conncrosslink'] = s.crosslink; }
    }
});

Symbols.forEach(function (s) {
    // flip coordinates of wrongly oriented symbols
    if (!(program.ccw == "true" || program.ccw == true)) {
        if (s.attributes.wallid) {
            if (s.label == "DOOR" || s.label == "WINDOW") {
                s.attributes.left = WALLINPUT[s.attributes.wallid].attributes.width - (s.attributes.left + s.attributes.width);
            }
        }
    }
});

// -------------------------------------------------------------------------------
console.log("evaluating grammar...");
// evaluate the grammar
var steps = 0;
while(grammar.evaluateGrammarStep(Symbols, TerminalSymbols, Grammar))
{
    steps = steps + 1;
}
console.log("evaluation took " + steps + " steps.");

// collect walls
var numSockets = 0;
var numSwitches = 0;
var numWalls = 0;
var WALLS = {};

TerminalSymbols.forEach(function (t) {
    if (t.label == "wall") {
        WALLS[t.attributes.id] = t;
        t.bb = new vec.AABB();
        numWalls = numWalls + 1;
    }
    if (t.label == "socket") numSockets = numSockets + 1;
    if (t.label == "switch") numSwitches = numSwitches + 1;
    //if (t.label == "vgroup") console.log("vgroup height:" + t.attributes.height);
});

for (var w in WALLS) {
    if (w == "wall0") {
        var wall = WALLS[w];
        console.log("######### WALL:" + w);
        TerminalSymbols.forEach(function (s) {
            if (s.attributes.wallid == w) {
                console.log(JSON.stringify({ 'label': s.label, 'left': s.attributes.left }));
            }
        });
    }
}



//for (var w in WALLS) {
//    if (w == "wall0") {
//        var wall = WALLS[w];
//        console.log("######### WALL:" + w);
//        TerminalSymbols.forEach(function (s) {
//            if (s.attributes.wallid == w) {
//                console.log(JSON.stringify({ 'label': s.label, 'left': s.attributes.left }));
//            }
//        });
//    }
//}

console.log("found " + numWalls + " walls, " + numSwitches + " switches and " + numSockets + " sockets.");

// get wall arrangements
var WALLORDER = [];
{
    // build left index
    var LEFT = {}
    for (var w in WALLS) {
        LEFT[WALLS[w].attributes.connleft] = WALLS[w];
    }
    
    while (Object.keys(LEFT).length > 0) {
        var current = LEFT[Object.keys(LEFT)[0]];
        var corder = [];
        do {
            corder.push(current.attributes.id);               // add to ordered list
            delete LEFT[current.attributes.connleft];         // remove entry
            current = LEFT[current.attributes.connright];     // move to next
        } while (current);
        WALLORDER.push(corder);
    }
}
console.log("WALL ORDER:");
console.log(WALLORDER);

// -------------------------------------------------------------------------------
// build installation zone graph

var G = new graph.Graph();

// calculate wall bounding boxes
TerminalSymbols.forEach(function (symbol)
{
    var att = symbol.attributes;
    if (att["id"]) {
        var bb = WALLS[att["id"]].bb;
        bb.insert(att.left, att.top);
        bb.insert(att.left + att.width, att.top + att.height);
    }
    if (att["wallid"]) {
        if (WALLS[att["wallid"]]) {
            var bb = WALLS[att["wallid"]].bb;
            bb.insert(att.left, att.top);
            bb.insert(att.left + att.width, att.top + att.height);
        } else {
            console.log("terminal " + symbol.label + " wall id " + att.wallid + " not found!");
        }
    }
});

// create initial arrangement graph from h and v zones
TerminalSymbols.forEach(function (t)
{
    var att = t.attributes;
    switch(t.label)
    {
        case 'hzone':
        {
            var v0 = new vec.Vec2(WALLS[att.wallid].bb.bbmin.x, att.pos, att.wallid);
            var v1 = new vec.Vec2(WALLS[att.wallid].bb.bbmax.x, att.pos, att.wallid);
            //hzones.push(G.addEdge(v0, v1));
            graph2d.insertArrangementEdge(G, v0, v1);
        }
        break;
        case 'vzone':
        {
            var v0 = new vec.Vec2(att.pos, WALLS[att.wallid].bb.bbmin.y, att.wallid);
            var v1 = new vec.Vec2(att.pos, WALLS[att.wallid].bb.bbmax.y, att.wallid);
            //vzones.push(G.addEdge(v0, v1));
            graph2d.insertArrangementEdge(G, v0, v1);
        }
        break;
    }
    //fs.writeFileSync(util.format("step-%d.svg",i++), svgexport.ExportGraphToSVG(G));
});

// remove segments that overlap with openings
var removededges = 0;
for (ts in TerminalSymbols) {
    t = TerminalSymbols[ts];
    if (t.label=='door' || t.label=='window')
    {
        // test if any graph edge overlaps with an 'obstacle'
        for (var e in G.E)
        {
            if (t.attributes.wallid == G.N[G.E[e].v0].wallid) {
                if (graph2d.edgeAABBIntersection(G, G.E[e], t.attributes)) {
                    //console.log("removing edge " + e);
                    G.removeEdge(e);
                    removededges++;
                }
            }
        }
    }
}
console.log("removed " + removededges + " edges that overlapped with openings.");

var ROOT = null;
// insert detections: insert as node if "near" to zone, connect to nearest zone otherwise
for (var ts in TerminalSymbols) {
    var term = TerminalSymbols[ts];

    if (term.label == 'switch' || term.label == 'socket' || term.label == 'root') {
        var validEndPoint = true;
        // ignore if inside an opening
        var a = term.attributes;
        var posx = a.left + a.width / 2;
        var posy = a.top + a.height / 2;
        for (var tso in TerminalSymbols) {
            var to = TerminalSymbols[tso];
            if (to.label == 'door' || to.label == 'window') {
                if (to.attributes.wallid == a.wallid) {
                    var att = to.attributes;
                    var l = att.left, t = att.top, r = att.left + att.width, b = att.top + att.height;
                    if ((posx >= l && posx <= r && posy >= t && posy <= b)) {
                        validEndPoint = false;
                        //console.log("endpoint " + term.label + " inside opening.");
                    }
                }
            }
        }
        
        if (validEndPoint) {
            var p = new vec.Vec2(a.left + a.width / 2, a.top + a.height / 2, a.wallid);
            p.terminal = term;
            // get line with minimal normal projection distance
            var mindist = Number.MAX_VALUE;
            var minedge = null;
            for (var e in G.E) {
                if (G.N[G.E[e].v0].wallid == a.wallid) {
                    var dist = graph2d.pointEdgeDist(G, G.E[e], p);
                    if (dist != null) {
                        if (dist < mindist) {
                            mindist = dist;
                            minedge = e;
                        }
                    }
                }
            }
            if (minedge != null) {
                // shortest edge was found
                var wall = getTerminalByAttribute(TerminalSymbols, 'wall', 'id', a.wallid);
                if (wall != null)
                    
                    var q = graph2d.edgePointProjection(G, G.E[minedge], p);
                q.wallid = p.wallid;
                q.terminal = p.terminal;
                var v = graph2d.splitGraphEdge(G, G.E[minedge], q);
                var endpoint;
                if (p.sub(q).length() > wall.attributes.zone_width / 2) {
                    // add an additional edge, TODO:check for occluders
                    G.addEdge(p, q);
                    endpoint = { pos: p, terminal: term };
                } else {
                    // inside installation zone
                    endpoint = { pos: q, terminal: term };
                }
                EndPoints.push(endpoint);
                if (term.label == 'root') {
                    ROOT = endpoint;
                }
            }
        }
    }
}

// sort endpoints by Y
EndPoints.sort(function (a, b){
    return a.pos.y - b.pos.y;
}
);


if (!ROOT) {
    console.log("WARNING: no root found, using an endpoint.");
    if (EndPoints.length > 0) {
        ROOT = EndPoints[0];
    } else {
        console.log("ERROR: no endpoints.");
        return;
    }
}
// Display endpoint statistics
var epstat = { 'socket': 0, 'switch': 0 };
for (var e in EndPoints) {
    epstat[EndPoints[e].terminal.label] = epstat[EndPoints[e].terminal.label] + 1;
}
console.log("Endpoints:" + epstat);

console.log("Connecting walls...");
// Connect wall segments
var WALLCONN = {};

function insertWallConnection(connid, v)
{
    if (!WALLCONN.hasOwnProperty(connid)) {
        WALLCONN[connid] = {};
    }
    if (!WALLCONN[connid].hasOwnProperty(v.wallid)) {
        WALLCONN[connid][v.wallid] = {};
    }
    WALLCONN[connid][v.wallid][v._id] = v;
}

function clusterVerticesByY(vertices)
{
    var clusters = [];
    // poor mans clustering, if necessary integrate a better method like 1D meanshift
    for (var i=0; i < vertices.length; ++i) {
        var v = vertices[i];
        var notfound = true;
        for (var c = 0; c < clusters.length && notfound; ++c) {
            var cluster = clusters[c];
            for (var j = 0; j < cluster.length && notfound; ++j) {
                if (Math.abs(v.y - cluster[j].y) < 3) {
                    cluster.push(v);
                    notfound = false;
                }
            }
        }
        if (notfound) {
            clusters.push([v]);
        }
    }
    return clusters;
}

for (var vid in G.N)
{
    // determine if this vertex is on left or right side of a wall
    var v = G.N[vid];
    if (Math.abs(v.x - WALLS[v.wallid].bb.bbmin.x) < 2) {
        var connid = WALLS[v.wallid].attributes.connleft;
        insertWallConnection(connid, v);
    }
    if (Math.abs(v.x - WALLS[v.wallid].bb.bbmax.x) < 2) {
        var connid = WALLS[v.wallid].attributes.connright;
        insertWallConnection(connid, v);
    }

}
//console.log(WALLCONN);
for (var conn in WALLCONN) {
    var connvertices = [];
    //       cluster all vertices by y coordinate
    for (var wconn in WALLCONN[conn]) {
        for (var v in WALLCONN[conn][wconn]) {
            connvertices.push(WALLCONN[conn][wconn][v]);
        }
    }
    var clusters = clusterVerticesByY(connvertices);

    for (var c = 0; c < clusters.length; ++c) {
        var cluster = clusters[c];
        //  create isolated connection vertex, wallid NaN always creates a new vertex
        var cv = G.checkVertex(new vec.Vec2(0, cluster[0].y, NaN));
        //  connect cluster edges
        for (var i = 0; i < cluster.length; ++i) {
            G.addEdge(cv, cluster[i]);
        }
    }

    /*
    if (Object.keys(WALLCONN[conn]).length == 2) {
        var K = Object.keys(WALLCONN[conn]);
        var A = WALLCONN[conn][K[0]];
        var B = WALLCONN[conn][K[1]];
        // connect points at similar height
        for (var va in A) {
            var VA = A[va];
            for (var vb in B) {
                var VB = B[vb];
                if (Math.abs(VA.y - VB.y) < 3) {
                    console.log(util.format("connecting %s<->%s at %s-%s", Object.keys(WALLCONN[conn])[0], Object.keys(WALLCONN[conn])[1]), va, vb);
                    G.addEdge(VA, VB);
                }
            }
        }                
    } else {
        if (Object.keys(WALLCONN[conn]).length > 2) {
            console.log("not handled connectivity case!");
        }
    }
    */
}

//// debug
//for (var wallid in WALLS) {
//    fs.writeFileSync(util.format("graph-all-%s.svg", wallid), svgexport.ExportGraphToSVG(G, wallid));
//}

// --------------------------------------------------------------------------------------------------------------------
// WIRE HYPOTHESIS
// extract tree from graph:
function findWireTree(G, root, EndPoints)
{
    var EP = EndPoints.slice();
    var T = new graph.Graph();
// - insert root in tree
    var v = G.isGraphVertex(root.pos);
    T.N[v._id]=v;
    wgutil.removeArrObj(EP, root);
    var i = 0;
    // - find shortest path from current endpoint to tree, for all endpoints
    while(EP.length > 0) {
        var best = { path:{cost: Number.MAX_VALUE }, ep: null };
        for (var epid in EP)
        {
            var ep = EP[epid];
            //console.log("Processing EndPoint: %d,%d", ep.pos.x, ep.pos.y);
            var path = graph2d.getShortestPath(G, T, ep.pos);   // { edge: [], cost: <val> }
            if (path) {
                if (path.path.length > 0 && path.cost < best.path.cost) {
                    //console.log(util.format("found new best path, cost: %d, old best %d, length", path.cost, best.path.cost, path.path.length));
                    best.path = path;
                    best.ep = ep;
                }
            } 
        }
        if (best.path.path) {
            // add path to tree, remove endpoint
            if (best.path.path.length > 0) {
                T.addPathFromGraph(G, best.path.path);
                wgutil.removeArrObj(EP, best.ep);
                //fs.writeFileSync(util.format("wire-graph-%d.svg", ++i), svgexport.ExportGraphToSVG(T));
                if (i > EndPoints.length) {
                    return T;
                }
            }
        } else {
            // tree is isolated (no endpoints connect to this tree)
            // -> insert new endpoint into tree (may become new tree)
            if (!G.forestRoots) G.forestRoots = [];
            var ep = EP[0];
            var v = G.isGraphVertex(ep.pos);
            T.N[v._id] = v;
            G.forestRoots.push(v);
            wgutil.removeArrObj(EP, ep);
        }
    }
    return T;
}

console.log("Extracting wire hypothesis...");
var WireTree = findWireTree(G, ROOT, EndPoints);

console.log("writing output...");

try {
    fs.mkdirSync(program.output);
} catch (err) { }

fs.writeFileSync(util.format("%s/iz-graph.json",program.output), JSON.stringify(G));
fs.writeFileSync(util.format("%s/iz-graph.dot", program.output), G.exportToGraphViz());

fs.writeFileSync(util.format("%s/hypothesis-graph.json", program.output), JSON.stringify(WireTree));
fs.writeFileSync(util.format("%s/hypothesis-graph.dot", program.output), WireTree.exportToGraphViz());


// --------------------------------------------------------------------------------------------------------------------

// param: array of svg sourcecode
function createHTMLOutput(wallorder, svg)  
{
    var SVG_HTML = "<html><body>\n";
    WALLORDER.forEach(function (cycle) {
        cycle.forEach(function (id) {
            SVG_HTML += svg[id] + "\n";
        });
        SVG_HTML += '<br>\n\n'
    });
    SVG_HTML += "</body></html>\n";
    return SVG_HTML;
}




// write SVG with terminal symbols (objects + installation zones)
mkdirSync(program.output);
mkdirSync(program.output + "/svg_grammar");
var grammarSVG = svgexport.ExportTerminalsToSVG(TerminalSymbols, program.prefix, program.flip);
for (var w in grammarSVG) {
    var wall = grammarSVG[w];
    fs.writeFileSync(util.format("%s/svg_grammar/%s.svg", program.output, w), wall);
}
fs.writeFileSync(util.format("%s/svg_grammar/index.html", program.output), createHTMLOutput(WALLORDER, grammarSVG));


mkdirSync(program.output + "/svg_hypothesis");
var hypothesisSVG = {};
for (var wallid in WALLS) {
    hypothesisSVG[wallid] = svgexport.ExportGraphToSVG(WireTree, wallid, WALLS[wallid].bb, program.prefix, program.flip);
    fs.writeFileSync(util.format("%s/svg_hypothesis/%s.svg", program.output, wallid), hypothesisSVG[wallid]);
    var fullgraphsvg = svgexport.ExportGraphToSVG(G, wallid, WALLS[wallid].bb, program.prefix, program.flip);
    fs.writeFileSync(util.format("%s/svg_hypothesis/%s_fullgraph.svg", program.output, wallid), fullgraphsvg);
}
fs.writeFileSync(util.format("%s/svg_hypothesis/index.html", program.output), createHTMLOutput(WALLORDER, hypothesisSVG));

//fs.writeFileSync("wire-graph.svg", svgexport.ExportGraphToSVG(WireTree));
console.log("=== WireGen Finished ===");

