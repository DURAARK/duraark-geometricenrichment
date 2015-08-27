var spawn = require('child_process').spawn,
  exec = require('child_process').exec,
  uuid = require('node-uuid'),
  path = require('path'),
  fs = require('fs'),
  Promise = require('bluebird'),
  sys = require('sys'),
  Docker = require('dockerode');

var PC2BIM = module.exports = function() {
  //this.session = session;
};

PC2BIM.prototype.extract = function(filename) {
  return new Promise(function(resolve, reject) {
    console.log('[PC2BIM::convert] input file: ' + filename);

    // docker run --rm -v /duraark-storage:/duraark-storage ubo/pc2bim pc2bim
    //    --input /duraark-storage/files/Nygade_Scan1001.e57
    //    --output /duraark-storage/files/Nygade_Scan1001_RECONSTRUCTED_DOCKER.ifc
    var outputfile = filename.slice(0, -4) + '_RECONSTRUCTED.ifc';

    console.log('[PC2BIM::convert] about to run:\n ' + 'docker run --rm -v /duraark-storage:/duraark-storage ubo/pc2bim pc2bim --input ' + filename + ' --output ' + outputfile);

    var executable = spawn('docker', ['run', '--rm', '-v', '/duraark-storage:/duraark-storage', 'ubo/pc2bim', 'pc2bim', '--input', filename, '--output', outputfile]);
    // var executable = spawn('docker', 'run', '--rm', 'hello-world');
    // var executable = spawn('docker');

    executable.stdout.on('data', function(data) {
      console.log(data.toString());
    });

    executable.stderr.on('data', function(data) {
      console.log('ERROR: ' + data.toString());
    });

    executable.on('close', function(code) {
      console.log('[PC2BIM-binding] child process exited with code ' + code);

      if (code === 0) {
        resolve({
          input: filename,
          output: outputfile,
          error: null
        });
      } else {
        reject({
          input: filename,
          output: null,
          error: 'extraction closed with error code: ' + code
        });
      }
    });

    // function puts(error, stdout, stderr) {
    //   console.log('ss');
    //   sys.puts(stdout)
    // }
    // exec('docker run hello-world', puts);

    // docker.createContainer({
    //   Image: 'hello-world',
    //   // Cmd: ['/bin/bash'],
    //   name: 'ubuntu-test'
    // }, function(err, container) {
    //   container.start(function(err, data) {
    //     if (err) reject(err);
    //     resolve(data);
    //     console.log('err: ' + err);
    //     console.log('data: ' + data);
    //   });
    // });

  });
};
