import { createSuite } from '../node_modules/just-test/dist/just-test.min.js';
import { ties } from '../dist/data-tier.js';
import { Observable } from '../dist/object-observer.min.js';

const suite = createSuite({ name: 'Testing ties' });

suite.runTest({ name: 'adding a tie and then a view' }, async test => {
	const
		newEl = document.createElement('div'),
		text = 'text test A';

	ties.create('tiesTestA', { name: text });

	newEl.dataset.tie = 'tiesTestA:name => textContent';
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();

	if (newEl.textContent !== text) test.fail(new Error('expected the content to be "' + text + '", found: ' + newEl.textContent));
});

suite.runTest({ name: 'adding a view and then a tie' }, async test => {
	const
		newEl = document.createElement('div'),
		text = 'text test B';

	newEl.dataset.tie = 'tiesTestB:name => textContent';
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();

	ties.create('tiesTestB', { name: text });
	if (newEl.textContent !== text) test.fail(new Error('expected the content to be "' + text + '", found: ' + newEl.textContent));
});

suite.runTest({ name: 'creating a tie with an undefined data' }, async test => {
	const
		newEl = document.createElement('div'),
		o = { text: 'text test C' },
		t = ties.create('tiesTestC');
	newEl.dataset.tie = 'tiesTestC:text => textContent';
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();

	if (newEl.textContent) test.fail(new Error('preliminary expectation failed: expected the content to be empty'));
	Object.assign(t, o);
	if (newEl.textContent !== o.text) test.fail(new Error('expected the content to be "' + o.text + '"; found: ' + newEl.textContent));
});

suite.runTest({ name: 'setting a tie with a non Observable', expectError: 'Cannot perform \'get\' on a proxy that has been revoked' }, async test => {
	const
		tieName = test.getRandom(8),
		newEl = document.createElement('div'),
		o = { text: 'text test E' },
		t = ties.create(tieName, o);

	test.assertNotEqual(o, t);

	newEl.dataset.tie = tieName + ':text => textContent';
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();
	test.assertEqual(newEl.textContent, t.text);

	ties.remove(tieName);

	t.text;
});

suite.runTest({ name: 'setting a tie with an Observable' }, async test => {
	const
		tieName = test.getRandom(8),
		newEl = document.createElement('div'),
		o = Observable.from({ text: 'text test E' }),
		t = ties.create(tieName, o);

	test.assertEqual(o, t);

	newEl.dataset.tie = tieName + ':text';
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();
	test.assertEqual(newEl.textContent, o.text);

	ties.remove(tieName);

	test.assertEqual('text test E', o.text);
});

suite.runTest({ name: 'creating a tie with a NULL data - negative', expectError: 'initial model, when provided, MUST NOT be null' }, () => {
	ties.create('tiesTestD', null);
});

suite.runTest({ name: 'setting a tie with a non object value - negative' }, test => {
	try {
		ties.create('tiesTestE', 5);
		test.fail('flow was not supposed to get to this point');
	} catch (e) {
	}
});