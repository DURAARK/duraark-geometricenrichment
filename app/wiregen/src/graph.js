"use strict";
// A simple graph structure with undirected edges
// 
// ulrich.krispel@vc.fraunhofer.at
//
var util = require('util');

function isEmpty(obj) {
    for(var prop in obj) { if(obj.hasOwnProperty(prop)) return false; }
    return true;
}

function Edge()
{
    if (arguments.length == 2) {
        if (parseInt(arguments[0]._id) < parseInt(arguments[1]._id)) {
            this.v0 = arguments[0]._id;
            this.v1 = arguments[1]._id;
        } else {
            this.v0 = arguments[1]._id;
            this.v1 = arguments[0]._id;
        }
    } else {
        if (arguments.length==1) {
            var V = arguments[0].split(":");
            this.v0 = V[0];
            this.v1 = V[1];
        } else {
            console.log("[EDGE] wrong edge constructor format.");
        }
    }
}
Edge.prototype.toString = function()
{
    return this.v0+":"+this.v1;
};
Edge.prototype.isAdjacentTo = function(v)
{
    if (v.hasOwnProperty('_id'))
        return (this.v0 == v._id) || (this.v1 == v._id);
    return (this.v0 == v) || (this.v1 == v);
}


function Graph()
{
    this.N = {};    // nodes
    this.E = {};    // edges
    this.A = {};    // adjacency
    
    this.nodeid = 0;    // node id counter
}
Graph.prototype.newNodeID = function()
{
    var id;
    do {
        id = this.nodeid++;
    } while(id in this.N);
    return id.toString();
};

Graph.prototype.isGraphVertex = function(v)
{
    // is if v is already correctly stored in nodes
    if (v.hasOwnProperty('_id')) {
        if (v._id in this.N) {
            if (this.N[v._id] == v) {
                return v;
            }
        }
    }
    // iterate over nodes and test against v,
    for (var n in this.N) {
        if (this.N[n].equals(v)) {
            return this.N[n];
        }
    }
    return null;
}

Graph.prototype.checkVertex = function(v)
{
    // see if this vertex is already in the node list
    var n=this.isGraphVertex(v);
    if (n != null){ return n; }
    if (!v.hasOwnProperty('_id')) { // reuse ids
        v['_id'] = this.newNodeID();
    }
    // insert into graph
    this.N[v._id] = v;
    return v;
};

Graph.prototype.addAdjacency = function(v0, v1)
{
    var v0id, v1id;
    if (v0.hasOwnProperty('_id'))
        v0id = v0._id;
    else v0id = v0;
    if (v1.hasOwnProperty('_id'))
        v1id = v1._id;
    else v1id = v1;

    if (!(v0id in this.A)) this.A[v0id] = {};
    this.A[v0id][v1id] = v1;
    if (!(v1id in this.A)) this.A[v1id] = {};
    this.A[v1id][v0id] = v0;
}
Graph.prototype.getAdjacency = function(v)
{
    if (v.hasOwnProperty('_id'))
        return this.A[v._id];
    return this.A[v];
}

Graph.prototype.addEdge = function(v0, v1)
{
    if (!v0.wallid || !v1.wallid) {
        console.log("brak");
    }
    if (!('root' in this)) this['root'] = v0;
    v0 = this.checkVertex(v0);
    v1 = this.checkVertex(v1);
    // vertices now have an ID
    var edge = new Edge(v0, v1);
    if (!(edge in this.E)) {
        // set adjacencies
        this.addAdjacency(v0, v1);
        this.E[edge] = edge;
    }
    return edge;
};

Graph.prototype.removeEdge = function() {
    var edge;
    if (arguments.length == 2) {
        edge = new Edge(arguments[0], arguments[1]);
    } else {
        edge = new Edge(arguments[0]);
    }
    if (edge in this.E)
    {
        var v0 = this.N[edge.v0], v1 = this.N[edge.v1];
        delete this.A[v0._id][v1._id];
        delete this.A[v1._id][v0._id];
        delete this.E[edge];
    }
};

Graph.prototype.DFS = function(visitor, startnode)
{
    var visited = {};
    var G = this;
    if (!startnode) startnode = this.root;

    var visit = function(node)
    {
        if (!(node._id in visited))
        {
            visited[node._id] = true;
            visitor(node);
            for (var a in node.adjacent)
            {
                visit(G.N[a]);
            }
        }
    };
    visit(startnode);
};

Graph.prototype.getEdges = function()
{
    result=[];
    for (key in this.E)
        result.push(this.E[key]);
    return result;
};


// add path in G to this graph (retains ids)
Graph.prototype.addPathFromGraph = function addPath(G, path) {
    for (var eid in path) {
        var e = G.E[path[eid]];
        var ev0 = G.N[e.v0];
        var ev1 = G.N[e.v1];
        this.addEdge(ev0, ev1);
    }
}

Graph.prototype.checkIntegrity = function () {
    // every vertex has to have a valid id
    for (var v in this.N) {
        if (!this.N[v].hasOwnProperty('_id')) {
            return false;
        }
    }
    // check edge links
    for (var e in this.E) {
        var edge = new Edge(e);
        if (edge.v0 != this.E[e].v0) return false;
        if (edge.v1 != this.E[e].v1) return false;
    }
    // check vertex adjacency links
    for (var a in this.A) {
        if (!(a in this.N)) return false;
        var adjacent = this.A[a];
        for (adj in adjacent) {
            if (adj != adjacent[adj]._id)
                return false;
        }        
    }
    return true;
};

Graph.prototype.exportToGraphViz = function ()
{
    var dot = "";

    dot += "digraph G {\n";
    for (var v in this.N) {
        dot += " V" + v + " [label=\"V" + v + ":" + this.N[v].wallid;
        if (v.terminal) {
            dot += "-" + v.terminal.label;
        }
        dot += "\"]\n";
    }
    for (var e in this.E) {
        var edge = new Edge(e);
        dot += " V" + edge.v0 + " -> V" + edge.v1 + "\n";
    }
    dot += "}\n";
    return dot;
}

module.exports =
{
    Graph : Graph,
    Edge  : Edge
};
