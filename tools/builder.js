var os = require('os'),
    fs = require('fs'),
    path = require('path'),
    sources,
    destination;

sources = [
    path.join('node_modules', 'object-observer', 'dist', 'object-observer.js'),
    path.join('src', 'view-observer.js'),
    path.join('src', 'data-tier.js')
];
destination = path.join('dist', 'data-tier.js');

module.exports.concatSources = function concatSources(grunt) {
    var cleanError = null;

    //  clean up
    process.stdout.write('Cleaning destination folder...');
    try {
        removeFolderSync('dist');
    } catch (e) {
        cleanError = e;
    }
    process.stdout.write('\t' + (cleanError === null ? '\x1b[32mOK' : '\x1b[31mFAIL (' + cleanError + ')') + os.EOL);

    //  create folder
    process.stdout.write('Creating destination folder...');
    try {
        fs.mkdirSync('dist');
    } catch (e) {
        cleanError = e;
    }
    process.stdout.write('\t' + (cleanError === null ? '\x1b[32mOK' : '\x1b[31mFAIL (' + cleanError + ')') + os.EOL);

    //  concat & copy
    process.stdout.write('Concat & copy:' + os.EOL);
    sources.forEach(source => {
        var error = null;
        process.stdout.write('\t' + source);
        try {
            fs.appendFileSync(destination, fs.readFileSync(source));
            fs.appendFileSync(destination, os.EOL);
        } catch (e) {
            error = e;
        }
        process.stdout.write('\t' + (error === null ? '\x1b[32mOK' : '\x1b[31mFAIL (' + error + ')') + os.EOL);
    });
};

function cleanFolderSync(folder) {
    if (fs.existsSync(folder) && fs.lstatSync(folder).isDirectory()) {
        fs.readdirSync(folder).forEach(function (item) {
            var tmpPath = path.join(folder, item);
            if (fs.lstatSync(tmpPath).isDirectory()) {
                cleanFoldeSyncr(tmpPath);
                fs.rmdirSync(tmpPath);
            } else {
                fs.unlinkSync(tmpPath);
            }
        });
    }
}

function removeFolderSync(folder) {
    if (fs.existsSync(folder) && fs.lstatSync(folder).isDirectory()) {
        cleanFolderSync(folder);
        fs.rmdirSync(folder);
    }
};