import { getSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const suite = getSuite({ name: 'Testing views changes - functional tying' });

//	single argument
//
suite.runTest({ name: 'adding root model single to view - model first' }, async test => {
	const tieName = test.getRandom(8);
	const model = DataTier.ties.create(tieName, { test: 'test' });

	const calls = [];
	const newEl = document.createElement('div');
	newEl.f = (value, changes) => calls.push([value, changes]);
	newEl.dataset.tie = 'f(' + tieName + ')';
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();

	test.assertEqual(1, calls.length);
	test.assertEqual(model, calls[0][0]);
	test.assertEqual(null, calls[0][1]);
});

suite.runTest({ name: 'adding deep model single to view - model first' }, async test => {
	const tieName = test.getRandom(8);
	DataTier.ties.create(tieName, { deep: { test: 'test' } });

	const calls = [];
	const newEl = document.createElement('div');
	newEl.f = (value, changes) => calls.push([value, changes]);
	newEl.dataset.tie = 'f(' + tieName + ':deep.test)';
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();

	test.assertEqual(1, calls.length);
	test.assertEqual('test', calls[0][0]);
	test.assertEqual(null, calls[0][1]);
});

suite.runTest({ name: 'adding root model single to view - view first' }, async test => {
	const tieName = test.getRandom(8);

	const calls = [];
	const newEl = document.createElement('div');
	newEl.f = (value, changes) => calls.push([value, changes]);
	newEl.dataset.tie = 'f(' + tieName + ')';
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();

	const model = DataTier.ties.create(tieName, { test: 'test' });
	test.assertEqual(1, calls.length);
	test.assertEqual(model, calls[0][0]);
	test.assertTrue(typeof calls[0][1] === 'object');
});

suite.runTest({ name: 'adding deep model single to view - view first' }, async test => {
	const tieName = test.getRandom(8);

	const calls = [];
	const newEl = document.createElement('div');
	newEl.f = (value, changes) => calls.push([value, changes]);
	newEl.dataset.tie = 'f(' + tieName + ':deep.test)';
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();

	DataTier.ties.create(tieName, { deep: { test: 'test' } });
	test.assertEqual(1, calls.length);
	test.assertEqual('test', calls[0][0]);
	test.assertTrue(typeof calls[0][1] === 'object');
});

//	multiple arguments
//
suite.runTest({ name: 'adding mixed models multi to view - model first' }, async test => {
	const tieNameA = test.getRandom(8);
	const tieNameB = test.getRandom(8);
	const model = DataTier.ties.create(tieNameA, { deep: { test: 'test' } });
	DataTier.ties.create(tieNameB, { deep: { test: 'test' } });

	const calls = [];
	const newEl = document.createElement('div');
	newEl.f = function () { calls.push(arguments) };
	newEl.dataset.tie = 'f(' + tieNameA + ', ' + tieNameB + ':deep.test)';
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();

	test.assertEqual(1, calls.length);
	test.assertEqual(model, calls[0][0]);
	test.assertEqual('test', calls[0][1]);
	test.assertEqual(null, calls[0][2]);
});

suite.runTest({ name: 'adding mixed models multi to view - view first' }, async test => {
	const tieNameA = test.getRandom(8);
	const tieNameB = test.getRandom(8);

	const calls = [];
	const newEl = document.createElement('div');
	newEl.f = function () { calls.push(arguments) };
	newEl.dataset.tie = 'f(' + tieNameB + ':deep.test, ' + tieNameA + ')';
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();

	const modelA = DataTier.ties.create(tieNameA, { deep: { test: 'testA' } });
	DataTier.ties.create(tieNameB, { deep: { test: 'testB' } });
	test.assertEqual(2, calls.length);
	test.assertEqual(undefined, calls[0][0]);
	test.assertEqual(modelA, calls[0][1]);
	test.assertTrue(typeof calls[0][2] === 'object');
	test.assertEqual('testB', calls[1][0]);
	test.assertEqual(modelA, calls[1][1]);
	test.assertTrue(typeof calls[1][2] === 'object');
});

//	multiple arguments - ongoing changes
//
suite.runTest({ name: 'adding mixed models multi to view - model first' }, async test => {
	const tieNameA = test.getRandom(8);
	const tieNameB = test.getRandom(8);
	const modelA = DataTier.ties.create(tieNameA, { deep: { test: 'test' } });
	const modelB = DataTier.ties.create(tieNameB, { deep: { test: 'test' } });

	const calls = [];
	const newEl = document.createElement('div');
	newEl.f = function () { calls.push(arguments) };
	newEl.dataset.tie = 'f(' + tieNameA + ', ' + tieNameB + ':deep.test)';
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();

	calls.splice(0);

	modelB.deep.test = 'change primitive';
	delete modelB.deep;

	test.assertEqual(2, calls.length);

	test.assertEqual(modelA, calls[0][0]);
	test.assertEqual('change primitive', calls[0][1]);
	test.assertTrue(Array.isArray(calls[0][2]));
	test.assertEqual('update', calls[0][2][0].type);
	test.assertTrue(Array.isArray(calls[0][2][0].path));
	test.assertEqual(2, calls[0][2][0].path.length);
	test.assertEqual('test', calls[0][2][0].oldValue);
	test.assertEqual('change primitive', calls[0][2][0].value);

	test.assertEqual(modelA, calls[1][0]);
	test.assertEqual(undefined, calls[1][1]);
	test.assertTrue(Array.isArray(calls[1][2]));
	test.assertEqual(modelB, calls[1][2][0].object);
	test.assertEqual('delete', calls[1][2][0].type);
	test.assertTrue(Array.isArray(calls[1][2][0].path));
	test.assertEqual(1, calls[1][2][0].path.length);
	test.assertEqual('object', typeof calls[1][2][0].oldValue);
	test.assertEqual(undefined, calls[1][2][0].value);
});
