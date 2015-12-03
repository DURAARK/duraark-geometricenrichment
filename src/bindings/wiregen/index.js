var spawn = require('child_process').spawn,
  uuid = require('node-uuid'),
  path = require('path'),
  fs = require('fs'),
  xml2js = require('xml2js');

var Wiregen = module.exports = function() {
  //this.session = session;
};

Wiregen.prototype.importDetections = function(session) {
  session.wiregenInput = [];
  session.Sockets = [];
  session.Switches = [];

  if (session.config.wiregen.roots) {
    session.Roots = session.config.wiregen.roots;
  } else {
    session.Roots = [];
  }

  var promises = [];

  if (session.useGroundtruth)
  {
    console.log('[Wiregen::importGroundtruth]');
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
      } catch (err) { }

      if (hasSVG)
      {
        var svgxml = fs.readFileSync(svgfilename);
        var promise = new Promise(function(resolve, reject) {
          xmlparser.parseString(svgxml,function(err, svg) {
            if (err) reject(err);
            // import symbols from SVG:
            if (svg.svg.rect) {
              for (j=0; j<svg.svg.rect.length; ++j)
              {
                var rect = svg.svg.rect[j];
                // parse scaling
                if (rect.$.transform) {
                  var RE = /scale\((.*),(.*)\)/gi;
                  var transform = RE.exec(rect.$.transform);
                  var sx = Number(transform[1]);
                  var sy = Number(transform[2]);
                }

                var item = {
                  "attributes": {
                    "left": sx*Number(rect.$.x),
                    "top": sy*Number(rect.$.y),
                    "width": Number(rect.$.width),
                    "height": Number(rect.$.height),
                    "wallid": wall.attributes.id
                  }
                };

                var RE = /stroke:#(......);/gi;
                var result = RE.exec(rect.$.style);
                switch(result[1].toLowerCase()) {
                  case '0000ff' : // SOCKET
                    item.label = 'SOCKET';
                    session.Sockets.push(item);
                  break;
                  case '00ff00' : // SWITCH
                    item.label = 'SWITCH';
                    session.Switches.push(item);
                  break;
                }
                //console.log(item);
              }
            }
            resolve();
          });
        });
        promises.push(promise);
      } else {
        console.log('no groundtruth data for ' + svgfilename);
      }
    }
  } 
  else 
  {
  console.log('[Wiregen::importDetections]');

  //console.log("selecimages " + JSON.stringify(session.elecDetecResultImages, null, 4));
  _.forEach(session.elecDetecResultImages, function(n) {
    if (n.file.substr(-4) === '.xml') {
      var promise = new Promise(function(resolve, reject) {
        var f = path.join(session.elecdetecResults, n.file);

        fs.readFile(f, 'utf-8', function(err, contents) {

          var parser = new xml2js.Parser();
          if (err) reject(err);

          var innerPrommises = [];
          parser.parseString(contents, function(err, result) {
            if (err) reject(err);
            for (var position in result.Image.Object) {

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
              //console.log('new item' + object.label);

              if (object.label == '1') {
                item.label = 'SOCKET';
                session.Sockets.push(item);

              } else if (object.label == '2') {
                item.label = 'SWITCH';
                session.Switches.push(item);
              }
            }
            resolve();

          });

        });
      });
      promises.push(promise);
    }
  });
    
  }

  return Promise.all(promises).then(function(argument) {
    console.log(session.Sockets.length + " sockets");
    console.log(session.Switches.length + " switches");
    return session;
  }).catch(function(err) {
    console.log('Error: ' + err);
    console.log(err.stack);
    throw new Error(err);
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
    console.log('using grammar ' + session.wiregenGrammar);
    var cwd = process.cwd();

    process.chdir(session.wiregenExecutable);

    var args = ['-i', session.wireGenFile, 
                '-o', session.wireGenOutput,
                '-g', session.wiregenGrammar,
                '-p', session.basename,
                '-c', 'false'];

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
