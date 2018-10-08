const
	os = require('os'),
	fs = require('fs'),
	readline = require('readline'),
	uglifyES = require('uglify-es');

module.exports.execute = function() {
	process.stdout.write('starting minification...' + os.EOL);

	fs.writeFileSync(
		'dist/data-tier.min.js',
		uglifyES.minify({'dist/data-tier.min.js': fs.readFileSync('dist/data-tier.js', {encoding: 'utf8'})}).code
	);
	process.stdout.write('\tdist/data-tier.min.js');
	readline.cursorTo(process.stdout, 40);
	process.stdout.write('\x1B[32mOK\x1B[0m' + os.EOL);

	fs.writeFileSync(
		'dist/data-tier-wo-oo.min.js',
		uglifyES.minify({'dist/data-tier-wo-oo.min.js': fs.readFileSync('dist/data-tier-wo-oo.js', {encoding: 'utf8'})}).code
	);
	process.stdout.write('\tdist/data-tier-wo-oo.min.js');
	readline.cursorTo(process.stdout, 40);
	process.stdout.write('\x1B[32mOK\x1B[0m' + os.EOL);

	process.stdout.write('minification completed' + os.EOL + os.EOL);
};