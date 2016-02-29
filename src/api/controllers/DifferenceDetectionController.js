/**
 * DifferenceDetectionController
 *
 * @description :: Server-side logic for managing Differencedetections
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var Promise = require('bluebird');

module.exports = {
  create: function(req, res, next) {
    var fileIdA = req.body.fileIdA,
      fileIdB = req.body.fileIdB,
      restart = req.body.restart;

    // restart = false;

    console.log('[duraark-geometricenrichment] Requesting difference detection:');
    console.log('    fileIdA: ' + fileIdA);
    console.log('    fileIdB: ' + fileIdB);
    console.log('    restart: ' + restart);

    var config = {
      inputFileA: fileIdA,
      inputFileB: fileIdB
    };

    DifferenceDetection.findOne(config).exec(function(err, diffDetectRecord) {
      // console.log('[debug] diffDetectRecord: ' + JSON.stringify(diffDetectRecord, null, 4));
      if (diffDetectRecord) {
        if (restart) {
          console.log('[duraark-geometricenrichment] Deleting cached entry and restarting task');
          return DifferenceDetection.destroy({
            id: diffDetectRecord.id
          }).then(function() {
            startBackgroundTasks(fileIdA, fileIdB, diffDetectRecord).then(function(diffDetectRecord) {
              return res.send(diffDetectRecord).status(200);
            }).catch(function(diffDetectRecord) {
              throw new Error('Error in difference detection: ' + JSON.stringify(diffDetectRecord));
            });
          });
        } else {
          console.log('[duraark-geometricenrichment] Returning cached entry');
          return res.send(diffDetectRecord).status(200);
        }
      }

      if (diffDetectRecord && diffDetectRecord.status === 'finished') {
        console.log('[duraark-geometricenrichment] Returning cached entry');
        return res.send(diffDetectRecord).status(200);
      } else if (diffDetectRecord && diffDetectRecord.status === 'error') {
        console.log('[duraark-geometricenrichment] Requested difference detection was not successfull');
        return res.send(diffDetectRecord).status(200);
      } else if (diffDetectRecord && diffDetectRecord.status === 'pending') {
        console.log('[duraark-geometricenrichment] Requested difference detection is pending');
        return res.send(diffDetectRecord).status(200);
      } else if (!diffDetectRecord) {
        console.log('[duraark-geometricenrichment] Starting new comparison task')

        DifferenceDetection.create({
          inputFileA: fileIdA,
          inputFileB: fileIdB,
          status: 'pending'
        }).exec(function(err, diffDetectRecord) {
          if (err) {
            return res.send({
              status: 'error',
              errorText: 'Error creating new difference detection record: ' + err
            }).status(200);
          }

          startBackgroundTasks(fileIdA, fileIdB, diffDetectRecord).then(function() {
            console.log('[duraark-geometricenrichment] Started difference detection in background');
          });

          return res.send(diffDetectRecord).status(200);
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

function startBackgroundTasks(fileIdA, fileIdB, diffDetectRecord, deleteCache) {
  var config = {
      filePathA: fileIdA,
      filePathB: fileIdB,
      deleteCache: deleteCache
    },
    that = this;

  return this.DuraarkDiffDetect.preprocessFiles(config).then(function(preprocessedFilesRecords) {
    console.log('preprocessedFilesRecords: ' + JSON.stringify(preprocessedFilesRecords, null, 4));

    that.DuraarkDiffDetect.compareNoPreprocessing(preprocessedFilesRecords).then(function(result) {
      diffDetectRecord.status = 'finished';
      diffDetectRecord.viewerUrl = result.viewerUrl.replace('/duraark-storage', '');
      console.log('diffDetectRecord.viewerUrl: ' + diffDetectRecord.viewerUrl);
      diffDetectRecord.save().then(function() {
        console.log('Finished difference detection (ID: %s)', diffDetectRecord.id);
      }).catch(function(err) {
        throw new Error('Failed to save to database:\n' + err);
      });
    }).catch(function(err) {
      console.log('[duraark-geometricenrichment] difference detection error:\n' + err);
      diffDetectRecord.status = 'error';
      diffDetectRecord.errorText = err;
      diffDetectRecord.viewerUrl = null;
      diffDetectRecord.save();
      reject(diffDetectRecord);
    });

  });

  var preprocessingTasks = [];
  preprocessingTasks.push(preprocessFile(fileIdA));
  preprocessingTasks.push(preprocessFile(fileIdB));

  Promise.all(preprocessingTasks).then(function(files) {
    var fileA = files[0];
    var fileB = files[1];
    scheduleDifferenceDetectionTask(fileA, fileB, diffDetectRecord).catch(function(diffDetectRecord) {
      reject(diffDetectRecord);
    });
  }).catch(function(err) {
    diffDetectRecord.status = 'error';
    diffDetectRecord.errorText = err;
    diffDetectRecord.save().catch(function(err) {
      throw new Error('ERROR creating instance: ' + err);
    });
  });

  return new Promise(function(resolve, reject) {
    DifferenceDetection.create({
      inputFileA: fileIdA,
      inputFileB: fileIdB,
      status: 'pending'
    }).exec(function(err, diffDetectRecord) {
      if (err) {
        throw new Error('ERROR creating difference detection instance');
      }

      resolve(diffDetectRecord);
    });
  });
}

function scheduleDifferenceDetectionTask(fileA, fileB, diffDetectRecord) {
  return new Promise(function(resolve, reject) {
    console.log('[duraark-geometricenrichment] scheduling difference detection task')

    // FIXXME: remove after testing!
    diffDetectRecord.status = 'error';
    diffDetectRecord.errorText = err;
    diffDetectRecord.viewerUrl = null;
    // diffDetectRecord.save();
    return reject(diffDetectRecord);

    var DDLib = new DiffDetectLib(duraarkStoragePath);
    return DDLib.compare({
      fileIdA: fileA.path,
      fileIdB: fileB.path
    }).then(function(result) {
      if (result.status && result.status === 'pending') {
        resolve(result);
      }

      diffDetectRecord.status = 'finished';
      diffDetectRecord.viewerUrl = result.viewerUrl.replace('/duraark-storage', '');
      console.log('diffDetectRecord.viewerUrl: ' + diffDetectRecord.viewerUrl);
      diffDetectRecord.save().then(function() {
        console.log('Finished difference detection (ID: %s)', diffDetectRecord.id);
        resolve(diffDetectRecord);
      }).catch(function(err) {
        throw new Error('Failed to save to database:\n' + err);
      });
    }).catch(function(err) {
      console.log('[duraark-geometricenrichment] difference detection error:\n' + err);
      diffDetectRecord.status = 'error';
      diffDetectRecord.errorText = err;
      diffDetectRecord.viewerUrl = null;
      diffDetectRecord.save();
      reject(diffDetectRecord);
    });
  });
}
