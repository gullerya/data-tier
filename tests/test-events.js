import { test } from '@gullerya/just-test';
import { assert } from '@gullerya/just-test/assert';
import { waitNextTask } from '@gullerya/just-test/timing';
import { getRandom } from '@gullerya/just-test/random';
import * as DataTier from '../dist/data-tier.js';


test('binding/unbinding default event', async () => {
	const tn = getRandom(8);
	const testTie = DataTier.ties.create(tn, {});
	const i = document.createElement('input');
	let e;
	i.dataset.tie = `${tn}:someA`;
	document.body.appendChild(i);

	await waitNextTask();

	assert.equal('', i.value);
	i.value = 'text';
	e = new Event('change');
	i.dispatchEvent(e);

	assert.equal('text', testTie.someA);

	//  removal of element should untie
	document.body.removeChild(i);

	await waitNextTask();

	i.value = 'changed text';
	e = new Event('change');
	i.dispatchEvent(e);

	assert.equal('text', testTie.someA);
});

test('binding/unbinding default event (checkbox)', async () => {
	const tn = getRandom(8);
	const testTie = DataTier.ties.create(tn, {});
	const i = document.createElement('input');
	let e;
	i.type = 'checkbox';
	i.dataset.tie = `${tn}:bool`;
	document.body.appendChild(i);

	await waitNextTask();

	assert.equal(i.value, 'on');
	i.checked = true;
	e = new Event('change');
	i.dispatchEvent(e);

	assert.isTrue(testTie.bool);

	//  removal of element should untie
	document.body.removeChild(i);

	await waitNextTask();

	i.checked = false;
	e = new Event('change');
	i.dispatchEvent(e);

	assert.isTrue(testTie.bool);
});

test('binding/unbinding custom event default value property', async () => {
	const tn = getRandom(8);
	const testTie = DataTier.ties.create(tn, {});
	const i = document.createElement('input');
	i.dataset.tie = `${tn}:someB => => customChange`;
	document.body.appendChild(i);

	await waitNextTask();

	assert.equal(i.value, '');
	i.value = 'text';
	let e = new Event('customChange');
	i.dispatchEvent(e);

	assert.equal(testTie.someB, 'text');

	//  removal of element should untie
	document.body.removeChild(i);

	await waitNextTask();

	i.value = 'changed text';
	e = new Event('customChange');
	i.dispatchEvent(e);

	assert.equal(testTie.someB, 'text');
});

test('binding custom event custom value property', async () => {
	const tn = getRandom(8);
	const testTie = DataTier.ties.create(tn, {});
	testTie.someC = 'new value';

	const d = document.createElement('div');
	testTie.someC = 'new value';
	d.customValue = '';
	d.dataset.tie = `${tn}:someC => customValue => customChange`;
	document.body.appendChild(d);

	await waitNextTask();

	assert.equal(d.customValue, testTie.someC);
	d.customValue = 'text';
	d.dispatchEvent(new Event('customChange'));

	assert.equal('text', testTie.someC);
});

test('regular event/value multiple bindings', async () => {
	const tieName = getRandom(8);
	const t = DataTier.ties.create(tieName, { test: 'some', other: 'thing' });

	const i = document.createElement('input');
	i.dataset.tie = `${tieName}:test, ${tieName}:other => customProp`;
	document.body.appendChild(i);

	await waitNextTask();
	assert.equal(i.value, t.test);
	assert.equal(i.customProp, t.other);

	i.value = 'text';
	i.dispatchEvent(new Event('change'));

	await waitNextTask();
	assert.equal(t.test, i.value);
	assert.equal(t.other, 'thing');
});

test('custom event/value multiple bindings', async () => {
	const tieName = getRandom(8);
	const t = DataTier.ties.create(tieName, { test: 'some', other: 'thing' });

	const d = document.createElement('input');
	d.dataset.tie = `${tieName}:test => customValue => customChange, ${tieName}:other => customProp`;
	document.body.appendChild(d);

	await waitNextTask();
	assert.equal(d.customValue, t.test);
	assert.equal(d.customProp, t.other);

	d.customValue = 'text';
	d.dispatchEvent(new Event('customChange'));

	await waitNextTask();
	assert.equal(t.test, d.customValue);
	assert.equal(t.other, 'thing');
});

test('deeply nested model update - success', async () => {
	const tieName = getRandom(8);
	const testModel = DataTier.ties.create(tieName);

	const i = document.createElement('input');
	i.dataset.tie = tieName + ':one.two.three';
	document.body.appendChild(i);

	await waitNextTask();

	i.value = 'new value';
	i.dispatchEvent(new Event('change'));

	await waitNextTask();

	assert.equal('new value', testModel.one && testModel.one.two && testModel.one.two.three);
});

test('deeply nested model update - failure', async () => {
	const tieName = getRandom(8);
	const testModel = DataTier.ties.create(tieName, { one: { two: 4 } });

	const i = document.createElement('input');
	i.dataset.tie = tieName + ':one.two.three';
	document.body.appendChild(i);

	await waitNextTask();

	i.value = 'new value';
	i.dispatchEvent(new Event('change'));

	await waitNextTask();

	assert.equal(4, testModel.one.two);
});

test('removed view is untied', async () => {
	const tn = getRandom(8);
	const testModel = DataTier.ties.create(tn, { test: 'test' });

	const i = document.createElement('input');
	i.dataset.tie = `${tn}:test`;
	document.body.appendChild(i);

	await waitNextTask();

	assert.equal(i.value, 'test');

	i.value = 'else';
	i.dispatchEvent(new Event('change'));

	await waitNextTask();

	assert.equal(i.value, 'else');

	document.body.removeChild(i);

	await waitNextTask();

	i.value = 'next';
	i.dispatchEvent(new Event('change'));

	await waitNextTask();

	assert.equal(testModel.test, 'else');
});