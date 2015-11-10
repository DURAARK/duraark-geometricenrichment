/**
 * SessionsController
 *
 * @description :: Server-side logic for managing sessions
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var Orthogen = require('../../bindings/orthogen/index'),
  Elecdetec = require('../../bindings/elecdetec/index'),
  Wiregen = require('../../bindings/wiregen/index'),
  Rise2X3D = require('../../lib/rise2x3d/index'),
  Graph = require('../../../app/wiregen/src/graph'),
  uuid = require('node-uuid'),
  fs = require('fs'),
  path = require('path'),
  mkdirp = require('mkdirp'),
  easyimage = require('easyimage');

function prepareSession(e57master) {
  var session = {};

    session.basename = path.basename(e57master, '.e57');
    session.workingDir = path.join(e57master, '..', '..', 'tools', 'rise');

    session.e57file = path.join(session.workingDir, "..", "..", "tmp", session.basename + "_e57metadata.json");
    session.wallfile = path.join(session.workingDir, "..", "..", "tmp", session.basename + "_wall.json");
    session.panopath = path.join(session.workingDir, "pano");
    session.orthoresult = path.join(session.workingDir, "orthoresult");

    session.elecDir = 'elecdetect-test-set';
    session.elecdetecPath = path.join(session.workingDir, session.elecDir);
    session.elecResultsDir = 'results';
    session.elecdetecResults = path.join(session.elecdetecPath, session.elecResultsDir);

    session.wiregenHypothesisGraph = path.join(session.workingDir, "wiregen", "output", "hypothesis-graph.json");
    //console.log(JSON.stringify(session));
  return session;
}

function initializeSession(param) {
  return new Promise(function(resolve, reject) {
    session = prepareSession(param.e57master);
    resolve(session);
  });
}

function createOrthoLowRes(session) {
  console.log("[createOrthoLowRes]");
  var cwd = process.cwd();

  mkdirp( path.join(session.orthoresult,'lowres') );
  process.chdir(session.orthoresult);
  promises = [];
  var files = fs.readdirSync(session.orthoresult);
  
  files.forEach(function(oldFile) {
    if (path.extname(oldFile) == '.jpg') {
      var destFile = path.join('lowres', path.basename(oldFile));
      console.log(JSON.stringify({src:oldFile, dst:destFile, width:500}));
      promises.push(easyimage.resize({src:oldFile, dst:destFile, width:500}));
    }
  });
  Promise.all(promises).then(function() {
    process.chdir(cwd);    
  });
}

function startOrthogen(param) {

  var session = prepareSession(param.e57master);

    mkdirp(session.orthoresult, function(err) {
      if (!err) {

        return new Promise(function(resolve, reject) {
          var orthogen = new Orthogen();
          orthogen.createOrthoImages(session).then(function(orthogen_result) {
            createOrthoLowRes(session);
            resolve(orthogen_result);
          });
        });

      } else {
        console.log('Error creating orthogen result directory. Aborting!');
        console.log('  Error message: ' + err);
        reject(err);
      }
    });
}

function startElecdetect(param) {

  var session = prepareSession(param.e57master);

  return new Promise(function(resolve, reject) {
    console.log('[SessionController::starting Elecdetect]');

    var elecdetect = new Elecdetec();
    var elecdetectConfig = elecdetect.defaultConfig();
    // parse elecdetect params
    if (param.config) {
      if (param.config.elecdetect) {
        console.log("reading elecdetect config:");
        for (var category in param.config.elecdetect) {
          for (var key in param.config.elecdetect[category]) {
            console.log(key + " : " + elecdetectConfig[category][key] +  " -> " + param.config.elecdetect[category][key]);
            elecdetectConfig[category][key] = param.config.elecdetect[category][key];
          }
        }
      }
    //elecdetectConfig.detection.detection_default_threshold = "0.4";
    //elecdetectConfig.detection.detection_label_thresholds = "0.2, 0.55";
    }
    console.log(elecdetect.config2ini(elecdetectConfig));

    resolve(elecdetect.createElecImages(session, elecdetectConfig));
    console.log("[SessionController::finished]");
  });
}

function startWiregen(param) {
  return new Promise(function(resolve, reject) {
    console.log('[SessionController::start Wiregen]');
    var session = prepareSession(param.e57master);

    var wiregen = new Wiregen();

    // collect elecdetect results
    var files = fs.readdirSync(session.elecdetecResults);
    session.elecDetecResultImages = [];
    for (var key in files) {
      var fileResult = {
        file: files[key],
        link: 'session/' + session.sessionId + '/' + session.elecDir + '/' + session.elecResultsDir + '/' + files[key]
      };
      session.elecDetecResultImages.push(fileResult);
    }

    resolve(wiregen.importDetections(session)
      .then(createInputSymbolList)
      .then(wiregen.createWiregenImages)
      .then(wireGenResultSvg_grammar)
      .then(wireGenResultSvg_hypothesis));
  });
}

function createInputSymbolList(session) {
  return new Promise(function(resolve, reject) {
    try {

      console.log('[SessionController::create Flat List]');

      console.log('reading from ' + session.wallfile);
      walljson = JSON.parse(fs.readFileSync(session.wallfile, "utf8"));

      // add symbols from wall json
      for (var ia in walljson)
      {
        walljson[ia].forEach(function(symbol){
          session.wiregenInput.push(symbol);
        });
        console.log("imported " + walljson[ia].length + " " + ia + " symbols.");
      }
      // add sockets and switches
      [ 'Sockets', 'Switches'].forEach(function(category){
        session[category].forEach(function(symbol){
          session.wiregenInput.push(symbol);
        });
        console.log("imported " + session[category].length + " " + category + " symbols.");
      });

      session.wiregenPath = path.join(session.workingDir, 'wiregen');
      session.wireGenFile = path.join(session.wiregenPath, 'wiregenInput.json');
      session.wireGenOutput = path.join(session.wiregenPath, 'output');
      mkdirp(session.wiregenPath, function(err) {
        mkdirp(session.wireGenOutput, function(err) {
          fs.writeFile(session.wireGenFile, JSON.stringify(session.wiregenInput), function(err) {
            if (err) reject(err);
            resolve(session);
          });
        });
      });
    } catch (e) {
      console.log(e);
      console.log(e.stack);
      reject(e);
    }


  });
}


module.exports = {
  /**
   * @api {post} /uploadFile Upload geometry file
   * @apiVersion 0.7.0
   * @apiName PostUploadFile
   * @apiGroup RISE
   * @apiPermission none
   *
   * @apiDescription Upload a new geometry file for RISE.
   *
   * @apiParam (File) {String} path Location of the File as provided by the [DURAARK Sessions API](http://data.duraark.eu/services/api/sessions/).
   * @apiParam {Number} ID of the internal Session the file should be added to.
   *
   */
  uploadFile: function(req, res, next) {

    var config = req.body;
    var workingDir = path.join(savePath, config.session);

    console.log('HomeDir: ' + workingDir);


    res.setTimeout(0);

    req.file('file').upload({
      dirname: path.resolve(sails.config.appPath, workingDir)
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
   * @api {post} /uploadPanoramas Upload panorama file
   * @apiVersion 0.7.0
   * @apiName PostUploadPanorama
   * @apiGroup RISE
   * @apiPermission none
   *
   * @apiDescription Upload a new panorama file for RISE.
   *
   * @apiParam (File) {File} file Upload of file via form data.
   * @apiParam {Number} ID of the internal Session the file should be added to.
   *
   */
  uploadPanoramas: function(req, res, next) {
    var config = req.body;
    var workingDir = path.join(savePath, config.session);

    console.log('HomeDir: ' + workingDir);


    res.setTimeout(0);

    req.file('file').upload({
      dirname: path.resolve(sails.config.appPath, workingDir)
    }, function(err, uploadedFiles) {
      if (err) return res.negotiate(err);

      return res.json({
        files: uploadedFiles,
        message: 'File uploaded successfully!'
      });
    });
  },

  /**
   * @api {post} /rise Extract electrical appliances
   * @apiVersion 0.7.0
   * @apiName PostRise
   * @apiGroup RISE
   * @apiPermission none
   *
   * @apiDescription Extract BIM model as IFC file with in-wall electrical appliances from given E57 point cloud file.
   *
   * @apiParam (File) {String} path Location of the File as provided by the [DURAARK Sessions API](http://data.duraark.eu/services/api/sessions/).
   *
   */
  rise: function(req, res, next) {
    req.connection.setTimeout(0);
    var session = req.body;
    session.panoImage = hardCodedPanoImage;

    createSession(session)
      .then(initializeSession)
      .then(startOrthogen)
      .then(startElecdetect)
      .then(startWiregen)
      .then(reOrderResult)
      .then(function(argument) {
        console.log('returning from everything');
        res.send(200, argument);
      }).catch(function(err) {
        console.log('Error: ' + err);
        res.send(500, err);
      });
  },


  createSession: function(req, res, next) {
    var session = req.body;
    createSession(session).then(function(argument) {
      res.send(200, argument);
    }).catch(function(err) {
      console.log('Error: ' + err);
      res.send(500, err);
    });

  },

  initializeSession: function(req, res, next) {
    var session = req.body;
    initializeSession(session).then(function(argument) {
      res.send(200, argument);
    }).catch(function(err) {
      console.log('Error: ' + err);
      res.send(500, err);
    });

  },

  // createObjectFiles: function(req, res, next) {
  //   var session = req.body;

  //   createObjectFiles(session).then(function(argument) {
  //     res.send(200, argument);
  //   }).catch(function(err) {
  //     console.log('Error: ' + err);
  //     res.send(500, err);
  //   });
  // },
  startOrthogen: function(req, res, next) {
    var session = req.body;

    startOrthogen(session).then(function(argument) {
      res.send(200, argument);
    }).catch(function(err) {
      console.log('Error: ' + err);
      res.send(500, err);
    });
  },
  startElecdetect: function(req, res, next) {
    var session = req.body;
    req.connection.setTimeout(0);

    startElecdetect(session).then(function(argument) {
      res.send(200, argument);
    }).catch(function(err) {
      console.log('Error: ' + err);
      res.send(500, err);
    });
  },
  startWiregen: function(req, res, next) {
    var session = req.body;
    //console.log(session);
    startWiregen(session).then(function(argument) {
      res.send(200, argument);
    }).catch(function(err) {
      console.log('Error: ' + err);
      res.send(500, err);
    });

  },

  floorInfo: function(req, res, next) {
      var rise2x3d = new Rise2X3D();
      var session = prepareSession(req.body.e57master);
      var walljson = JSON.parse(fs.readFileSync(session.wallfile, "utf8"));
      var rooms = rise2x3d.parseRooms(walljson);
      // extract short floorinfo
      var floorinfo = {};
      for (room in rooms) {
        var walls = [];
        for (wall in rooms[room].walls) {
          walls.push(rooms[room].walls[wall].attributes.id);
        }
        floorinfo[room] = walls;
      }
      res.send(200, floorinfo);
  },

  roomInfo: function(req, res, next) {
    // var sessionId = req.param('sessionId'),
    // roomId = req.param('roomId');
    //var sessionId = 3,
    //    roomId = 'room11';
    //Rise.findOne(sessionId).then(function(session) {
    //  console.log('session: ' + JSON.stringify(session, null, 4));
      var rise2x3d = new Rise2X3D();
      // TODO: find svgs for room
      var session = prepareSession(req.body.e57master);
      //console.log(JSON.stringify(session, null, 4));

      // read wall JSON
      var walljson = JSON.parse(fs.readFileSync(session.wallfile, "utf8"));
      var ROOMS = rise2x3d.parseRooms(walljson);

      var Room = ROOMS[req.body.roomid];
      if (Room) {

        // initialize roomdata
        roomdata = {
          "roomid" : Room.label,
          "rise" : {
            "wallids" : [],
            "orthophoto" : { "walls" : [ ] },
            "grammar"    : { "walls" : [ ] },
            "hypothesis" : { "walls" : [ ] }
          }
        };

        for (i=0; i<Room.walls.length; ++i)
        {
          var wallid = Room.walls[i].attributes.id;
          roomdata.rise.wallids.push(wallid);
          var httpbase = "/rise/";
          roomdata.rise.orthophoto.walls.push(httpbase + "orthoresult/" + session.basename + "_" + wallid + ".jpg");
          roomdata.rise.grammar.walls.push(httpbase + "wiregen/output/svg_grammar/" + wallid + ".svg");
          roomdata.rise.hypothesis.walls.push(httpbase + "wiregen/output/svg_hypothesis/" + wallid + ".svg");
        }

        console.log(JSON.stringify(roomdata, null, 4));

        res.send(200, roomdata);
      } else {
        // Room id not found
        res.send(404, "room id not found.");
      }

    },

    x3d : function(req, res, next) {

      var rise2x3d = new Rise2X3D();
      var session = prepareSession(req.body.e57master);
      // parse wall json
      var walljson = JSON.parse(fs.readFileSync(session.wallfile, "utf8"));
      var rooms    = rise2x3d.parseRooms(walljson);
      // parse hypothesis power line graph
      var powerlines = new Graph.Graph(JSON.parse(fs.readFileSync(session.wiregenHypothesisGraph, "utf8")));

      var x3d = rise2x3d.rooms2x3d(rooms, powerlines, walljson, "/sessions/nygade-1001/tools/rise/orthoresult/lowres/" + session.basename + "_");
      //console.log(x3d);
      res.send(200, x3d);
    }



};
