var Preprocess = require('./preprocess'),
  AutoReg = require('./autoreg'),
  Association = require('./association'),
  DiffDetect = require('./diffdetect'),
  PotreeConverter = require('./potreeconverter'),
  Promise = require('bluebird'),
  path = require('path');

var DifferenceDetectionCLI = module.exports = function(storagePath) {
  this._preprocess = new Preprocess(storagePath);
  this._autoreg = new AutoReg(storagePath);
  this._association = new Association(storagePath);
  this._diffDetect = new DiffDetect(storagePath);
  this._potreeConverter = new PotreeConverter(storagePath);
};

DifferenceDetectionCLI.prototype.compare = function(config) {
  console.log('[DifferenceDetectionCLI] fileIdA: ' + config.fileIdA);
  console.log('                         fileIdB: ' + config.fileIdB);

  // TODO: implement caching!

  var filesToPreprocess = [],
    that = this;

  filesToPreprocess.push(this.preprocessFile(config.fileIdA));
  filesToPreprocess.push(this.preprocessFile(config.fileIdB));

  return Promise.all(filesToPreprocess).then(function(files) {
    console.log('[DifferenceDetectionCLI] finished preprocessing files:\n\n%s\n\n', JSON.stringify(files, null, 4));
    return that.registerFiles(files).then(function(files) {
      console.log('[DifferenceDetectionCLI] finished registration of files:\n\n%s\n\n', JSON.stringify(files, null, 4));
      return that.associateFiles(files).then(function(files) {
        console.log('[DifferenceDetectionCLI] finished association of files:\n\n%s\n\n', JSON.stringify(files, null, 4));
        return that.createDifferencePointcloud(files).then(function(files) {
          console.log('[DifferenceDetectionCLI] created difference point cloud:\n\n%s\n\n', JSON.stringify(files, null, 4));

          var dirname = path.dirname(files[0].fileId),
            pageName = path.basename(files[0].fileId.replace(' ', '_')) + '-' + path.basename(files[1].fileId.replace(' ', '_'));

          var config = {
            pageName: pageName,
            dirname: dirname,
            potreeOutdir: path.join(dirname, '../potree/') + pageName,
            e57File: files[0].diffDetectOutputFile
          }

          return that.convertToPotree(config);
        });
      });
    });
  });
}

DifferenceDetectionCLI.prototype.preprocessFile = function(filePath) {
  return this._preprocess.run(filePath);
};

DifferenceDetectionCLI.prototype.registerFiles = function(files) {
  return this._autoreg.run(files);
};

DifferenceDetectionCLI.prototype.associateFiles = function(files) {
  return this._association.run(files);
};

DifferenceDetectionCLI.prototype.createDifferencePointcloud = function(files) {
  return this._diffDetect.run(files);
};

DifferenceDetectionCLI.prototype.convertToPotree = function(config) {
  return this._potreeConverter.run(config);
};
