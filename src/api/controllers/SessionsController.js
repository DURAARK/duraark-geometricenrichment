/**
 * SessionsController
 *
 * @description :: Server-side logic for managing sessions
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var Orthogen = require('../../bindings/orthogen/index'),
  Elecdetect = require('../../bindings/elecdetec/index'),
  Wiregen = require('../../bindings/wiregen/index'),
  uuid = require('node-uuid'),
  fs = require('fs'),
  path = require('path'),
  mkdirp = require('mkdirp'),
  hardCodedPanoImage = '/tmp/panorama.jpg';

var savePath = '/tmp';

function createSession(session) {
  return new Promise(function(resolve, reject) {
    var tmp = '73fe3ef2-4614-4830-bf40-b58147d52d47',  //uuid.v4(),
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

function initializeSession(session) {
  return new Promise(function(resolve, reject) {
    //todo upload stuff
    session.basename = "Byg72";
    session.e57file  = path.join(session.homeDir,session.basename + "_e57metadata.json");
    session.wallfile = path.join(session.homeDir,session.basename + "_wall.json");
    session.panopath = path.join(session.homeDir, "pano");
    session.orthoresult = path.join(session.homeDir, "orthoresult");
    mkdirp(session.orthoresult, function(err) {
      if (!err) {
        resolve(session);
      } else {
        console.log('Error creating session directory. Aborting!');
        console.log('  Error message: ' + err);
        reject(err);
      }
    });
  });
}

/*
function createObjectFiles(session) {
  var promises = [];
  console.log('[SessionController::Creating Object files]');

  session.poseInformation.objFile = [];

  _.forEach(session.Walls, function(oneWall) {
    if (oneWall.label == 'WALL') {
      var promise = new Promise(function(resolve, reject) {
        console.log('[SessionController::Found Wall: ' + oneWall.attributes.id + ']');

        var attr = oneWall.attributes;
        var height = attr.height;
        var width = attr.width;

        var objFile = 'v ' + (attr.origin[0] / 1000) + ' ' + (attr.origin[1] / 1000) + ' ' + (attr.origin[2] / 1000) + "\n" +
          'v ' + ((attr.origin[0] + attr.y[0] * height) / 1000) + ' ' + ((attr.origin[1] + attr.y[1] * height) / 1000) + ' ' + ((attr.origin[2] + attr.y[2] * height) / 1000) + "\n" +
          'v ' + ((attr.origin[0] + attr.y[0] * height + attr.x[0] * width) / 1000) + ' ' + ((attr.origin[1] + attr.y[1] * height + attr.x[1] * width) / 1000) + ' ' + ((attr.origin[2] + attr.y[2] * height + attr.x[2] * width) / 1000) + "\n" +
          'v ' + ((attr.origin[0] + attr.x[0] * width) / 1000) + ' ' + ((attr.origin[1] + attr.x[1] * width) / 1000) + ' ' + ((attr.origin[2] + attr.x[2] * width) / 1000) + "\n" +
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
*/

function startOrthogen(session) {
 
  return new Promise(function(resolve, reject) {
    var orthogen = new Orthogen();
    orthogen.createOrthoImages(session).then(function(orthogen_result){

     resolve(orthogen_result); 
    });
  });

 /* var promises = [];
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
  });*/

}

function startElecdetec(session) {
  return new Promise(function(resolve, reject) {
    console.log('[SessionController::starting Elecdetec]');

    //var homeDir = session.homeDir;
    //var sessionId = session.sessionId;

    //console.log('configuration: ' + JSON.stringify(config, null, 4));

    // Start async ortho-image creation. Session information is updated within the 'Orthogen' binding:
    var elecdetect = new Elecdetect();
    resolve(elecdetect.createElecImages(session));
    console.log("[SessionController::finished]");
  });
}

function startWiregen(session) {
  return new Promise(function(resolve, reject) {
    console.log('[SessionController::start Wiregen]');
    //console.log(session);
    var wiregen = new Wiregen();
    resolve(wiregen.importDetections(session)
      .then(createFlatList)
      .then(wiregen.createWiregenImages)
      .then(wireGenResultSvg_grammar)
      .then(wireGenResultSvg_hypothesis));
  });
}

function createFlatList(session) {
  return new Promise(function(resolve, reject) {
    try {

      console.log('[SessionController::create Flat List]');

      listImport = ['Switches', 'Sockets', 'Doors', 'Walls'];

      for (var i = 0; i < listImport.length; i++) {
        var currentList = listImport[i];
        //console.log(session[currentList]);
        for (var j = 0; j < session[currentList].length; j++) {
          var item = session[currentList][j];
          session.wiregenInput.push(item);
        }
      }

      session.wiregenPath = path.join(session.homeDir, 'wiregen');
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
      reject(e);
    }


  });
}

