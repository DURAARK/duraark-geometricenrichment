var spawn = require('child_process').spawn,
    uuid = require('node-uuid'),
    path = require('path'),
    fs = require('fs'),
    mkdirp = require('mkdirp'),
    _ = require('lodash');


/**
 * Provides NodeJS-Javascript bindings for the 'orthogen' executable.
 *
 * @module widget
 */
var Elecdetec = module.exports = function(session) {
    this.session = session;
}

Elecdetec.prototype.createElecImages = function(cb) {


    this.session.status = 'pending';
    this.session.elecDir = 'elecdetect-test-set';
    this.session.elecResultsDir = 'results';
    this.session.elecdetecPath = path.join(this.session.homeDir, this.session.elecDir);
    this.session.elecdetecExecutable = path.join(__dirname, '../../../app/ElecDetec-windows/'); //Config.xml, config.ini & elecdetect.exe
    this.session.elecdetecResults = path.join(this.session.elecdetecPath, this.session.elecResultsDir);
    console.log('[Elecdetect::createElecDetection] configuration: ' + JSON.stringify(this.session, null, 4));
 


    mkdirp(this.session.elecdetecPath, function(err) {
        if (!err) {

            _.forEach(this.session.files, function(n){
                var oldFile = path.join(this.session.homeDir, n);
                var newFile = path.join(this.session.elecdetecPath, n);
                console.log('[Elecdetect::copyImages]: ' + oldFile + " --> " + newFile);
                fs.createReadStream(oldFile).pipe(fs.createWriteStream(newFile));

            }.bind(this));

            // TODO: change to session directory here?
            var cwd = process.cwd();

            process.chdir(this.session.homeDir);

            var arguments = ['-m', 'detect',
                '-d', this.session.elecdetecPath,
                '-c', path.join(this.session.elecdetecExecutable, 'config.xml'),
                '-i', path.join(this.session.elecdetecExecutable, 'config.ini')
            ];

            var executable = spawn(path.join(this.session.elecdetecExecutable, 'ElecDetec.exe'), arguments);

            executable.stdout.on('data', function(data) {
                console.log(data.toString());
            });

            executable.stderr.on('data', function(data) {
                console.log('ERROR: ' + data.toString());
            });

            executable.on('close', function(code) {
                console.log('[Elecdetec-binding] child process exited with code ' + code);

                //var md = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
                //console.log('myhomeDir: ' + JSON.stringify(session));

                this.session.status = 'finished';

                var result = fs.readdir(this.session.elecdetecResults, function(err, files) {
                    if (err) {
                        throw err;
                    }

                    console.log('[Elecdetec-finished] Read directory and return result ' + JSON.stringify(files));


                    this.session.resultImages = [];

                    for (key in files) {
                        var fileResult = {
                                file : files[key],
                                //TODO: don't like this style alternatives?
                                link : sails.getBaseurl() + '/public/' + this.session.sessionId + '/' + this.session.elecDir + '/' + this.session.elecResultsDir + '/' + files[key]
                            };
                            this.session.resultImages.push(fileResult);
                    }
                    cb();
                }.bind(this));

                //this.session.save(function(err, record) {
                //    console.log('[Orthogen::binding] created ortho-images: ' + JSON.stringify(session.resultImages, null, 4));
                //});
            }.bind(this));
        }
        else {
            console.log('Error creating test-set directory. Aborting!');
            console.log('  Error message: ' + err);
        }
    }.bind(this));
};
