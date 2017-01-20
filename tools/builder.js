const os = require('os'),
    fs = require('fs'),
    path = require('path'),
    utils = require('./utils.js');

var sourcesWithOO,
	sourcesWithoutOO,
    destinationWithOO,
	destinationWithoutOO;

sourcesWithOO = [
    path.join('node_modules', 'object-observer', 'dist', 'object-observer.js'),
    path.join('src', 'ties-service.js'),
    path.join('src', 'rules-service.js'),
    path.join('src', 'views-service.js'),
    path.join('src', 'vanilla-rules.js')
];
destinationWithOO = path.join('dist', 'data-tier.js');

sourcesWithoutOO = [
    path.join('src', 'ties-service.js'),
    path.join('src', 'rules-service.js'),
    path.join('src', 'views-service.js'),
    path.join('src', 'vanilla-rules.js')
];
destinationWithoutOO = path.join('dist', 'data-tier-wo-oo.js');

module.exports.concatSources = function concatSources(grunt) {
	var cleanError = null;

	//  clean up
	process.stdout.write('Cleaning destination folder...');
	try {
		utils.removeFolderSync('dist');
	} catch (e) {
		cleanError = e;
	}
	process.stdout.write('\t' + (cleanError === null ? '\033[32mOK' : '\033[31mFAIL (' + cleanError + ')') + os.EOL);

	//  create folder
	process.stdout.write('Creating destination folder...');
	try {
		fs.mkdirSync('dist');
	} catch (e) {
		cleanError = e;
	}
	process.stdout.write('\t' + (cleanError === null ? '\033[32mOK' : '\033[31mFAIL (' + cleanError + ')') + os.EOL);

	//  concat & copy
	process.stdout.write('Concat & copy (with embedded "object-observer"):' + os.EOL);
	sourcesWithOO.forEach(source => {
		var error = null;
		process.stdout.write('\t' + source);
		try {
			fs.appendFileSync(destinationWithOO, fs.readFileSync(source));
			fs.appendFileSync(destinationWithOO, os.EOL);
		} catch (e) {
			error = e;
		}
		process.stdout.write('\t' + (error === null ? '\033[32mOK' : '\033[31mFAIL (' + error + ')') + os.EOL);
	});

	process.stdout.write('Concat & copy (without embedded "object-observer"):' + os.EOL);
	sourcesWithoutOO.forEach(source => {
		var error = null;
		process.stdout.write('\t' + source);
		try {
			fs.appendFileSync(destinationWithoutOO, fs.readFileSync(source));
			fs.appendFileSync(destinationWithoutOO, os.EOL);
		} catch (e) {
			error = e;
		}
		process.stdout.write('\t' + (error === null ? '\033[32mOK' : '\033[31mFAIL (' + error + ')') + os.EOL);
	});
};