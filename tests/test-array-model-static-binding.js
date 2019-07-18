import { createSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const suite = createSuite({ name: 'Testing array changes (static binding)' });

suite.addTest({ name: 'array manipulation flow' }, async test => {
	const
		ordersTie = DataTier.ties.create('ordersASB'),
		element = document.createElement('div');

	//	add element with static binding on element 2
	element.dataset.tie = 'ordersASB:2 => textContent';
	document.body.appendChild(element);
	await new Promise(resolve => setTimeout(resolve, 0));
	if (element.textContent !== '') test.fail('expected textContent to be [], found ' + element.textContent);

	//	add array having element 2
	ordersTie.model = ['0', '1', '2', '3'];
	if (element.textContent !== '2') test.fail('expected textContent to be [2], found ' + element.textContent);

	//	unshift
	ordersTie.model.unshift('primordial');
	if (element.textContent !== '1') test.fail('expected textContent to be [1], found ' + element.textContent);

	//	shift
	ordersTie.model.shift();
	if (element.textContent !== '2') test.fail('expected textContent to be [2], found ' + element.textContent);
	ordersTie.model.shift();
	if (element.textContent !== '3') test.fail('expected textContent to be [3], found ' + element.textContent);
	ordersTie.model.shift();
	if (element.textContent !== '') test.fail('expected textContent to be [], found ' + element.textContent);

	//	push
	ordersTie.model.push('_');
	if (element.textContent !== '_') test.fail('expected textContent to be [_], found ' + element.textContent);

	//	pop
	ordersTie.model.pop();
	if (element.textContent !== '') test.fail('expected textContent to be [], found ' + element.textContent);

	test.pass();
});

suite.addTest({ name: 'array multi-manipulation flow' }, async test => {
	const
		testTie = DataTier.ties.create('testMulti', []),
		element = document.createElement('div');

	element.dataset.tie = 'testMulti:0 => textContent';
	document.body.appendChild(element);
	await new Promise(resolve => setTimeout(resolve, 0));
	if (element.textContent !== '') test.fail('[multi] expected textContent to be [], found ' + element.textContent);

	testTie.model.push('one', 'two', 'tree');
	if (element.textContent !== 'one') test.fail('expected textContent to be [one], found ' + element.textContent);

	test.pass();
});

suite.run();