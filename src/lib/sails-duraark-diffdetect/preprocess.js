var DiffDetectLib = require('../diffdetect'),
  Promise = require('bluebird'),
  util = require('util'),
  fs = require('fs');

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch (err) {
    return false;
  }
}


// Promise.onPossiblyUnhandledRejection(function(err) {
//   console.log('Promise.onPossiblyUnhandledRejection handler:');
//   throw err;
// });

var Preprocess = module.exports = function(storagePath) {
  this.storagePath = storagePath;
  this.createCacheFromExistingFiles = true;
};

Preprocess.prototype.run = function(config) {
  var that = this;
  return new Promise(function(resolve, reject) {
    that._startPreprocessingFiles(config).then(function(result) {
      resolve(result);
    }).catch(function(err) {
      reject(err);
    });
  });
};

Preprocess.prototype._startPreprocessingFiles = function(config) {
  var filePathA = config.filePathA,
    filePathB = config.filePathB,
    deleteCache = config.deleteCache,
    that = this;

  var filePaths = [config.filePathA, config.filePathB],
    fileProcessPromises = [];

  _.forEach(filePaths, function(filePath) {
    fileProcessPromises.push(that._findCacheRecord(filePath).then(function(preprocessedFiles) {
      // console.log('[debug] _startPreprocessingFiles: ' + JSON.stringify(preprocessedFiles, null, 4));
      if (preprocessedFiles && preprocessedFiles.status === 'finished') {
        console.log('[sails-duraark-diffdetect] found cache entry');
        if (deleteCache) {
          console.log('[sails-duraark-diffdetect] deleting cache entry as requrested');
          return that._deleteCacheRecord(preprocessedFiles)
            .then(createCacheRecord({
              inputFile: fileIdA
            })).then(function(preprocessedFiles) {
              return that._preprocessFile(preprocessedFiles);
            });
        } else {
          return preprocessedFiles;
        }
      } else if (preprocessedFiles && preprocessedFiles.status === 'pending') {
        // TODO!
      } else if (preprocessedFiles && preprocessedFiles.status === 'error') {
        // TODO!
      } else {
        console.log('[sails-duraark-diffdetect] creating new cache entry');
        return that._createCacheRecord(filePath).then(function(preprocessedFilesRecord) {
          console.log('[debug] created new cache entry: ' + JSON.stringify(preprocessedFilesRecord, null, 4));
          // _createCacheRecord creates a record from existing files, depending on the configuration
          // parameter 'createCacheFromExistingFiles'
          if (preprocessedFilesRecord.status === 'finished') {
            console.log('[debug] finished: ' + JSON.stringify(preprocessedFilesRecord, null, 4));
            return preprocessedFilesRecord;
          }

          return that._preprocessFile(preprocessedFilesRecord);
        });
      }
    }));
  });

  return Promise.all(fileProcessPromises).then(function(preprocessedFilesRecords) {
    console.log('preprocessedFilesRecordsJUHUU: ' + preprocessedFilesRecords);
    return preprocessedFilesRecords;
  });
}

Preprocess.prototype._preprocessFile = function(preprocessedFilesRecord) {
  console.log('[debug] _preprocessFile: ' + JSON.stringify(preprocessedFilesRecord, null, 4));

  var diffDetectLib = new DiffDetectLib(this.storagePath);

  return new Promise(function(resolve, reject) {
    console.log('[sails-duraark-diffdetect] Doing file processing ...');
    return diffDetectLib.preprocessFile(preprocessedFilesRecord.inputFile).then(function(result) {
      console.log('[debug] finished file processing with: ' + JSON.stringify(result, null, 4));
      preprocessedFilesRecord.status = 'finished';
      preprocessedFilesRecord.outputFile = result.outputFile;

      preprocessedFilesRecord.save().then(function() {
        resolve(preprocessedFilesRecord);
      }).catch(function(err) {
        throw new Error('ERROR saving instance: ' + err);
      });
    }).catch(function(err) {
      preprocessedFilesRecord.status = 'error';
      preprocessedFilesRecord.errorText = err;

      preprocessedFilesRecord.save().catch(function(err) {
        throw new Error('ERROR saving instance: ' + err);
      });
      reject(preprocessedFilesRecord);
    });
  });
}

Preprocess.prototype._findCacheRecord = function(filePath) {
  var that = this;
  return new Promise(function(resolve, reject) {
    PreprocessedFiles.findOne({
      inputFile: filePath
    }).exec(function(err, preprocessedFilesRecord) {
      if (err) {
        reject(err);
        throw new Error('ERROR saving instance: ' + err);
      }

      resolve(preprocessedFilesRecord);
    });
  });
}

Preprocess.prototype._createCacheRecord = function(inputFile) {
  console.log('[debug] _createCacheRecord: ' + inputFile);

  var that = this;

  return new Promise(function(resolve, reject) {
    PreprocessedFiles.create({
      inputFile: inputFile,
      outputFile: null,
      fileType: inputFile.split('.').pop(),
      status: 'pending'
    }).exec(function(err, preprocessedFilesRecord) {
      if (err) {
        reject(err);
        throw new Error('ERROR saving instance: ' + err);
      }

      if (!that.createCacheFromExistingFiles) {
        resolve(preprocessedFilesRecord);
      } else {
        var fileType = inputFile.split('.').pop(),
          potentialPreprocessedFilePath = null;

        console.log('[debug] checking if preprocessed file already exists for: ' + inputFile);

        if (fileType.toLowerCase() === 'ifc') {
          potentialPreprocessedFilePath = inputFile.replace('master', 'tmp').replace(fileType, 'ifcmesh');
        } else if (fileType.toLowerCase() === 'e57') {
          potentialPreprocessedFilePath = inputFile.replace('master', 'tmp').replace(fileType, 'e57n');
        } else {
          console.log('[ERROR] file type is not supported: ' + inputFile);
          reject('[ERROR] file type is not supported: ' + inputFile);
        }

        console.log('[debug] searching for: ' + potentialPreprocessedFilePath);
        if (fileExists(potentialPreprocessedFilePath)) {
          console.log('[debug] found file');

          preprocessedFilesRecord.outputFile = potentialPreprocessedFilePath;
          preprocessedFilesRecord.status = 'finished';
          preprocessedFilesRecord.save().then(resolve);
        } else {
          console.log('[debug] file does not exist');
          resolve(preprocessedFilesRecord);
        }
      }
    });
  });
}

Preprocess.prototype._deleteCache = function(record, files) {
  return new Promise(function(resolve, reject) {
    PreprocessedFiles.destroy(record.id).then(function() {
      var deleteFilePromises = [];
      _.forEach(files, function(file) {
        deleteFilePromises.push(fs.unlink(file));
      });

      Promise.all(deleteFilePromises).then(function() {
        resolve(recordType);
      }).catch(function(err) {
        reject(err);
      });
    });
  });
}
