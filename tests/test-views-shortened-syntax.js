import { test } from '@gullerya/just-test';
import { assert } from '@gullerya/just-test/assert';
import { waitNextTask } from '@gullerya/just-test/timing';
import * as DataTier from '../dist/data-tier.js';

const user = { name: 'some name', age: 7, address: { street: 'str', apt: 9 } };

DataTier.ties.create('userC', user);

test('update view when path changes (deep)', async () => {
	const s1 = document.createElement('div');
	s1.dataset.tie = 'userC:name';
	document.body.appendChild(s1);

	await waitNextTask();

	if (s1.textContent !== user.name) assert.fail(new Error('preliminary check failed'));
	s1.dataset.tie = 'userC:address.street';

	await waitNextTask();

	if (s1.textContent !== user.address.street) assert.fail(new Error('expected the content to be "' + user.address.street + '"; found: "' + s1.textContent + '"'));
});

test('adding new view (zero depth) with path defined', async () => {
	const newEl = document.createElement('div');
	newEl.dataset.tie = 'userC:name';
	document.body.appendChild(newEl);

	await waitNextTask();

	if (newEl.textContent !== user.name) assert.fail(new Error('expected the content to be "' + user.name + '"'));
});

test('adding few views (with depth) with paths defined', async () => {
	const newElA = document.createElement('div'), newElB = document.createElement('div');
	newElA.dataset.tie = 'userC:name';
	newElB.dataset.tie = 'userC:address.apt';
	document.body.appendChild(newElA);
	document.body.appendChild(newElB);

	await waitNextTask();

	if (newElA.textContent !== user.name) assert.fail(new Error('expected the content to be "' + user.name + '"'));
	if (newElB.textContent !== user.address.apt.toString()) assert.fail(new Error('expected the content to be "' + user.address.apt + '"'));
});

test('adding checkbox view and verifying its value set correctly', async () => {
	const newEl = document.createElement('input');
	newEl.type = 'checkbox';
	newEl.dataset.tie = 'cbValueTestShort:test';
	document.body.appendChild(newEl);
	DataTier.ties.create('cbValueTestShort', { test: true });

	await waitNextTask();

	if (newEl.checked !== true) assert.fail(new Error('expected the value to be "true", but found "' + newEl.checked + '"'));
});

test('verify that falsish values (0, false, \'\') are visualized correctly', async () => {
	const newEl = document.createElement('div');
	DataTier.ties.create('falsishTestShort', { test: 0 });
	document.body.appendChild(newEl);
	newEl.dataset.tie = 'falsishTestShort:test';

	await waitNextTask();

	if (newEl.textContent !== '0') assert.fail(new Error('expected the value to be "0", but found "' + newEl.textContent + '"'));

	DataTier.ties.get('falsishTestShort').test = false;
	if (newEl.textContent !== 'false') assert.fail(new Error('expected the value to be "false", but found "' + newEl.textContent + '"'));

	DataTier.ties.get('falsishTestShort').test = '';
	if (newEl.textContent !== '') assert.fail(new Error('expected the value to be "", but found "' + newEl.textContent + '"'));

	DataTier.ties.get('falsishTestShort').test = null;
	if (newEl.textContent !== '') assert.fail(new Error('expected the value to be "", but found "' + newEl.textContent + '"'));
});

test('adding tie property after the element was added to the DOM', async () => {
	const newEl = document.createElement('div');
	DataTier.ties.create('postAddShort', { test: 'text' });
	document.body.appendChild(newEl);
	newEl.dataset.tie = 'postAddShort:test';

	await waitNextTask();

	if (newEl.textContent !== 'text') assert.fail(new Error('expected the value to be "text", but found ' + newEl.textContent));
});

test('mapping element to 2 different ties', async () => {
	const newEl = document.createElement('div');
	DataTier.ties.create('multiTiesAShort', { test: 'test' });
	DataTier.ties.create('multiTiesBShort', { else: 'else' });
	newEl.dataset.tie = 'multiTiesAShort:test, multiTiesBShort:else => testContent';
	document.body.appendChild(newEl);

	await waitNextTask();

	if (newEl.textContent !== 'test') assert.fail(new Error('expected the value to be "test", but found ' + newEl.textContent));
	if (newEl.testContent !== 'else') assert.fail(new Error('expected the value to be "else", but found ' + newEl.testContent));
});

test('native element with customized default property', async () => {
	const newEl = document.createElement('div');
	DataTier.ties.create('customTargetProperty', { test: 'custom target property' });
	newEl.dataset.tie = 'customTargetProperty:test => data';
	document.body.appendChild(newEl);

	await waitNextTask();

	if (newEl.data !== 'custom target property') assert.fail(new Error('expected the value to be "custom target property", but found ' + newEl.textContent));
});