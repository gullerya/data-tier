'use strict';

const os = require('os'),
	fs = require('fs'),
	path = require('path'),
	utils = require('./utils.js');

let sources,
	objectObserver,
	destinationWithOO,
	destinationWithoutOO;

sources = [
	path.join('src', 'ties-service.js'),
	path.join('src', 'processors-service.js'),
	path.join('src', 'views-service.js')
];
fs.readdirSync(path.join('src', 'processors')).forEach(file => sources.push(path.join('src', 'processors', file)));
objectObserver = path.join('node_modules', 'object-observer', 'dist', 'object-observer.js');

destinationWithOO = path.join('dist', 'data-tier.js');
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
	sources.unshift(objectObserver);
	sources.forEach(source => {
		let error = null;
		process.stdout.write('\t' + source);
		try {
			fs.appendFileSync(destinationWithOO, fs.readFileSync(source));
			fs.appendFileSync(destinationWithOO, os.EOL);
		} catch (e) {
			error = e;
		}
		process.stdout.write('\t\t\t' + (error === null ? '\x1B[32mOK\x1B[0m' : '\x1B[31mFAIL\x1B[0m (' + error + ')') + os.EOL);
	});

	process.stdout.write('concatenation (without embedded "object-observer"):' + os.EOL);
	sources.shift();
	sources.forEach(source => {
		let error = null;
		process.stdout.write('\t' + source);
		try {
			fs.appendFileSync(destinationWithoutOO, fs.readFileSync(source));
			fs.appendFileSync(destinationWithoutOO, os.EOL);
		} catch (e) {
			error = e;
		}
		process.stdout.write('\t\t\t' + (error === null ? '\x1B[32mOK\x1B[0m' : '\x1B[31mFAIL\x1B[0m (' + error + ')') + os.EOL);
	});

	process.stdout.write('concatenation completed' + os.EOL + os.EOL);
};
