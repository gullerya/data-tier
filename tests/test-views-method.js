import { test } from '@gullerya/just-test';
import { assert } from '@gullerya/just-test/assert';
import { waitNextTask } from '@gullerya/just-test/timing';
import { getRandom } from '@gullerya/just-test/random';
import * as DataTier from '../dist/data-tier.js';


//	single argument
//
test('adding root model single to view - model first', async () => {
	const tieName = getRandom(8);
	const model = DataTier.ties.create(tieName, { test: 'test' });

	const calls = [];
	const newEl = document.createElement('div');
	newEl.f = (value, changes) => calls.push([value, changes]);
	newEl.dataset.tie = 'f(' + tieName + ')';
	document.body.appendChild(newEl);

	await waitNextTask();

	assert.equal(1, calls.length);
	assert.equal(model, calls[0][0]);
	assert.equal(null, calls[0][1]);
});

test('adding deep model single to view - model first', async () => {
	const tieName = getRandom(8);
	DataTier.ties.create(tieName, { deep: { test: 'test' } });

	const calls = [];
	const newEl = document.createElement('div');
	newEl.f = (value, changes) => calls.push([value, changes]);
	newEl.dataset.tie = 'f(' + tieName + ':deep.test)';
	document.body.appendChild(newEl);

	await waitNextTask();

	assert.equal(1, calls.length);
	assert.equal('test', calls[0][0]);
	assert.equal(null, calls[0][1]);
});

test('adding root model single to view - view first', async () => {
	const tieName = getRandom(8);

	const calls = [];
	const newEl = document.createElement('div');
	newEl.f = (value, changes) => calls.push([value, changes]);
	newEl.dataset.tie = 'f(' + tieName + ')';
	document.body.appendChild(newEl);

	await waitNextTask();

	const model = DataTier.ties.create(tieName, { test: 'test' });
	assert.equal(1, calls.length);
	assert.equal(model, calls[0][0]);
	assert.isTrue(typeof calls[0][1] === 'object');
});

test('adding deep model single to view - view first', async () => {
	const tieName = getRandom(8);

	const calls = [];
	const newEl = document.createElement('div');
	newEl.f = (value, changes) => calls.push([value, changes]);
	newEl.dataset.tie = 'f(' + tieName + ':deep.test)';
	document.body.appendChild(newEl);

	await waitNextTask();

	DataTier.ties.create(tieName, { deep: { test: 'test' } });
	assert.equal(1, calls.length);
	assert.equal('test', calls[0][0]);
	assert.isTrue(typeof calls[0][1] === 'object');
});

//	multiple arguments
//
test('adding mixed models multi to view - model first', async () => {
	const tieNameA = getRandom(8);
	const tieNameB = getRandom(8);
	const model = DataTier.ties.create(tieNameA, { deep: { test: 'test' } });
	DataTier.ties.create(tieNameB, { deep: { test: 'test' } });

	const calls = [];
	const newEl = document.createElement('div');
	newEl.f = function () { calls.push(arguments); };
	newEl.dataset.tie = 'f(' + tieNameA + ', ' + tieNameB + ':deep.test)';
	document.body.appendChild(newEl);

	await waitNextTask();

	assert.equal(1, calls.length);
	assert.equal(model, calls[0][0]);
	assert.equal('test', calls[0][1]);
	assert.equal(null, calls[0][2]);
});

test('adding mixed models multi to view - view first', async () => {
	const tieNameA = getRandom(8);
	const tieNameB = getRandom(8);

	const calls = [];
	const newEl = document.createElement('div');
	newEl.f = function () { calls.push(arguments); };
	newEl.dataset.tie = 'f(' + tieNameB + ':deep.test, ' + tieNameA + ')';
	document.body.appendChild(newEl);

	await waitNextTask();

	const modelA = DataTier.ties.create(tieNameA, { deep: { test: 'testA' } });
	DataTier.ties.create(tieNameB, { deep: { test: 'testB' } });
	assert.equal(2, calls.length);
	assert.equal(undefined, calls[0][0]);
	assert.equal(modelA, calls[0][1]);
	assert.isTrue(typeof calls[0][2] === 'object');
	assert.equal('testB', calls[1][0]);
	assert.equal(modelA, calls[1][1]);
	assert.isTrue(typeof calls[1][2] === 'object');
});

//	multiple arguments - ongoing changes
//
test('adding mixed models multi to view - ongoing changes', async () => {
	const tieNameA = getRandom(8);
	const tieNameB = getRandom(8);
	const modelA = DataTier.ties.create(tieNameA, { deep: { test: 'test' } });
	const modelB = DataTier.ties.create(tieNameB, { deep: { test: 'test' } });

	const calls = [];
	const newEl = document.createElement('div');
	newEl.f = function () { calls.push(arguments); };
	newEl.dataset.tie = 'f(' + tieNameA + ', ' + tieNameB + ':deep.test)';
	document.body.appendChild(newEl);

	await waitNextTask();

	calls.splice(0);

	modelB.deep.test = 'change primitive';
	delete modelB.deep;

	assert.equal(2, calls.length);

	assert.equal(modelA, calls[0][0]);
	assert.equal('change primitive', calls[0][1]);
	assert.isTrue(Array.isArray(calls[0][2]));
	assert.equal('update', calls[0][2][0].type);
	assert.isTrue(Array.isArray(calls[0][2][0].path));
	assert.equal(2, calls[0][2][0].path.length);
	assert.equal('test', calls[0][2][0].oldValue);
	assert.equal('change primitive', calls[0][2][0].value);

	assert.equal(modelA, calls[1][0]);
	assert.equal(undefined, calls[1][1]);
	assert.isTrue(Array.isArray(calls[1][2]));
	assert.equal(modelB, calls[1][2][0].object);
	assert.equal('delete', calls[1][2][0].type);
	assert.isTrue(Array.isArray(calls[1][2][0].path));
	assert.equal(1, calls[1][2][0].path.length);
	assert.equal('object', typeof calls[1][2][0].oldValue);
	assert.equal(undefined, calls[1][2][0].value);
});
