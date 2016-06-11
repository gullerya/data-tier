const os = require('os'),
    fs = require('fs'),
    path = require('path'),
    http = require('http'),
    https = require('https'),
    readline = require('readline'),

    admZip = require('adm-zip'),

    googleAPIs = 'www.googleapis.com',
    chromiumRevisionPathWin = '/download/storage/v1/b/chromium-browser-snapshots/o/Win_x64%2FLAST_CHANGE?alt=media',
    chromiumDownloadPathWin = '/download/storage/v1/b/chromium-browser-snapshots/o/Win_x64%2F{REVISION}%2Fchrome-win32.zip?alt=media';

module.exports.obtainChrome = function (callback) {
    var req = https.request({ method: 'GET', hostname: googleAPIs, path: chromiumRevisionPathWin }, res => {
        var revision = '',
            contentReq,
            destination;
        res.on('data', chunk => revision += chunk.toString());
        res.on('end', () => {
            destination = fs.createWriteStream('chromium.zip');
            contentReq = https.request({ method: 'GET', hostname: googleAPIs, path: chromiumDownloadPathWin.replace('{REVISION}', revision) }, contentRes => {
                var gotLength = 0;
                contentRes.pipe(destination);
                contentRes.on('data', chunk => {
                    gotLength += chunk.length;
                    process.stdout.write(Math.round(gotLength / 1000000) + ' MB');
                    readline.cursorTo(process.stdout, 40);
                });
                contentRes.on('end', () => {
                    var zip = new admZip('chromium.zip');
                    zip.extractAllTo('chromium', true);
                    callback();
                });
            });
            contentReq.end();
        });
    });
    req.end();
    req.on('error', error => console.error(error));
};