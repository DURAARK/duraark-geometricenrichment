/**
 *  CompressionController
 *
 * @description :: Server-side logic for managing E57 compression
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var Promise = require('bluebird');

module.exports = {
  create: function(req, res, next) {
    var inputFile = req.body.inputFile,
      restart = req.body.restart;

    console.log('[duraark-geometricenrichment] Requesting E57 compression:');
    console.log('    inputFile: ' + inputFile);
    console.log('    restart: ' + restart);

    var config = {
      inputFile: inputFile
    };

    Compression.findOne(config).exec(function(err, compressionRecord) {
      // console.log('[debug] compressionRecord: ' + JSON.stringify(compressionRecord, null, 4));
      if (compressionRecord) {
        if (restart) {
          console.log('[duraark-geometricenrichment] Deleting cached entry and restarting task');
          return Compression.destroy({
            id: compressionRecord.id
          }).then(function() {
            startBackgroundTasks(config.inputFile, restart).then(function(compressionRecord) {
              return res.send(compressionRecord).status(200);
            }).catch(function(compressionRecord) {
              throw new Error('Error in compression: ' + JSON.stringify(compressionRecord));
            });
          });
        } else {
          console.log('[duraark-geometricenrichment] Returning cached entry');
          return res.send(compressionRecord).status(200);
        }
      }

      if (compressionRecord && compressionRecord.status === 'finished') {
        console.log('[duraark-geometricenrichment] Returning cached entry');
        return res.send(compressionRecord).status(200);
      } else if (compressionRecord && compressionRecord.status === 'error') {
        console.log('[duraark-geometricenrichment] Requested compression was not successfull');
        return res.send(compressionRecord).status(200);
      } else if (compressionRecord && compressionRecord.status === 'pending') {
        console.log('[duraark-geometricenrichment] Requested compression is pending');
        return res.send(compressionRecord).status(200);
      } else if (!compressionRecord) {
        console.log('[duraark-geometricenrichment] Starting new comparison task')

        Compression.create({
          inputFile: config.inputFile,
          status: 'pending'
        }).exec(function(err, compressionRecord) {
          if (err) {
            return res.send({
              status: 'error',
              errorText: 'Error creating new compression record: ' + err
            }).status(200);
          }

          startBackgroundTasks(inputFile).then(function() {
            console.log('[duraark-geometricenrichment] Started compression in background');
          });

          return res.send(compressionRecord).status(200);
        });
      } else {
        res.send({
          status: 'error',
          errorText: 'Database inconsistency, contact system administrator!'
        }).status(200);
        console.log('[ERROR] Database inconsistency, contact system administrator!');
      }
    });
  }
}

function startBackgroundTasks(inputFile, deleteCache) {
  var that = this;

  return this.DuraarkCompressionE57.compress(inputFile).then(function(result) {
    console.log('[duraark-geometricenrichment] finished compression. Result: ' + JSON.stringify(result, null, 4));

    compressionRecord.status = 'finished';
    compressionRecord.downloadURL = result.outputFile.replace('/duraark-storage', '');
    compressionRecord.save().then(function() {
      console.log('Finished compression (ID: %s)', compressionRecord.id);
    }).catch(function(err) {
      throw new Error('Failed to save to database:\n' + err);
    });
  }).catch(function(err) {
    console.log('[duraark-geometricenrichment] compression error:\n' + err);
    compressionRecord.status = 'error';
    compressionRecord.errorText = err;
    compressionRecord.viewerUrl = null;
    compressionRecord.save();
    return (compressionRecord);
  });
}
