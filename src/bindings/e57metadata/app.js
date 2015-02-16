/**
 * app.js
 *
 * @description :: TODO: You might write a short summary of how this service works.
 */

var spawn = require('child_process').spawn,
    uuid = require('node-uuid'),
    path = require('path'),
    fs = require('fs');

var E57Metadata = module.exports = function() {
        // Microservice.call(this, opts);
}
// _.extend(E57Metadata.prototype, Microservice.prototype);

E57Metadata.prototype.extractFromFile = function(e57mRecord) {
    console.log('[E57Metadata::extractFromFile] file: ' + e57mRecord.originatingFile);

    e57mRecord.status = 'pending';

    e57mRecord.save(function(err, record) {

        var outputFile = path.join('/tmp', uuid.v4() + '.json');
console.log('outputFile: ' + outputFile);
        var  executable = spawn('e57metadata', [e57mRecord.originatingFile, outputFile]);

        executable.stdout.on('data', function(data) {
            console.log('stdout: ' + data);
        });

        executable.stderr.on('data', function(data) {
            console.log('[E57Metadata-binding] ERROR: ' + data);
        });

        executable.on('close', function(code) {
            console.log('child process exited with code ' + code);

            var md = JSON.parse(fs.readFileSync(outputFile, 'utf8'));

            e57mRecord.status = 'finished';
            e57mRecord.metadata = md;

            e57mRecord.save(function(err, record) {
                console.log('[E57Metadata::extractFromFile] extracted metadata from file: ' + e57mRecord.originatingFile);
            });
        });
    });
};