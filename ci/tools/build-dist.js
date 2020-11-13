import os from 'os';
import fs from 'fs';
import path from 'path';
import process from 'process';
import uglifyES from 'uglify-es';

const
	fsEncOpts = { encoding: 'utf8' },
	filesToCopy = ['data-tier.js', 'dom-processor.js', 'ties.js', 'utils.js', 'views.js'],
	filesToMinify = filesToCopy;

process.stdout.write(`\x1B[32mStarting the build...\x1B[0m${os.EOL}${os.EOL}`);

process.stdout.write('\tcleaning "dist"...');
fs.rmdirSync('./dist', { recursive: true });
fs.mkdirSync('./dist');
process.stdout.write(`\t\t\x1B[32mOK\x1B[0m${os.EOL}`);

process.stdout.write('\tcopying "src" to "dist"...');
for (const fileToCopy of filesToCopy) {
	fs.copyFileSync(path.join('./src', fileToCopy), path.join('./dist', fileToCopy));
}
process.stdout.write(`\t\x1B[32mOK\x1B[0m${os.EOL}`);

process.stdout.write('\tupdate version in runtime...');
const version = JSON.parse(fs.readFileSync('package.json', fsEncOpts)).version;
const dataTierSource = fs
	.readFileSync('dist/data-tier.js', fsEncOpts)
	.replace('DT-VERSION-PLACEHOLDER', version);
fs.writeFileSync('dist/data-tier.js', dataTierSource, fsEncOpts);
process.stdout.write(`\t\x1B[32mOK\x1B[0m${os.EOL}`);

process.stdout.write('\tminifying...');
const options = {
	toplevel: true
};
for (const fileToMinify of filesToMinify) {
	const fp = path.join('./dist', fileToMinify);
	const mfp = path.join('./dist', fileToMinify.replace(/\.js$/, '.min.js'));
	const fc = fs
		.readFileSync(fp, fsEncOpts)
		.replace(/(?<!.min)\.js(?=')/g, '.min.js');
	const mfc = uglifyES.minify(fc, options).code;
	fs.writeFileSync(mfp, mfc, fsEncOpts);
}
process.stdout.write(`\t\t\t\x1B[32mOK\x1B[0m${os.EOL}`);

process.stdout.write('\tinstalling "object-observer"...');
fs.copyFileSync('node_modules/object-observer/dist/object-observer.min.js', 'dist/object-observer.min.js');
process.stdout.write(`\t\x1B[32mOK\x1B[0m${os.EOL}${os.EOL}`);

process.stdout.write(`\x1B[32mDONE${os.EOL}`);
