/**
 * DifferenceDetection.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    inputFileA: 'string',
    inputFileB: 'string',

    viewerUrl: 'string',
    status: 'string',

    registrationRDF: 'string',
    associationRDF: 'string',
    differenceE57: 'string',
    viewerUrl: 'string',

    resolution: 'number',
    objPath: 'string'
  }
};
