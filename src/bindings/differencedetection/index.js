var Preprocess = require('./preprocess'),
Promise = require('bluebird');

var DifferenceDetectionCLI = module.exports = function(storagePath) {
  this._preprocess = new Preprocess(storagePath);
};

DifferenceDetectionCLI.prototype.compare = function(config) {
  var that = this;
  console.log('[DifferenceDetectionCLI] fileIdA: ' + config.fileIdA);
  console.log('                         fileIdB: ' + config.fileIdB);

  // TODO: implement caching!

  var filesToPreprocess = [];
  filesToPreprocess.push(this.preprocessFile(config.fileIdA));
  filesToPreprocess.push(this.preprocessFile(config.fileIdB));

  return Promise.all(filesToPreprocess).then(function(files) {
    console.log('[DifferenceDetectionCLI] finished preprocessing files');
  });
}

DifferenceDetectionCLI.prototype.preprocessFile = function (filePath) {
  return this._preprocess.run(filePath);
};
