var spawn = require('child_process').spawn,
  exec = require('child_process').exec,
  path = require('path'),
  promisify = require('promisify-node'),
  fs = promisify('fs-extra'),
  Promise = require('bluebird'),
  _ = require('underscore');

var PotreeConverter = module.exports = function(storagePath) {
  this.storagePath = storagePath;
};

PotreeConverter.prototype.run = function(config) {
  var that = this;

  // NOTE: The 'paulhilbert/potreeconverter' container needs the output directory created before running.
  // The container does create the directory if not present, but it has a bug causing necessary output files
  // not being created in this case.
  console.log('[PotreeConverter] creating output directory: ' + config.potreeOutdir);
  fs.mkdirpSync(config.potreeOutdir);

  return new Promise(function(resolve, reject) {
    // docker run --rm -v /home/user/work:/work -v /srv/http/potree:/http paulhilbert/potreeconverter --generate-page some_name --outdir /http /work/differences.e57n
    var args = ['run', '--rm', '-v', that.storagePath + ':/duraark-storage', 'paulhilbert/potreeconverter', '--generate-page', config.pageName, '--outdir', config.potreeOutdir, config.e57File],
      logText = '';

    console.log('Converting: [%s] to potree page at: [%s] with page name: [%s]', config.e57File, config.potreeOutdir, config.pageName);

    // console.log('[PotreeConverter] about to run:\n ' + 'docker ' + args.join(' '));

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
      // console.log('[PotreeConverter-binding] child process exited with code ' + code);

      if (code === 0) {
        config.viewerUrl = path.join(config.potreeOutdir, 'examples', config.pageName) + '.html';

        console.log('[PotreeConverter] successfully finished');
        console.log('potreeOutdir: ' + config.potreeOutdir);
        console.log('config.viewerUrl: ' + config.viewerUrl);

        resolve(config);
      } else {
        console.log('[PotreeConverter] ERROR:\n' + logText);
        reject(logText);
      }
    });
  });
}
