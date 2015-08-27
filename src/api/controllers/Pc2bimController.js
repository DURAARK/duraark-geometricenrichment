/**
 * Pc2bimController
 */

var PC2BIM = require('../../bindings/pc2bim');

function startExtraction(filename) {
  var pc2bim = new PC2BIM();
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
    var filename = req.param('file');

    console.log('POST /pc2bim: Scheduled conversion from ' + filename);

    res.setTimeout(0);

    startExtraction(filename).then(function(res) {
      console.log('juhuu: ' + JSON.stringify(res, null, 4));
      res.send(argument).status(200);
    }).catch(function(err) {
      console.log('[Pc2bimController] Error:\n' + err);

      res.send(err).status(500);
    });
  }

};
