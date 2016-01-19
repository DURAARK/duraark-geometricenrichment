"use strict";
var geo2d = require('./geo2d');

var Rise2SVG = module.exports = function() {
};

// params: { width: x, height: y, 
Rise2SVG.prototype.getFloorplan = function(rooms, params)
{
  // perform a 2D projection of the floorplan
  var ROOMS = {};
  var totalbb = new geo2d.AABB();
  
  // extract vertices for ordered wall cycle
  for (var roomid in rooms)
  {
    var room = {
      "label": roomid,
      "center": new geo2d.Vec2(),
      "walls": rooms[roomid].walls,
      "points": []
    };
  
    // extract 2D vertices for ordered wall cycle
    // so far only simple downprojection on Z axis
    for (var i in  room.walls) {
      var wall = room.walls[i];
      var v = new geo2d.Vec2(wall.attributes.origin[0], wall.attributes.origin[1]);
      totalbb.insert(v.x, v.y);
      room.points.push(v);
    }
    
    // calculate center
    var roombb = new geo2d.AABB();
    room.points.forEach(function(p) {
      roombb.insert(p.x, p.y);
    });
    room.center = roombb.center();
    ROOMS[roomid] = room;
  }
  
  // scale points
  var aspect = totalbb.width() / totalbb.height();
  var TARGET_WIDTH = 500;
  var TARGET_HEIGHT = TARGET_WIDTH / aspect;
  var scale = function(v) {
    v.x = (v.x - totalbb.bbmin.x) * TARGET_WIDTH / totalbb.width();
    v.y = TARGET_HEIGHT - ((v.y - totalbb.bbmin.y) * TARGET_HEIGHT / totalbb.height());
  }    
  
  for(roomid in ROOMS) 
  {
    var room = ROOMS[roomid];
    for (var p in room.points) {
      scale(room.points[p]);
    }
    scale(room.center);
  }
  
  return ROOMS;
};

