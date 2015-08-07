"use strict";

var fs = require('fs');

function readJSON(filename)
{
    return JSON.parse(fs.readFileSync(filename, "utf8"));
}

var input = readJSON("input/nygade-1001/nygade_1001_offset.json");
var process = input.Walls.slice(0);
var sorted = [];

console.log(input);

while(process.length > 0)
{
  var first = process.pop();
  sorted.push(first);
  var corner = first.right;
  while (corner != first.left)
  {
    // find wall with left corner
    var found=false;
    for (var w in process)
    {
      var wall = process[w];
      if (wall.left == corner) { 
        sorted.push(wall);
        corner = wall.right;
        process.splice(w, 1); 
        found=true;
        break; 
      }
    }
    if (found==false) 
    {
      console.log("loop not closed.");
      break;
    }
  }
}

for (var s in sorted)
{
  console.log(sorted[s].attributes.id);
}
