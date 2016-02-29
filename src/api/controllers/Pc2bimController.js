/**
 * Pc2bimController
 */

var PC2BIM = require('../../bindings/pc2bim'),
  isThere = require('is-there'),
  path = require('path');

var _SIMULATE_SUCCESS = false;

function pc2bimRun(config) {
  var pc2bim = new PC2BIM(config.duraarkStoragePath);
  return pc2bim.extract(config);
}

function startExtraction(derivativeState, config) {
  pc2bimRun(config).then(function(result) {
    console.log('Extraction finished: ' + JSON.stringify(result, null, 4));

    derivativeState.bimFilePath = result.bimFilePath;
    derivativeState.wallsFilePath = result.wallsFilePath;
    derivativeState.status = "finished";
    derivativeState.bimDownloadUrl = result.bimFilePath.replace('/duraark-storage', '');
    derivativeState.wallsDownloadUrl = result.wallsFilePath.replace('/duraark-storage', '');
    derivativeState.save().then(function(pc2bimRecord) {
      console.log('[Pc2bimController] Successfully reconstructed BIM model for: ' + pc2bimRecord.inputFile);
    });
  }).catch(function(err) {
    console.log('[Pc2bimController] Error:\n' + err);

    if (err === "") {
      err = "No explicit error given"
    }
    derivativeState.status = "error";
    derivativeState.errorText = err;

    console.log('[Pc2bimController] derivativeState: ' + JSON.stringify(derivativeState, null, 4));

    derivativeState.save().then(function(pc2bimRecord) {
      console.log('[Pc2bimController] Error reconstructing BIM model for: ' + pc2bimRecord.inputFile);
      console.log('[Pc2bimController] Error details:\n' + pc2bimRecord.errorText);
    });
  });
}

/**
 * @apiDefine ExtractionSuccess
 * @apiSuccess (Response) {String} input Location of the input file.
 * @apiSuccess (Response) {String} output Location of the reconstructed output file.
 * @apiSuccess (Response) {String} error 'null' if extraction was successfull, otherwise contains error message.
 */

