/**
 * FilesController
 *
 * @description :: Server-side logic for managing files
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var fs = require('fs'),
    path = require('path');

// All DURAARK microservices are using a single data volume which is
// mounted at the same path in each container under '/duraark-storage'.
var filesPath = '/duraark-storage/files';

module.exports = {
    find: function(req, res, next) {
        var files = [],
            directories = [];

        fs.readdir(filesPath, function(err, pathStrings) {
            if (err) return res.send(err);

            for (var idx = 0; idx < pathStrings.length; idx++) {
                var pathString = pathStrings[idx];

                var absPath = path.join(filesPath, pathString);

                if (fs.lstatSync(absPath).isDirectory()) {
                    directories.push(absPath);
                } else if (fs.lstatSync(absPath).isFile()) {
                    files.push(absPath);
                }
            }

            res.send(201, {
                files: files,
                directories: directories
            });
        });
    }
};
