// 2D vectors and axis aligned bounding boxes
function Vec2(x, y) {
  this.x = x !== undefined ? x : 0;
  this.y = y !== undefined ? y : 0;
}
Vec2.prototype.add = function(other) {
  return new Vec2(this.x + other.x, this.y + other.y);
};
Vec2.prototype.sub = function(other) {
  return new Vec2(this.x - other.x, this.y - other.y);
};
Vec2.prototype.mul = function(scalar) {
  return new Vec2(this.x * scalar, this.y * scalar);
};
Vec2.prototype.length = function() {
  return Math.sqrt(this.x * this.x + this.y * this.y);
};
Vec2.prototype.equals = function(other) {
  return (this.x == other.x && this.y == other.y && this.wallid == other.wallid);
};
Vec2.prototype.toString = function() {
  return "[" + this.x + "," + this.y + "]";
}

function AABB(bbmin, bbmax) {
  this.bbmin = bbmin !== undefined ? bbmin : new Vec2(Number.MAX_VALUE, Number.MAX_VALUE);
  this.bbmax = bbmax !== undefined ? bbmax : new Vec2(Number.MIN_VALUE, Number.MIN_VALUE);
}
AABB.prototype.insert = function(x, y) {
  if (x < this.bbmin.x) this.bbmin.x = x;
  if (x > this.bbmax.x) this.bbmax.x = x;
  if (y < this.bbmin.y) this.bbmin.y = y;
  if (y > this.bbmax.y) this.bbmax.y = y;
};
AABB.prototype.isInside = function(v) {
  return (v.x >= this.bbmin.x && v.x <= this.bbmax.x && v.y >= this.bbmin.y && v.y <= this.bbmax.y);
};
AABB.prototype.width = function() {
  return this.bbmax.x - this.bbmin.x;
};
AABB.prototype.height = function() {
  return this.bbmax.y - this.bbmin.y;
};
AABB.prototype.center = function() {
  return new Vec2((this.bbmin.x + this.bbmax.x) / 2.0, (this.bbmin.y + this.bbmax.y) / 2.0);
}
AABB.prototype.toString = function() {
    return this.bbmin.toString() + "--" + this.bbmax.toString();
}

module.exports = {
  'Vec2' : Vec2,
  'AABB' : AABB
};