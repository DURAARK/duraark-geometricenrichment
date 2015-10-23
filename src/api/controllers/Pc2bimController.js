/**
 * Pc2bimController
 */

var PC2BIM = require('../../bindings/pc2bim');

var _SIMULATE_SUCCESS = false;

function pc2bimRun(filename, duraarkStoragePath) {
  var pc2bim = new PC2BIM(duraarkStoragePath);
  return pc2bim.extract(filename);
}

function startExtraction(config) {
  var runState = config.runState,
    inputFile = config.inputFile;

  pc2bimRun(config.inputFile, config.duraarkStoragePath).then(function(result) {
    console.log('Extraction finished: ' + JSON.stringify(result, null, 4));

    runState.outputFile = result.outputFile;
    runState.status = "finished";
    runState.downloadUrl = result.outputFile.replace('/duraark-storage', '');
    runState.save().then(function(pc2bimRecord) {
      console.log('[Pc2bimController] Successfully reconstructed BIM model for: ' + pc2bimRecord.inputFile);
    });
  }).catch(function(err) {
    console.log('[Pc2bimController] Error:\n' + err);

    if (err === "") {
      err = "'pc2bim' could not start. Are you sure that your CPU is from Intel? AMD is not supported at the moment."
    }
    runState.status = "error";
    runState.errorText = err;

    runState.save().then(function(pc2bimRecord) {
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
    var inputFile = req.param('inputFile'),
      restart = req.param('restart'),
      duraarkStoragePath = process.env.DURAARK_STORAGE_PATH || '/duraark-storage';

    // console.log('duraarkStoragePath: ' + duraarkStoragePath);
    // console.log('inputFile: ' + inputFile);
    // console.log('restart: ' + restart);

    console.log('POST /pc2bim: Scheduled conversion from ' + inputFile);

    res.setTimeout(0);

    Pc2bim.findOne({
      "where": {
        "inputFile": {
          "equals": inputFile
        }
      }
    }).then(function(runState) {
      // console.log('runState: ' + JSON.stringify(runState, null, 4));

      if (!runState) {
        Pc2bim.create({
          inputFile: inputFile,
          outputFile: null,
          status: "pending",
          downloadUrl: null
        }).then(function(runState) {

          if (_SIMULATE_SUCCESS) {
            runState.status = "finished";
            var url = runState.inputFile.replace('.e57', '.ifc');
            url = url.replace('/duraark-storage', '');
            runState.downloadUrl = url;
            return res.send(runState);
          }

          startExtraction({
            runState: runState,
            inputFile: inputFile,
            duraarkStoragePath: duraarkStoragePath
          });

          return res.send(runState).status(200);
        });
      } else {

        if (_SIMULATE_SUCCESS) {
          runState.status = "finished";
          var url = runState.inputFile.replace('.e57', '.ifc');
          url = url.replace('/duraark-storage', '');
          runState.downloadUrl = url;
          return res.send(runState);
        }

        if (runState.status === "finished") {
          console.log('Returning cached result: ' + JSON.stringify(runState, null, 4));
          res.send(runState).status(201);
        }

        if (runState.status === "pending") {
          console.log('Extraction pending: ' + JSON.stringify(runState, null, 4));
          res.send(runState).status(200);
        }

        if (runState.status === "error") {
          console.log('Extraction error: ' + JSON.stringify(runState, null, 4));
          if (restart) {
            startExtraction({
              runState: runState,
              inputFile: inputFile,
              duraarkStoragePath: duraarkStoragePath
            });
          }
          res.send(runState).status(200);
        }
      }
    }).catch(function(err) {
      console.log('[PC2BIMController] Error: ' + err);
    });
  }
}
