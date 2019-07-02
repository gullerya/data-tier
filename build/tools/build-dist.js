const
	os = require('os'),
	fs = require('fs'),
	fsExtra = require('fs-extra'),
	uglifyES = require('uglify-es');

process.stdout.write('*** INSTALL OO (into src) ***' + os.EOL);
fsExtra.copySync('node_modules/object-observer/dist/object-observer.js', 'src/object-observer.js');
fsExtra.copySync('node_modules/object-observer/dist/object-observer.min.js', 'src/object-observer.min.js');

process.stdout.write('*** CLEANUP ***' + os.EOL);
fsExtra.emptyDirSync('./dist');

process.stdout.write('*** BUILD ***' + os.EOL);
fsExtra.copySync('src/', 'dist/');
fsExtra.copySync('node_modules/object-observer/dist/object-observer.min.js', 'dist/object-observer.min.js');

process.stdout.write('*** MINIFY ***' + os.EOL);
let dataTierSource = fs.readFileSync('dist/data-tier.js', { encoding: 'utf8' });
dataTierSource = dataTierSource.replace('object-observer.js', 'object-observer.min.js');
fs.writeFileSync('dist/data-tier.min.js', uglifyES.minify({ 'dist/data-tier.min.js': dataTierSource }).code);

process.stdout.write('*** DONE ***' + os.EOL);
