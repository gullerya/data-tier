import { getSuite } from '../node_modules/just-test/dist/just-test.min.js';
// import * as DataTier from '../dist/data-tier.js';

const suite = getSuite({ name: 'Testing Performance plain DOM' });
const chunksToAdd = 10000;
const chunksToMove = 10000;

//	this tests un-tied elements, measuring impact of 'data-tier' on the app
suite.runTest({ name: `adding ${chunksToAdd} untied HTML chunks to DOM - one element at once` }, () => {
	const container = document.createElement('div');
	document.body.appendChild(container);

	const measures = runMeasured(() => {
		const root = document.createElement('div');
		const child1 = document.createElement('span');
		const child2 = document.createElement('span');

		container.appendChild(root);
		root.appendChild(child1);
		root.appendChild(child2);
	}, chunksToAdd);

	console.log(measures.singleTime.toFixed(2) + 'ms');

	document.body.removeChild(container);
});

//	this tests un-tied elements, measuring impact of 'data-tier' on the app
suite.runTest({ name: `adding ${chunksToAdd} untied HTML chunks to DOM - chunk as a whole`, skip: true }, () => {
	const measures = runMeasured(() => {
		const root = document.createElement('div');
		const child1 = document.createElement('span');
		const child2 = document.createElement('span');
		root.appendChild(child1);
		root.appendChild(child2);

		document.body.appendChild(root);
	}, chunksToAdd);
	console.log(measures.singleTime.toFixed(2) + 'ms');
});

suite.runTest({ name: `moving ${chunksToMove} HTML chunks in DOM` }, async () => {
	//	define tie
	//	create document fragment
	//	add it to DOM and remove from DOM
});

function runMeasured(f, times) {
	const started = performance.now();
	let cnt = times;
	while (cnt--) {
		f();
	}
	const totalTime = performance.now() - started;
	return {
		totalTime: totalTime,
		singleTime: totalTime / times
	};
}