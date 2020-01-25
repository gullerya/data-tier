import { createSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const
	suite = createSuite({ name: 'Testing views changes - property tying' }),
	user = { name: 'some name', age: 7, address: { street: 'str', apt: 9 } };

suite.runTest({ name: 'adding root model to view - model first' }, async test => {
	const tieName = test.getRandom(8);
	DataTier.ties.create(tieName, { test: 'test' });

	const newEl = document.createElement('div');
	newEl.dataset.tie = tieName + ' => data';
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();

	test.assertTrue(newEl.data !== null && newEl.data !== undefined);
	test.assertEqual('test', newEl.data.test)
});

suite.runTest({ name: 'adding root model to view - view first' }, async test => {
	const tieName = test.getRandom(8);

	const newEl = document.createElement('div');
	newEl.dataset.tie = tieName + ' => data';
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();

	DataTier.ties.create(tieName, { test: 'test' });

	test.assertTrue(newEl.data !== null && newEl.data !== undefined);
	test.assertEqual('test', newEl.data.test)
});

suite.runTest({ name: 'update view when path changes (deep)' }, async test => {
	DataTier.ties.create('viewsA', user);
	const s1 = document.createElement('div');

	s1.dataset.tie = 'viewsA:name => textContent';
	document.body.appendChild(s1);

	await test.waitNextMicrotask();

	if (s1.textContent !== user.name) test.fail(new Error('preliminary check failed'));
	s1.dataset.tie = 'viewsA:address.street => textContent';

	await test.waitNextMicrotask();

	if (s1.textContent !== user.address.street) test.fail(new Error('expected the content to be "' + user.address.street + '"; found: "' + s1.textContent + '"'));
});

suite.runTest({ name: 'adding new view (zero depth) with path defined' }, async test => {
	DataTier.ties.create('viewsB', user);

	const newEl = document.createElement('div');
	newEl.dataset.tie = 'viewsB:name';
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();

	if (newEl.textContent !== user.name) test.fail(new Error('expected the content to be "' + user.name + '"'));
});

suite.runTest({ name: 'adding few views (with depth) with paths defined' }, async test => {
	DataTier.ties.create('viewsC', user);

	const newElA = document.createElement('div'), newElB = document.createElement('div');
	newElA.dataset.tie = 'viewsC:name => textContent';
	newElB.dataset.tie = 'viewsC:address.apt => textContent';
	document.body.appendChild(newElA);
	document.body.appendChild(newElB);

	await test.waitNextMicrotask();

	if (newElA.textContent !== user.name) test.fail(new Error('expected the content to be "' + user.name + '"'));
	if (newElB.textContent !== user.address.apt.toString()) test.fail(new Error('expected the content to be "' + user.address.apt + '"'));
});

suite.runTest({ name: 'adding checkbox view and verifying its default value set correctly' }, async test => {
	const newEl = document.createElement('input');
	newEl.type = 'checkbox';
	newEl.dataset.tie = 'cbValueTest:test';
	document.body.appendChild(newEl);
	DataTier.ties.create('cbValueTest', { test: true });

	await test.waitNextMicrotask();

	if (newEl.checked !== true) test.fail(new Error('expected the value to be "true", but found "' + newEl.checked + '"'));
});

suite.runTest({ name: 'adding source and verifying its default value set correctly' }, async test => {
	const tieName = test.getRandom(8);
	const newEl = document.createElement('source');
	newEl.dataset.tie = tieName + ':test';
	document.body.appendChild(newEl);
	DataTier.ties.create(tieName, { test: 'some.non.existing.url' });

	await test.waitNextMicrotask();

	test.assertTrue(newEl.src.endsWith('some.non.existing.url'));
});

suite.runTest({ name: 'adding anchor and verifying its default value set correctly' }, async test => {
	const tieName = test.getRandom(8);
	const newEl = document.createElement('a');
	newEl.dataset.tie = tieName + ':test';
	document.body.appendChild(newEl);
	DataTier.ties.create(tieName, { test: 'some.non.existing.url' });

	await test.waitNextMicrotask();

	test.assertTrue(newEl.href.endsWith('some.non.existing.url'));
});

suite.runTest({ name: 'adding use and verifying its default value set correctly' }, async test => {
	const tieName = test.getRandom(8);
	const newEl = document.createElementNS('http://www.w3.org/2000/svg', 'use');
	newEl.dataset.tie = tieName + ':test';
	document.body.appendChild(newEl);
	DataTier.ties.create(tieName, { test: 'some.non.existing.url' });

	await test.waitNextMicrotask();

	test.assertEqual('object', typeof newEl.href);
	test.assertTrue(newEl.href.baseVal.endsWith('some.non.existing.url'));
});

suite.runTest({ name: 'verify that falsish values (0, false, \'\') are visualized correctly' }, async test => {
	const newEl = document.createElement('div');
	DataTier.ties.create('falsishTest', { test: 0 });
	document.body.appendChild(newEl);
	newEl.dataset.tie = 'falsishTest:test => textContent';

	await test.waitNextMicrotask();

	if (newEl.textContent !== '0') test.fail(new Error('expected the value to be "0", but found "' + newEl.textContent + '"'));

	DataTier.ties.get('falsishTest').test = false;
	if (newEl.textContent !== 'false') test.fail(new Error('expected the value to be "false", but found "' + newEl.textContent + '"'));

	DataTier.ties.get('falsishTest').test = '';
	if (newEl.textContent !== '') test.fail(new Error('expected the value to be "", but found "' + newEl.textContent + '"'));

	DataTier.ties.get('falsishTest').test = null;
	if (newEl.textContent !== '') test.fail(new Error('expected the value to be "", but found "' + newEl.textContent + '"'));
});

suite.runTest({ name: 'adding tie property after the element was added to the DOM' }, async test => {
	const newEl = document.createElement('div');
	DataTier.ties.create('postAdd', { test: 'text' });
	document.body.appendChild(newEl);
	newEl.dataset.tie = 'postAdd:test => textContent';

	await test.waitNextMicrotask();

	if (newEl.textContent !== 'text') test.fail(new Error('expected the value to be "text", but found ' + newEl.textContent));
});

suite.runTest({ name: 'mapping element to 2 different ties' }, async test => {
	const newEl = document.createElement('div');
	DataTier.ties.create('multiTiesA', { test: 'test' });
	DataTier.ties.create('multiTiesB', { else: 'else' });
	newEl.dataset.tie = 'multiTiesA:test => textContent, multiTiesB:else => testContent';
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();

	if (newEl.textContent !== 'test') test.fail(new Error('expected the value to be "test", but found ' + newEl.textContent));
	if (newEl.testContent !== 'else') test.fail(new Error('expected the value to be "else", but found ' + newEl.testContent));
});

suite.runTest({ name: 'adding nested DOM tree to see children are tied correctly' }, async test => {
	const
		parEl = document.createElement('div'),
		chilEl = document.createElement('div');
	DataTier.ties.create('nestedDomTree', { test: 'test' });

	chilEl.dataset.tie = 'nestedDomTree:test';
	parEl.appendChild(chilEl);
	document.body.appendChild(parEl);

	await test.waitNextMicrotask();

	if (chilEl.textContent !== 'test') test.fail(new Error('expected the text content to be "test", but found ' + chilEl.textContent));
});

suite.runTest({ name: 'adding view and immediatelly appending to it children' }, async test => {
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
});

suite.runTest({ name: 'multiparam (with occasional comma duplicate)' }, async test => {
	const d = document.createElement('div');
	document.body.appendChild(d);

	DataTier.ties.create('multiParamWithCommas', { test: 'test' });

	d.dataset.tie = 'multiParamWithCommas:test,, multiParamWithCommas:test => data';

	await test.waitNextMicrotask();

	test.assertEqual(d.textContent, 'test');
	test.assertEqual(d.data, 'test');
});

suite.runTest({ name: 'tie property changes cycle' }, async test => {
	const
		tn = test.getRandom(8),
		t = DataTier.ties.create(tn, { some: 'test' }),
		d = document.createElement('div');
	document.body.appendChild(d);

	//	set tie to NULL
	d.dataset.tie = null;

	await test.waitNextMicrotask();

	//	set tie to empty
	d.dataset.tie = '';

	await test.waitNextMicrotask();

	//	set tie to existing value
	d.dataset.tie = tn + ':some';

	await test.waitNextMicrotask();

	//	set tie to the same value again (ensure in debugger that update is not running here)
	d.dataset.tie = tn + ':some';

	await test.waitNextMicrotask();
});