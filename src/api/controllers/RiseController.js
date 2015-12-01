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

  if (!e57master) {
    console.log('ERROR: e57master ' + e57master);
    return null;
  }

  session.basename = path.basename(e57master, '.e57');
  session.workingDir = path.join(e57master, '..', '..', 'tools', 'rise');
  session.basedir = path.basename(path.join(e57master, '..', '..'));

  session.e57file = path.join(session.workingDir, "..", "..", "tmp", session.basename + "_e57metadata.json");
  session.wallfile = path.join(session.workingDir, "..", "..", "tmp", session.basename + "_wall.json");
  session.panopath = path.join(session.workingDir, "pano");
  session.orthoresult = path.join(session.workingDir, "orthoresult");

  session.elecDir = 'elecdetect-test-set';
  session.elecdetecPath = path.join(session.workingDir, session.elecDir);
  session.elecResultsDir = 'results';
  session.elecdetecResults = path.join(session.elecdetecPath, session.elecResultsDir);

  session.wiregenHypothesisGraph = path.join(session.workingDir, "wiregen", "output", "hypothesis-graph.json");
  session.configFile = path.join(session.workingDir, "rise_config.json");

  // read config
  console.log("loading config " + session.configFile);
  var hasConfig=false;
  try 
  {
    hasConfig = fs.lstatSync(svgfilename).isFile();
  } catch (err) { }
  if (hasConfig) {
    session.config = JSON.parse(fs.readFileSync(session.configFile, "utf8"));
  } else {
    session.config = {
        "orthogen":   { },
        "elecdetect": { 
          "ini" : new Elecdetec().defaultConfig()
        },
        "wiregen":    { }
    };
    // write initial config to file
    console.log("writing initial config.");
    fs.writeFileSync(session.configFile, JSON.stringify(session.config, null, 4), "utf8");
  }
  console.log(session.config);

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

  mkdirp(path.join(session.orthoresult, 'lowres'));
  process.chdir(session.orthoresult);
  promises = [];
  var files = fs.readdirSync(session.orthoresult);

  files.forEach(function(oldFile) {
    if (path.extname(oldFile) == '.jpg') {
      var destFile = path.join('lowres', path.basename(oldFile));
      console.log(JSON.stringify({
        src: oldFile,
        dst: destFile,
        width: 500
      }));
      promises.push(easyimage.resize({
        src: oldFile,
        dst: destFile,
        width: 500
      }));
    }
  });
  Promise.all(promises).then(function() {
    process.chdir(cwd);
  });
}

function startOrthogen(session) {
  return new Promise(function(resolve, reject) {
    mkdirp(session.orthoresult, function(err) {
      if (!err) {
        var orthogen = new Orthogen();
        console.time('Orthogen');
        orthogen.createOrthoImages(session).then(function(orthogen_result) {
          createOrthoLowRes(session);
          console.timeEnd('Orthogen');
          resolve(session);
        }).catch(function(err) {
          reject(err);
        });
      } else {
        console.log('Error creating orthogen result directory. Aborting!');
        console.log('  Error message: ' + err);
        reject(err);
      }
    });
  });
}

function startElecdetect(session) {
  return new Promise(function(resolve, reject) {
    console.log('[SessionController::starting Elecdetect]');

    var elecdetect = new Elecdetec();
    console.time('Elecdetect');
    elecdetect.createElecImages(session, session.config.elecdetect.ini).then(function() {
      console.timeEnd('Elecdetect');
      console.log("[SessionController::finished]");
      resolve(session);
    });
  });
}

function prepareWiregen(session) {
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

}

