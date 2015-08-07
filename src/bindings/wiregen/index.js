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
  var promises = [];
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

              var item = {
                "attributes": {
                  "left": Number(attr.x),
                  "top": Number(attr.y),
                  "width": Number(attr.w),
                  "height": Number(attr.h),
                  "wallid": path.basename(result.Image.$.file, '.jpg')
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



  return Promise.all(promises).then(function(argument) {
    return session;
  }).catch(function(err) {
    console.log('Error: ' + err);
    throw new Error(err);
  });


};

Wiregen.prototype.createWiregenImages = function(session) {
  return new Promise(function(resolve, reject) {
    console.log('[Wiregen::createWiregenImages]');
    session.wiregenExecutable = path.join(__dirname, '../../../app/wiregen/src'); //Config.xml, config.ini & elecdetect.exe
    session.wiregenGrammar = path.join(__dirname, '../../../app/wiregen/src/grammar/grammar-nygade.json');

    var cwd = process.cwd();

    process.chdir(session.wiregenExecutable);

    var args = ['-i', session.wireGenFile, '-o', session.wireGenOutput  ,'-g', session.wiregenGrammar];

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

      if (code === 0) {
        resolve(session);
      }
      else{
        reject(session);
      }
    });

  });
};
