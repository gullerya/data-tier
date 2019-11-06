const
	os = require('os'),
	fs = require('fs'),
	fsExtra = require('fs-extra'),
	uglifyES = require('uglify-es');

process.stdout.write('STARTING...' + os.EOL);

process.stdout.write('cleaning "dist"...' + os.EOL);
fsExtra.emptyDirSync('./dist');

process.stdout.write('installing "object-observer"...' + os.EOL);
fsExtra.copySync('node_modules/object-observer/dist/object-observer.min.js', 'src/object-observer.min.js');

process.stdout.write('building "dist"' + os.EOL);
fsExtra.copySync('src/', 'dist/');

process.stdout.write('minifying...' + os.EOL);
const dataTierSource = fs.readFileSync('dist/data-tier.js', { encoding: 'utf8' });
fs.writeFileSync('dist/data-tier.min.js', uglifyES.minify({ 'dist/data-tier.min.js': dataTierSource }).code);

process.stdout.write('DONE' + os.EOL);
