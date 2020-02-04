import { getSuite, RANDOM_CHARSETS } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const
	suite = getSuite({ name: 'Testing tying to classList' });

suite.runTest({ name: 'full flow simple case' }, async test => {
	const
		tn = test.getRandom(8, [RANDOM_CHARSETS.numeric]),
		t = DataTier.ties.create(tn),
		v = document.createElement('span');

	v.classList.add('ootb');
	v.dataset.tie = `${tn}:classes => classList`;
	document.body.appendChild(v);

	await test.waitNextMicrotask();
	test.assertTrue(v.classList.contains('ootb'));
	test.assertTrue(v.classList.length === 1);

	t.classes = ['added-a'];
	await test.waitNextMicrotask();
	test.assertTrue(v.classList.contains('ootb'));
	test.assertTrue(v.classList.contains('added-a'));
	test.assertTrue(v.classList.length === 2);

	t.classes.pop();
	await test.waitNextMicrotask();
	test.assertTrue(v.classList.contains('ootb'));
	test.assertTrue(v.classList.length === 1);
});

suite.runTest({ name: 'full flow - array' }, async test => {
	const
		tn = test.getRandom(8, [RANDOM_CHARSETS.numeric]),
		t = DataTier.ties.create(tn),
		v = document.createElement('span');

	v.classList.add('a', 'b');
	v.dataset.tie = `${tn}:classes => classList`;
	document.body.appendChild(v);

	await test.waitNextMicrotask();
	test.assertTrue(v.classList.contains('a'));
	test.assertTrue(v.classList.contains('b'));
	test.assertTrue(v.classList.length === 2);

	t.classes = ['b', 'c', 'd'];
	await test.waitNextMicrotask();
	test.assertTrue(v.classList.contains('a'));
	test.assertTrue(v.classList.contains('b'));
	test.assertTrue(v.classList.contains('c'));
	test.assertTrue(v.classList.contains('d'));
	test.assertTrue(v.classList.length === 4);

	t.classes.pop();
	await test.waitNextMicrotask();
	test.assertTrue(v.classList.contains('a'));
	test.assertTrue(v.classList.contains('b'));
	test.assertTrue(v.classList.contains('c'));
	test.assertTrue(v.classList.length === 3);

	t.classes.splice(0);
	await test.waitNextMicrotask();
	test.assertTrue(v.classList.contains('a'));
	test.assertTrue(v.classList.contains('b'));
	test.assertTrue(v.classList.length === 2);
});

suite.runTest({ name: 'full flow - object' }, async test => {
	const
		tn = test.getRandom(8, [RANDOM_CHARSETS.numeric]),
		t = DataTier.ties.create(tn),
		v = document.createElement('span');

	v.classList.add('a', 'b');
	v.dataset.tie = `${tn}:classes => classList`;
	document.body.appendChild(v);

	await test.waitNextMicrotask();
	test.assertTrue(v.classList.contains('a'));
	test.assertTrue(v.classList.contains('b'));
	test.assertTrue(v.classList.length === 2);

	t.classes = {
		b: false,
		c: 1,
		d: 0
	};
	await test.waitNextMicrotask();
	test.assertTrue(v.classList.contains('a'));
	test.assertTrue(v.classList.contains('c'));
	test.assertTrue(v.classList.length === 2);

	t.classes.b = true;
	t.classes.c = false;
	t.classes.d = {};
	await test.waitNextMicrotask();
	test.assertTrue(v.classList.contains('a'));
	test.assertTrue(v.classList.contains('b'));
	test.assertTrue(v.classList.contains('d'));
	test.assertTrue(v.classList.length === 3);
});

suite.runTest({ name: 'full flow - string' }, async test => {
	const
		tn = test.getRandom(8, [RANDOM_CHARSETS.numeric]),
		t = DataTier.ties.create(tn),
		v = document.createElement('span');

	v.classList.add('ootb');
	v.dataset.tie = `${tn}:classes => classList`;
	document.body.appendChild(v);

	await test.waitNextMicrotask();
	test.assertTrue(v.classList.contains('ootb'));
	test.assertTrue(v.classList.length === 1);

	t.classes = 'string';
	await test.waitNextMicrotask();
	test.assertTrue(v.classList.contains('ootb'));
	test.assertTrue(v.classList.contains('string'));
	test.assertTrue(v.classList.length === 2);

	t.classes = '';
	await test.waitNextMicrotask();
	test.assertTrue(v.classList.contains('ootb'));
	test.assertTrue(v.classList.length === 1);
});
