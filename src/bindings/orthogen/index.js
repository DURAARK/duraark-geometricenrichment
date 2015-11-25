var spawn = require('child_process').spawn,
  uuid = require('node-uuid'),
  path = require('path'),
  fs = require('fs');


/**
 * Provides NodeJS-Javascript bindings for the 'orthogen' executable.
 *
 * @module widget
 */
var Orthogen = module.exports = function() {
  //this.session = session;
};

Orthogen.prototype.createOrthoImages = function(session) {

  return new Promise(function(resolve, reject) {

    session.status = 'pending';

    console.log('[Orthogen::createOrthoImages] configuration: ' + session.basename);

    if (!folderExists(session.panopath)) {
      console.log('[Orthogen] ERROR: no pano folder exists');

      return reject({
        type: 'error',
        text: 'No panorama folder exists. Please upload panorama images first!'
      });
    };

    var args = [
      '--e57metadata', session.e57file,
      '--walljson', session.wallfile,
      '--panopath', session.panopath,
      '--align', 'panoalign',
      '--output', session.basename,
      '--exgeom', '1',
      '--ccw', '0'
    ];

    // TODO: change to session directory here?
    var cwd = process.cwd();

    process.chdir(session.orthoresult);

    // FIXXME: check ic --poanopath exists and contains images. If not return error message to caller!
    console.log('[Orthogen-binding] about to run: orthogen ' + args.join(' '));

    var executable = spawn('orthogen', args);

    executable.stdout.on('data', function(data) {
      console.log(data.toString());
    });

    executable.stderr.on('data', function(data) {
      console.log('ERROR: ' + data.toString());
    });

    executable.on('close', function(code) {
      console.log('[Orthogen-binding] child process exited with code ' + code);

      //var md = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
      //console.log('myhomeDir: ' + JSON.stringify(session));

      session.status = 'finished-Orthogen';

      var result = fs.readdir(session.orthoresult, function(err, files) {
        if (err) {
          throw err;
        }

        console.log('[Orthogen-finished]'); //'Read directory and return result ' + JSON.stringify(files));
        resolve(session);
      });
    });
  });
};

function folderExists(folderPath)
{
    try
    {
        return fs.statSync(folderPath).isFolder();
    }
    catch (err)
    {
        return false;
    }
}
