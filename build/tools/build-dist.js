'use strict';

const
	os = require('os'),
	fsExtra = require('fs-extra'),
	concater = require('./build-concat.js'),
	minifier = require('./build-minify.js');

process.stdout.write('*** CLEANUP ***' + os.EOL + os.EOL);
fsExtra.emptyDirSync('./dist');

process.stdout.write('*** CONCATENATION ***' + os.EOL + os.EOL);
concater.execute();

process.stdout.write('*** MINIFICATION ***' + os.EOL + os.EOL);
minifier.execute();

process.stdout.write('*** DONE ***' + os.EOL + os.EOL);
