const
	os = require('os'),
	fs = require('fs'),
	fsExtra = require('fs-extra'),
	concater = require('./build-concat.js'),
	minifier = require('./build-minify.js'),
	uglifyES = require('uglify-es');

process.stdout.write('*** INSTALL OO ***' + os.EOL + os.EOL);
fsExtra.copySync('node_modules/object-observer/dist/module/object-observer.js', 'src/module/object-observer.js');

process.stdout.write('*** CLEANUP ***' + os.EOL + os.EOL);
fsExtra.emptyDirSync('./dist');

process.stdout.write('___ BUILDING AS MODULE ___' + os.EOL + os.EOL);
fsExtra.copySync('src/module', 'dist/module');
fs.writeFileSync(
	'dist/module/data-tier.min.js',
	uglifyES.minify({'dist/module/data-tier.min.js': fs.readFileSync('dist/module/data-tier.js', {encoding: 'utf8'})}).code
);
fsExtra.copySync('node_modules/object-observer/dist/module/object-observer.min.js', 'dist/module/object-observer.min.js');

process.stdout.write('___ BUILDING LEGACY ___' + os.EOL + os.EOL);
process.stdout.write('*** CONCATENATION ***' + os.EOL);
concater.execute();

process.stdout.write('*** MINIFICATION ***' + os.EOL);
minifier.execute();

process.stdout.write('*** DONE ***' + os.EOL + os.EOL);
