import { getSuite } from '../node_modules/just-test/dist/just-test.min.js';
import { ties } from '../dist/data-tier.js';
import { Observable } from '../dist/object-observer.min.js';

const suite = getSuite({ name: 'Testing ties - API' });

//	create API
//
suite.runTest({ name: 'create - none -> Observable' }, test => {
	test.assertTrue(Observable.isObservable(ties.create(test.getRandom(8))));
});

suite.runTest({ name: 'create - undefined -> Observable' }, test => {
	test.assertTrue(Observable.isObservable(ties.create(test.getRandom(8), undefined)));
});

suite.runTest({ name: 'create - null === null' }, test => {
	test.assertEqual(null, ties.create(test.getRandom(8), null));
});

suite.runTest({ name: 'create - Observable === Observable' }, test => {
	const o = Observable.from({});
	const m = ties.create(test.getRandom(8), o);
	test.assertEqual(o, m);
});

suite.runTest({ name: 'create - object -> Observable' }, test => {
	const o = {};
	const m = ties.create(test.getRandom(8), o);
	test.assertTrue(Observable.isObservable(m));
	test.assertNotEqual(o, m);
});

suite.runTest({ name: 'create - boolean === boolean' }, test => {
	test.assertEqual(true, ties.create(test.getRandom(8), true));
});

suite.runTest({ name: 'create - number === number' }, test => {
	test.assertEqual(123, ties.create(test.getRandom(8), 123));
});

suite.runTest({ name: 'create - string === string' }, test => {
	test.assertEqual('text', ties.create(test.getRandom(8), 'text'));
});

//	update API (existing tie)
//
suite.runTest({ name: 'update - none -> Error', expectError: 'illegal model' }, test => {
	const tn = test.getRandom(8);
	ties.create(tn);
	ties.update(tn);
});

suite.runTest({ name: 'update - undefined -> Observable', expectError: 'illegal model' }, test => {
	const tn = test.getRandom(8);
	ties.create(tn);
	ties.update(tn, undefined);
});

suite.runTest({ name: 'update - null === null' }, test => {
	const tn = test.getRandom(8);
	ties.create(tn);
	test.assertEqual(null, ties.update(tn, null));
});

suite.runTest({ name: 'update - Observable === Observable' }, test => {
	const tn = test.getRandom(8);
	const o = Observable.from({});
	ties.create(tn);
	test.assertEqual(o, ties.update(tn, o));
});

suite.runTest({ name: 'update - object -> Observable' }, test => {
	const tn = test.getRandom(8);
	const o = {};
	ties.create(tn);
	const m = ties.update(tn, o);
	test.assertTrue(Observable.isObservable(m));
	test.assertNotEqual(o, m);
});

suite.runTest({ name: 'update - boolean === boolean' }, test => {
	const tn = test.getRandom(8);
	ties.create(tn);
	test.assertEqual(true, ties.update(tn, true));
});

suite.runTest({ name: 'update - number === number' }, test => {
	const tn = test.getRandom(8);
	ties.create(tn);
	test.assertEqual(123, ties.update(tn, 123));
});

suite.runTest({ name: 'update - string === string' }, test => {
	const tn = test.getRandom(8);
	ties.create(tn);
	test.assertEqual('text', ties.update(tn, 'text'));
});

//	update API (non-existing tie)
//
suite.runTest({ name: 'update (create) - none -> Error', expectError: 'illegal model' }, test => {
	ties.update(test.getRandom(8));
});

suite.runTest({ name: 'update (create) - undefined -> Observable', expectError: 'illegal model' }, test => {
	ties.update(test.getRandom(8), undefined);
});

suite.runTest({ name: 'update (create) - null === null' }, test => {
	test.assertEqual(null, ties.update(test.getRandom(8), null));
});

suite.runTest({ name: 'update (create) - Observable === Observable' }, test => {
	const o = Observable.from({});
	test.assertEqual(o, ties.update(test.getRandom(8), o));
});

suite.runTest({ name: 'update (create) - object -> Observable' }, test => {
	const o = {};
	const m = ties.update(test.getRandom(8), o);
	test.assertTrue(Observable.isObservable(m));
	test.assertNotEqual(o, m);
});

suite.runTest({ name: 'update (create) - boolean === boolean' }, test => {
	test.assertEqual(true, ties.update(test.getRandom(8), true));
});

suite.runTest({ name: 'update (create) - number === number' }, test => {
	test.assertEqual(123, ties.update(test.getRandom(8), 123));
});

suite.runTest({ name: 'update (create) - string === string' }, test => {
	test.assertEqual('text', ties.update(test.getRandom(8), 'text'));
});

const modelVariations = [undefined, null, {}, [], true, 123, 'text'];
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

	if (modelVariation !== undefined) {
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
}