module.exports = {
  /**
   * @api {post} /pc2bim/ Extract BIM model
   * @apiVersion 0.8.0
   * @apiName PostPc2bim
   * @apiGroup PC2BIM
   * @apiPermission none
   *
   * @apiDescription Schedule the extraction of a BIM model as IFC file from a given E57 point cloud file.
   *
   * @apiParam (File) {String} path Location of the File as provided by the [DURAARK Sessions API](http://data.duraark.eu/services/api/sessions/).
   *
   * @apiUse ExtractionSuccess
   *
   * @apiSuccessExample Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *        "input": "/duraark-storage/files/Nygade_Scan1001.e57",
   *        "output": "/duraark-storage/files/Nygade_Scan1001_RECONSTRUCTED.ifc",
   *        "error": null
   *      }
   */
  create: function(req, res, next) {
    // return res.send({
    //   status: 'pending',
    //   errorText: 'an error',
    //   viewerUrl: 'http://orf.at',
    //   id: 42
    // });

    var inputFile = req.param('inputFile'),
      ext = path.extname(inputFile),
      restart = req.param('restart'),
      duraarkStoragePath = process.env.DURAARK_STORAGE_PATH || '/duraark-storage',
      bimFilePath = inputFile.replace(ext, '_RECONSTRUCTED.ifc').replace('master', 'derivative_copy'),
      wallsFilePath = inputFile.replace(ext, '_wall.json').replace('master', 'tmp'),
      isAlreadyReconstructed = false;

    // console.log('duraarkStoragePath: ' + duraarkStoragePath);
    // console.log('inputFile: ' + inputFile);
    // console.log('restart: ' + restart);

    console.log('POST /pc2bim: Scheduled conversion of ' + inputFile);

    res.setTimeout(0);

    // Check if reconstructed IFC file is already present:
    isAlreadyReconstructed = isThere(bimFilePath) && isThere(wallsFilePath);

    // console.log('bim: ' + bimFilePath);
    // console.log('wall: ' + wallsFilePath);
    // console.log('bim there: ' + isThere(bimFilePath));
    // console.log('wall there: ' + isThere(wallsFilePath));

    console.log('[Pc2bim] Found existing reconstruction: ' + isAlreadyReconstructed);

    Pc2bim.findOne({
      "where": {
        "inputFile": {
          "equals": inputFile
        }
      }
    }).then(function(derivativeState) {
      // console.log('derivativeState: ' + JSON.stringify(derivativeState, null, 4));

      if (_SIMULATE_SUCCESS) {
        derivativeState.status = "finished";
        var url = derivativeState.inputFile.replace(ext, '.ifc');
        url = url.replace('/duraark-storage', '');
        derivativeState.bimDownloadUrl = url;
        return res.send(derivativeState).status(200);
      }

      if (!derivativeState) {
        console.log('[Pc2bimController] No job found for input file: ' + inputFile);
        console.log('[Pc2bimController] Creating new database entry ...');
        Pc2bim.create({
          inputFile: inputFile,
          bimFilePath: null,
          wallsFilePath: null,
          status: 'pending',
          bimDownloadUrl: null
        }).then(function(derivativeState) {

          if (restart) {
            console.log('[Pc2bimController] Reschedule job as requested');
            startExtraction(derivativeState, {
              inputFile: derivativeState.inputFile,
              bimFilePath: bimFilePath,
              wallsFilePath: wallsFilePath,
              duraarkStoragePath: duraarkStoragePath
            });

            derivativeState.status = 'pending';
            derivativeState.error = 'no error';
            return derivativeState.save().then(function() {
              return res.send(derivativeState).status(200);
            });
          }

          if (isAlreadyReconstructed) {
            console.log('[Pc2bimController] Found existing reconstruction, reusing:');
            console.log('[Pc2bimController]   * BIM model: ' + bimFilePath);
            console.log('[Pc2bimController]   * Wall JSON: ' + wallsFilePath);

            // Take the new database entry and update it with the existing data files:
            derivativeState.bimFilePath = bimFilePath;
            derivativeState.wallsFilePath = wallsFilePath;
            derivativeState.bimDownloadUrl = bimFilePath.replace('/duraark-storage', '');
            derivativeState.wallsDownloadUrl = wallsFilePath.replace('/duraark-storage', '');
            derivativeState.status = 'finished';

            derivativeState.save().catch(function(err) {
              console.log('[Pc2BimController] When this error occurs the database and client app are not syncronized correctly anymore ...')
              throw new Error(err);
            });

            console.log('[Pc2bimController] Updated database with existing data');

            // FIXXME: The 'save()' method above could go wrong. This return statement is directly triggered
            // here and not in the resolved promise above only because of the execution flow.
            return res.send(derivativeState).status(200);
          }

          var jobConfig = {
            inputFile: derivativeState.inputFile,
            bimFilePath: bimFilePath,
            wallsFilePath: wallsFilePath,
            duraarkStoragePath: duraarkStoragePath
          };

          console.log('[Pc2bimController] Starting new job: ' + JSON.stringify(jobConfig, null, 4));

          startExtraction(derivativeState, jobConfig);
          return res.send(derivativeState).status(201);
        });

      } else {
        if (restart) {
          console.log('[Pc2bimController] Reschedule job as requested');
          startExtraction(derivativeState, {
            inputFile: derivativeState.inputFile,
            bimFilePath: bimFilePath,
            wallsFilePath: wallsFilePath,
            duraarkStoragePath: duraarkStoragePath
          });

          derivativeState.status = 'pending';
          derivativeState.error = 'no error';
          return derivativeState.save().then(function() {
            return res.send(derivativeState).status(200);
          });
        }

        if (isAlreadyReconstructed) {
          console.log('[Pc2bimController] Found existing reconstruction, reusing:');
          console.log('[Pc2bimController]   * BIM model: ' + bimFilePath);
          console.log('[Pc2bimController]   * Wall JSON: ' + wallsFilePath);

          // Take the new database entry and update it with the existing data files:
          derivativeState.bimFilePath = bimFilePath;
          derivativeState.wallsFilePath = wallsFilePath;
          derivativeState.bimDownloadUrl = bimFilePath.replace('/duraark-storage', '');
          derivativeState.wallsDownloadUrl = wallsFilePath.replace('/duraark-storage', '');
          derivativeState.status = 'finished';

          derivativeState.save().catch(function(err) {
            console.log('[Pc2BimController] When this error occurs the database and client app are not syncronized correctly anymore ...')
            throw new Error(err);
          });

          console.log('[Pc2bimController] Updated database with existing data');

          // FIXXME: The 'save()' method above could go wrong. This return statement is directly triggered
          // here and not in the resolved promise above only because of the execution flow.
          return res.send(derivativeState).status(200);
        }

        if (derivativeState.status === "finished") {
          console.log('[Pc2bimController] Found finished job: ' + JSON.stringify(derivativeState, null, 4));
          return res.send(derivativeState).status(200);
        }

        if (derivativeState.status === "pending") {
          // console.log('[Pc2bimController] Job is pending: ' + JSON.stringify(derivativeState, null, 4));
          return res.send(derivativeState).status(200);
        }

        if (derivativeState.status === "error") {
          console.log('[Pc2bimController] Found failed job: ' + JSON.stringify(derivativeState, null, 4));
          return res.send(derivativeState).status(200);
        }
      }
    }).catch(function(err) {
      console.log('[PC2BIMController] Internal error: ' + err);
      return res.send(err).status(500);
    });
  }
}
