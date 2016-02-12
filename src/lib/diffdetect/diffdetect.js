var spawn = require('child_process').spawn,
  exec = require('child_process').exec,
  path = require('path'),
  Promise = require('bluebird'),
  _ = require('underscore');

var DiffDetect = module.exports = function(storagePath) {
  this.storagePath = storagePath;
};

DiffDetect.prototype.run = function(files) {
  var that = this;

  return new Promise(function(resolve, reject) {
    // docker run --rm -v /home/user/work:/work paulhilbert/duraark_diffdetect --input /work/a.e57n --assoc /work/association.rdf --output /work/differences.e57n
    var reprA, reprB;

    if (files[0].outputFile.split('.').pop().toLowerCase() === 'ifcmesh') {
      reprA = files[1].outputFile;
      reprB = files[0].outputFile;
    } else {
      reprA = files[0].outputFile;
      reprB = files[1].outputFile;
    }

    var associationFile = files[0].association,
      dirname = path.dirname(files[0].outputFile),
      outputFile = path.join(dirname, '../tmp/') + 'diffdetect_' + path.basename(reprA.replace(' ', '_')) + '-' + path.basename(reprB.replace(' ', '_')) + '.e57n',
      args = ['run', '--rm', '-v', that.storagePath + ':/duraark-storage', 'paulhilbert/duraark_diffdetect', '--input', reprA, '--assoc', associationFile, '--output', outputFile],
      logText = '';

    console.log('[DiffDetect] about to run:\n ' + 'docker ' + args.join(' '));

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
      // console.log('[DiffDetect-binding] child process exited with code ' + code);

      if (code === 0) {
        // console.log('[DiffDetect] successfully finished');

        _.forEach(files, function(file) {
          file.diffDetectOutputFile = outputFile;
        });

        resolve(files);
      } else {
        console.log('[DiffDetect] ERROR:\n' + logText);
        reject(logText);
      }
    });
  });
}
