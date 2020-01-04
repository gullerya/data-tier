import { createSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const suite = createSuite({ name: 'Testing views changes - functional tying' });

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

	const model = DataTier.ties.create(tieNameA, { deep: { test: 'test' } });
	DataTier.ties.create(tieNameB, { deep: { test: 'test' } });
	test.assertEqual(2, calls.length);
	test.assertEqual(undefined, calls[0][0]);
	test.assertEqual(model, calls[0][1]);
	test.assertTrue(typeof calls[0][2] === 'object');
	test.assertEqual('test', calls[1][0]);
	test.assertEqual(model, calls[1][1]);
	test.assertTrue(typeof calls[1][2] === 'object');
});
