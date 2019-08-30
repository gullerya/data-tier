import { createSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const
	suite = createSuite({ name: 'Testing views changes' }),
	user = { name: 'some name', age: 7, address: { street: 'str', apt: 9 } };

suite.addTest({ name: 'update view when path changes (deep)' }, async test => {
	DataTier.ties.create('viewsA', user);
	const s1 = document.createElement('div');

	s1.dataset.tie = 'viewsA:name => textContent';
	document.body.appendChild(s1);

	await test.waitNextMicrotask();

	if (s1.textContent !== user.name) test.fail(new Error('preliminary check failed'));
	s1.dataset.tie = 'viewsA:address.street => textContent';

	await test.waitNextMicrotask();

	if (s1.textContent !== user.address.street) test.fail(new Error('expected the content to be "' + user.address.street + '"; found: "' + s1.textContent + '"'));
	test.pass();
});

suite.addTest({ name: 'adding new view (zero depth) with path defined' }, async test => {
	DataTier.ties.create('viewsB', user);

	const newEl = document.createElement('div');
	newEl.dataset.tie = 'viewsB:name => textContent';
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();

	if (newEl.textContent !== user.name) test.fail(new Error('expected the content to be "' + user.name + '"'));
	test.pass();
});

suite.addTest({ name: 'adding few views (with depth) with paths defined' }, async test => {
	DataTier.ties.create('viewsC', user);

	const newElA = document.createElement('div'), newElB = document.createElement('div');
	newElA.dataset.tie = 'viewsC:name => textContent';
	newElB.dataset.tie = 'viewsC:address.apt => textContent';
	document.body.appendChild(newElA);
	document.body.appendChild(newElB);

	await test.waitNextMicrotask();

	if (newElA.textContent !== user.name) test.fail(new Error('expected the content to be "' + user.name + '"'));
	if (newElB.textContent !== user.address.apt.toString()) test.fail(new Error('expected the content to be "' + user.address.apt + '"'));
	test.pass();
});

suite.addTest({ name: 'adding checkbox view and verifying its value set correctly' }, async test => {
	const newEl = document.createElement('input');
	newEl.type = 'checkbox';
	newEl.dataset.tie = 'cbValueTest:test => value';
	document.body.appendChild(newEl);
	DataTier.ties.create('cbValueTest', { test: true });

	await test.waitNextMicrotask();

	if (newEl.checked !== true) test.fail(new Error('expected the value to be "true", but found "' + newEl.checked + '"'));
	test.pass();
});

suite.addTest({ name: 'verify that falsish values (0, false, \'\') are visualized correctly' }, async test => {
	const newEl = document.createElement('div');
	DataTier.ties.create('falsishTest', { test: 0 });
	document.body.appendChild(newEl);
	newEl.dataset.tie = 'falsishTest:test => textContent';

	await test.waitNextMicrotask();

	if (newEl.textContent !== '0') test.fail(new Error('expected the value to be "0", but found "' + newEl.textContent + '"'));

	DataTier.ties.get('falsishTest').model.test = false;
	if (newEl.textContent !== 'false') test.fail(new Error('expected the value to be "false", but found "' + newEl.textContent + '"'));

	DataTier.ties.get('falsishTest').model.test = '';
	if (newEl.textContent !== '') test.fail(new Error('expected the value to be "", but found "' + newEl.textContent + '"'));

	DataTier.ties.get('falsishTest').model.test = null;
	if (newEl.textContent !== '') test.fail(new Error('expected the value to be "", but found "' + newEl.textContent + '"'));

	test.pass();
});

suite.addTest({ name: 'adding tie property after the element was added to the DOM' }, async test => {
	const newEl = document.createElement('div');
	DataTier.ties.create('postAdd', { test: 'text' });
	document.body.appendChild(newEl);
	newEl.dataset.tie = 'postAdd:test => textContent';

	await test.waitNextMicrotask();

	if (newEl.textContent !== 'text') test.fail(new Error('expected the value to be "text", but found ' + newEl.textContent));
	test.pass();
});

suite.addTest({ name: 'mapping element to 2 different ties' }, async test => {
	const newEl = document.createElement('div');
	DataTier.ties.create('multiTiesA', { test: 'test' });
	DataTier.ties.create('multiTiesB', { else: 'else' });
	newEl.dataset.tie = 'multiTiesA:test => textContent, multiTiesB:else => testContent';
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();

	if (newEl.textContent !== 'test') test.fail(new Error('expected the value to be "test", but found ' + newEl.textContent));
	if (newEl.testContent !== 'else') test.fail(new Error('expected the value to be "else", but found ' + newEl.testContent));
	test.pass();
});

suite.addTest({ name: 'adding nested DOM tree to see children are tied correctly' }, async test => {
	const
		parEl = document.createElement('div'),
		chilEl = document.createElement('div');
	DataTier.ties.create('nestedDomTree', { test: 'test' });

	chilEl.dataset.tie = 'nestedDomTree:test';
	parEl.appendChild(chilEl);
	document.body.appendChild(parEl);

	await test.waitNextMicrotask();

	if (chilEl.textContent !== 'test') test.fail(new Error('expected the text content to be "test", but found ' + chilEl.textContent));
	test.pass();
});

suite.addTest({ name: 'adding view and immediatelly appending to it children' }, async test => {
	const
		parEl = document.createElement('div'),
		chilEl = document.createElement('div');
	let watchedProperty,
		chilElVisitedNumber = 0;
	DataTier.ties.create('nestedAppended', { test: 'test' });
	Object.defineProperty(chilEl, 'watchedProperty', {
		set: v => {
			watchedProperty = v;
			chilElVisitedNumber++;
		},
		get: () => watchedProperty
	});

	chilEl.dataset.tie = 'nestedAppended:test => watchedProperty';
	document.body.appendChild(parEl);
	parEl.appendChild(chilEl);

	await test.waitNextMicrotask();

	if (chilEl.watchedProperty !== 'test') test.fail(new Error('expected the watchedProperty to be "test", but found ' + chilEl.watchedProperty));
	if (chilElVisitedNumber > 1) test.fail(new Error('element expected to be visited by DataTier only once, but found ' + chilElVisitedNumber));
	test.pass();
});

suite.run();
