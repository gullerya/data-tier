const os = require('os'),
	fs = require('fs'),
	path = require('path'),
	http = require('http'),
	https = require('https'),
	readline = require('readline'),

	admZip = require('adm-zip'),
	utils = require('./utils.js'),

	googleAPIs = 'www.googleapis.com',
	chromiumRevisionPathWin = '/download/storage/v1/b/chromium-browser-snapshots/o/Win_x64%2FLAST_CHANGE?alt=media',
	chromiumDownloadPathWin = '/download/storage/v1/b/chromium-browser-snapshots/o/Win_x64%2F{REVISION}%2Fchrome-win32.zip?alt=media';

module.exports.obtainChrome = function(callback) {
	utils.removeFolderSync('./tmp');
	fs.mkdirSync('./tmp');

	let req = https.request({method: 'GET', hostname: googleAPIs, path: chromiumRevisionPathWin}, res => {
		let revision = '',
			contentReq,
			destination;
		res.on('data', chunk => revision += chunk.toString());
		res.on('end', () => {
			process.stdout.write('Latest Chromium revision found is \x1B[32m' + revision + '\x1B[37m (Windows)' + os.EOL);

			process.stdout.write('Downloading Chromium... ');
			destination = fs.createWriteStream('./tmp/chromium.zip');
			contentReq = https.request({
				method: 'GET',
				hostname: googleAPIs,
				path: chromiumDownloadPathWin.replace('{REVISION}', revision)
			}, contentRes => {
				var totalLength = 0,
					tmpLength = 0;
				contentRes.pipe(destination);
				contentRes.on('data', chunk => {
					tmpLength += chunk.length;
					if (Math.round(tmpLength / 1000000) > 1) {
						totalLength += tmpLength;
						process.stdout.write('\x1B7');
						process.stdout.write('\x1B[32m' + Math.round(totalLength / 1000000) + '\x1B[37m MB');
						process.stdout.write('\x1B8');
						tmpLength = 0;
					}
				});
				contentRes.on('end', () => {
					process.stdout.write('\x1B[37m' + os.EOL);

					process.stdout.write('Unzipping Chromium... ');
					try {
						let zip = new admZip('./tmp/chromium.zip');
						zip.extractAllTo('./tmp/chromium', true);
						process.stdout.write('\x1B[32mOK\x1B[37m' + os.EOL);
						if (typeof callback === 'function') {
							callback();
						}
					} catch (e) {
						process.stdout.write('\x1B[31m' + e + '\x1B[37m' + os.EOL);
					}
				});
			});
			contentReq.end();
		});
	});
	req.end();
	req.on('error', error => console.error(error));
};
