import { test } from '@gullerya/just-test';
import { assert } from '@gullerya/just-test/assert';
import { waitNextTask } from '@gullerya/just-test/timing';
import { ties } from '../dist/data-tier.js';

const originalConsoleError = console.error;

test('wrong tying syntax - missing tieKey', async () => {
	const d = document.createElement('div');
	const errors = [];

	console.error = (m, e) => {
		errors.push(e);
	};

	d.dataset.tie = ':path';
	document.body.appendChild(d);

	await waitNextTask();

	assert.isTrue(errors.length &&
		errors[0] instanceof Error &&
		errors[0].message.includes('tie key missing'));

	console.error = originalConsoleError;
});

ties.create('negMultiProp', {
	text: 'txt',
	bool: true
});

test('multiple bindings to the same property - explicit', async () => {
	const d = document.createElement('div');
	const errors = [];

	console.error = m => {
		errors.push(m);
	};

	d.dataset.tie = 'negMultiProp:text => data, negMultiProp:bool => data';
	document.body.appendChild(d);

	await waitNextTask();

	assert.isTrue(errors.length &&
		typeof errors[0] === 'string' &&
		errors[0].includes('elements\'s property \'data\' tied more than once'));
	assert.equal('txt', d.data);

	console.error = originalConsoleError;
});

test('multiple bindings to the same property - implicit', async () => {
	const d = document.createElement('div');
	const errors = [];

	console.error = m => {
		errors.push(m);
	};

	d.dataset.tie = 'negMultiProp:bool, negMultiProp:text';
	document.body.appendChild(d);

	await waitNextTask();

	assert.isTrue(errors.length &&
		typeof errors[0] === 'string' &&
		errors[0].includes('elements\'s property \'textContent\' tied more than once'));
	assert.equal(d.textContent, 'true');

	console.error = originalConsoleError;
});

test('multiple bindings to the same property - explicit and implicit', async () => {
	const d = document.createElement('div');
	const errors = [];

	console.error = m => {
		errors.push(m);
	};

	d.dataset.tie = 'negMultiProp:text => textContent, negMultiProp:bool';
	document.body.appendChild(d);

	await waitNextTask();

	assert.isTrue(errors.length &&
		typeof errors[0] === 'string' &&
		errors[0].includes('elements\'s property \'textContent\' tied more than once'));
	assert.equal(d.textContent, 'txt');

	console.error = originalConsoleError;
});