const fs = require('fs'),
    path = require('path');

module.exports.cleanFolderSync = function (folder) {
    if (fs.existsSync(folder) && fs.lstatSync(folder).isDirectory()) {
        fs.readdirSync(folder).forEach(function (item) {
            var tmpPath = path.join(folder, item);
            if (fs.lstatSync(tmpPath).isDirectory()) {
                module.exports.cleanFolderSync(tmpPath);
                fs.rmdirSync(tmpPath);
            } else {
                fs.unlinkSync(tmpPath);
            }
        });
    }
}

module.exports.removeFolderSync = function (folder) {
    if (fs.existsSync(folder) && fs.lstatSync(folder).isDirectory()) {
        module.exports.cleanFolderSync(folder);
        fs.rmdirSync(folder);
    }
};