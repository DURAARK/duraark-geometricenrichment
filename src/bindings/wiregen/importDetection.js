var fs = require('fs');
var path = require('path');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();

//var INDIR = 'I:/Projects/2014-04-DuraArk/dev/elecdetect/test-d4_1001/results';

// ----------------------------------------------------- XML Parsing


// Parse command line options
program
  .version(pkg.version)
  .option('-i, --input', 'directory containing detection XMLs', '.')
  .parse(process.argv);

var xml = [];
// read input
console.log('converting detections from directory %s', program.input);
var files = fs.readdirSync(program.input);

files.forEach(function(file) {
  if (file.substr(file.length - 4) == ".xml") {
    xml.push(file);
  }
});

var parser = new xml2js.Parser();
xml.forEach(function(xmlfile) {
  var xmlstr = fs.readFileSync(INDIR + "/" + xmlfile);
  parser.parseString(xmlstr, function(err, result) {
    // read detections and convert to wall json
    console.log('processing file %s', xmlstr);
  });
});



/*
fs.readFile(__dirname + '/foo.xml', function (err, data) {
    parser.parseString(data, function (err, result) {
        console.dir(result);
        console.log('Done');
    });
});
*/
