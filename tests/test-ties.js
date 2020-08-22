import { getSuite } from '../node_modules/just-test/dist/just-test.min.js';
import { ties } from '../dist/data-tier.js';
import { Observable } from '../dist/object-observer.min.js';

const suite = getSuite({ name: 'Testing ties' });

suite.runTest({ name: 'adding a tie and then a view' }, async test => {
	const
		tieName = test.getRandom(8),
		newEl = document.createElement('div'),
		text = 'text test A';

	ties.create(tieName, { name: text });

	newEl.dataset.tie = tieName + ':name => textContent';
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();

	if (newEl.textContent !== text) test.fail(new Error('expected the content to be "' + text + '", found: ' + newEl.textContent));
});

suite.runTest({ name: 'adding a view and then a tie' }, async test => {
	const
		tieNameA = test.getRandom(8),
		tieNameB = test.getRandom(8),
		newEl = document.createElement('div'),
		text = 'text test B';

	newEl.dataset.tie = tieNameA + ':nonce => nonce, ' + tieNameB + ':name';
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();

	ties.create(tieNameB, { name: text });
	if (newEl.textContent !== text) test.fail(new Error('expected the content to be "' + text + '", found: ' + newEl.textContent));
});

suite.runTest({ name: 'creating a tie with an undefined data' }, async test => {
	const
		newEl = document.createElement('div'),
		o = { text: 'text test C' },
		t = ties.create('tiesTestC');

	test.assertTrue(Observable.isObservable(t));
	newEl.dataset.tie = 'tiesTestC:text => textContent';
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();

	if (newEl.textContent) test.fail(new Error('preliminary expectation failed: expected the content to be empty'));
	Object.assign(t, o);
	if (newEl.textContent !== o.text) test.fail(new Error('expected the content to be "' + o.text + '"; found: ' + newEl.textContent));
});

suite.runTest({ name: 'setting a tie with a non Observable' }, async test => {
	const
		tieName = test.getRandom(8),
		newEl = document.createElement('div'),
		o = { text: 'text test E' },
		t = ties.create(tieName, o);

	test.assertTrue(Observable.isObservable(t));
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

	test.assertTrue(Observable.isObservable(t));
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

suite.runTest({ name: 'setting a tie with a non object value - negative', expectError: 'observable MAY ONLY be created from a non-null object' }, test => {
	ties.create('tiesTestE', 5);
});

suite.runTest({ name: 'update tie - plain' }, test => {
	const t = ties.create('testUpdateA');
	test.assertTrue(Observable.isObservable(t));

	const tu1 = ties.update('testUpdateA', { update: 'a' });
	test.assertTrue(Observable.isObservable(tu1));
	test.assertEqual('a', tu1.update);

	const tnu = ties.update('testUpdateA', tu1);
	test.assertEqual(tu1, tnu);
});

suite.runTest({ name: 'update tie - observable' }, test => {
	const t = ties.create('testUpdateB');
	test.assertTrue(Observable.isObservable(t));

	const oo = Observable.from({ test: 'b' });
	const tu1 = ties.update('testUpdateB', oo);
	test.assertTrue(Observable.isObservable(tu1));
	test.assertEqual(oo, tu1);
});

suite.runTest({ name: 'update tie - create non-existing - string key' }, test => {
	const t = ties.update('testUpdateC', {});
	test.assertTrue(Observable.isObservable(t));
});

suite.runTest({ name: 'update tie - create non-existing - scope/element key' }, test => {
	const e = document.createElement('div');
	const t = ties.update(e, {});
	test.assertTrue(Observable.isObservable(t));
});