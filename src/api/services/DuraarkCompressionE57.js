var DuraarkCompressionE57 = require('../../lib/sails-duraark-compression-e57n');
duraarkStoragePath = process.env.DURAARK_STORAGE_PATH || '/duraark-storage';

console.log('[sails-duraark-compression-e57n]: duraarkStoragePath: ' + duraarkStoragePath);
var compressionE57 = new DuraarkCompressionE57(duraarkStoragePath);
module.exports = compressionE57;
