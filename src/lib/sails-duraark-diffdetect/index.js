var Preprocess = require('./preprocess'),
DiffDetectLib = require('../diffdetect');

var SailsDuraarkDiffDetect = module.exports = function(storagePath) {
  this.storagePath = storagePath;
  this._preprocess = new Preprocess(storagePath);
};

SailsDuraarkDiffDetect.prototype.preprocessFiles = function(config) {
  console.log('[sails-duraark-diffdetect] preprocessing files: %s', JSON.stringify(config, null, 4));
  return this._preprocess.run(config);
};

SailsDuraarkDiffDetect.prototype.compareNoPreprocessing = function(files) {
  var diffDetectLib = new DiffDetectLib(this.storagePath);
  return diffDetectLib.compareNoPreprocessing(files);
};
