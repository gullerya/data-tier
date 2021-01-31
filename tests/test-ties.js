import { getSuite } from '../node_modules/just-test/dist/just-test.min.js';
import { ties, Observable } from '../dist/data-tier.js';

const suite = getSuite({ name: 'Testing ties' });

suite.runTest({ name: 'adding a tie and then a view' }, async test => {
	const
		tn = test.getRandom(8),
		newEl = document.createElement('div'),
		text = 'text test A';

	ties.create(tn, { name: text });

	newEl.dataset.tie = `${tn}:name => textContent`;
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();

	if (newEl.textContent !== text) test.fail(new Error('expected the content to be "' + text + '", found: ' + newEl.textContent));
});

suite.runTest({ name: 'adding a view and then a tie' }, async test => {
	const
		tkA = test.getRandom(8),
		tkB = test.getRandom(8),
		newEl = document.createElement('div'),
		text = 'text test B';

	newEl.dataset.tie = `${tkA}:nonce => nonce, ${tkB}:name`;
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();

	ties.create(tkB, { name: text });
	if (newEl.textContent !== text) test.fail(new Error('expected the content to be "' + text + '", found: ' + newEl.textContent));
});

suite.runTest({ name: 'tie to model created with undefined' }, async test => {
	const
		tk = test.getRandom(8),
		newEl = document.createElement('div'),
		o = { text: 'text test C' },
		t = ties.create(tk);

	test.assertTrue(Observable.isObservable(t));
	newEl.dataset.tie = `${tk}:text => textContent`;
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();

	if (newEl.textContent) test.fail(new Error('preliminary expectation failed: expected the content to be empty'));
	Object.assign(t, o);
	if (newEl.textContent !== o.text) test.fail(new Error('expected the content to be "' + o.text + '"; found: ' + newEl.textContent));
});

suite.runTest({ name: 'setting a tie with a non Observable' }, async test => {
	const
		tk = test.getRandom(8),
		newEl = document.createElement('div'),
		o = { text: 'text test E' },
		t = ties.create(tk, o);

	newEl.dataset.tie = `${tk}:text => textContent`;
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();
	test.assertEqual(newEl.textContent, t.text);

	ties.remove(tk);
	test.assertEqual('text test E', t.text);
});

suite.runTest({ name: 'setting a tie with an Observable' }, async test => {
	const
		tk = test.getRandom(8),
		newEl = document.createElement('div'),
		o = Observable.from({ text: 'text test E' });

	ties.create(tk, o);
	newEl.dataset.tie = `${tk}:text`;
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();
	test.assertEqual(newEl.textContent, o.text);

	ties.remove(tk);
	test.assertEqual('text test E', o.text);
});

//	primitive models
for (const primitiveModel of [true, 123, 'text']) {
	suite.runTest({ name: `primitive model - create - ${primitiveModel}` }, async test => {
		const tk = test.getRandom(8);
		const e = document.createElement('div');
		e.dataset.tie = tk;
		ties.create(tk, primitiveModel);
		document.body.appendChild(e);
		await test.waitNextMicrotask();
		test.assertEqual(String(primitiveModel), e.textContent);
	});

	suite.runTest({ name: `primitive model - update - ${primitiveModel}` }, async test => {
		const tk = test.getRandom(8);
		const e = document.createElement('div');
		e.dataset.tie = tk;
		ties.create(tk, 'something');
		document.body.appendChild(e);
		await test.waitNextMicrotask();
		test.assertEqual('something', e.textContent);
		ties.update(tk, primitiveModel);
		test.assertEqual(String(primitiveModel), e.textContent);
	});
}

//	TODO: move this test to scoping area or else, when scope is officially supported
suite.runTest({ name: 'update tie - create non-existing - scope/element key' }, test => {
	const e = document.createElement('div');
	const t = ties.update(e, {});
	test.assertTrue(Observable.isObservable(t));
});
