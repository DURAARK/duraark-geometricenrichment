/**
 *  CompressionController
 *
 * @description :: Server-side logic for managing E57 compression
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var Promise = require('bluebird');

module.exports = {
  /**
   * @api {post} /compression/ Compress E57 file
   * @apiVersion 1.0.0
   * @apiName PostCompress
   * @apiGroup Compression
   * @apiPermission none
   *
   * @apiDescription Schedule the compression of an E57 point cloud file.
   *
   * @apiParam (File) {String} inputFile Location of the File as provided by the [DURAARK Sessions API](http://data.duraark.eu/services/api/sessions/).
   * @apiParam (Ratio) {Number} ratio Compression Ratio (between 0-1)
   * @apiParam (Restart) {String} restart Perform a new compression, even if there is a cached result in the database.
   *
   * @apiSuccessExample Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *        "inputFile": "/duraark-storage/sessions/Nygade1001/Nygade_Scan1001.e57",
   *        "ratio": 0.5,
   *        "status": "finished",
   *        "createdAt": "2016-01-03T12:47:23.519Z",
   *        "updatedAt": "2016-01-03T12:47:23.546Z",
   *        "id": 1,
   *        "downloadUrl": "/sessions/Nygade1001/Nygade_Scan1001.e57"
   *      }
   */
  create: function(req, res, next) {
    var inputFile = req.body.inputFile,
      ratio = req.body.ratio,
      restart = req.body.restart;

    console.log('[duraark-geometricenrichment] Requesting E57 compression:');
    console.log('    inputFile: ' + inputFile);
    console.log('    ratio: ' + ratio);
    console.log('    restart: ' + restart);

    var config = {
      inputFile: inputFile,
      ratio: ratio
    };

    Compression.findOne(config).exec(function(err, compressionRecord) {
      console.log('[debug] compressionRecord: ' + JSON.stringify(compressionRecord, null, 4));
      if (compressionRecord) {
        if (restart) {
          console.log('[duraark-geometricenrichment] Deleting cached entry and restarting task');
          return Compression.destroy({
            id: compressionRecord.id
          }).then(function() {
            startBackgroundTasks(config).then(function(compressionRecord) {
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
          ratio: config.ratio,
          status: 'pending'
        }).exec(function(err, compressionRecord) {
          if (err) {
            return res.send({
              status: 'error',
              errorText: 'Error creating new compression record: ' + err
            }).status(200);
          }

          startBackgroundTasks(compressionRecord);

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

function startBackgroundTasks(compressionRecord) {
  var that = this;

  console.log('[duraark-geometricenrichment] Started compression in background');

  return this.DuraarkCompressionE57.compress(compressionRecord).then(function(result) {
    console.log('[duraark-geometricenrichment] finished compression: ' + JSON.stringify(result, null, 4));

    compressionRecord.status = 'finished';
    compressionRecord.downloadUrl = result.outputFile.replace('/duraark-storage', '');
    return compressionRecord.save().then(function(compressionRecord) {
      console.log('Finished compression (ID: %s)', compressionRecord.id);
      return compressionRecord;
    }).catch(function(err) {
      throw new Error('Failed to save to database:\n' + err);
    });
  }).catch(function(err) {
    console.log('[duraark-geometricenrichment] compression error:\n' + err);
    compressionRecord.status = 'error';
    compressionRecord.errorText = err;
    compressionRecord.downloadUrl = null;
    return compressionRecord.save().then(function(compressionRecord) {
      return compressionRecord;
    });
  });
}
