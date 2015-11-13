
var XMLWriter = require('xml-writer');
var Vec3 = require('./vec3');
var Earcut = require('./earcut');

var Rise2X3D = module.exports = function() {
};


//----------------------------------------------------------------------------

Rise2X3D.prototype.test = function(bla) {
	console.log(bla);
}

//----------------------------------------------------------------------------

Rise2X3D.prototype.parseRooms = function(walljson, filterid) {
  var ROOMS = {};
  var room2wall = {};
  
  if (filterid) {
    console.log('filtering for room ' + filterid)
  }

  // build room wall cycles
  for (var i in walljson.Walls)
  {
    var wall = walljson.Walls[i];

	    // build room->walls index
	    if (!room2wall[wall.attributes.roomid]) 
	      room2wall[wall.attributes.roomid]=[];
	      
	    room2wall[wall.attributes.roomid].push(wall);
  }

  for (var roomid in room2wall)
  {
    if (filterid==undefined || roomid==filterid)
    {
      // create new room
      room = {
        "label" : roomid,
        "walls" : []
      }
      // get ordered wall cycle
      unordered = room2wall[roomid].slice();
      ordered = [];
      while(unordered.length > 0)
      {
        var nocycle=true;
        if (ordered.length==0) {
          // start with any element
          ordered.push(unordered.pop());
        } else {
          var current = ordered[ordered.length-1];
          // find element "right" to the current one
          for (var i in unordered) {
            if (unordered[i].left == current.right) {
              ordered.push(unordered[i]);
              unordered.splice(i,1);
              nocycle=false;
              break;
            }
          }
          if (nocycle)  {
            console.log("error: non-closing cycle!");
            ordered.push(unordered.pop());
          }
        }
      }
      room.walls = ordered;
      ROOMS[room.label] = room;
	}
  }
  return ROOMS;
}

//----------------------------------------------------------------------------

var IndexedSet = function() {
	this.V = "";
	this.I = "";
	this.index = 0;
	this.attributes = {
		"solid" : "false"
	};
};

IndexedSet.prototype.addVertex = function(v) {
	this.V = this.V + " " + v.shortstr();
	this.I = this.I + " " + this.index;
	this.index = this.index + 1;
};
IndexedSet.prototype.endFace = function() {
	this.I = this.I + " -1";
}

IndexedSet.prototype.addSymbol = function(wall, symbol, closed)
{
	//console.log("[addSymbol] : wall: " + JSON.stringify(wall) + " symbol:" + JSON.stringify(symbol));
	var TL = wall.O.add(wall.X.scale(symbol.attributes.left)).add(wall.Y.scale(symbol.attributes.top));
	var W  = wall.X.scale(symbol.attributes.width);
	var H  = wall.Y.scale(symbol.attributes.height);
	//console.log(" TL:" + TL + " W:" + W + " H:" + H);

	var v0 = TL.add( wall.N.scale(10));
	var v1 = TL.add(W).add(wall.N.scale(10));
	var v2 = TL.add(W).add(H).add(wall.N.scale(10));
	var v3 = TL.add(H).add(wall.N.scale(10));

	//console.log("adding vertices");
	this.addVertex(v0);
	this.addVertex(v1);
	this.addVertex(v2);
	this.addVertex(v3);
	if (closed==true) {
		this.addVertex(v0);
	}
	//console.log("end face");
	this.endFace();
}

IndexedSet.prototype.writeX3D = function(xml, set_type) {
	xml.startElement('Shape');
		xml.startElement('Appearance');
			if (this.material) {
				xml.startElement('Material');
				for (attribute in this.material) {
					xml.writeAttribute(attribute,this.material[attribute]);
				}
				xml.endElement();
			}
			if (this.texture) {
				xml.startElement('ImageTexture');
				for (attribute in this.texture) {
					xml.writeAttribute(attribute,this.texture[attribute]);
				}
				xml.endElement();
			}
		xml.endElement();	// /appearance

		xml.startElement(set_type);
			xml.writeAttribute('coordIndex', this.I)
			for (var att in this.attributes) {
				xml.writeAttribute(att, this.attributes[att]);
			}
			xml.startElement('Coordinate');
				xml.writeAttribute('point', this.V);
			xml.endElement();	// /coordinate
			if (this.texCoord) {
				xml.startElement('TextureCoordinate');
					xml.writeAttribute('point', this.texCoord);
				xml.endElement();	// /coordinate
			}
		xml.endElement();	// /set_type
	xml.endElement();	// /shape
}

