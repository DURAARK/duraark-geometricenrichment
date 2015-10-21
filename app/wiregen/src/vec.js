"use strict";
// simple 2d vector and axis aligned bounding boxes (AABB)
// ulrich.krispel@vc.fraunhofer.at

function Vec2(x, y, wallid)
{
    this.x = x !== undefined ? x : 0;
    this.y = y !== undefined ? y : 0;
    this.wallid = wallid;
}
Vec2.prototype.add = function(other)
{
    return new Vec2(this.x + other.x, this.y + other.y);
};
Vec2.prototype.sub = function(other)
{
    return new Vec2(this.x - other.x, this.y - other.y);
};
Vec2.prototype.mul = function(scalar)
{
    return new Vec2(this.x * scalar, this.y * scalar);
};
Vec2.prototype.length = function()
{
    return Math.sqrt(this.x * this.x + this.y * this.y);
};
Vec2.prototype.equals = function(other)
{
    return (this.x == other.x && this.y == other.y && this.wallid == other.wallid);
};

function AABB(bbmin, bbmax)
{
    this.bbmin = bbmin !== undefined ? bbmin : new Vec2(Number.MAX_VALUE,Number.MAX_VALUE);
    this.bbmax = bbmax !== undefined ? bbmax : new Vec2(Number.MIN_VALUE,Number.MIN_VALUE);
}
AABB.prototype.insert = function(x,y)
{
    if (x < this.bbmin.x) this.bbmin.x = x;
    if (x > this.bbmax.x) this.bbmax.x = x;
    if (y < this.bbmin.y) this.bbmin.y = y;
    if (y > this.bbmax.y) this.bbmax.y = y;
    return this;
};
AABB.prototype.insertBB = function (bb) {
    this.insert(bb.bbmin.x, bb.bbmin.y);
    this.insert(bb.bbmax.x, bb.bbmax.y);
    return this;
};

AABB.prototype.isInside = function (v) {
    return (v.x >= this.bbmin.x && v.x <= this.bbmax.x 
         && v.y >= this.bbmin.y && v.y <= this.bbmax.y);
};

AABB.prototype.left   = function() { return this.bbmin.x; }
AABB.prototype.top    = function() { return this.bbmin.y; }
AABB.prototype.right  = function() { return this.bbmax.x; }
AABB.prototype.bottom = function() { return this.bbmax.y; }
AABB.prototype.width  = function() { return this.bbmax.x - this.bbmin.x; };
AABB.prototype.height = function() { return this.bbmax.y - this.bbmin.y; };

module.exports = {
    Vec2 : Vec2,
    AABB : AABB
};
