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
    .parse(process.argv);

// read installation zone grammar
console.log('reading installation zone grammar from %s', program.grammar);
Grammar = readJSON(program.grammar);
console.log('parsed %d grammar rules', Object.keys(Grammar).length);

// read semantic entities (input symbols)
console.log('* reading semantic entities from %s', program.input);
Symbols = readJSON(program.input);
console.log('parsed %d entities', Symbols.length);

// adapt input
Symbols.forEach(function (s) {
  if (s.label=="WALL")
  {
    var a = s.attributes;
    if (s.hasOwnProperty('left')) { a['connleft'] = s.left; }
    if (s.hasOwnProperty('right')) { a['connright'] = s.right; }
    if (s.hasOwnProperty('crosslink')) { a['conncrosslink'] = s.crosslink; }
  }
});


// -------------------------------------------------------------------------------
// evaluate the grammar
while(Symbols.length > 0)
{
    Symbols = grammar.evaluateGrammarStep(Symbols, TerminalSymbols, Grammar);
}

TerminalSymbols.forEach(function (t) {
    if (t.label == "wall") {
        t.bb = new vec.AABB();
        WALLS[t.attributes.id] = t;
    }
});

// write SVG with terminal symbols (objects + installation zones)
mkdirSync(program.output + "svg_grammar");
var wallsvg = svgexport.ExportTerminalsToSVG(TerminalSymbols);
for (var w in wallsvg) {
    var wall = wallsvg[w];
    fs.writeFileSync(util.format("%s/svg_grammar/%s.svg", program.output, w), wall);
}
// -------------------------------------------------------------------------------
// build installation zone graph

var G = new graph.Graph();

// get bounding box
TerminalSymbols.forEach(function (symbol)
{
    var att = symbol.attributes;
    if (att.hasOwnProperty("id")) {
        var bb = WALLS[att["id"]].bb;
        bb.insert(att.left, att.top);
        bb.insert(att.left + att.width, att.top + att.height);
    }
    if (att.hasOwnProperty("wallid")) {
        var bb = WALLS[att["wallid"]].bb;
        bb.insert(att.left, att.top);
        bb.insert(att.left + att.width, att.top + att.height);
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
TerminalSymbols.forEach(function (t) {
    if (t.label=='door' || t.label=='window')
    {
        // test if any graph edge overlaps with an 'obstacle'
        for (var e in G.E)
        {
            if (graph2d.edgeAABBIntersection(G, G.E[e], t.attributes)) {
                if (t.wallid == G.N[G.E[e].v0].wallid) {
                    G.removeEdge(e);
                }
            }
        }
    }
});


var ROOT = null;

// insert detections: insert as node if "near" to zone, connect to nearest zone otherwise
for (var ts in TerminalSymbols) {
    var t = TerminalSymbols[ts];
    if (t.label=='switch' || t.label=='socket' || t.label=='root') {
        var a = t.attributes;
        var p = new vec.Vec2(a.left + a.width / 2, a.top + a.height / 2, a.wallid);
        p.terminal = t;
        // get line with minimal normal projection distance
        var mindist=Number.MAX_VALUE;
        var minedge=null;
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
            if (p.sub(q).length() > wall.attributes.zone_width/2)
            {
                // add an additional edge, TODO:check for occluders
                G.addEdge(p,q);
                endpoint = { pos:p, terminal:t };
            } else {
                // inside installation zone
                endpoint = { pos:q, terminal:t };
            }
            EndPoints.push(endpoint);
            if (t.label == 'root')
            {
                ROOT = endpoint;
            }
        }
    }
}

if (ROOT == null) {
    console.log("WARNING: no root found, using an endpoint.");
    if (EndPoints.length > 0) {
        ROOT = EndPoints[0];
    } else {
        console.log("ERROR: no endpoints.");
    }
}

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
    if (Object.keys(WALLCONN[conn]).length == 2) {
        var K = Object.keys(WALLCONN[conn]);
        var A = WALLCONN[conn][K[0]];
        var B = WALLCONN[conn][K[1]];
        // connect points at similar height
        for (var va in A) {
            var VA = A[va];
            for (var vb in B) {
                var VB = B[vb];
                if (Math.abs(VA.y - VB.y) < 2) {
                    console.log(util.format("connecting %s<->%s at %s-%s", Object.keys(WALLCONN[conn])[0], Object.keys(WALLCONN[conn])[1]),va,vb);
                    G.addEdge(VA, VB);
                }
            }
        }                
    } else {
        if (Object.keys(WALLCONN[conn]).length > 2) {
            console.log("not handled connectivity case!");
        }
    }
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
    var i =0;
    // - find shortest path from current endpoint to tree, for all endpoints
    while(EP.length > 0) {
        var best = { path:{cost: Number.MAX_VALUE }, ep: null };
        for (var epid in EP)
        {
            var ep = EP[epid];
            //console.log("Processing EndPoint: %d,%d", ep.pos.x, ep.pos.y);
            var path = graph2d.getShortestPath(G, T, ep.pos);   // { edge: [], cost: <val> }
            if (path.path.length > 0 && path.cost < best.path.cost) {
                //console.log(util.format("found new best path, cost: %d, old best %d, length", path.cost, best.path.cost, path.path.length));
                best.path = path;
                best.ep   = ep;
            }
        }
        // add path to tree, remove endpoint
        if (best.path.path.length > 0) {
            T.addPathFromGraph(G, best.path.path);
            wgutil.removeArrObj(EP, best.ep);
            //fs.writeFileSync(util.format("wire-graph-%d.svg", ++i), svgexport.ExportGraphToSVG(T));
            if (i > EndPoints.length) {
                return T;
            }
        }
    }
    return T;
}

var WireTree = findWireTree(G, ROOT, EndPoints);
//console.log(WireTree);

fs.writeFileSync(util.format("%s/iz-graph.json",program.output), JSON.stringify(G));
fs.writeFileSync(util.format("%s/iz-graph.dot", program.output), G.exportToGraphViz());

fs.writeFileSync(util.format("%s/hypothesis-graph.json", program.output), JSON.stringify(WireTree));
fs.writeFileSync(util.format("%s/hypothesis-graph.dot", program.output), WireTree.exportToGraphViz());


// --------------------------------------------------------------------------------------------------------------------
mkdirSync(program.output + "svg_hypothesis");
for (var wallid in WALLS) {
    fs.writeFileSync(util.format("%s/svg_hypothesis/%s.svg", program.output, wallid), svgexport.ExportGraphToSVG(WireTree, wallid, WALLS[wallid].bb));
}

//fs.writeFileSync("wire-graph.svg", svgexport.ExportGraphToSVG(WireTree));
console.log("=== WireGen Finished ===");

