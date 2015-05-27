/**
 * SessionsController
 *
 * @description :: Server-side logic for managing sessions
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var Orthogen = require('../../bindings/orthogen/index'),
    uuid = require('node-uuid'),
    path = require('path'),
    mkdirp = require('mkdirp');

var savePath = '/tmp'


module.exports = {
    /**
     * Uploades a new geometry file into the session container
     *
     * @example POST http://localhost:5010/uploadGeometry/
     * Upload must be form-data
     * session: SessionId
     * file: <local file>
     * 
     * IMPORTANT: session must be before file in order for sails to extract the ID.
     */
      uploadGeometry: function (req, res, next) {

        var config = req.body;
        homeDir = path.join(savePath, config.session);

        console.log('HomeDir: ' + homeDir);


        res.setTimeout(0);

        req.file('file').upload({
          dirname: path.resolve(sails.config.appPath, homeDir)
        },function (err, uploadedFiles) {
          if (err) return res.negotiate(err);

          return res.json({
            files: uploadedFiles,
            message: 'File uploaded successfully!'            
          });
        });
      },

      uploadPanoramas: function (req, res, next) {

        var config = req.body;
        homeDir = path.join(savePath, config.session);

        console.log('HomeDir: ' + homeDir);


        res.setTimeout(0);

        req.file('file').upload({
          dirname: path.resolve(sails.config.appPath, homeDir)
        },function (err, uploadedFiles) {
          if (err) return res.negotiate(err);

          return res.json({
            files: uploadedFiles,
            message: 'File uploaded successfully!'            
          });
        });
      },


    /**
     * Creates a new session.
     *
     * Returns the SessionUUID which should be used for uploading uploadGeometry and uploadPanoramas
     * @example POST http://localhost:5010/sessions/createSession
     */

    createSession: function(req, res, next) {
        var tmp = uuid.v4(),
            homeDir = path.join(savePath, tmp),
            config = req.body; 

        console.log('configuration: ' + JSON.stringify(config, null, 4));

        mkdirp(homeDir, function(err) {
            if (!err) {
                console.log('Created session at path: ' + homeDir);

                var sessionInfo = {
                    homeDir: homeDir,
                    config: config,
                    status: 'created'
                };

                Sessions.create(sessionInfo, function(err, session) {
                    if (err) return next(err);

                    session.status = 'pending';

                    session.save(function(err, saved_record) {
                        console.log('session: ' + JSON.stringify(saved_record, null, 4));


                        // FIXXME: delegate to Orthogen executable!
                        res.send(201, {
                            session: saved_record // Wrap into 'sessions' key for Ember.js compatibility
                        });
                    });
                });
            } else {
                console.log('Error creating session directory. Aborting!');
                console.log('  Error message: ' + err);
            }

        });
    },

    // FIXXME: uploading a file should be done via the 'microservice-files' service!
    uploadGeoModel: function(req, res, next) {
        throw Error('Implement "uploadGeoModel"');
        //     // e.g.
        //     // 0 => infinite
        //     // 240000 => 4 minutes (240,000 miliseconds)
        //     // etc.
        //     //
        //     // Node defaults to 2 minutes.
        //     res.setTimeout(0);

        //     req.file('geomodel')
        //         .upload({

        //             // You can apply a file upload limit (in bytes)
        //             //maxBytes: 1000000

        //         }, function whenDone(err, uploadedFiles) {
        //             if (err) return res.serverError(err);
        //             else {
        //                 console.log('uploaded');
        //                 return res.json({
        //                     files: uploadedFiles,
        //                     textParams: req.params.all()
        //                 });
        //             }
        //         });

    },
    /**
     * Starts the Orthogen creation.
     *
     * @example POST http://localhost:5010/sessions

         * @input {
    * "session": "uuid"
     *  "proxyGeometry": "/storage/myBuilding.obj",
      *  "panoImage": "/storage/myBuildingPano.jpg",
      *  "poseInformation": {
      *      "translationX": 3,
      *      "translationY": 5,
    *        "translationZ": 8,
    *        "rotationW": 1,
    *        "rotationX": 2,
    *        "rotationY": 3,
    *        "rotationZ": 4
    *    },
    *    "clusteringOpts": {
    *        "normalDirection": true,
    *        "distanceClustering": true
    *    } 
      } 
     */

    start: function(req, res, next) {
        homeDir = path.join(savePath, tmp),
        config = req.body;

        console.log('configuration: ' + JSON.stringify(config, null, 4));

        // Start async ortho-image creation. Session information is updated within the 'Orthogen' binding:
        var orthogen = new Orthogen(session);
        orthogen.createOrthoImages();

    }
}
