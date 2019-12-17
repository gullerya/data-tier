import { createSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const suite = createSuite({ name: 'Testing array changes (static binding)' });

suite.runTest({ name: 'array manipulation flow' }, async test => {
	const
		ordersTie = DataTier.ties.create('ordersASB', []),
		element = document.createElement('div');

	//	add element with static binding on element 2
	element.dataset.tie = 'ordersASB:2 => textContent';
	document.body.appendChild(element);
	await test.waitNextMicrotask();
	if (element.textContent !== '') test.fail('expected textContent to be [], found ' + element.textContent);

	//	add array having element 2
	ordersTie.push('0', '1', '2', '3');
	if (element.textContent !== '2') test.fail('expected textContent to be [2], found ' + element.textContent);

	//	unshift
	ordersTie.unshift('primordial');
	if (element.textContent !== '1') test.fail('expected textContent to be [1], found ' + element.textContent);

	//	shift
	ordersTie.shift();
	if (element.textContent !== '2') test.fail('expected textContent to be [2], found ' + element.textContent);
	ordersTie.shift();
	if (element.textContent !== '3') test.fail('expected textContent to be [3], found ' + element.textContent);
	ordersTie.shift();
	if (element.textContent !== '') test.fail('expected textContent to be [], found ' + element.textContent);

	//	push
	ordersTie.push('_');
	if (element.textContent !== '_') test.fail('expected textContent to be [_], found ' + element.textContent);

	//	pop
	ordersTie.pop();
	if (element.textContent !== '') test.fail('expected textContent to be [], found ' + element.textContent);
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

suite.runTest({ name: 'array - full replate' }, async test => {
	const
		tieName = test.getRandom(8),
		testTie = DataTier.ties.create(tieName, { data: [] }),
		element = document.createElement('div');

	element.dataset.tie = tieName + ':data => data';
	document.body.appendChild(element);

	await test.waitNextMicrotask();
	test.assertTrue(Array.isArray(element.data));
	test.assertEqual(0, element.data.length);

	testTie.data.push.apply(testTie.data, [0, 1, 2, 3]);
	test.assertEqual(4, element.data.length);
	test.assertEqual(2, element.data[2]);
});