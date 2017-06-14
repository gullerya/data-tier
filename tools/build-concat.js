'use strict';

const os = require('os'),
	fs = require('fs'),
	path = require('path'),
	utils = require('./utils.js');

let sourcesWithOO,
	sourcesWithoutOO,
	destinationWithOO,
	destinationWithoutOO;

sourcesWithOO = [
	path.join('node_modules', 'object-observer', 'dist', 'object-observer.js'),
	path.join('src', 'ties-service.js'),
	path.join('src', 'controllers-service.js'),
	path.join('src', 'views-service.js'),
	path.join('src', 'vanilla-controllers.js')
];
destinationWithOO = path.join('dist', 'data-tier.js');

sourcesWithoutOO = [
	path.join('src', 'ties-service.js'),
	path.join('src', 'controllers-service.js'),
	path.join('src', 'views-service.js'),
	path.join('src', 'vanilla-controllers.js')
];
destinationWithoutOO = path.join('dist', 'data-tier-wo-oo.js');

module.exports.execute = function concatSources() {
	let cleanError = null;

	//  clean up
	process.stdout.write('cleaning destination folder...');
	try {
		utils.removeFolderSync('dist');
	} catch (e) {
		cleanError = e;
	}
	process.stdout.write('\t' + (cleanError === null ? '\x1B[32mOK\x1B[0m' : '\x1B[31mFAIL\x1B[0m (' + cleanError + ')') + os.EOL);

	//  create folder
	process.stdout.write('creating destination folder...');
	try {
		fs.mkdirSync('dist');
	} catch (e) {
		cleanError = e;
	}
	process.stdout.write('\t' + (cleanError === null ? '\x1B[32mOK\x1B[0m' : '\x1B[31mFAIL\x1B[0m (' + cleanError + ')') + os.EOL);

	//  concat & copy
	process.stdout.write('concatenation (with embedded "object-observer"):' + os.EOL);
	sourcesWithOO.forEach(source => {
		let error = null;
		process.stdout.write('\t' + source);
		try {
			fs.appendFileSync(destinationWithOO, fs.readFileSync(source));
			fs.appendFileSync(destinationWithOO, os.EOL);
		} catch (e) {
			error = e;
		}
		process.stdout.write('\t' + (error === null ? '\x1B[32mOK\x1B[0m' : '\x1B[31mFAIL\x1B[0m (' + error + ')') + os.EOL);
	});

	process.stdout.write('concatenation (without embedded "object-observer"):' + os.EOL);
	sourcesWithoutOO.forEach(source => {
		let error = null;
		process.stdout.write('\t' + source);
		try {
			fs.appendFileSync(destinationWithoutOO, fs.readFileSync(source));
			fs.appendFileSync(destinationWithoutOO, os.EOL);
		} catch (e) {
			error = e;
		}
		process.stdout.write('\t' + (error === null ? '\x1B[32mOK\x1B[0m' : '\x1B[31mFAIL\x1B[0m (' + error + ')') + os.EOL);
	});

	process.stdout.write('concatenation completed' + os.EOL + os.EOL);
};
