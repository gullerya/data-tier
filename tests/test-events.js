import { getSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const suite = getSuite({ name: 'Testing events' });

suite.runTest({ name: 'binding/unbinding default event' }, async test => {
	const tn = test.getRandom(8);
	const testTie = DataTier.ties.create(tn, {});
	const i = document.createElement('input');
	let e;
	i.dataset.tie = `${tn}:someA`;
	document.body.appendChild(i);

	await test.waitNextMicrotask();

	test.assertEqual('', i.value);
	i.value = 'text';
	e = new Event('change');
	i.dispatchEvent(e);

	test.assertEqual('text', testTie.someA);

	//  removal of element should untie
	document.body.removeChild(i);

	await test.waitNextMicrotask();

	i.value = 'changed text';
	e = new Event('change');
	i.dispatchEvent(e);

	test.assertEqual('text', testTie.someA);
});

suite.runTest({ name: 'binding/unbinding default event (checkbox)' }, async test => {
	const tn = test.getRandom(8);
	const testTie = DataTier.ties.create(tn, {});
	const i = document.createElement('input');
	let e;
	i.type = 'checkbox';
	i.dataset.tie = `${tn}:bool`;
	document.body.appendChild(i);

	await test.waitNextMicrotask();

	test.assertEqual(i.value, 'on');
	i.checked = true;
	e = new Event('change');
	i.dispatchEvent(e);

	test.assertTrue(testTie.bool);

	//  removal of element should untie
	document.body.removeChild(i);

	await test.waitNextMicrotask();

	i.checked = false;
	e = new Event('change');
	i.dispatchEvent(e);

	test.assertTrue(testTie.bool);
});

suite.runTest({ name: 'binding/unbinding custom event default value property' }, async test => {
	const tn = test.getRandom(8);
	const testTie = DataTier.ties.create(tn, {});
	const i = document.createElement('input');
	i.dataset.tie = `${tn}:someB => => customChange`;
	document.body.appendChild(i);

	await test.waitNextMicrotask();

	test.assertEqual(i.value, '');
	i.value = 'text';
	let e = new Event('customChange');
	i.dispatchEvent(e);

	test.assertEqual(testTie.someB, 'text');

	//  removal of element should untie
	document.body.removeChild(i);

	await test.waitNextMicrotask();

	i.value = 'changed text';
	e = new Event('customChange');
	i.dispatchEvent(e);

	test.assertEqual(testTie.someB, 'text');
});

suite.runTest({ name: 'binding custom event custom value property' }, async test => {
	const tn = test.getRandom(8);
	const testTie = DataTier.ties.create(tn, {});
	testTie.someC = 'new value';

	const d = document.createElement('div');
	testTie.someC = 'new value';
	d.customValue = '';
	d.dataset.tie = `${tn}:someC => customValue => customChange`;
	document.body.appendChild(d);

	await test.waitNextMicrotask();

	test.assertEqual(d.customValue, testTie.someC);
	d.customValue = 'text';
	d.dispatchEvent(new Event('customChange'));

	test.assertEqual('text', testTie.someC);
});

suite.runTest({ name: 'regular event/value multiple bindings' }, async test => {
	const tieName = test.getRandom(8);
	const t = DataTier.ties.create(tieName, { test: 'some', other: 'thing' });

	const i = document.createElement('input');
	i.dataset.tie = `${tieName}:test, ${tieName}:other => customProp`;
	document.body.appendChild(i);

	await test.waitNextMicrotask();
	test.assertEqual(i.value, t.test);
	test.assertEqual(i.customProp, t.other);

	i.value = 'text';
	i.dispatchEvent(new Event('change'));

	await test.waitNextMicrotask();
	test.assertEqual(t.test, i.value);
	test.assertEqual(t.other, 'thing');
});

suite.runTest({ name: 'custom event/value multiple bindings' }, async test => {
	const tieName = test.getRandom(8);
	const t = DataTier.ties.create(tieName, { test: 'some', other: 'thing' });

	const d = document.createElement('input');
	d.dataset.tie = `${tieName}:test => customValue => customChange, ${tieName}:other => customProp`;
	document.body.appendChild(d);

	await test.waitNextMicrotask();
	test.assertEqual(d.customValue, t.test);
	test.assertEqual(d.customProp, t.other);

	d.customValue = 'text';
	d.dispatchEvent(new Event('customChange'));

	await test.waitNextMicrotask();
	test.assertEqual(t.test, d.customValue);
	test.assertEqual(t.other, 'thing');
});

suite.runTest({ name: 'deeply nested model update - success' }, async test => {
	const tieName = test.getRandom(8);
	const testModel = DataTier.ties.create(tieName);

	const i = document.createElement('input');
	i.dataset.tie = tieName + ':one.two.three';
	document.body.appendChild(i);

	await test.waitNextMicrotask();

	i.value = 'new value';
	i.dispatchEvent(new Event('change'));

	await test.waitNextMicrotask();

	test.assertEqual('new value', testModel.one && testModel.one.two && testModel.one.two.three);
});

suite.runTest({ name: 'deeply nested model update - failure' }, async test => {
	const tieName = test.getRandom(8);
	const testModel = DataTier.ties.create(tieName, { one: { two: 4 } });

	const i = document.createElement('input');
	i.dataset.tie = tieName + ':one.two.three';
	document.body.appendChild(i);

	await test.waitNextMicrotask();

	i.value = 'new value';
	i.dispatchEvent(new Event('change'));

	await test.waitNextMicrotask();

	test.assertEqual(4, testModel.one.two);
});

suite.runTest({ name: 'removed view is untied' }, async test => {
	const tn = test.getRandom(8);
	const testModel = DataTier.ties.create(tn, { test: 'test' });

	const i = document.createElement('input');
	i.dataset.tie = `${tn}:test`;
	document.body.appendChild(i);

	await test.waitNextMicrotask();

	test.assertEqual(i.value, 'test');

	i.value = 'else';
	i.dispatchEvent(new Event('change'));

	await test.waitNextMicrotask();

	test.assertEqual(i.value, 'else');

	document.body.removeChild(i);

	await test.waitNextMicrotask();

	i.value = 'next';
	i.dispatchEvent(new Event('change'));

	await test.waitNextMicrotask();

	test.assertEqual(testModel.test, 'else');
});