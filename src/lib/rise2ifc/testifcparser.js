"use strict";

var fs = require('fs');
var jison = require("jison");

var bnf = fs.readFileSync("ifcparser.jison", "utf8");
var parser = new jison.Parser(bnf);


var input = fs.readFileSync('test1.ifc','UTF8');
var output;
try {
      var IFC = parser.parse(input);
      console.log("parsed:\n" + JSON.stringify(IFC, null, 2));
      fs.writeFileSync("ifc.json", JSON.stringify(IFC, null, 2));
    } catch (exception) {
      console.log(exception.name + ":  " + exception.message);
    }
