"use strict";
// export installation zone grammar terminals and 2d graphs to SVG
//
// ulrich.krispel@vc.fraunhofer.at

var util = require('util');
var vec = require('./vec');

// returns an object with one svg string per wall
function ExportTerminalsToSVG(symbols, imgprefix, flip)
{
    var s = 0.1;    // scale

    var result = {};
    var resultbb = {};
    var WALLS = [];

    // get bounding box per wall
    symbols.forEach(function (symbol)
    {
        var att = symbol.attributes;
        if (att.hasOwnProperty('wallid')) {
            if (!resultbb.hasOwnProperty(att.wallid)) {
                resultbb[att.wallid] = new vec.AABB();
            }
            resultbb[att.wallid].insert(att.left, att.top);
            resultbb[att.wallid].insert(att.left + att.width, att.top + att.height);
        }
        if (symbol.label == "wall") {
            WALLS.push(symbol);
            if (!resultbb.hasOwnProperty(att.id)) {
                resultbb[att.id] = new vec.AABB();
            }
            resultbb[att.id].insert(att.left, att.top);
            resultbb[att.id].insert(att.left + att.width, att.top + att.height);
        }
    });

    // initialize wall svgs
    WALLS.forEach(function (symbol) {
        var att = symbol.attributes;
        result[att.id] = util.format('<svg width="%s" height="%s" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n', att.width * s, att.height * s);

        if (imgprefix) {
            result[att.id] += util.format('<image xlink:href="%s_%s.jpg" y="0" width="%d" height="%d"', imgprefix, att.id, att.width * s, att.height * s);
            if (flip==true || flip=="true") {
                result[att.id] += util.format(' transform="scale(-1,1)" x="%d" ', -resultbb[att.id].width() * s);
            } else {
                result[att.id] += ' x="0" ';
            }

            result[att.id] += ' />\n';
        } else {
            result[att.id] += util.format('<rect width="%d" height="%d" style="fill:rgb(240,240,240);stroke-width:3;stroke:rgb(0,0,0)" />\n', resultbb[att.id].width() * s, resultbb[att.id].height() * s);
        }
        //result[att.id] += util.format('<rect width="%d" height="%d" style="fill:rgb(240,240,240);stroke-width:3;stroke:rgb(0,0,0)" />\n', resultbb[att.id].width() * s, resultbb[att.id].height() * s);
    });

    //var result = util.format('<svg width="%s" height="%s" version="1.1" xmlns="http://www.w3.org/2000/svg">\n', bb.width()*s, bb.height()*s);
    // draw bounding box
    //result += util.format('<rect width="%d" height="%d" style="fill:rgb(240,240,240);stroke-width:3;stroke:rgb(0,0,0)" />\n', bb.width()*s, bb.height()*s);

    symbols.forEach(function (symbol)
    {
        var att = symbol.attributes;
        if (att.hasOwnProperty('wallid')) {
            var bb = resultbb[att.wallid];
            //console.log("looking at symbol " + symbol.label);
            switch(symbol.label)
            {
                case "hzone":
                    result[att.wallid] += util.format('<line x1="%d" y1="%d" x2="%d" y2="%d" stroke-dasharray="10,10" style="stroke:rgb(255,0,0);stroke-width:2;" />\n', 0, att.pos*s, bb.width()*s, att.pos*s);
                    break;
                case "vzone":
                    result[att.wallid] += util.format('<line x1="%d" y1="%d" x2="%d" y2="%d" stroke-dasharray="10,10" style="stroke:rgb(255,0,0);stroke-width:2;" />\n', att.pos*s, 0, att.pos*s, bb.height()*s);
                    break;
                case "door": case "window":
                    result[att.wallid] += util.format('<rect x="%d" y="%d" width="%d" height="%d" style="fill:rgb(200,200,100);stroke-width:3;stroke:rgb(0,0,0)" />\n', att.left*s, att.top*s, att.width*s, att.height*s);
                    break;
                case "socket":
                    result[att.wallid] += util.format('<rect x="%d" y="%d" width="%d" height="%d" style="fill:none;stroke-width:3;stroke:rgb(0,0,200)" />\n', att.left*s, att.top*s, att.width*s, att.height*s);
                    break;
                case "switch":
                    result[att.wallid] += util.format('<rect x="%d" y="%d" width="%d" height="%d" style="fill:none;stroke-width:3;stroke:rgb(0,200,0)" />\n', att.left*s, att.top*s, att.width*s, att.height*s);
                    break;
                case "vgroup":
                    result[att.wallid] += util.format('<rect x="%d" y="%d" width="%d" height="%d" style="fill:none;stroke-width:3;stroke:rgb(200,200,0)" />\n', att.left * s, att.top * s, att.width * s, att.height * s);
                    break;
                case "hgroup":
                    result[att.wallid] += util.format('<rect x="%d" y="%d" width="%d" height="%d" style="fill:none;stroke-width:3;stroke:rgb(200,0,200)" />\n', att.left * s, att.top * s, att.width * s, att.height * s);
                    break;
            }
        }
    });

    WALLS.forEach(function (symbol) {
        var att = symbol.attributes;
        result[att.id] += '<text x="10" y="20" fill="black">' + att.id + '</text>'
        result[att.id] += '</svg>\n';
    });

    return result;
}


