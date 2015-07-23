/**
 * SessionsController
 *
 * @description :: Server-side logic for managing sessions
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var Orthogen = require('../../bindings/orthogen/index'),
  Elecdetect = require('../../bindings/elecdetec/index'),
  uuid = require('node-uuid'),
  fs = require('fs'),
  path = require('path'),
  mkdirp = require('mkdirp'),
  hardCodedPanoImage = '/tmp/panorama.jpg';

var savePath = '/tmp';

function createSession(session) {
  return new Promise(function(resolve, reject) {
    var tmp = uuid.v4(),
      homeDir = path.join(savePath, tmp),
      config = session;

    //console.log('configuration: ' + JSON.stringify(config, null, 4));

    mkdirp(homeDir, function(err) {
      if (!err) {
        console.log('[SessionController::Created session at path: ' + homeDir + ']');
        console.log(tmp);

        session.homeDir = homeDir;
        session.sessionId = tmp;
        session.status = 'created';

        Sessions.create(session, function(err, session) {
          if (err) return next(err);

          session.status = 'pending';
          session.save(function(err, saved_record) {
            //console.log('session: ' + JSON.stringify(saved_record, null, 4));
            resolve(session);
          });
        });
      } else {
        console.log('Error creating session directory. Aborting!');
        console.log('  Error message: ' + err);
        reject(err);
      }

    });
  });

}

function createObjectFiles(session) {
  var promises = [];
  console.log('[SessionController::Creating Object files]');
  session.poseInformation.objFile = [];

  _.forEach(session.Walls, function(oneWall) {
    if (oneWall.label == 'WALL') {
      var promise = new Promise(function(resolve, reject) {
        console.log('[SessionController::Found Wall: ' + oneWall.attributes.id + ']');

        var attr = oneWall.attributes;

        var objFile = 'v ' + attr.origin[0] + ' ' + attr.origin[1] + ' ' + attr.origin[2] + "\n" +
          'v ' + (attr.origin[0] + attr.y[0]) + ' ' + (attr.origin[1] + attr.y[1]) + ' ' + (attr.origin[2] + attr.y[2]) + "\n" +
          'v ' + (attr.origin[0] + attr.y[0] + attr.x[0]) + ' ' + (attr.origin[1] + attr.y[1] + attr.x[1]) + ' ' + (attr.origin[2] + attr.y[2] + attr.x[2]) + "\n" +
          'v ' + (attr.origin[0] + attr.x[0]) + ' ' + (attr.origin[1] + attr.x[1]) + ' ' + (attr.origin[2] + attr.x[2]) + "\n" +
          'f 1 2 3 4';

        var file = path.join(session.homeDir, oneWall.attributes.id + '.obj');

        fs.writeFile(file, objFile, function(err) {
          if (err) reject(err);
          resolve(session.poseInformation.objFile.push(file));
        });
      });

      promises.push(promise);
    }
  });
  return Promise.all(promises).then(function(argument) {
    return session;
  }).catch(function(err) {
    console.log('Error: ' + err);
    throw new Error(err);
  });
}

function startOrthogen(session) {

  //console.log('[StarOrthogen::] Start config ' + JSON.stringify(session, null, 4));
  /*var config = session;
  var homeDir = path.join(savePath, config.session);
  var sessionId = config.session;*/

  /*  var session = {
      sessionId: sessionId,
      homeDir: homeDir,
      config: {
        proxyGeometry: path.join(homeDir, config.proxyGeometry),
        panoImage: path.join(homeDir, config.panoImage),
        poseInformation: config.poseInformation,
        clusteringOpts: config.clusteringOpts
      }
    };*/

  //console.log('configuration: ' + JSON.stringify(session, null, 4));

  // Start async ortho-image creation. Session information is updated within the 'Orthogen' binding:
  var promises = [];
  session.ElecdetecInputFiles = [];
  console.log('[SessionController::starting Orthogens]');

  _.forEach(session.poseInformation.objFile, function(oneObj) {
    var promise = new Promise(function(resolve, reject) {

      var orthogen = new Orthogen();
      orthogen.createOrthoImages(session, oneObj)
        .then(function(newFile) {
          resolve(session.ElecdetecInputFiles.push(newFile));
        });


    });

    promises.push(promise);
  });

  return Promise.all(promises).then(function(argument) {
    //console.log(session.ElecdetecInputFiles);
    return session;
  }).catch(function(err) {
    console.log('Error: ' + err);
    throw new Error(err);
  });

}

