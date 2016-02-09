/**
 * DifferenceDetectionController
 *
 * @description :: Server-side logic for managing Differencedetections
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var DifferenceDetectionCLI = require('../../bindings/differencedetection/index'),
  duraarkStoragePath = process.env.DURAARK_STORAGE_PATH || '/duraark-storage';

module.exports = {
  create: function(req, res, next) {
    var options = req.body;

    console.log('[duraark-geometricenrichment] Requesting difference detection:');
    console.log('             fileIdA: ' + options.fileIdA);
    console.log('             fileIdB: ' + options.fileIdB);

    // TODO: search in cache first!
    options.status = 'pending';

    DifferenceDetection.create(options).then(function(diffDetection) {
      // TODO: schedule difference detection job!
      console.log('[duraark-geometricenrichment] scheduled difference detection job')

      var cli = new DifferenceDetectionCLI(duraarkStoragePath);
      cli.compare(diffDetection).then(function() {
        console.log('Finished difference detection!');
        diffDetection.status = 'finished';
        diffDetection.save();
      }).catch(function(err) {
				console.log('[duraark-geometricenrichment] difference detection error: ' + err);
				diffDetection.status = 'error';
				diffDetection.errorMessage = err;
				diffDetection.save();
			});

      res.send(diffDetection).status(200);
    });
  }
};
