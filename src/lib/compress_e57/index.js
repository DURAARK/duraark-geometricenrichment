var Preprocess = require('./preprocess'),
  Compress = require('./compress');

var CompressE57 = module.exports = function(storagePath) {
  this._preprocess = new Preprocess(storagePath);
  this._compress = new Compress(storagePath);
};

CompressE57.prototype.compress = function(config) {
  console.log('[CompressE57] fileId: ' + config.fileId);

  this._preprocess.run(config.fileId).then(function(preprocessResult) {
    console.log('[CompressE57] finished preprocessing file:\n\n%s\n\n', JSON.stringify(preprocessResult, null, 4));
    return that._compress(preprocessResult.outputFile).then(function(e57cFile) {
      var result = {
        inputFile: config.fileId,
        downloadURL: 'http://workbench.duraark.eu/file.e57c'
      }

      return result;
    });
  });
}
