var spawn = require('child_process').spawn,
  exec = require('child_process').exec,
  path = require('path'),
  Promise = require('bluebird');

var Preprocess = module.exports = function(storagePath) {
  this.storagePath = storagePath;
};

Preprocess.prototype.run = function(fileId) {
  var fileType = path.extname(fileId).toLowerCase(),
    basename = path.basename(fileId),
    dirname = path.dirname(fileId),
    inputFileId = fileId,
    that = this;

  console.log('[Preprocess::preprocess] Starting preprocessing');

  return new Promise(function(resolve, reject) {
    if (fileType === '.e57') {
      // docker run --rm -v /home/user/work:/work paulhilbert/e57-processor --input /work/a.e57 --output /work/a.e57n -l 0.02
      var logText = '',
        resolution = 0.02,
        outputFileName = path.join(dirname, '../tmp', basename.substring(0, basename.length - fileType.length)) + '.e57n',
        args = ['run', '--rm', '-v', that.storagePath + ':/duraark-storage', 'paulhilbert/e57-processor', '--input', inputFileId, '--output', outputFileName, '-l', resolution];

      //console.log('[Preprocess::preprocess] about to run:\n ' + 'docker ' + args.join(' '));

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
        // console.log('[Preprocess-binding] child process exited with code ' + code);

        if (code === 0) {
          // console.log('[Preprocess::preprocess] successfully finished');

          resolve({
            inputFile: fileId,
            outputFile: outputFileName,
            resolution: resolution,
            type: 'e57',
          });
        } else {
          console.log('[Preprocess::convert] ERROR:\n' + logText);
          reject(logText);
        }
      });
    } else if (fileType === '.ifc') {
      // docker run --rm -v /home/user/work:/work paulhilbert/ifc-mesh-extract --input /work/b.ifc --output /work/objs --json /work/b.ifcmesh -s
      var logText = '',
        resolution = 0.02,
        objOutputPath = path.join(dirname, '../tmp/obj'),
        ifcmeshFileName = path.join(dirname, '../tmp', basename.substring(0, basename.length - fileType.length)) + '.ifcmesh'
      args = ['run', '--rm', '-v', that.storagePath + ':/duraark-storage', 'paulhilbert/ifc-mesh-extract', '--input', inputFileId, '--output', objOutputPath, '--json', ifcmeshFileName, '-s'];

      // console.log('[Preprocess::preprocess] about to run:\n ' + 'docker ' + args.join(' '));

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
        // console.log('[Preprocess-binding] child process exited with code ' + code);

        if (code === 0) {
          // console.log('[Preprocess::preprocess] successfully finished');

          resolve({
            inputFile: fileId,
            outputFile: ifcmeshFileName,
            fileType: 'ifc',
            objPath: objOutputPath
          });
        } else {
          console.log('[Preprocess::preprocess] ERROR:\n' + logText);
          reject(logText);
        }
      });
    } else {
      reject('[Preprocess::convert] Filetype "' + fileType + '" not supported, aborting preprocessing!');
    }
  });
}