function wireGenResultSvg_grammar(session) {
  return new Promise(function(resolve, reject) {
    session.wireGenResultGrammar = [];
    fs.readdir(path.join(session.wireGenOutput, 'svg_grammar'), function(err, files) {
      for (var key in files) {
        var fileResult = {
          file: files[key],
          link: 'session/' + session.sessionId + '/wiregen/output/svg_grammar/' + files[key]
        };
        session.wireGenResultGrammar.push(fileResult);
      }
      resolve(session);
    });
  });
}

function wireGenResultSvg_hypothesis(session) {
  return new Promise(function(resolve, reject) {
    session.wireGenResultHypothesis = [];
    fs.readdir(path.join(session.wireGenOutput, 'svg_hypothesis'), function(err, files) {
      for (var key in files) {
        var fileResult = {
          file: files[key],
          link: 'session/' + session.sessionId + '/wiregen/output/svg_hypothesis/' + files[key]
        };
        session.wireGenResultHypothesis.push(fileResult);
      }
      resolve(session);
    });
  });
}

function reOrderResult(session) {
  return new Promise(function(resolve, reject) {
    try {


      session.resultArray = {};
      session.resultArray.elecDetecResults = [];
      session.resultArray.orthogenResults = [];
      session.resultArray.wireGenResultHypothesis = [];
      session.resultArray.wireGenResultGrammar = [];

      var baseUrl = 'session/' + session.sessionId + '/';
      var wireGenGramarUrl = baseUrl + 'wiregen/output/svg_grammar/';
      var wireGenHypothesisUrl = baseUrl + 'wiregen/output/svg_hypothesis/';
      var elecDetedtUrl = baseUrl + '/elecdetect-test-set/results/';

      var orderedResult = orderSession(session);

      for (var i = 0; i < orderedResult.length; i++) {
        var picture = orderedResult[i].attributes.id;
        session.resultArray.wireGenResultGrammar.push(wireGenGramarUrl + picture + '.svg');
        session.resultArray.wireGenResultHypothesis.push(wireGenHypothesisUrl + picture + '.svg');
        session.resultArray.elecDetecResults.push(elecDetedtUrl + picture + '-result.jpg');
        session.resultArray.orthogenResults.push(baseUrl + picture + '.jpg');
      }

      resolve(session);
    } catch (e) {
      console.log(e);
      reject(session);
    }
  });
}

function orderSession(session) {
  var tempWalls = session.Walls.slice(0);
  var sorted = [];


  while (tempWalls.length > 0) {
    var first = tempWalls.pop();
    sorted.push(first);
    var corner = first.right;
    while (corner != first.left) {
      // find wall with left corner
      var found = false;
      for (var w in tempWalls) {
        var wall = tempWalls[w];
        if (wall.left == corner) {
          sorted.push(wall);
          corner = wall.right;
          tempWalls.splice(w, 1);
          found = true;
          break;
        }
      }
      if (found === false) {
        console.log("loop not closed.");
        break;
      }
    }
  }
  return sorted;
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
      .then(startElecdetec)
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


  createObjectFiles: function(req, res, next) {
    var session = req.body;

    createObjectFiles(session).then(function(argument) {
      res.send(200, argument);
    }).catch(function(err) {
      console.log('Error: ' + err);
      res.send(500, err);
    });
  },
  startOrthogen: function(req, res, next) {
    var session = req.body;
    session.panoImage = hardCodedPanoImage;

    startOrthogen(session).then(function(argument) {
      res.send(200, argument);
    }).catch(function(err) {
      console.log('Error: ' + err);
      res.send(500, err);
    });
  },
  startElecdetec: function(req, res, next) {
    var session = req.body;
    req.connection.setTimeout(0);

    startElecdetec(session).then(function(argument) {
      res.send(200, argument);
    }).catch(function(err) {
      console.log('Error: ' + err);
      res.send(500, err);
    });
  },
  startWiregen: function(req, res, next) {
    var session = req.body;

    startWiregen(session).then(function(argument) {
      res.send(200, argument);
    }).catch(function(err) {
      console.log('Error: ' + err);
      res.send(500, err);
    });

  },
  reOrderResult: function(req, res, next) {
    reOrderResult(session).then(function(argument) {
      res.send(200, argument);
    }).catch(function(err) {
      console.log('Error: ' + err);
      res.send(500, err);
    });
  }
};
