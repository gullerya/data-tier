import { test } from '@gullerya/just-test';
import { assert } from '@gullerya/just-test/assert';
import { waitNextTask } from '@gullerya/just-test/timing';
import * as DataTier from '../dist/data-tier.js?inst=scope-lifecycle';

test('scoped tying root - data first, element last', async () => {
	const sv = document.createElement('div');
	sv.dataset.tie = 'scope:text';
	const model = DataTier.ties.create(sv, { text: 'text' });

	document.body.appendChild(sv);
	await waitNextTask();

	assert.equal(model.text, sv.textContent);
});

test('scoped tying root - element first, data last', async () => {
	const sv = document.createElement('div');
	sv.dataset.tie = 'scope:text';

	document.body.appendChild(sv);
	await waitNextTask();

	const model = DataTier.ties.create(sv, { text: 'text' });

	assert.equal(model.text, sv.textContent);
});

test('scoped tying root - data, element, attribute last', async () => {
	const sv = document.createElement('div');
	const model = DataTier.ties.create(sv, { text: 'text' });

	document.body.appendChild(sv);
	assert.equal('', sv.textContent);

	sv.dataset.tie = 'scope:text';
	await waitNextTask();

	assert.equal(model.text, sv.textContent);
});

test('scoped tying root - element, data, attribute last', async () => {
	const sv = document.createElement('div');
	document.body.appendChild(sv);
	assert.equal('', sv.textContent);

	const model = DataTier.ties.create(sv, { text: 'text' });

	sv.dataset.tie = 'scope:text';
	await waitNextTask();

	assert.equal(model.text, sv.textContent);
});

test('scoped tying child - data first, element last', async () => {
	const rv = document.createElement('div');
	document.body.appendChild(rv);
	await waitNextTask();

	const model = DataTier.ties.create(rv, { text: 'text' });

	const cv = document.createElement('div');
	cv.dataset.tie = 'scope:text';
	rv.appendChild(cv);
	await waitNextTask();

	assert.equal(model.text, cv.textContent);
});

test('scoped tying child - element first, data last', async () => {
	const rv = document.createElement('div');
	const cv = document.createElement('div');
	cv.dataset.tie = 'scope:text';
	rv.appendChild(cv);
	document.body.appendChild(rv);
	await waitNextTask();

	const model = DataTier.ties.create(rv, { text: 'text' });

	assert.equal(model.text, cv.textContent);
});
