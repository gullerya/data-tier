const
	os = require('os'),
	fs = require('fs'),
	path = require('path'),
	readline = require('readline');

let sources,
	objectObserver,
	destinationWithOO,
	destinationWithoutOO;

sources = [
	path.join('src', 'ties-service.js'),
	path.join('src', 'controllers-service.js'),
	path.join('src', 'views-service.js')
];
fs.readdirSync(path.join('src', 'controllers')).forEach(file => sources.push(path.join('src', 'controllers', file)));
objectObserver = path.join('node_modules', 'object-observer', 'dist', 'object-observer.js');

destinationWithOO = path.join('dist', 'data-tier.js');
destinationWithoutOO = path.join('dist', 'data-tier-wo-oo.js');

module.exports.execute = function concatSources() {
	let cleanError = null;

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
		readline.cursorTo(process.stdout, 40);
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
		readline.cursorTo(process.stdout, 40);
		process.stdout.write('\t\t\t' + (error === null ? '\x1B[32mOK\x1B[0m' : '\x1B[31mFAIL\x1B[0m (' + error + ')') + os.EOL);
	});

	process.stdout.write('concatenation completed' + os.EOL + os.EOL);
};
