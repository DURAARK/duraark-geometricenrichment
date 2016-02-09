/**
 * DifferenceDetectionController
 *
 * @description :: Server-side logic for managing Differencedetections
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var DifferenceDetectionLib = require('../../bindings/differencedetection/index'),
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

      var cli = new DifferenceDetectionLib(duraarkStoragePath);
      cli.compare(diffDetection).then(function(result) {
        diffDetection.status = 'finished';
        diffDetection.viewerUrl = result.potreeOutdir.replace('/duraark-storage', '');
        diffDetection.save().then(function(diffDetection) {
          console.log('Finished difference detection (ID: %s)', diffDetection.id);
        }).catch(function(err) {
          console.log('Failed to save to database:\n' + err);
        });
      }).catch(function(err) {
        console.log('[duraark-geometricenrichment] difference detection error:\n' + err);
        diffDetection.status = 'error';
        diffDetection.errorMessage = err;
        diffDetection.save();
      });

      res.send(diffDetection).status(200);
    });
  }
};
