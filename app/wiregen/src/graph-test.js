"use strict";
// small graph unit tests
//
// ulrich.krispel@vc.fraunhofer.at

var vec = require('./vec');
var graph = require('./graph');
var graph2d = require('./graph-2d');

// graph test
var G = new graph.Graph();

v0 = new vec.Vec2(0,0);     // 0
v1 = new vec.Vec2(10,0);    // 1
v2 = new vec.Vec2(10,10);   // 2
v3 = new vec.Vec2(0,10);    // 3

v4 = new vec.Vec2(10,10);   // 2
v5 = new vec.Vec2(5,5);     // 4

G.addEdge(v0,v1);
G.addEdge(v0,v2);
G.addEdge(v0,v3);
G.addEdge(v1,v2);
G.addEdge(v2,v3);
G.addEdge(v1,v0);   // redundant edge
G.addEdge(v4,v5);   // makes actually 2:4

var E = G.getEdges();
console.log(E);

console.log('remove v0<->v3');
G.removeEdge(v0,v3);
var E = G.getEdges();
console.log(E);

// projection test
var e = new graph.Edge(v1,v2);
var t0 = new vec.Vec2(11, 5);
var p = graph2d.edgePointProjection(G, e, t0);
console.log(graph2d.edge2txt(G,e) + ":" + t0 + "->" + p);

var e2 = new graph.Edge(v0,v2);
var t1 = new vec.Vec2(5, 7);
var p2 = graph2d.edgePointProjection(G, e2, t1);
console.log(graph2d.edge2txt(G,e2) + ":" + t1 + "->" + p2);


