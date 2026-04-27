import { test } from '@gullerya/just-test';
import { assert } from '@gullerya/just-test/assert';
import { waitNextTask } from '@gullerya/just-test/timing';
import { getRandom } from '@gullerya/just-test/random';
import { ties, Observable } from '../dist/data-tier.js';


test('adding a tie and then a view', async () => {
	const
		tn = getRandom(8),
		newEl = document.createElement('div'),
		text = 'text test A';

	ties.create(tn, { name: text });

	newEl.dataset.tie = `${tn}:name => textContent`;
	document.body.appendChild(newEl);

	await waitNextTask();

	if (newEl.textContent !== text) assert.fail(new Error('expected the content to be "' + text + '", found: ' + newEl.textContent));
});

test('adding a view and then a tie', async () => {
	const
		tkA = getRandom(8),
		tkB = getRandom(8),
		newEl = document.createElement('div'),
		text = 'text test B';

	newEl.dataset.tie = `${tkA}:nonce => nonce, ${tkB}:name`;
	document.body.appendChild(newEl);

	await waitNextTask();

	ties.create(tkB, { name: text });
	if (newEl.textContent !== text) assert.fail(new Error('expected the content to be "' + text + '", found: ' + newEl.textContent));
});

test('tie to model created with undefined', async () => {
	const
		tk = getRandom(8),
		newEl = document.createElement('div'),
		o = { text: 'text test C' },
		t = ties.create(tk);

	assert.isTrue(Observable.isObservable(t));
	newEl.dataset.tie = `${tk}:text => textContent`;
	document.body.appendChild(newEl);

	await waitNextTask();

	if (newEl.textContent) assert.fail(new Error('preliminary expectation failed: expected the content to be empty'));
	Object.assign(t, o);
	if (newEl.textContent !== o.text) assert.fail(new Error('expected the content to be "' + o.text + '"; found: ' + newEl.textContent));
});

test('setting a tie with a non Observable', async () => {
	const
		tk = getRandom(8),
		newEl = document.createElement('div'),
		o = { text: 'text test E' },
		t = ties.create(tk, o);

	newEl.dataset.tie = `${tk}:text => textContent`;
	document.body.appendChild(newEl);

	await waitNextTask();
	assert.equal(newEl.textContent, t.text);

	ties.remove(tk);
	assert.equal('text test E', t.text);
});

test('setting a tie with an Observable', async () => {
	const
		tk = getRandom(8),
		newEl = document.createElement('div'),
		o = Observable.from({ text: 'text test E' });

	ties.create(tk, o);
	newEl.dataset.tie = `${tk}:text`;
	document.body.appendChild(newEl);

	await waitNextTask();
	assert.equal(newEl.textContent, o.text);

	ties.remove(tk);
	assert.equal('text test E', o.text);
});

//	primitive models
for (const primitiveModel of [true, 123, 'text']) {
	test(`primitive model - create - ${primitiveModel}`, async () => {
		const tk = getRandom(8);
		const e = document.createElement('div');
		e.dataset.tie = tk;
		ties.create(tk, primitiveModel);
		document.body.appendChild(e);
		await waitNextTask();
		assert.equal(String(primitiveModel), e.textContent);
	});

	test(`primitive model - update - ${primitiveModel}`, async () => {
		const tk = getRandom(8);
		const e = document.createElement('div');
		e.dataset.tie = tk;
		ties.create(tk, 'something');
		document.body.appendChild(e);
		await waitNextTask();
		assert.equal('something', e.textContent);
		ties.update(tk, primitiveModel);
		assert.equal(String(primitiveModel), e.textContent);
	});
}

//	TODO: move this test to scoping area or else, when scope is officially supported
test('update tie - create non-existing - scope/element key', () => {
	const e = document.createElement('div');
	const t = ties.update(e, {});
	assert.isTrue(Observable.isObservable(t));
});
