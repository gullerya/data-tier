import { getSuite } from '../node_modules/just-test/dist/just-test.min.js';
import { ties } from '../dist/data-tier.js';

const suite = getSuite({ name: 'Testing ties - model variations' });
const modelVariations = [{}, [], true, 123, 'text', null, undefined]

for (const modelVariation of modelVariations) {
	let modelType = `'${typeof modelVariation}'`;
	if (Array.isArray(modelVariation)) {
		modelType += ' (Array)';
	} else if (modelVariation === null) {
		modelType += ' (null)';
	}

	suite.runTest({ name: `create and tie as root - ${modelType}` }, async test => {
		const
			key = test.getRandom(8),
			v = document.createElement('div');

		ties.create(key, modelVariation);
		v.dataset.tie = `${key} => data`;
		document.body.appendChild(v);

		await test.waitNextMicrotask();

		test.assertEqual(ties.get(key), v.data);
	});

	suite.runTest({ name: `update and tie nested - ${modelType}` }, async test => {
		const
			key = test.getRandom(8),
			v = document.createElement('div');

		ties.create(key, { prop: 'text' });
		v.dataset.tie = `${key}:prop => data`;
		document.body.appendChild(v);

		await test.waitNextMicrotask();
		test.assertEqual('text', v.data);

		ties.update(key, modelVariation);
		test.assertEqual(ties.get(key) ? ties.get(key).prop : ties.get(key), v.data);
	});
}