var spawn = require('child_process').spawn,
  exec = require('child_process').exec,
  path = require('path'),
  Promise = require('bluebird'),
  _ = require('underscore');

var Association = module.exports = function(storagePath) {
  this.storagePath = storagePath;
};

Association.prototype.run = function(files) {
  var that = this;

  return new Promise(function(resolve, reject) {
    if (files.length !== 2) {
      return reject('Array has to contain 2 file representations!');
    }

    // docker run --rm -v /home/user/work:/work paulhilbert/duraark_assoc --rep-a /work/a.e57n --rep-b /work/b.ifcmesh --registration /work/registration.rdf --output-file /work/association.rdf --epsilon 0.1
    var reprA = files[0].outputFile,
      reprB = files[1].outputFile,
      registrationFile = files[0].registration,
      dirname = path.dirname(files[0].outputFile),
      epsilon = 0.1,
      outputRDF = path.join(dirname, '../tmp/') + 'association__' + path.basename(reprA.replace(' ', '_')) + '-' + path.basename(reprB.replace(' ', '_')) + '.rdf',
      args = ['run', '--rm', '-v', that.storagePath + ':/duraark-storage', 'paulhilbert/duraark_assoc', '--rep-a', reprA, '--rep-b', reprB, '--registration', registrationFile, '--output-file', outputRDF, '--epsilon', epsilon],
      logText = '';

    // console.log('[Association] about to run:\n ' + 'docker ' + args.join(' '));

    var executable = spawn('docker', args);

    executable.stdout.on('data', function(data) {
      console.log(data.toString());
      logText += data.toString();
    });

    executable.stderr.on('data', function(data) {
      console.log(data.toString());
      logText += data.toString();
    });

    executable.on('close', function(code) {
      // console.log('[Association-binding] child process exited with code ' + code);

      if (code === 0) {
        // console.log('[Association] successfully finished');

        _.forEach(files, function(file) {
          file.association = outputRDF;
        });

        resolve(files);
      } else {
        console.log('[Association] ERROR:\n' + logText);
        reject(logText);
      }
    });
  });
}
