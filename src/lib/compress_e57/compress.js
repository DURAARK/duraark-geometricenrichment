var spawn = require('child_process').spawn,
  exec = require('child_process').exec,
  path = require('path'),
  Promise = require('bluebird'),
  isThere = require('is-there'),
  _ = require('underscore');

var Compress = module.exports = function(storagePath) {
  this.storagePath = storagePath;
};

Compress.prototype.run = function(filePath) {
  var that = this;

  return new Promise(function(resolve, reject) {
    // docker run --rm -v /home/user/work:/work paulhilbert/compress_e57n duraark_compress --input-cloud /work/pointcloud.e57n --output-json /work/compressed.json --output /work/compressed.e57c

    var dirname = path.dirname(filePath),
      outputFilePath = path.join(dirname, '../tmp/') + path.basename(filePath.replace(' ', '_')) + '.e57c',
      outputJSONPath = path.join(dirname, '../tmp/') + 'compression_' + path.basename(filePath.replace(' ', '_')) + '.json',
      args = ['run', '--rm', '-v', that.storagePath + ':/duraark-storage', 'paulhilbert/compress_e57n', 'duraark_compress', '--input-cloud', filePath, '--output-json', registrationFile, '--output', outputFilePath],
      logText = '';

    // Check if file is already created and use it in case:
    // FIXXME: make this behaviour configurable!
    var filesAlreadyExist = isThere(outputFilePath) && isThere(outputJSONPath);
    if (filesAlreadyExist) {
      console.log('[Compress] Output already exists, skipping processing.');
      return resolve({
        outputFilePath: outputFilePath,
        outputJSONPath: outputJSONPath
      });
    }

    // console.log('[Compress] about to run:\n ' + 'docker ' + args.join(' '));

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
      // console.log('[Compress-binding] child process exited with code ' + code);

      if (code === 0) {
        // console.log('[Compress] successfully finished');

        return resolve({
          outputFilePath: outputFilePath,
          outputJSONPath: outputJSONPath
        });
      } else {
        console.log('[Compress] ERROR:\n' + logText);
        reject(logText);
      }
    });
  });
}
