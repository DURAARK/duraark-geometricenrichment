"use strict";
// simple 3D vector class
// ulrich.krispel@fraunhofer.at
var Vec3 = module.exports = function(x,y,z) {
  if (Object.prototype.toString.call( x ) === '[object Array]' ) {
    this.x = x[0];
    this.y = x[1];
    this.z = x[2];
  } else {
    this.x = x; this.y = y; this.z = z;
  }
}

Vec3.prototype.scale = function(s) { return new Vec3(this.x*s,this.y*s,this.z*s); }
Vec3.prototype.add = function(v)   { return new Vec3(this.x+v.x,this.y+v.y,this.z+v.z); }
Vec3.prototype.sub = function(v)   { return new Vec3(this.x-v.x,this.y-v.y,this.z-v.z); }
Vec3.prototype.dot = function(v)   { return this.x*v.x+this.y*v.y+this.z*v.z; }
Vec3.prototype.cross = function(v) {
  return new Vec3( this.y*v.z - this.z*v.y, 
                    this.z*v.x - this.x*v.z, 
                    this.x*v.y - this.y*v.y );
}
// rodrigues' rotation
Vec3.prototype.rotate = function(axis, angle) {
  return this.scale(Math.cos(angle)).add(axis.cross(this).scale(sin(angle))).add(axis.scale(this.dot(axis)*(1.0-cos(angle))));
}
Vec3.prototype.length = function() { return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z); }
Vec3.prototype.normalize = function(v) {
  var s=1.0/v.length();
  return new Vec3(v.x*s,v.y*s,v.z*s);
}
Vec3.prototype.shortstr = function() {
  return this.x + " " + this.y + " " + this.z;
}
Vec3.prototype.toString = function() {
  return "[" + this.x + "," + this.y + "," + this.z + "]";
}