import { getSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const
	suite = getSuite({ name: 'Testing views changes (shortened syntax)' }),
	user = { name: 'some name', age: 7, address: { street: 'str', apt: 9 } };

DataTier.ties.create('userC', user);

suite.runTest({ name: 'update view when path changes (deep)' }, async test => {
	const s1 = document.createElement('div');
	s1.dataset.tie = 'userC:name';
	document.body.appendChild(s1);

	await test.waitNextMicrotask();

	if (s1.textContent !== user.name) test.fail(new Error('preliminary check failed'));
	s1.dataset.tie = 'userC:address.street';

	await test.waitNextMicrotask();

	if (s1.textContent !== user.address.street) test.fail(new Error('expected the content to be "' + user.address.street + '"; found: "' + s1.textContent + '"'));
});

suite.runTest({ name: 'adding new view (zero depth) with path defined' }, async test => {
	const newEl = document.createElement('div');
	newEl.dataset.tie = 'userC:name';
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();

	if (newEl.textContent !== user.name) test.fail(new Error('expected the content to be "' + user.name + '"'));
});

suite.runTest({ name: 'adding few views (with depth) with paths defined' }, async test => {
	const newElA = document.createElement('div'), newElB = document.createElement('div');
	newElA.dataset.tie = 'userC:name';
	newElB.dataset.tie = 'userC:address.apt';
	document.body.appendChild(newElA);
	document.body.appendChild(newElB);

	await test.waitNextMicrotask();

	if (newElA.textContent !== user.name) test.fail(new Error('expected the content to be "' + user.name + '"'));
	if (newElB.textContent !== user.address.apt.toString()) test.fail(new Error('expected the content to be "' + user.address.apt + '"'));
});

suite.runTest({ name: 'adding checkbox view and verifying its value set correctly' }, async test => {
	const newEl = document.createElement('input');
	newEl.type = 'checkbox';
	newEl.dataset.tie = 'cbValueTestShort:test';
	document.body.appendChild(newEl);
	DataTier.ties.create('cbValueTestShort', { test: true });

	await test.waitNextMicrotask();

	if (newEl.checked !== true) test.fail(new Error('expected the value to be "true", but found "' + newEl.checked + '"'));
});

suite.runTest({ name: 'verify that falsish values (0, false, \'\') are visualized correctly' }, async test => {
	const newEl = document.createElement('div');
	DataTier.ties.create('falsishTestShort', { test: 0 });
	document.body.appendChild(newEl);
	newEl.dataset.tie = 'falsishTestShort:test';

	await test.waitNextMicrotask();

	if (newEl.textContent !== '0') test.fail(new Error('expected the value to be "0", but found "' + newEl.textContent + '"'));

	DataTier.ties.get('falsishTestShort').test = false;
	if (newEl.textContent !== 'false') test.fail(new Error('expected the value to be "false", but found "' + newEl.textContent + '"'));

	DataTier.ties.get('falsishTestShort').test = '';
	if (newEl.textContent !== '') test.fail(new Error('expected the value to be "", but found "' + newEl.textContent + '"'));

	DataTier.ties.get('falsishTestShort').test = null;
	if (newEl.textContent !== '') test.fail(new Error('expected the value to be "", but found "' + newEl.textContent + '"'));
});

suite.runTest({ name: 'adding tie property after the element was added to the DOM' }, async test => {
	const newEl = document.createElement('div');
	DataTier.ties.create('postAddShort', { test: 'text' });
	document.body.appendChild(newEl);
	newEl.dataset.tie = 'postAddShort:test';

	await test.waitNextMicrotask();

	if (newEl.textContent !== 'text') test.fail(new Error('expected the value to be "text", but found ' + newEl.textContent));
});

suite.runTest({ name: 'mapping element to 2 different ties' }, async test => {
	const newEl = document.createElement('div');
	DataTier.ties.create('multiTiesAShort', { test: 'test' });
	DataTier.ties.create('multiTiesBShort', { else: 'else' });
	newEl.dataset.tie = 'multiTiesAShort:test, multiTiesBShort:else => testContent';
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();

	if (newEl.textContent !== 'test') test.fail(new Error('expected the value to be "test", but found ' + newEl.textContent));
	if (newEl.testContent !== 'else') test.fail(new Error('expected the value to be "else", but found ' + newEl.testContent));
});

suite.runTest({ name: 'native element with customized default property' }, async test => {
	const newEl = document.createElement('div');
	DataTier.ties.create('customTargetProperty', { test: 'custom target property' });
	newEl.dataset.tie = 'customTargetProperty:test => data';
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();

	if (newEl.data !== 'custom target property') test.fail(new Error('expected the value to be "custom target property", but found ' + newEl.textContent));
});