Rise2X3D.prototype.rooms2x3d = function(rooms, powerlines, walljson, texturepath, session) {

	console.log("[rooms2x3D] started.");
	xw = new XMLWriter();
	xw.startDocument();
	xw.writeDocType("X3D", "ISO//Web3D//DTD X3D 3.0//EN", 
		"http://www.web3d.org/specifications/x3d-3.0.dtd");
	xw.startElement('X3D').writeAttribute('profile', 'Immersive');

	xw.startElement('Scene').startElement('Group');

	var WG = []; // new IndexedSet();		// wall geometry
	var FG = new IndexedSet();		// floor geometry
	var DG = new IndexedSet(); 		// door geometry
	var WIG = new IndexedSet();		// window geometry
	var SKT = new IndexedSet();		// sockets
	var SWI = new IndexedSet();		// switches
	
	console.log('creating walls');
	//-------------------------------- WALLS
    WALLS = {};
	{
		var floornormal = new Vec3(0,0,1);

		for (roomid in rooms) {
			var room = rooms[roomid];
			var floor = [];
			for (wallid in room.walls) {
				var wall = room.walls[wallid];

				var O = new Vec3(wall.attributes.origin);
				var vx = new Vec3(wall.attributes.x).scale(wall.attributes.width);
				var vy = new Vec3(wall.attributes.y).scale(wall.attributes.height);
				var n  = new Vec3(wall.attributes.x).cross(new Vec3(wall.attributes.y));

				var v0 = O.add(n.scale(2));
				var v1 = O.add(vx).add(n.scale(2));
				var v2 = O.add(vx).add(vy).add(n.scale(2));
				var v3 = O.add(vy).add(n.scale(2));

				var newwall = new IndexedSet();
				newwall.addVertex(v0, n);
				newwall.addVertex(v1, n);
				newwall.addVertex(v2, n);
				newwall.addVertex(v3, n);
				newwall.endFace();
				newwall.texture = { "url": texturepath + wall.attributes.id + ".jpg" };
				newwall.attributes.texCoordIndex = " 3 2 1 0 -1";
				newwall.texCoord = "0.0 0.0  1.0 0.0  1.0 1.0  0.0 1.0";
			    //console.log(newwall.texture);
				newwall.material = {
					"diffuseColor" : "0.3 0.3 0.3",
					"ambientIntensity" : "0.8",
					"transparency" : ".5"
				}
				WG.push(newwall);
				floor.push(v3);

				WALLS[wall.attributes.id] = {
					"O" : O,
					"X" : new Vec3(wall.attributes.x),
					"Y" : new Vec3(wall.attributes.y),
					"N"  : n
				};
			}

			// create floor face: triangulate
			var floorvertex=[];
			floor.forEach(function(v) { 
				floorvertex = floorvertex.concat([v.x, v.y, v.z]);
			});
			var tri=Earcut(floorvertex, null, 3);
			
			for(var i=0; i<tri.length; i+=3)
			{
				FG.addVertex(floor[tri[i+0]], floornormal);
				FG.addVertex(floor[tri[i+1]], floornormal);
				FG.addVertex(floor[tri[i+2]], floornormal);
				FG.endFace();
			}
		}
	}

	console.log("creating openings")
	// doors and windows
	var openings = walljson['Openings'];
	for (var i=0; i<openings.length; ++i) {
		var S = openings[i];
		var G = null;
		if (S.attributes.wallid in WALLS) {
			var wall = WALLS[S.attributes.wallid];
			switch(S.label) {
				case "DOOR" :   G = DG; break;
				case "WINDOW" : G = WIG; break;
				default:
					console.log('unknown opening symbol: ' + JSON.stringify(S));
			}
			G.addSymbol(wall, S);
		}
	}
	console.log("creating detections");
	// detections: sockets and switches
	for (var i=0;i<session.Sockets.length; ++i) {
		var socket = session.Sockets[i];
		if (socket.attributes.wallid in WALLS) {
			var wall = WALLS[socket.attributes.wallid];
			SKT.addSymbol(wall, socket, true);
		} else {
			console.log('wall ' + socket.attributes.wallid + ' not in filtered wall set of socket ' + JSON.stringify(socket) );
		}
	}
	for (var i=0;i<session.Switches.length; ++i) {
		var swt= session.Switches[i];
		if (swt.attributes.wallid in WALLS) {
			var wall = WALLS[swt.attributes.wallid];
			SWI.addSymbol(wall, swt, true);
		} else {
			console.log('wall ' + swt.attributes.wallid + ' not in filtered wall set of switch ' + JSON.stringify(swt) );
		}
	}

	console.log('write X3D');
	// write WALLS
	WG.forEach(function(wg) { wg.writeX3D(xw, "IndexedFaceSet"); });
	
	// write FLOORS
	FG.material = {
		"diffuseColor" : "0.6 0.6 0.6",
		"ambientIntensity" : "0.8"
	}
	FG.writeX3D(xw, "IndexedFaceSet");

	// WINDOWS AND DOORS
	DG.material = {
		"diffuseColor" : "0.6 0.4 0.2",
		"ambientIntensity" : "0.5",
		"transparency" : "0"
	}
	DG.writeX3D(xw, "IndexedFaceSet");

	WIG.material = {
		"diffuseColor" : "0.2 0.2 0.6",
		"ambientIntensity" : "0.5",
		"transparency" : "0"
	}
	WIG.writeX3D(xw, "IndexedFaceSet");

	SKT.material = {
		'emissiveColor': '0 0 1'
	}
	SKT.writeX3D(xw, "IndexedLineSet");
	SWI.material = {
		'emissiveColor': '0 1 0'
	}
	SWI.writeX3D(xw, "IndexedLineSet");

	// -------------------------------- POWER LINES
	xw.startElement("Shape");
	xw.startElement('Appearance');
		xw.startElement('Material');
		xw.writeAttribute('emissiveColor', '1 0 0');
		xw.endElement();
	xw.endElement();		
	{
		console.log('writing power lines');

		var V = "";
		var I = "";
		var index = 0;
	    var addVertex = function(v) {
	    	V = V + " " + v.shortstr();
	    	I = I + " " + index;
	    	index = index + 1;
	    };
	    var transform3D = function(wall, vertex) {
	    	return wall.O.add( wall.X.scale(vertex.x) ).add( wall.Y.scale(vertex.y) ).add( wall.N.scale(-10.0) );
	    }

	    for (e in powerlines.E) {
	    	var edge = powerlines.E[e];
	    	var v0 = powerlines.N[edge.v0];
	    	var v1 = powerlines.N[edge.v1];
	    	if (v0.wallid in WALLS && v1.wallid in WALLS) {
		    	var wall = WALLS[v0.wallid]; 	// assert == v1.wallid
		     	// transform to 3D world coordinates
		    	var p0 = transform3D(wall, v0);
		    	var p1 = transform3D(wall, v1);
		    	// add line
		    	addVertex(p0);
		    	addVertex(p1);
		    	I = I + " -1";
	    	}
	    }

	 	xw.startElement('IndexedLineSet');
	 	xw.writeAttribute('colorPerVertex','false');
		xw.writeAttribute('coordIndex', I);	 	
			xw.startElement('Coordinate');
			xw.writeAttribute('point', V);
			xw.endElement();
		xw.endElement();   
	}
	xw.endElement();	// /shape

	xw.endDocument();
	console.log("[rooms2x3D] finished.");	
	return xw.toString();
}

