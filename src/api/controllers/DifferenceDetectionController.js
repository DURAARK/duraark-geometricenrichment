/**
 * DifferenceDetectionController
 *
 * @description :: Server-side logic for managing Differencedetections
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var DifferenceDetectionLib = require('../../bindings/differencedetection/index'),
  duraarkStoragePath = process.env.DURAARK_STORAGE_PATH || '/duraark-storage',
  Promise = require('bluebird');

module.exports = {
  create: function(req, res, next) {
    var fileIdA = req.body.fileIdA,
      fileIdB = req.body.fileIdB,
      restart = req.body.restart;

    // restart = true;

    console.log('[duraark-geometricenrichment] Requesting difference detection:');
    console.log('    fileIdA: ' + fileIdA);
    console.log('    fileIdB: ' + fileIdB);

    DifferenceDetection.findOne({
        fileAPath: fileIdA,
        fileBPath: fileIdB
      })
      .exec(function(err, diffDetectRecord) {
        if (diffDetectRecord) {
          if (restart) {
            console.log('[duraark-geometricenrichment] Deleting cached entry and restarting task');
            DifferenceDetection.destroy({
              id: diffDetectRecord.id
            }).then(function() {
              startDifferenceDetection(fileIdA, fileIdB).then(function(diffDetectRecord) {
                return res.send(diffDetectRecord).status(200);
              }).catch(function(diffDetectRecord) {
                // NOTE: though we are having an error here a 200 response is sent, so that the client
                //       can display the error.
                return res.send(diffDetectRecord).status(200);
              });
            });
          } else {
            console.log('[duraark-geometricenrichment] Returning cached entry');
            return res.send(diffDetectRecord).status(200);
          }
        } else {
          console.log('[duraark-geometricenrichment] Starting new comparison task')

          startDifferenceDetection(fileIdA, fileIdB).then(function(diffDetectRecord) {
            return res.send(diffDetectRecord).status(200);
          }).catch(function(diffDetectRecord) {
            // NOTE: though we are having an error here a 200 response is sent, so that the client
            //       can display the error.
            return res.send(diffDetectRecord).status(200);
          });
        }
      });
  }
}

function startDifferenceDetection(fileIdA, fileIdB) {
  return new Promise(function(resolve, reject) {
    DifferenceDetection.create({
      fileAPath: fileIdA,
      fileBPath: fileIdB,
      status: 'pending'
    }).exec(function(err, diffDetectRecord) {
      if (err) {
        throw new Error('ERROR creating difference detection instance');
      }

      var preprocessingTasks = [];
      preprocessingTasks.push(preprocessFile(fileIdA));
      preprocessingTasks.push(preprocessFile(fileIdB));

      Promise.all(preprocessingTasks).then(function(files) {
        var fileA = files[0];
        var fileB = files[1];
        scheduleDifferenceDetectionTask(fileA, fileB, diffDetectRecord);
      });

      resolve(diffDetectRecord);
    });
  });
}

function preprocessFile(fileId) {
  return new Promise(function(resolve, reject) {
    File.findOne({
      path: fileId
    }).exec(function(err, file) {
      if (err) {
        throw new Error('ERROR finding file: %s', fileId);
      }

      if (file) {
        console.log('File "%s" is cached', file.path);
        resolve(file);
      } else {
        File.create({
          path: fileId
        }).exec(function(err, file) {
          if (err) {
            throw new Error('ERROR creating fileA record for: %s', fileId);
          }

          // TODO: schedule preprocessing of file!

          file.preprocessed = '/path/asdf.ifcmesh';
          file.save().then(function(file) {
            resolve(file);
          });
        });
      }
    });
  });
}

function scheduleDifferenceDetectionTask(fileA, fileB, diffDetectRecord) {
  return new Promise(function(resolve, reject) {
    console.log('[duraark-geometricenrichment] scheduling difference detection task')

    var DDLib = new DifferenceDetectionLib(duraarkStoragePath);
    return DDLib.compare({
      fileIdA: fileA.path,
      fileIdB: fileB.path
    }).then(function(result) {
      diffDetectRecord.status = 'finished';
      diffDetectRecord.viewerUrl = result.viewerUrl.replace('/duraark-storage', '');
      console.log('diffDetectRecord.viewerUrl: ' + diffDetectRecord.viewerUrl);
      diffDetectRecord.save().then(function() {
        console.log('Finished difference detection (ID: %s)', diffDetectRecord.id);
        resolve(diffDetectRecord);
      }).catch(function(err) {
        console.log('Failed to save to database:\n' + err);
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
