"use strict";
var geo2d = require('./geo2d');

var Rise2SVG = module.exports = function() {
};

Rise2SVG.prototype.getFloorplan = function(rooms, params)
{
  // perform a 2D projection of the floorplan
  var ROOMS = {
    ROOMS : []
  };
  var totalbb = new geo2d.AABB();
  params = params ? params : { };
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
    ROOMS.ROOMS.push(room);
  }
  
  // scale points
  var aspect = totalbb.width() / totalbb.height();
  ROOMS.width = params.width ? params.width : 500;
  ROOMS.height = ROOMS.width / aspect;
  var scale = function(v) {
    v.x = (v.x - totalbb.bbmin.x) * ROOMS.width / totalbb.width();
    v.y = ROOMS.height - ((v.y - totalbb.bbmin.y) * ROOMS.height / totalbb.height());
  }    
  
  ROOMS.ROOMS.forEach(function (room)
  {
    for (var p in room.points) {
      scale(room.points[p]);
    }
    // calculate center
    var roombb = new geo2d.AABB();
    room.points.forEach(function(p) {
      roombb.insert(p.x, p.y);
    });
    room.center = roombb.center();
  });
  
  return ROOMS;
};

