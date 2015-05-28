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
      uploadFile: function (req, res, next) {

        var config = req.body;
        var homeDir = path.join(savePath, config.session);

        console.log('HomeDir: ' + homeDir);


        res.setTimeout(0);

        req.file('file').upload({
          dirname: path.resolve(sails.config.appPath, homeDir)
        },function (err, uploadedFiles) {
          if (err) return res.negotiate(err);

          console.log(uploadedFiles[0].fd);

          return res.json({
            files: uploadedFiles,
            fileName: path.basename(uploadedFiles[0].fd),
            message: 'File uploaded successfully!'            
          });
        });
      },

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

      uploadPanoramas: function (req, res, next) {

        var config = req.body;
        var homeDir = path.join(savePath, config.session);

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
                console.log(this.tmp);

                var sessionInfo = {
                    homeDir: homeDir,
                    sessionId: tmp,
                    status: 'created'
                };

                Sessions.create(sessionInfo, function(err, session) {
                    if (err) return next(err);

                    //session.status = 'pending';
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

        }.bind(tmp));
    },

    /**
     * Starts the Orthogen creation.
     *
     * @example POST http://localhost:5010/startOrthogen

    {
    "session" : "0a137c92-2679-47e7-931b-9e8f6229517d",
       "proxyGeometry": "237996dd-ef7b-43be-9c89-cb86a55c2495.obj",
        "panoImage": "9f647cb6-22fd-4aa3-b42b-8b349fbb5fa3.jpg",
        "poseInformation": {
            "translationX": 0,
            "translationY": 0,
            "translationZ": 0,
            "rotationW": 0.0266818,
            "rotationX": 0.00336098,
            "rotationY": 0.00221603,
            "rotationZ": 0.999636,
            "res": 1,
            "scale": "mm",
            "elevationX": -1.5707963,
            "elevationY": 1.5707963,
            "exgeom": 1,
            "exsphere": 1,
            "exquad": 1
        },
        "clusteringOpts": {
            "normalDirection": true,
            "distanceClustering": true
        } 
      }
   */
    startOrthogen: function(req, res, next) {
        var config = req.body; 
        var homeDir = path.join(savePath, config.session);
        var sessionId = config.session;
       
        var session = {
            sessionId : sessionId,
            homeDir : homeDir,
            config : {
                proxyGeometry : path.join(homeDir, config.proxyGeometry),
                panoImage : path.join(homeDir, config.panoImage),
                poseInformation: config.poseInformation,
                clusteringOpts: config.clusteringOpts
            }
        };

        //console.log('configuration: ' + JSON.stringify(session, null, 4));

        // Start async ortho-image creation. Session information is updated within the 'Orthogen' binding:
        var orthogen = new Orthogen(session);
        orthogen.createOrthoImages(function(){
                    res.send(201, {
                        session: session,
                        nextStep: '/sessions/startElecdetect'
                    });

                });
    },
    /**
     * Gets one file in a session which Orthogen created.
     *
     * @example GET http://localhost:5010/sessions/getOrthogenImage?session=a00ba655-8628-43bd-8505-94b1692aef89&file=ortho_5.jpg
    */

    getOrthogenImage: function(req, res, next) {

        console.log('[Retrieved Query]: ' + JSON.stringify(req.query));

        var config = req.query; 
        var homeDir = path.join(savePath, config.session);
        var filePath = path.join(homeDir,config.file);

        var fs = require('fs');

        fs.readFile(filePath, function(err, file){
            if(!err){
                console.log('[Send File]');
                res.send(file);
            }
            else
            {
                console.log('Error Reading File. Aborting!');
                console.log('  Error message: ' + err);
                res.send(500, err);
            }
        }); 
    }
}
