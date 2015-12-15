var spawn = require('child_process').spawn,
  uuid = require('node-uuid'),
  path = require('path'),
  fs = require('fs'),
  xml2js = require('xml2js');

function importGroundtruthSymbols(session) 
{
  var symbols = {
    'Sockets'  : [],
    'Switches' : [],
    'Roots'    : []
  };
  var HFLIP = false;
  if (session.config.elecdetect.groundtruth)
  {
    HFLIP = (session.config.elecdetect.groundtruth.HFLIP == true);
  }

  console.log('[Wiregen::importGroundtruth]       HFLIP:'+HFLIP);

  var walljson = JSON.parse(fs.readFileSync(session.wallfile, "utf8"));
  for (var i=0; i<walljson.Walls.length; ++i) 
  {
      var xmlparser = new xml2js.Parser();
      var wall = walljson.Walls[i];
      var svgfilename = path.join(session.workingDir, 'groundtruth', 
        session.basename + "_" + wall.attributes.id + ".svg");
      var hasSVG = false;
      
      try 
      {
        hasSVG = fs.lstatSync(svgfilename).isFile();
      } catch (err) { 
        console.log('file ' + svgfilename + ' could not be opened.');
      }

      if (hasSVG)
      {
        var svgxml = fs.readFileSync(svgfilename);

        xmlparser.parseString(svgxml,function(err, svg) 
        {
          if (err) {
            console.log('could not parse SVG XML:' + svgfilename);
          }
          else 
          {
            //console.log(JSON.stringify(svg,null,2));
            var WIDTH = Number(svg.svg.$.width);
            var HEIGHT = Number(svg.svg.$.height);
            if (svg.svg.rect) 
            {
              for (j=0; j<svg.svg.rect.length; ++j)
              {
                var rect = svg.svg.rect[j];
                // parse scaling
                if (rect.$.transform) {
                  var RE = /scale\((.*),(.*)\)/gi;
                  var transform = RE.exec(rect.$.transform);
                  var sx = Number(transform[1]);
                  var sy = Number(transform[2]);
                } else {
                  sx = 1.0;
                  sy = 1.0;
                }
                // parse width
                var RE = /stroke-width:([^;]*);/gi;
                var sw = RE.exec(rect.$.style);
                var strokewidth = Number(sw[1]);
                //console.log(strokewidth);

                var IW = Number(rect.$.width)+strokewidth;
                var IH = Number(rect.$.height)+strokewidth;

                var IL = sx*Number(rect.$.x)-(strokewidth/2);
                var IT = sy*Number(rect.$.y)-(IH-(strokewidth/2));

                var item = {
                  "attributes": {
                    "left": HFLIP ? WIDTH - IL - IW : IL,
                    "top": IT,
                    "width": IW,
                    "height": IH,
                    "wallid": wall.attributes.id
                  }
                };

                var RE = /stroke:#(......);/gi;
                var result = RE.exec(rect.$.style);
                switch(result[1].toLowerCase()) {
                  case '0000ff' : // SOCKET
                    item.label = 'SOCKET';
                    symbols.Sockets.push(item);
                  break;
                  case '00ff00' : // SWITCH
                    item.label = 'SWITCH';
                    symbols.Switches.push(item);
                  break;
                }
              }
            }
          }
        });
      } else {
        console.log('no groundtruth data for ' + svgfilename);
      }
    }
  return symbols;
} 

