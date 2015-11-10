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

    //var config = session.poseInformation;
    // var args = ['--im', session.panoImage,
    //   '--ig', objFile,
    //   '--rot', config.poseInformation.rotationW, config.poseInformation.rotationX, config.poseInformation.rotationY, config.poseInformation.rotationZ,
    //   '--trans', config.poseInformation.translationX, config.poseInformation.translationY, config.poseInformation.translationZ,
    //   '--res', config.poseInformation.res, // default: 1mm/pixel
    //   '--elevation', config.poseInformation.elevationX, config.poseInformation.elevationY,
    //   '--scale', config.poseInformation.scale, // default: 'm'
    //   //'--exgeom', config.poseInformation.exgeom,
    //   //'--exsphere', config.poseInformation.exsphere,
    //   //'--exquad', config.poseInformation.exquad,
    //   '--output', path.basename(objFile,'.obj')

    var args = [
      '--e57metadata', session.e57file,
      '--walljson', session.wallfile,
      '--panopath', session.panopath,
      '--align', path.resolve(process.cwd(), '../app/orthogen-windows/panoalign'),
      '--output', session.basename,
      '--exgeom', '1'
    ];

    console.log('args: ' + JSON.stringify(args, null, 4));

    // TODO: change to session directory here?
    var cwd = process.cwd();

    process.chdir(session.orthoresult);

    // orthogen --im=pano.jpg
    // --ig=geometry.obj
    // --rot 0.9592315236 -0.00766527459 -0.007286718304 0.2824234966
    // --trans 0 0 141.6600828
    // --res 1
    // --elevation -1.5707963 1.5707963
    // --scale m
    // --exgeom 1
    // --exsphere 1
    // --exquad 1

    var executable = spawn(path.join(__dirname, '../../../app/orthogen-windows/orthogen'), args);

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
        // session.resultImages = [];

        // for (key in files) {
        //   if (files[key].substr(-4)==".jpg") {
        //     var fileResult = {
        //       file: files[key],
        //       //TODO: don't like this style alternatives?
        //       link: sails.getBaseurl() + '/public/' + session.sessionId + '/' + files[key]
        //     };
        //     session.resultImages.push(fileResult);
        //   }
        // }
        resolve(session);
      });
    });
  });
};