function startWiregen(session) {
  return new Promise(function(resolve, reject) {
    console.log('[SessionController::start Wiregen]');
    prepareWiregen(session);
    var wiregen = new Wiregen();
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
      for (var ia in walljson) {
        walljson[ia].forEach(function(symbol) {
          session.wiregenInput.push(symbol);
        });
        console.log("imported " + walljson[ia].length + " " + ia + " symbols.");
      }
      // add sockets and switches
      ['Sockets', 'Switches', 'Roots'].forEach(function(category) {
        session[category].forEach(function(symbol) {
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
    var session = prepareSession(req.body.e57master);
    // session.panoImage = hardCodedPanoImage;

    // Setting config parameters for different components, if available in request:
    // FIXXME: new for a static method, not good ...
    session.config.elecdetect = new Elecdetec().defaultConfig();

    startOrthogen(session)
      .then(startElecdetect)
      .then(startWiregen)
      // .then(reOrderResult)
      .then(function(argument) {
        console.log('returning from everything');
        res.send(argument).status(200);
      }).catch(function(err) {
        console.log('Error: ' + JSON.stringify(err));

        res.send(err).status(500);
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
    var session = prepareSession(req.body.e57master);

    startOrthogen(session).then(function(argument) {
      res.send(200, argument);
    }).catch(function(err) {
      console.log('Error: ' + err);
      res.send(500, err);
    });
  },
  startElecdetect: function(req, res, next) {
    var session = prepareSession(req.body.e57master);
    req.connection.setTimeout(0);

    startElecdetect(session).then(function(argument) {
      res.send(200, argument);
    }).catch(function(err) {
      console.log('Error: ' + err);
      res.send(500, err);
    });
  },
  startWiregen: function(req, res, next) {
    var session = prepareSession(req.body.e57master);
    session.useGroundtruth = req.body.useGroundtruth;    
    //console.log(session);
    startWiregen(session).then(function(argument) {
      res.send(200, argument);
    }).catch(function(err) {
      console.log('Error: ' + err);
      console.log(err.stack);
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
    var rise2x3d = new Rise2X3D(),
      file = req.query.file,
      roomId = req.query.roomId;

    console.log('[roomInfo] GET /roomInfo file: ' + file + ' | roomId: ' + roomId);

    if (!file || !roomId) {
      console.error('[roomInfo] Error: Please provide a "file" and a "roomId" parameter!')
      return res.badRequest('Please provide a "file" and a "roomId" parameter!');
    }

    // TODO: find svgs for room
    var session = prepareSession(file);
    // console.log(JSON.stringify(session, null, 4));

    var walljson = JSON.parse(fs.readFileSync(session.wallfile, "utf8"));
    var ROOMS = rise2x3d.parseRooms(walljson);

    var Room = ROOMS[roomId];
    if (Room) {

      roomdata = {
        "roomid": Room.label,
        "rise": {
          "wallids": [],
          "orthophoto": {
            "walls": []
          },
          "grammar": {
            "walls": []
          },
          "hypothesis": {
            "walls": []
          }
        }
      }

      for (i = 0; i < Room.walls.length; ++i) {
        var wallid = Room.walls[i].attributes.id;
        roomdata.rise.wallids.push(wallid);

        // FIXXME: replace!
        var httpbase = file.replace('/duraark-storage', '').split('/');
        httpbase.pop();
        httpbase.pop();
        httpbase = httpbase.join('/');

        // console.log('httpbase: ' + httpbase);

        roomdata.rise.orthophoto.walls.push(httpbase + "/tools/rise/orthoresult/" + session.basename + "_" + wallid + ".jpg");
        roomdata.rise.grammar.walls.push(httpbase + "/tools/rise/wiregen/output/svg_grammar/" + wallid + ".svg");
        roomdata.rise.hypothesis.walls.push(httpbase + "/tools/rise/wiregen/output/svg_hypothesis/" + wallid + ".svg");
      }

      console.log(JSON.stringify(roomdata, null, 4));

      res.send(roomdata).status(200);
    } else {
      // Room id not found
      console.error('[roomInfo] Error: Cannot find roomId: ' + roomId)
      return res.badRequest('Cannot find roomId: ' + roomId);
    }

  },

  x3d: function(req, res, next) {

    var rise2x3d = new Rise2X3D(),
      file = req.query.file,
      roomId = req.query.roomId;

    console.log('[roomInfo] GET /roomInfo file: ' + file + ' | roomId: ' + roomId);

    if (!file )//|| !roomId) 
    {
      console.error('[roomInfo] Error: Please provide a "file" and a "roomId" parameter!')
      return res.badRequest('Please provide a "file" and a "roomId" parameter!');
    }

    var session = prepareSession(file);

    // parse wall json
    var walljson = JSON.parse(fs.readFileSync(session.wallfile, "utf8"));
    var rooms = rise2x3d.parseRooms(walljson, roomId);

    if (Object.keys(rooms).length == 0) {
      res.send(404, "room id " + req.param('roomid') + " not found");
    }

    // parse hypothesis power line graph
    var powerlines = new Graph.Graph(JSON.parse(fs.readFileSync(session.wiregenHypothesisGraph, "utf8")));

    // parse elecdetect results
    prepareWiregen(session);
    var wiregen = new Wiregen();
    wiregen.importDetections(session).then(function() {

      console.log(JSON.stringify(session, null, 2));

      var texture_path = path.join('/sessions/', session.basedir, 'tools', 'rise',
        'orthoresult', 'lowres', session.basename + "_");

      texture_path = 'http://juliet.cgv.tugraz.at/api/v0.7/geometricenrichment' + texture_path;

      console.log('texture path:' + texture_path)
      var x3d = rise2x3d.rooms2x3d(rooms, powerlines, walljson,
        texture_path, session);

      //console.log('x3d: ' + x3d);
      // FIXXME: create /tmp folder if it does not exist!
      var file = '/duraark-storage/sessions/tmp/' + uuid.v4() + '.x3d';

      console.log('writing to file: ' + file);

      fs.writeFile(file, x3d, function(err) {
        if (err) {
          console.log('error writing x3d file: ' + file);
          console.log('ERROR: ' + JSON.stringify(err, null, 4));
          return res.badRequest(err);
        }

        console.log('[x3d] created file at: ' + file);
        res.send({
          url: file.replace('/duraark-storage', '')
        }).status(200);
      });
    });
  }



};
