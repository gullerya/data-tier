import { getSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const suite = getSuite({ name: 'Testing views changes - attribute tying' });

suite.runTest({ name: 'targeting to data- property should set attribute' }, async test => {
	const tieName = test.getRandom(8);
	DataTier.ties.create(tieName, { test: 'test' });

	const newEl = document.createElement('div');
	newEl.dataset.tie = `${tieName}:test a> data-test`;
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();

	test.assertEqual(newEl.getAttribute('data-test'), 'test');
	test.assertEqual(newEl.dataset.test, 'test');
});

suite.runTest({ name: 'tie as a root' }, async test => {
	const tieName = test.getRandom(8);
	DataTier.ties.create(tieName, 'value');

	const newEl = document.createElement('div');
	newEl.dataset.tie = `${tieName} a> attr-test`;
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();

	test.assertEqual(newEl.getAttribute('attr-test'), 'value');
});

suite.runTest({ name: 'two way binding e2e' }, async test => {
	const tieName = test.getRandom(8);
	const tie = DataTier.ties.create(tieName, { test: 'test' });

	const newEl = document.createElement('div');
	newEl.dataset.tie = `${tieName}:test a> test-attribute => change`;
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();

	test.assertEqual(newEl.getAttribute('test-attribute'), 'test');

	newEl.setAttribute('test-attribute', 'else');
	newEl.dispatchEvent(new Event('change'));

	test.assertEqual('else', tie.test);
});