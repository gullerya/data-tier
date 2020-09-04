import { getSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const suite = getSuite({ name: 'Testing array changes (static binding)' });

suite.runTest({ name: 'array manipulation flow' }, async test => {
	const
		tn = test.getRandom(8, ['numeric']),
		ordersTie = DataTier.ties.create(tn, []),
		element = document.createElement('div');

	//	add element with static binding on element 2
	element.dataset.tie = `${tn}:2 => textContent`;
	document.body.appendChild(element);
	await test.waitNextMicrotask();
	test.assertEqual('', element.textContent);

	//	add array having element 2
	ordersTie.push('0', '1', '2', '3');
	test.assertEqual('2', element.textContent);

	//	unshift
	ordersTie.unshift('primordial');
	test.assertEqual('1', element.textContent);

	//	shift
	ordersTie.shift();
	test.assertEqual('2', element.textContent);
	ordersTie.shift();
	test.assertEqual('3', element.textContent);
	ordersTie.shift();
	test.assertEqual('', element.textContent);

	//	push
	ordersTie.push('_');
	test.assertEqual('_', element.textContent);

	//	pop
	ordersTie.pop();
	test.assertEqual('', element.textContent);
});

suite.runTest({ name: 'array multi-manipulation flow' }, async test => {
	const
		testTie = DataTier.ties.create('testMulti', []),
		element = document.createElement('div');

	element.dataset.tie = 'testMulti:0 => textContent';
	document.body.appendChild(element);
	await test.waitNextMicrotask();
	if (element.textContent !== '') test.fail('[multi] expected textContent to be [], found ' + element.textContent);

	testTie.push('one', 'two', 'tree');
	if (element.textContent !== 'one') test.fail('expected textContent to be [one], found ' + element.textContent);
});

suite.runTest({ name: 'array - full replace' }, async test => {
	const
		tieName = test.getRandom(8),
		testTie = DataTier.ties.create(tieName, { data: [] }),
		element = document.createElement('div');

	element.dataset.tie = tieName + ':data => data';
	document.body.appendChild(element);

	await test.waitNextMicrotask();
	test.assertTrue(Array.isArray(element.data));
	test.assertEqual(0, element.data.length);

	Array.prototype.push.apply(testTie.data, [0, 1, 2, 3]);
	test.assertEqual(4, element.data.length);
	test.assertEqual(2, element.data[2]);
});