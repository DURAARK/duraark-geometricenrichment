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

Orthogen.prototype.createOrthoImages = function() {
    console.log('[Orthogen::createOrthoImages] configuration: ' + JSON.stringify(this.session, null, 4));

    var arguments = ['--im', this.session.panoImage,
        '--ig', this.session.config.proxyGeometry,
        '--rot', this.session.config.poseInformation.rotationW, this.session.config.poseInformation.rotationX, this.session.config.poseInformation.rotationY, this.session.config.poseInformation.rotationZ,
        '--trans', this.session.config.poseInformation.translationX, this.session.config.poseInformation.translationY, this.session.config.poseInformation.translationZ,
        '--res', '1', // default: 1mm/pixel
        // '--elevation', ...
        '--scale', 'm', // default: 'm'
        '--exgeom', '1',
        '--exsphere', '1',
        '--exquad', '1'
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
    var executable = spawn('orthogen', ['--im', this.session.panoImage,
        '--ig', this.session.config.proxyGeometry,
        '--rot', this.session.config.poseInformation.rotationW, this.session.config.poseInformation.rotationX, this.session.config.poseInformation.rotationY, this.session.config.poseInformation.rotationZ,
        '--trans', this.session.config.poseInformation.translationX, this.session.config.poseInformation.translationY, this.session.config.poseInformation.translationZ,
        '--res', '1', // default: 1mm/pixel
        // '--elevation', ...
        '--scale', 'm', // default: 'm'
        '--exgeom', '1',
        '--exsphere', '1',
        '--exquad', '1'
    ]);

    executable.stdout.on('data', function(data) {
        console.log(data);
    });

    executable.stderr.on('data', function(data) {
        console.log('ERROR: ' + data);
    });

    executable.on('close', function(code) {
        console.log('[Orthogen-binding] child process exited with code ' + code);

        //var md = JSON.parse(fs.readFileSync(outputFile, 'utf8'));

        this.session.status = 'finished';
        this.session.resultImages = [ // TODO
            path.join(this.session.homeDir, 'image000.jpg'),
            path.join(this.session.homeDir, 'image001.jpg'),
            path.join(this.session.homeDir, 'image002.jpg'),
            path.join(this.session.homeDir, 'image003.jpg'),
            path.join(this.session.homeDir, 'image004.jpg'),
            path.join(this.session.homeDir, 'image005.jpg')
        ];

        this.session.save(function(err, record) {
            console.log('[Orthogen::binding] created ortho-images: ' + JSON.stringify(session.resultImages, null, 4));
        });
    });


    this.session.status = 'finished';
    this.session.resultImages = [ // TODO
        path.join(this.session.homeDir, 'image000.jpg'),
        path.join(this.session.homeDir, 'image001.jpg'),
        path.join(this.session.homeDir, 'image002.jpg'),
        path.join(this.session.homeDir, 'image003.jpg'),
        path.join(this.session.homeDir, 'image004.jpg'),
        path.join(this.session.homeDir, 'image005.jpg')
    ];

    for (var idx = 0; idx < this.session.resultImages.length; idx++) {
        var img = this.session.resultImages[idx];
        fs.openSync(img, 'w');
    };

    // Switch back to original working directory:
    // FIXXME: what happens, if there is an error before and this line is not called?
    process.chdir(cwd);

    this.session.save(function(err, record) {
        console.log('[Orthogen::binding] created ortho-images: ' + JSON.stringify(this.session.resultImages, null, 4));
    }.bind(this));
};
