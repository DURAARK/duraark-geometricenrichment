
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

Rise2X3D.prototype.parseRooms = function(walljson) {
  var ROOMS = {};
  var room2wall = {};
  
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

IndexedSet.prototype.addSymbol = function(wall, symbol)
{
	var TL = wall.O.add(wall.X.scale(symbol.attributes.left)).add(wall.Y.scale(symbol.attributes.top));
	var W  = wall.X.scale(symbol.attributes.width);
	var H  = wall.Y.scale(symbol.attributes.height);

	var v0 = TL.add( wall.N.scale(10));
	var v1 = TL.add(W).add(wall.N.scale(10));
	var v2 = TL.add(W).add(H).add(wall.N.scale(10));
	var v3 = TL.add(H).add(wall.N.scale(10));

	this.addVertex(v0);
	this.addVertex(v1);
	this.addVertex(v2);
	this.addVertex(v3);
	this.endFace();
}

IndexedSet.prototype.writeX3D = function(xml, set_type) {
	xml.startElement('Shape');
	if (this.material) {
		xml.startElement('Appearance');
			xml.startElement('Material');
			for (attribute in this.material) {
				xml.writeAttribute(attribute,this.material[attribute]);
			}
			xml.endElement();
		xml.endElement();	// /appearance
	}

		xml.startElement(set_type);
		xml.writeAttribute('coordIndex', this.I)
		for (var att in this.attributes) {
			xml.writeAttribute(att, this.attributes[att]);
		}
			xml.startElement('Coordinate');
			xml.writeAttribute('point', this.V);
			xml.endElement();
		xml.endElement();
	xml.endElement();	// /shape
}



Rise2X3D.prototype.rooms2x3d = function(rooms, powerlines, walljson) {

	xw = new XMLWriter();
	xw.startDocument();
	xw.writeDocType("X3D", "ISO//Web3D//DTD X3D 3.0//EN", 
		"http://www.web3d.org/specifications/x3d-3.0.dtd");
	xw.startElement('X3D').writeAttribute('profile', 'Immersive');

	xw.startElement('Scene').startElement('Group');

	var WG = new IndexedSet();		// wall geometry
	var FG = new IndexedSet();		// floor geometry
	var DG = new IndexedSet(); 		// door geometry
	var WIG = new IndexedSet();		// window geometry
	
	// -------------------------------- WALLS
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

				WG.addVertex(v0, n);
				WG.addVertex(v1, n);
				WG.addVertex(v2, n);
				WG.addVertex(v3, n);
				WG.endFace();

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

	var openings = walljson['Openings'];
	for (var i=0; i<openings.length; ++i) {
		var S = openings[i];
		var G = null;
		var wall = WALLS[S.attributes.wallid];
		switch(S.label) {
			case "DOOR" : G = DG; break;
			case "WINDOW" : G = WIG; break;
			default:
				console.log('unknown opening symbol: ' + JSON.stringify(S));
		}
		G.addSymbol(wall, S);
	}

	// write WALLS
	WG.material = {
		"diffuseColor" : "0.9 0.9 0.8",
		"ambientIntensity" : "0.8",
		"transparency" : ".5"
	}
	WG.writeX3D(xw, "IndexedFaceSet");
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
		"transparency" : ".8"
	}
	DG.writeX3D(xw, "IndexedFaceSet");

	WIG.material = {
		"diffuseColor" : "0.2 0.2 0.6",
		"ambientIntensity" : "0.5",
		"transparency" : ".8"
	}
	WIG.writeX3D(xw, "IndexedFaceSet");

	// -------------------------------- POWER LINES
	xw.startElement("Shape");
	xw.startElement('Appearance');
		xw.startElement('Material');
		xw.writeAttribute('emissiveColor', '1 0 0');
		xw.endElement();
	xw.endElement();		
	{
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
	    	var wall = WALLS[v0.wallid]; 	// assert == v1.wallid
	     	// transform to 3D world coordinates
	    	var p0 = transform3D(wall, v0);
	    	var p1 = transform3D(wall, v1);
	    	// add line
	    	addVertex(p0);
	    	addVertex(p1);
	    	I = I + " -1";
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
	return xw.toString();
}

