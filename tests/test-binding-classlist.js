import { test } from '@gullerya/just-test';
import { assert } from '@gullerya/just-test/assert';
import { waitNextTask } from '@gullerya/just-test/timing';
import { getRandom } from '@gullerya/just-test/random';
import * as DataTier from '../dist/data-tier.js';


test('full flow simple case', async () => {
	const
		tn = getRandom(8),
		t = DataTier.ties.create(tn),
		v = document.createElement('span');

	v.classList.add('ootb');
	v.dataset.tie = `${tn}:classes => classList`;
	document.body.appendChild(v);

	await waitNextTask();
	assert.isTrue(v.classList.contains('ootb'));
	assert.isTrue(v.classList.length === 1);

	t.classes = ['added-a'];
	await waitNextTask();
	assert.isTrue(v.classList.contains('ootb'));
	assert.isTrue(v.classList.contains('added-a'));
	assert.isTrue(v.classList.length === 2);

	t.classes.pop();
	await waitNextTask();
	assert.isTrue(v.classList.contains('ootb'));
	assert.isTrue(v.classList.length === 1);
});

test('full flow - array', async () => {
	const
		tn = getRandom(8),
		t = DataTier.ties.create(tn),
		v = document.createElement('span');

	v.classList.add('a', 'b');
	v.dataset.tie = `${tn}:classes => classList`;
	document.body.appendChild(v);

	await waitNextTask();
	assert.isTrue(v.classList.contains('a'));
	assert.isTrue(v.classList.contains('b'));
	assert.isTrue(v.classList.length === 2);

	t.classes = ['b', 'c', 'd'];
	await waitNextTask();
	assert.isTrue(v.classList.contains('a'));
	assert.isTrue(v.classList.contains('b'));
	assert.isTrue(v.classList.contains('c'));
	assert.isTrue(v.classList.contains('d'));
	assert.isTrue(v.classList.length === 4);

	t.classes.pop();
	await waitNextTask();
	assert.isTrue(v.classList.contains('a'));
	assert.isTrue(v.classList.contains('b'));
	assert.isTrue(v.classList.contains('c'));
	assert.isTrue(v.classList.length === 3);

	t.classes.splice(0);
	await waitNextTask();
	assert.isTrue(v.classList.contains('a'));
	assert.isTrue(v.classList.contains('b'));
	assert.isTrue(v.classList.length === 2);
});

test('full flow - object', async () => {
	const
		tn = getRandom(8),
		t = DataTier.ties.create(tn),
		v = document.createElement('span');

	v.classList.add('a', 'b');
	v.dataset.tie = `${tn}:classes => classList`;
	document.body.appendChild(v);

	await waitNextTask();
	assert.isTrue(v.classList.contains('a'));
	assert.isTrue(v.classList.contains('b'));
	assert.isTrue(v.classList.length === 2);

	t.classes = {
		b: false,
		c: 1,
		d: 0
	};
	await waitNextTask();
	assert.isTrue(v.classList.contains('a'));
	assert.isTrue(v.classList.contains('c'));
	assert.isTrue(v.classList.length === 2);

	t.classes.b = true;
	t.classes.c = false;
	t.classes.d = {};
	await waitNextTask();
	assert.isTrue(v.classList.contains('a'));
	assert.isTrue(v.classList.contains('b'));
	assert.isTrue(v.classList.contains('d'));
	assert.isTrue(v.classList.length === 3);
});

test('full flow - string', async () => {
	const
		tn = getRandom(8),
		t = DataTier.ties.create(tn),
		v = document.createElement('span');

	v.classList.add('ootb');
	v.dataset.tie = `${tn}:classes => classList`;
	document.body.appendChild(v);

	await waitNextTask();
	assert.isTrue(v.classList.contains('ootb'));
	assert.isTrue(v.classList.length === 1);

	t.classes = 'string';
	await waitNextTask();
	assert.isTrue(v.classList.contains('ootb'));
	assert.isTrue(v.classList.contains('string'));
	assert.isTrue(v.classList.length === 2);

	t.classes = '';
	await waitNextTask();
	assert.isTrue(v.classList.contains('ootb'));
	assert.isTrue(v.classList.length === 1);
});