function startElecdetec(session) {
  return new Promise(function(resolve, reject) {
    console.log('[SessionController::starting Elecdetec]');

    //var homeDir = session.homeDir;
    //var sessionId = session.sessionId;

    //console.log('configuration: ' + JSON.stringify(config, null, 4));

    // Start async ortho-image creation. Session information is updated within the 'Orthogen' binding:
    var elecdetect = new Elecdetect();
    elecdetect.createElecImages(session).then(function (argument) {
      resolve(argument);
    });
  });
}

module.exports = {
  /**
   * Uploades a new geometry file into the session container
   *
   * @example POST http://localhost:5010/uploadFile/
   * Upload must be form-data
   * session: SessionId
   * file: <local file>
   *
   * IMPORTANT: session must be before file in order for sails to extract the ID.
   */
  uploadFile: function(req, res, next) {

    var config = req.body;
    var homeDir = path.join(savePath, config.session);

    console.log('HomeDir: ' + homeDir);


    res.setTimeout(0);

    req.file('file').upload({
      dirname: path.resolve(sails.config.appPath, homeDir)
    }, function(err, uploadedFiles) {
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

  uploadPanoramas: function(req, res, next) {

    var config = req.body;
    var homeDir = path.join(savePath, config.session);

    console.log('HomeDir: ' + homeDir);


    res.setTimeout(0);

    req.file('file').upload({
      dirname: path.resolve(sails.config.appPath, homeDir)
    }, function(err, uploadedFiles) {
      if (err) return res.negotiate(err);

      return res.json({
        files: uploadedFiles,
        message: 'File uploaded successfully!'
      });
    });
  },


  rise: function(req, res, next) {
    var session = req.body;
    session.panoImage = hardCodedPanoImage;

    createSession(session)
      .then(createObjectFiles)
      .then(startOrthogen)
      .then(startElecdetec)
      .then(function(argument) {
        res.send(200, argument);
      }).catch(function(err) {
        console.log('Error: ' + err);
        res.send(500, err);
      });
  },


  /**
   * Creates a new session.
   *
   * Returns the SessionUUID which should be used for uploading uploadGeometry and uploadPanoramas
   * @example POST http://localhost:5010/sessions/createSession
   */


  createSession: function(req, res, next) {
    createSession(req, res, next).then(function(argument) {
      res.send(200, argument);
    });

  },

  /**
     * Starts the Orthogen creation.
     *
     * @example POST http://localhost:5010/sessions/startOrthogen

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
    console.log(req.body);
    var argument = req.body;
    startOrthogen(req, res, next).then(function(argument) {
      res.send(201, {
        session: argument,
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
    var filePath = path.join(homeDir, config.file);

    var fs = require('fs');

    fs.readFile(filePath, function(err, file) {
      if (!err) {
        console.log('[Send File]');
        res.send(file);
      } else {
        console.log('Error Reading File. Aborting!');
        console.log('  Error message: ' + err);
        res.send(500, err);
      }
    });
  },


  /**
     * Starts the Elecdetec creation after the Orthogen images are finished.
     *
     * @example POST http://localhost:5010/sessions/startElecdetect

    {
        "session": "0e275b45-2258-4abd-ba5b-70c8418b3b37", //the sessionId where the orthogen images were created
        "files": [ //one or multiple which were generated from orthogen.
            "test1.png",
            "test2.png"
        ]
    }
   */
  startElecdetec: function(req, res, next) {
    var config = req.body;
    var homeDir = path.join(savePath, config.session);
    var sessionId = config.session;

    console.log('configuration: ' + JSON.stringify(config, null, 4));

    var session = {
      sessionId: sessionId,
      homeDir: homeDir,
      files: config.files
    };

    // Start async ortho-image creation. Session information is updated within the 'Orthogen' binding:
    var elecdetect = new Elecdetect(session);
    elecdetect.createElecImages(function() {
      res.send(201, {
        session: session,
        nextStep: 'startWiregen'
      });

    });
  }
};
