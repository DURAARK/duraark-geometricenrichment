var spawn = require('child_process').spawn,
    uuid = require('node-uuid'),
    path = require('path'),
    fs = require('fs');


/**
 * Provides NodeJS-Javascript bindings for the 'orthogen' executable.
 *
 * @module widget
 */
var Orthogen = module.exports = function(session) {
    this.session = session;
}

Orthogen.prototype.createOrthoImages = function(cb) {


    this.session.status = 'pending';

    console.log('[Orthogen::createOrthoImages] configuration: ' + JSON.stringify(this.session, null, 4));

    var arguments = ['--im', this.session.config.panoImage,
        '--ig', this.session.config.proxyGeometry,
        '--rot', this.session.config.poseInformation.rotationW, this.session.config.poseInformation.rotationX, this.session.config.poseInformation.rotationY, this.session.config.poseInformation.rotationZ,
        '--trans', this.session.config.poseInformation.translationX, this.session.config.poseInformation.translationY, this.session.config.poseInformation.translationZ,
        '--res', this.session.config.poseInformation.res, // default: 1mm/pixel
        '--elevation', this.session.config.poseInformation.elevationX, this.session.config.poseInformation.elevationY,
        '--scale', this.session.config.poseInformation.scale, // default: 'm'
        '--exgeom', this.session.config.poseInformation.exgeom,
        '--exsphere', this.session.config.poseInformation.exsphere,
        '--exquad', this.session.config.poseInformation.exquad
    ];

    console.log('arguments: ' + JSON.stringify(arguments, null, 4));

    // TODO: change to session directory here?
    var cwd = process.cwd();

    process.chdir(this.session.homeDir);

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

    var executable = spawn(path.join(__dirname, '../../../app/orthogen'), arguments);

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

        this.session.status = 'finished';

        var result = fs.readdir(this.session.homeDir, function(err, files) {
            if (err) {
                throw err;
            }

            console.log('[Orthogen-finished] Read directory and return result ' + JSON.stringify(files));


            this.session.resultImages = [];

            for (key in files) {
                var fileResult = {
                        file : files[key],
                        //TODO: don't like this style alternatives?
                        link : sails.getBaseurl() + '/public/' + this.session.sessionId + '/' + files[key]
                    };
                    this.session.resultImages.push(fileResult);

            }
            cb();
        }.bind(this));

        //this.session.save(function(err, record) {
        //    console.log('[Orthogen::binding] created ortho-images: ' + JSON.stringify(session.resultImages, null, 4));
        //});
    }.bind(this));
};
