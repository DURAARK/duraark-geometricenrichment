var spawn = require('child_process').spawn,
  uuid = require('node-uuid'),
  path = require('path'),
  fs = require('fs'),
  mkdirp = require('mkdirp'),
  _ = require('lodash'),
  Promise = require("bluebird");


/**
 * Provides NodeJS-Javascript bindings for the 'orthogen' executable.
 *
 * @module widget
 */
var Elecdetec = module.exports = function() {};

function copyFile(source, target) {
  return new Promise(function(resolve, reject) {
    console.log('[Elecdetect::copyImages]: ' + source + " --> " + target);

    var rd = fs.createReadStream(source);
    rd.on('error', reject);
    var wr = fs.createWriteStream(target);
    wr.on('error', reject);
    wr.on('finish', resolve);
    rd.pipe(wr);
  });
}


Elecdetec.prototype.createElecImages = function(session) {

  return new Promise(function(resolve, reject) {

    session.status = 'pending';
    session.elecDir = 'elecdetect-test-set';
    session.elecResultsDir = 'results';
    session.elecdetecPath = path.join(session.homeDir, session.elecDir);
    session.elecdetecExecutable = path.join(__dirname, '../../../app/ElecDetec-windows/'); //Config.xml, config.ini & elecdetect.exe
    session.elecdetecResults = path.join(session.elecdetecPath, session.elecResultsDir);
    session.elecDetecResultImages = [];
    //session.files = session.files;
    //session.sessionId = session.sessionId;
    //console.log('[Elecdetect::createElecDetection] create Images: ');

    //console.log(session.ElecdetecInputFiles);

    mkdirp(session.elecdetecPath, function(err) {
      if (!err) {
        promises = [];

        _.forEach(session.ElecdetecInputFiles, function(n) {
          var oldFile = n.file;
          var newFile = path.join(session.elecdetecPath, path.basename(n.file));
          promises.push(copyFile(oldFile, newFile));
        });

        Promise.all(promises).then(function() {

            var cwd = process.cwd();

            process.chdir(session.homeDir);

            var args = ['-m', 'detect',
              '-d', session.elecdetecPath,
              '-c', path.join(session.elecdetecExecutable, 'config.xml'),
              '-i', path.join(session.elecdetecExecutable, 'config.ini')
            ];

            var executable = spawn(path.join(session.elecdetecExecutable, 'ElecDetec.exe'), args);

            executable.stdout.on('data', function(data) {
              console.log(data.toString());
            });

            executable.stderr.on('data', function(data) {
              console.log('ERROR: ' + data.toString());
            });

            executable.on('close', function(code) {
              console.log('[Elecdetec-binding] child process exited with code ' + code);

              //var md = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
              //console.log('myhomeDir: ' + JSON.stringify(session));

              session.status = 'Elecdetec-finished';

              if (code === 0) {
                var result = fs.readdir(session.elecdetecResults, function(err, files) {
                  if (err) {
                    throw err;
                  }

                  console.log('[Elecdetec-finished] Read directory and return result ' + JSON.stringify(files));



                  for (var key in files) {
                    var fileResult = {
                      file: files[key],
                      //TODO: don't like this style alternatives?
                      link: sails.getBaseurl() + '/public/' + session.sessionId + '/' + session.elecDir + '/' + session.elecResultsDir + '/' + files[key]
                    };
                    session.elecDetecResultImages.push(fileResult);
                  }
                  resolve(session);
                });
              } else {
                reject();
              }
              //this.session.save(function(err, record) {
              //    console.log('[Orthogen::binding] created ortho-images: ' + JSON.stringify(session.elecDetecResultImages, null, 4));
              //});
            });
          });
      } else {
        console.log('Error creating test-set directory. Aborting!');
        console.log('  Error message: ' + err);
        reject(err);
      }
    });
  });

};