function ExportGraphToSVG(G, wallid, bb, imgprefix, flip)
{

    var s = 0.1;    // scale

    // get bounding box if not supplied
    if (!bb) {
        bb = new vec.AABB();
        for (var n in G.N) {
            var v = G.N[n];
            if (v.wallid == wallid) {
                bb.insert(v.x, v.y);
            }
        }
    }

    var result = util.format('<svg width="%s" height="%s" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n', bb.width() * s, bb.height() * s);

    if (imgprefix) {
        result += util.format('<image xlink:href="%s_%s.jpg" y="0" width="%d" height="%d"', imgprefix, wallid, bb.width() * s, bb.height() * s);
        if (flip == true || flip == "true") {
            result += util.format(' transform="scale(-1,1)" x="%d" ', -bb.width() * s);
        } else {
            result += ' x="0" ';
        }

        result += ' />\n';
    } else {
        result += util.format('<rect width="%d" height="%d" style="fill:rgb(240,240,240);stroke-width:3;stroke:rgb(0,0,0)" />\n', bb.width() * s, bb.height() * s);
    }
    // link to ortho image

    // draw vertices
    for (var n in G.N) {
        var v = G.N[n];
        if (v.wallid == wallid) {
            //result += util.format('<text x="%s" y="%s">V%s</text>',v.x*s,v.y*s,n);
            if (v.terminal) {
                var att = v.terminal.attributes;
                switch (v.terminal.label) {
                    case "socket":
                        result += util.format('<rect x="%d" y="%d" width="%d" height="%d" style="fill:none;stroke-width:3;stroke:rgb(0,0,200)" />\n', att.left * s, att.top * s, att.width * s, att.height * s);
                        break;
                    case "switch":
                        result += util.format('<rect x="%d" y="%d" width="%d" height="%d" style="fill:none;stroke-width:3;stroke:rgb(0,200,0)" />\n', att.left * s, att.top * s, att.width * s, att.height * s);
                        break;
                    case "root":
                        result += util.format('<rect x="%d" y="%d" width="%d" height="%d" style="fill:none;stroke-width:3;stroke:rgb(0,0,200)" />\n', att.left * s, att.top * s, att.width * s, att.height * s);
                        break;
                }
            }
            result += util.format('<circle cx="%s" cy="%s" r="3" stroke="black" stroke-width="1" fill="black" />\n', v.x * s, v.y * s);
        }
    }
    // draw edges
    for (var eid in G.E) {
        var e = G.E[eid];
        var v0 = G.N[e.v0];
        var v1 = G.N[e.v1];
        if (v0.wallid == wallid && v1.wallid==wallid) {
            result += util.format('<line x1="%d" y1="%d" x2="%d" y2="%d" stroke-dasharray="10,10" style="stroke:rgb(255,0,0);stroke-width:2;" />\n', v0.x * s, v0.y * s, v1.x * s, v1.y * s);
        }
    }
    // draw wall label
    result += '<text x="10" y="20" fill="black">' + wallid + '</text>'
    result += '</svg>\n';
    return result;
}

module.exports = {
    ExportTerminalsToSVG : ExportTerminalsToSVG,
    ExportGraphToSVG     : ExportGraphToSVG
};
