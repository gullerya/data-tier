import { getSuite } from '../node_modules/just-test/dist/just-test.min.js';
import { ties } from '../src/data-tier.js';

const
	originalConsoleError = console.error,
	suite = getSuite({ name: 'Testing views (negative)' });

suite.runTest({ name: 'wrong tying syntax', sync: true }, async test => {
	const d = document.createElement('div');
	const errors = [];

	console.error = (m, e) => {
		errors.push(e);
	};

	d.dataset.tie = 'some::thing';
	document.body.appendChild(d);

	await test.waitNextMicrotask();

	test.assertTrue(errors.length &&
		errors[0] instanceof Error &&
		errors[0].message.includes(`invalid tie parameter '${d.dataset.tie}'`));

	console.error = originalConsoleError;
});

ties.create('negMultiProp', {
	text: 'txt',
	bool: true
});

suite.runTest({ name: 'multiple bindings to the same property - explicit', sync: true }, async test => {
	const d = document.createElement('div');
	const errors = [];

	console.error = m => {
		errors.push(m);
	};

	d.dataset.tie = 'negMultiProp:text => data, negMultiProp:bool => data';
	document.body.appendChild(d);

	await test.waitNextMicrotask();

	test.assertTrue(errors.length &&
		typeof errors[0] === 'string' &&
		errors[0].includes('elements\'s property \'data\' tied more than once'));
	test.assertEqual('txt', d.data);

	console.error = originalConsoleError;
});

suite.runTest({ name: 'multiple bindings to the same property - implicit', sync: true }, async test => {
	const d = document.createElement('div');
	const errors = [];

	console.error = m => {
		errors.push(m);
	};

	d.dataset.tie = 'negMultiProp:bool, negMultiProp:text';
	document.body.appendChild(d);

	await test.waitNextMicrotask();

	test.assertTrue(errors.length &&
		typeof errors[0] === 'string' &&
		errors[0].includes('elements\'s property \'textContent\' tied more than once'));
	test.assertEqual(d.textContent, 'true');

	console.error = originalConsoleError;
});

suite.runTest({ name: 'multiple bindings to the same property - explicit and implicit', sync: true }, async test => {
	const d = document.createElement('div');
	const errors = [];

	console.error = m => {
		errors.push(m);
	};

	d.dataset.tie = 'negMultiProp:text => textContent, negMultiProp:bool';
	document.body.appendChild(d);

	await test.waitNextMicrotask();

	test.assertTrue(errors.length &&
		typeof errors[0] === 'string' &&
		errors[0].includes('elements\'s property \'textContent\' tied more than once'));
	test.assertEqual(d.textContent, 'txt');

	console.error = originalConsoleError;
});