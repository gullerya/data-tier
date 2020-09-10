import { getSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js?inst=scope-lifecycle';

const suite = getSuite({ name: 'Testing scoped views lifecycle' });

suite.runTest({ name: 'scoped tying root - data first, element last' }, async test => {
	const sv = document.createElement('div');
	sv.dataset.tie = 'scope:text';
	const model = DataTier.ties.create(sv, { text: 'text' });

	document.body.appendChild(sv);
	await test.waitNextMicrotask();

	test.assertEqual(model.text, sv.textContent);
});

suite.runTest({ name: 'scoped tying root - element first, data last', skip: false }, async test => {
	const sv = document.createElement('div');
	sv.dataset.tie = 'scope:text';

	document.body.appendChild(sv);
	await test.waitNextMicrotask();

	const model = DataTier.ties.create(sv, { text: 'text' });

	test.assertEqual(model.text, sv.textContent);
});

suite.runTest({ name: 'scoped tying root - data, element, attribute last' }, async test => {
	const sv = document.createElement('div');
	const model = DataTier.ties.create(sv, { text: 'text' });

	document.body.appendChild(sv);
	test.assertEqual('', sv.textContent);

	sv.dataset.tie = 'scope:text';
	await test.waitNextMicrotask();

	test.assertEqual(model.text, sv.textContent);
});

suite.runTest({ name: 'scoped tying root - element, data, attribute last' }, async test => {
	const sv = document.createElement('div');
	document.body.appendChild(sv);
	test.assertEqual('', sv.textContent);

	const model = DataTier.ties.create(sv, { text: 'text' });

	sv.dataset.tie = 'scope:text';
	await test.waitNextMicrotask();

	test.assertEqual(model.text, sv.textContent);
});

suite.runTest({ name: 'scoped tying child - data first, element last' }, async test => {
	const rv = document.createElement('div');
	document.body.appendChild(rv);
	await test.waitNextMicrotask();

	const model = DataTier.ties.create(rv, { text: 'text' });

	const cv = document.createElement('div');
	cv.dataset.tie = 'scope:text';
	rv.appendChild(cv);
	await test.waitNextMicrotask();

	test.assertEqual(model.text, cv.textContent);
});

suite.runTest({ name: 'scoped tying child - element first, data last', skip: false }, async test => {
	const rv = document.createElement('div');
	const cv = document.createElement('div');
	cv.dataset.tie = 'scope:text';
	rv.appendChild(cv);
	document.body.appendChild(rv);
	await test.waitNextMicrotask();

	const model = DataTier.ties.create(rv, { text: 'text' });

	test.assertEqual(model.text, cv.textContent);
});
