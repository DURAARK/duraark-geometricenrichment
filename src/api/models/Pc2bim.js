/**
* Pc2bim.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
    inputFile: 'string',
    bimFilePath: 'string',
    wallFilePath: 'string',
    bimDownloadUrl: 'string',
    wallsDownloadUrl: 'string',
    status: 'string',
    errorText: 'string'
  }
};
