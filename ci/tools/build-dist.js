import os from 'os';
import fs from 'fs';
import path from 'path';
import esbuild from 'esbuild';
import { calcIntegrity } from './intergrity-utils.js';

const
	SRC_DIR = 'src',
	OUT_DIR = 'dist',
	fsEncOpts = { encoding: 'utf8' };

{
	writeGreen('Starting the build...', true);

	//	cleanup
	fs.rmSync('./dist', { recursive: true, force: true });
	fs.mkdirSync('./dist');

	await buildESModule();
	await buildCDNResources();

	writeGreen(`DONE`, true);
}

async function buildESModule() {
	write('\tbuilding ESM resources...');

	write('\t\tcopying...');
	const srcFiles = fs.readdirSync(SRC_DIR);
	for (const file of srcFiles) {
		fs.copyFileSync(path.join(SRC_DIR, file), path.join(OUT_DIR, file));
	}

	write('\t\tupdating version in runtime...');
	const version = JSON.parse(fs.readFileSync('package.json', fsEncOpts)).version;
	const dataTierSource = fs
		.readFileSync(path.join(OUT_DIR, 'data-tier.js'), fsEncOpts)
		.replace('DT-VERSION-PLACEHOLDER', version);
	fs.writeFileSync(path.join(OUT_DIR, 'data-tier.js'), dataTierSource, fsEncOpts);

	write('\t\tminifying...');
	await esbuild.build({
		entryPoints: srcFiles.map(f => path.join(OUT_DIR, f)),
		outdir: OUT_DIR,
		minify: true,
		sourcemap: true,
		sourcesContent: false,
		outExtension: { '.js': '.min.js' }
	});

	write('\t\tinstalling "object-observer"...');
	fs.copyFileSync('node_modules/@gullerya/object-observer/dist/object-observer.min.js', 'dist/object-observer.min.js');

	writeGreen('\tOK');
	write(os.EOL, false);
}

async function buildCDNResources() {
	write('\tbuilding CDN resources...');

	write('\t\tcopying...');
	const CDN_DIR = path.join(OUT_DIR, 'cdn');
	fs.mkdirSync(CDN_DIR);
	const srcFiles = fs.readdirSync(OUT_DIR).filter(f => f !== 'cdn');
	for (const file of srcFiles) {
		fs.copyFileSync(path.join(OUT_DIR, file), path.join(CDN_DIR, file));
	}

	write('\t\tproducing sri.json...');
	const sriMap = await calcIntegrity(CDN_DIR);
	fs.writeFileSync('sri.json', JSON.stringify(sriMap, null, '\t'), fsEncOpts);

	writeGreen('\tOK');
	write(os.EOL, false);
}

function write(text, newLine = true) {
	process.stdout.write(`${text}${newLine ? os.EOL : ''}`);
}

function writeGreen(text, newLine = true) {
	write(`\x1B[32m${text}\x1B[0m`, newLine);
}