function importElecdetectSymbols(session) 
{
  console.log('[Wiregen::importDetections]');
  var symbols = {
    'Sockets'  : [],
    'Switches' : [],
    'Roots'    : []
  };

  _.forEach(session.elecDetecResultImages, function(n) 
  {
    if (n.file.substr(-4) === '.xml') 
    {
      var f = path.join(session.elecdetecResults, n.file);
      console.log('importing from ' + f);

      var contents = fs.readFileSync(f, 'utf-8');
      var parser = new xml2js.Parser();
      parser.parseString(contents, function(err, result) {
        if (err) {
          console.log('could not parse XML: ' + f);
        } else {
          for (var position in result.Image.Object) 
          {
            var object = result.Image.Object[position];
            var attr = object.boundingbox[0].$;
            var wallid = path.basename(result.Image.$.file, '.jpg').substring(session.basename.length+1);

            var item = {
              "attributes": {
                "left": Number(attr.x),
                "top": Number(attr.y),
                "width": Number(attr.w),
                "height": Number(attr.h),
                "wallid": wallid
              }
            };
            if (object.label == '1') {
              item.label = 'SOCKET';
              symbols.Sockets.push(item);

            } else if (object.label == '2') {
              item.label = 'SWITCH';
              symbols.Switches.push(item);
            }
            //console.log('new item' + JSON.stringify(item) );
          }
        }
      });
    }
  });

  return symbols;
}

var Wiregen = module.exports = function() {
};

Wiregen.prototype.importElecdetectSymbols = importElecdetectSymbols;
Wiregen.prototype.importGroundtruthSymbols = importGroundtruthSymbols;

Wiregen.prototype.importDetections = function(session) {
  return new Promise(function(resolve, reject) {
    session.wiregenInput = [];
    session.Sockets = [];
    session.Switches = [];

    var symbols;
   
    if (session.useGroundtruth)
    {
      symbols = importGroundtruthSymbols(session);
    } 
    else 
    {
      symbols = importElecdetectSymbols(session);
    }

    for (group in symbols)
    {
      session[group] = symbols[group];
    }

    // append any roots from config
    if (session.config.wiregen.roots) {
      session.Roots = session.Roots.concat(session.config.wiregen.roots);
    } 
    console.log(session.Sockets.length + " sockets");
    console.log(session.Switches.length + " switches");
    console.log(session.Roots.length + " roots");
    resolve(session);
  });
};

Wiregen.prototype.createWiregenImages = function(session) {
  return new Promise(function(resolve, reject) {
    console.log('[Wiregen::createWiregenImages]');
    session.wiregenExecutable = path.join(__dirname, '../../../app/wiregen/src'); //Config.xml, config.ini & elecdetect.exe
    if (session.config.wiregen.wiregenGrammar) {
      session.wiregenGrammar = path.join(__dirname, '..', '..', '..', 'app', 'wiregen', 'src', 'grammar', session.config.wiregen.wiregenGrammar)
    } else {
      session.wiregenGrammar = path.join(__dirname, '../../../app/wiregen/src/grammar/grammar-nygade.json'
        );
    }
    var CCW = true;
    if (session.config.wiregen.ccw) {
      CCW = session.config.wiregen.ccw;
    }
    console.log('using grammar ' + session.wiregenGrammar);
    var cwd = process.cwd();

    process.chdir(session.wiregenExecutable);

    var args = ['-i', session.wireGenFile, 
                '-o', session.wireGenOutput,
                '-g', session.wiregenGrammar,
                '-p', session.basename,
                '-c', CCW];

    console.log('wiregen.bat ' + args);
    var executable = spawn(path.join(session.wiregenExecutable, 'wiregen.bat'), args);

    executable.stdout.on('data', function(data) {
      console.log(data.toString());
    });

    executable.stderr.on('data', function(data) {
      console.log('ERROR: ' + data.toString());
    });

    executable.on('close', function(code) {
      console.log('[Wiregen-binding] child process exited with code ' + code);
      session.status = 'finished-Wiregen';

      if (code == 0) {
        // copy lowres ortho images
          var files = fs.readdirSync(path.join(session.orthoresult, 'lowres'));
          files.forEach(function(fname) {
            var sourceFile = path.join(session.orthoresult, 'lowres', fname);
            var targetFile = path.join(session.workingDir, "wiregen", "output", "svg_grammar", fname);
            fs.writeFileSync(targetFile, fs.readFileSync(sourceFile));
            targetFile = path.join(session.workingDir, "wiregen", "output", "svg_hypothesis", fname);
            fs.writeFileSync(targetFile, fs.readFileSync(sourceFile));
          });
        console.log('# ending wiregen');
        resolve(session);
      }
      else{
        reject(session);
      }
    });

  });
};
