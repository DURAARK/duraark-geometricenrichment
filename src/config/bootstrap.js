/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#/documentation/reference/sails.config/sails.config.bootstrap.html
 */

var promisify = require('promisify-node'),
  fs = promisify('fs-extra'),
  Promise = require('bluebird');

module.exports.bootstrap = function(cb) {

  var promises = [];

  promises.push(fs.mkdirp('/duraark-storage/logs/pc2bim'));
  promises.push(fs.mkdirp('/duraark-storage/logs/diffdetect'));
  promises.push(fs.mkdirp('/duraark-storage/logs/compression'));

  Promise.all(promises).then(function() {
    console.log('[init] Created log folder structure.');
    cb();
  }).catch(function(err) {
    console.log('[init] ERROR: ' + error);
  });
};
