/**
 * SessionsController
 *
 * @description :: Server-side logic for managing sessions
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var uuid = require('node-uuid'),
    path = require('path'),
    mkdirp = require('mkdirp');

module.exports = {
    create: function(req, res, next) {
        var tmp = uuid.v4(),
        homeDir = path.join('/tmp', tmp);

        console.log('bind da');

        mkdirp(homeDir, function(err) {
            if (!err) {
                console.log('Created session at path: ' + homeDir);

                var sessionInfo = {
                    homeDir: homeDir,
                    status: 'created'
                };

                Sessions.create(sessionInfo, function(err, record) {
                    if (err) return next(err);

                    record.save(function(err, saved_record) {
                        console.log('record: ' + JSON.stringify(saved_record, null, 4));
                        res.send(201, {
                            sessions: [saved_record] // Wrap into 'sessions' key for Ember.js compatibility
                        });
                    });
                });
            } else {
                console.log('Error creating session directory. Aborting!');
                console.log('  Error message: ' + err);
            }

        });
    }
}