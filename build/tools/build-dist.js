'use strict';

const
	os = require('os'),
	fsExtra = require('fs-extra'),
	concater = require('./build-concat.js'),
	minifier = require('./build-minify.js');

process.stdout.write('cleaning "dist"...');
fsExtra.emptyDirSync('./dist');
process.stdout.write('\t\t\t\x1B[32mOK\x1B[0m' + os.EOL);

concater.execute();

minifier.execute();
