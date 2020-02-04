const
	os = require('os'),
	fs = require('fs'),
	fsExtra = require('fs-extra'),
	uglifyES = require('uglify-es');

process.stdout.write('STARTING...' + os.EOL);

process.stdout.write('\tcleaning "dist"...' + os.EOL);
fsExtra.emptyDirSync('./dist');

process.stdout.write('\tinstalling "object-observer"...' + os.EOL);
fsExtra.copySync('node_modules/object-observer/dist/object-observer.min.js', 'src/object-observer.min.js');

process.stdout.write('\tbuilding "dist"...' + os.EOL);
fsExtra.copySync('src/', 'dist/');

process.stdout.write('\tminifying...' + os.EOL);
const dataTierUtilsSource = fs
	.readFileSync('dist/dt-utils.js', { encoding: 'utf8' });
fs.writeFileSync('dist/dt-utils.min.js', uglifyES.minify({ dataTierUtils: dataTierUtilsSource }).code);
const dataTierSource = fs
	.readFileSync('dist/data-tier.js', { encoding: 'utf8' })
	.replace('dt-utils.js', 'dt-utils.min.js');
fs.writeFileSync('dist/data-tier.min.js', uglifyES.minify({ dataTier: dataTierSource }).code);

process.stdout.write('DONE' + os.EOL);
