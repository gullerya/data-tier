import os from 'os';
import fs from 'fs';
import fsExtra from 'fs-extra';
import uglifyES from 'uglify-es';

process.stdout.write('STARTING...' + os.EOL);

process.stdout.write('\tcleaning "dist"...' + os.EOL);
fsExtra.emptyDirSync('./dist');

process.stdout.write('\tbuilding "dist"...' + os.EOL);
fsExtra.copySync('src/', 'dist/');

process.stdout.write('\tinstalling "object-observer"...' + os.EOL);
fsExtra.copySync('node_modules/object-observer/dist/object-observer.min.js', 'dist/object-observer.min.js');

process.stdout.write('\tminifying...' + os.EOL);
const dataTierUtilsSource = fs
	.readFileSync('dist/utils.js', { encoding: 'utf8' });
fs.writeFileSync('dist/utils.min.js', uglifyES.minify({ dataTierUtils: dataTierUtilsSource }).code);
const dataTierTiesSource = fs
	.readFileSync('dist/ties.js', { encoding: 'utf8' })
	.replace('utils.js', 'utils.min.js');
fs.writeFileSync('dist/ties.min.js', uglifyES.minify({ dataTierUtils: dataTierTiesSource }).code);
const dataTierViewsSource = fs
	.readFileSync('dist/views.js', { encoding: 'utf8' })
	.replace('utils.js', 'utils.min.js');
fs.writeFileSync('dist/views.min.js', uglifyES.minify({ dataTierUtils: dataTierViewsSource }).code);
const dataTierSource = fs
	.readFileSync('dist/data-tier.js', { encoding: 'utf8' })
	.replace('ties.js', 'ties.min.js')
	.replace('views.js', 'views.min.js')
	.replace('utils.js', 'utils.min.js');
fs.writeFileSync('dist/data-tier.min.js', uglifyES.minify({ dataTier: dataTierSource }).code);

process.stdout.write('DONE' + os.EOL);
