/**
 * Pc2bimController
 */

var PC2BIM = require('../../bindings/pc2bim');

function startExtraction(filename, duraarkStoragePath) {
  var pc2bim = new PC2BIM(duraarkStoragePath);
  return pc2bim.extract(filename);
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
      duraarkStoragePath = process.env.DURAARK_STORAGE_PATH || '/duraark-storage';

    // console.log('duraarkStoragePath: ' + duraarkStoragePath);

    console.log('POST /pc2bim: Scheduled conversion from ' + inputFile);

    res.setTimeout(0);

    Pc2bim.findOne({
      "where": {
        "inputFile": {
          "equals": inputFile
        }
      }
    }).then(function(pc2bim) {
      // console.log('pc2bim: ' + JSON.stringify(pc2bim, null, 4));

      if (!pc2bim) {
        Pc2bim.create({
          inputFile: inputFile,
          outputFile: null,
          status: "pending"
        }).then(function(pc2bim) {
          startExtraction(inputFile, duraarkStoragePath).then(function(result) {
            console.log('Extraction finished: ' + JSON.stringify(result, null, 4));
            pc2bim.outputFile = result.outputFile;
            pc2bim.status = "finished";
            pc2bim.save().then(function(pc2bimRecord) {
              res.send(pc2bimRecord).status(200);
            });
          }).catch(function(err) {
            console.log('[Pc2bimController] Error:\n' + err);

            pc2bim.status = "error";
            pc2bim.save().then(function() {
              res.send(err).status(500);
            });
          });

        });
      } else {
        if (pc2bim.status === "finished") {
          console.log('Returning cached result: ' + JSON.stringify(pc2bim, null, 4));
          res.send(pc2bim).status(201);
        }

        if (pc2bim.status === "pending") {
          console.log('Extraction pending: ' + JSON.stringify(pc2bim, null, 4));
          res.send(pc2bim).status(200);
        }

        if (pc2bim.status === "error") {
          console.log('Extraction error: ' + JSON.stringify(pc2bim, null, 4));
          res.send(pc2bim).status(200);
        }
      }
    }).catch(function(err) {
      console.log('[PC2BIMController] Error: ' + err);
    });
  }
}
