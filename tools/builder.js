const os = require('os'),
    fs = require('fs'),
    path = require('path'),
    utils = require('./utils.js');

var sources,
    destination;

sources = [
    path.join('node_modules', 'object-observer', 'dist', 'object-observer.js'),
    path.join('src', 'ties-service.js'),
    path.join('src', 'views-service.js'),
    path.join('src', 'rules-service.js'),
    path.join('src', 'vanilla-rules.js'),
    path.join('src', 'data-tier.js')
];
destination = path.join('dist', 'data-tier.js');

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
		process.stdout.write('\t' + (error === null ? '\033[32mOK' : '\033[31mFAIL (' + error + ')') + os.EOL);
	});
};