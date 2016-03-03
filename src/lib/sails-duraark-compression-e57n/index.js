var CompressionLib = require('../compress_e57');

var SailsDuraarkDiffDetect = module.exports = function(storagePath) {
  this.storagePath = storagePath;
  this.compressionLib = new CompressionLib(storagePath);
};

SailsDuraarkDiffDetect.prototype.compress = function(filePath) {
  return this.compressionLib.compress(filePath).then(function(result) {
    console.log('juhuu: ' + JSON.stringify(result, null, 4));
    return result;
  });
};
