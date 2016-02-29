var spawn = require('child_process').spawn,
  exec = require('child_process').exec,
  uuid = require('node-uuid'),
  path = require('path'),
  promisify = require('promisify-node'),
  fs = promisify('fs-extra'),
  Promise = require('bluebird'),
  sys = require('sys');

var Strings = {};
Strings.orEmpty = function(entity) {
  return entity || "";
};

var PC2BIM = module.exports = function(storagePath) {
  this.storagePath = storagePath;
  console.log('[PC2BIM] mounting ' + this.storagePath + ' as "/duraark-storage"');
};

PC2BIM.prototype.extract = function(jobConfig) {
  var that = this,
    consoleLog = '';

  return new Promise(function(resolve, reject) {
    console.log('[PC2BIM::convert] input file: ' + jobConfig.inputFile);

    // docker run --rm -v /duraark-storage:/duraark-storage ubo/pc2bim pc2bim
    //    --input /duraark-storage/files/Nygade_Scan1001.e57
    //    --output /duraark-storage/files/Nygade_Scan1001_RECONSTRUCTED.ifc
    var args = ['run', '--rm', '-v', that.storagePath + ':/duraark-storage', 'ochi/duraark_pc2bim', 'pc2bim', '--input', '"' + jobConfig.inputFile + '"', , '--output', '"' + jobConfig.bimFilePath + '"', '--outputjson', '"' + jobConfig.wallsFilePath + '"'];

    console.log('[PC2BIM::convert] about to run:\n ' + 'docker ' + args.join(' '));
    // outputLog += '[PC2BIM::convert] about to run:\n ' + 'docker ' + args.join(' ');

    var executable = spawn('docker', args);

    executable.stdout.setEncoding('utf8');
    executable.stderr.setEncoding('utf8');

    executable.stdout.on('data', function(data) {
      // console.log(data);
      consoleLog += Strings.orEmpty(data);
    });

    executable.stderr.on('data', function(data) {
      // console.log(data);
      consoleLog += Strings.orEmpty(data);
    });

    executable.on('close', function(code) {
      console.log('[PC2BIM-binding] child process exited with code ' + code);

      // console.log('consoleLog: ' + consoleLog);

      var logFilePath = '/duraark-storage/logs/pc2bim/' + new Date().toISOString();
      fs.writeFile(logFilePath, consoleLog, 'utf8').then(function(err) {
        if (err) {
          console.log('[PC2BIM-binding] ERROR writing log file: ' + logFilePath);
        }

        console.log('wrote log file: %s', logFilePath);
      });

      if (code === 0) {
        console.log('[PC2BIM-binding] successfully finished');

        resolve({
          inputFile: jobConfig.inputFile,
          bimFilePath: jobConfig.bimFilePath,
          wallsFilePath: jobConfig.wallsFilePath,
          error: null
        });
      } else if (code === 132) {
        var outputLog = "'pc2bim' could not start. Are you sure that your CPU is from Intel? AMD is not supported at the moment."
        console.log('[PC2BIM::convert] ' + outputLog);
        reject(outputLog);
      } else {
        console.log('[PC2BIM::convert] ' + outputLog);
        reject(outputLog);
      }
    });
  });
};
