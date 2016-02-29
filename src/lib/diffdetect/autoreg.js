var spawn = require('child_process').spawn,
  exec = require('child_process').exec,
  path = require('path'),
  Promise = require('bluebird'),
  isThere = require('is-there'),
  _ = require('underscore');

var Registration = module.exports = function(storagePath) {
  this.storagePath = storagePath;
};

Registration.prototype.run = function(files) {
  var that = this;

  return new Promise(function(resolve, reject) {
    if (files.length !== 2) {
      return reject('Array has to contain 2 file representations!');
    }

    // docker run --rm -v /home/user/work:/work ochi/duraark_autoreg --repra /work/a.e57n --reprb /work/b.ifcmesh --output /work/registration.rdf

    var reprA = files[0].outputFile,
      reprB = files[1].outputFile,
      dirname = path.dirname(files[0].outputFile),
      outputRDF = path.join(dirname, '../tmp/') + 'registration__' + path.basename(reprA.replace(' ', '_')) + '-' + path.basename(reprB.replace(' ', '_')) + '.rdf',
      args = ['run', '--rm', '-v', that.storagePath + ':/duraark-storage', 'ochi/duraark_autoreg', '--repra', reprA, '--reprb', reprB, '--output', outputRDF],
      logText = '';

      // Check if file is already created and use it in case:
      // FIXXME: make this behaviour configurable!
      var fileAlreadyExist = isThere(outputRDF);
      if (fileAlreadyExist) {
        console.log('[AutoReg] Output already exists, skipping processing.');
        _.forEach(files, function(file) {
          file.registration = outputRDF;
        });
        return resolve(files);
      }

    // console.log('[Registration] about to run:\n ' + 'docker ' + args.join(' '));

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
      // console.log('[Registration-binding] child process exited with code ' + code);

      if (code === 0) {
        // console.log('[Registration] successfully finished');

        _.forEach(files, function(file) {
          file.registration = outputRDF;
        });

        resolve(files);
      } else {
        console.log('[Registration] ERROR:\n' + logText);
        reject(logText);
      }
    });
  });
}
