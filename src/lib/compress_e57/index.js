var Preprocess = require('./preprocess'),
  Compress = require('./compress');

var CompressE57 = module.exports = function(storagePath) {
  this._preprocess = new Preprocess(storagePath);
  this._compress = new Compress(storagePath);
};

CompressE57.prototype.compress = function(config) {
  console.log('[CompressE57] inputFile: ' + config.inputFile);

  var that = this;

  return this._preprocess.run(config.inputFile).then(function(preprocessResult) {
    console.log('[CompressE57] finished preprocessing file:\n\n%s\n\n', JSON.stringify(preprocessResult, null, 4));
    return that._compress.run({
      inputFile: preprocessResult.outputFile,
      ratio: config.ratio
    });
  });
}
