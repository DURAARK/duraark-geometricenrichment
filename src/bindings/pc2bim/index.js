var spawn = require('child_process').spawn,
  exec = require('child_process').exec,
  uuid = require('node-uuid'),
  path = require('path'),
  fs = require('fs'),
  Promise = require('bluebird'),
  sys = require('sys');

var PC2BIM = module.exports = function(storagePath) {
  this.storagePath = storagePath;
  console.log('[PC2BIM] mounting ' + this.storagePath + ' as "/duraark-storage"');
};

PC2BIM.prototype.extract = function(config) {
  var that = this;
  return new Promise(function(resolve, reject) {
    console.log('[PC2BIM::convert] input file: ' + config.inputFile);

    // docker run --rm -v /duraark-storage:/duraark-storage ubo/pc2bim pc2bim
    //    --input /duraark-storage/files/Nygade_Scan1001.e57
    //    --output /duraark-storage/files/Nygade_Scan1001_RECONSTRUCTED.ifc
    var errorText = '';

    console.log('[PC2BIM::convert] about to run:\n ' + 'docker run --rm -v ' + that.storagePath + ':/duraark-storage ochi/duraark_pc2bim pc2bim --input ' + config.inputFile + ' --output ' + config.outputFile + ' --outputjson ' + config.outputWallJSON);

    var executable = spawn('docker', ['run', '--rm', '-v', that.storagePath + ':/duraark-storage', 'ochi/duraark_pc2bim', 'pc2bim', '--input', config.inputFile, '--output', config.outputFile + ' --outputjson ' + config.outputWallJSON]);

    executable.stdout.on('data', function(data) {
      console.log(data.toString());
    });

    executable.stderr.on('data', function(data) {
      console.log('ERROR: ' + data.toString());
      errorText += data.toString();
    });

    executable.on('close', function(code) {
      // console.log('[PC2BIM-binding] child process exited with code ' + code);

      if (code === 0) {
        console.log('[PC2BIM-binding] successfully finished');
        resolve({
          inputFile: config.inputFile,
          outputFile: config.outputFile,
          outputWallJSON: config.outputWallJSON,
          error: null
        });
      } else {
        console.log('[PC2BIM-binding] finished with error code: ' + code);
        reject(errorText);
      }
    });
  });
};
