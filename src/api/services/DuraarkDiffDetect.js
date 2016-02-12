var DuraarkDiffDetect = require('../../lib/sails-duraark-diffdetect');
duraarkStoragePath = process.env.DURAARK_STORAGE_PATH || '/duraark-storage';

console.log('[sails-duraark-diffdetect]: duraarkStoragePath: ' + duraarkStoragePath);
var diffDetect = new DuraarkDiffDetect(duraarkStoragePath);
module.exports = diffDetect;
