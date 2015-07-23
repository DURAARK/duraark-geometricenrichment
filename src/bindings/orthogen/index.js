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

Orthogen.prototype.createOrthoImages = function(session, objFile) {

  return new Promise(function(resolve, reject) {


    session.status = 'pending';

    console.log('[Orthogen::createOrthoImages] configuration: ' + JSON.stringify(objFile, null, 4));

    var config = session.poseInformation;


    var arguments = ['--im', session.panoImage,
      '--ig', objFile,
      '--rot', config.poseInformation.rotationW, config.poseInformation.rotationX, config.poseInformation.rotationY, config.poseInformation.rotationZ,
      '--trans', config.poseInformation.translationX, config.poseInformation.translationY, config.poseInformation.translationZ,
      '--res', config.poseInformation.res, // default: 1mm/pixel
      '--elevation', config.poseInformation.elevationX, config.poseInformation.elevationY,
      '--scale', config.poseInformation.scale, // default: 'm'
      //'--exgeom', config.poseInformation.exgeom,
      //'--exsphere', config.poseInformation.exsphere,
      //'--exquad', config.poseInformation.exquad,
      '--output', path.basename(objFile,'.obj')
    ];

    console.log('arguments: ' + JSON.stringify(arguments, null, 4));

    // TODO: change to session directory here?
    var cwd = process.cwd();

    process.chdir(session.homeDir);

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

    var executable = spawn(path.join(__dirname, '../../../app/orthogen-windows/orthogen'), arguments);

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

      if(code === 0)
      {
        //in the current development we only get one!!! output... the other code reads the directory and outputs every file.
        var file = path.join(session.homeDir,path.basename(objFile,'.obj')) + '.jpg';
        orthoResultImage ={
          file: file,
          link: sails.getBaseurl() + '/public/' + session.sessionId + '/' + file
        };
        resolve(orthoResultImage);
      }
      /*var result = fs.readdir(session.homeDir, function(err, files) {
        if (err) {
          throw err;
        }

        console.log('[Orthogen-finished] Read directory and return result ' + JSON.stringify(files));


        session.resultImages = [];

        for (key in files) {
          var fileResult = {
            file: files[key],
            //TODO: don't like this style alternatives?
            link: sails.getBaseurl() + '/public/' + session.sessionId + '/' + files[key]
          };
          session.resultImages.push(fileResult);

        }
        resolve(session.resultImages);
      });*/

      //this.session.save(function(err, record) {
      //    console.log('[Orthogen::binding] created ortho-images: ' + JSON.stringify(session.resultImages, null, 4));
      //});
    });
  });
};
