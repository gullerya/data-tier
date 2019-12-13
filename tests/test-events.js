import { createSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const
	suite = createSuite({ name: 'Testing events' }),
	testTie = DataTier.ties.create('eventsTest', {});

suite.runTest({ name: 'binding/unbinding default event' }, async test => {
	const i = document.createElement('input');
	let event;
	i.dataset.tie = 'eventsTest:someA';
	document.body.appendChild(i);

	await test.waitNextMicrotask();

	test.assertEqual(i.value, '');
	i.value = 'text';
	event = new Event('change');
	i.dispatchEvent(event);

	test.assertEqual(testTie.someA, 'text');

	//  removal of element should untie
	document.body.removeChild(i);

	await test.waitNextMicrotask();

	i.value = 'changed text';
	event = new Event('change');
	i.dispatchEvent(event);

	test.assertEqual(testTie.someA, 'text');
});

suite.runTest({ name: 'binding/unbinding default event (checkbox)' }, async test => {
	const i = document.createElement('input');
	let event;
	i.type = 'checkbox';
	i.dataset.tie = 'eventsTest:bool';
	document.body.appendChild(i);

	await test.waitNextMicrotask();

	test.assertEqual(i.value, 'on');
	i.checked = true;
	event = new Event('change');
	i.dispatchEvent(event);

	test.assertTrue(testTie.bool);

	//  removal of element should untie
	document.body.removeChild(i);

	await test.waitNextMicrotask();

	i.checked = false;
	event = new Event('change');
	i.dispatchEvent(event);

	test.assertTrue(testTie.bool);
});

suite.runTest({ name: 'binding/unbinding custom event default value property' }, async test => {
	const i = document.createElement('input');
	i[DataTier.CHANGE_EVENT_NAME_PROVIDER] = 'customChange';
	i.dataset.tie = 'eventsTest:someB';
	document.body.appendChild(i);

	await test.waitNextMicrotask();

	test.assertEqual(i.value, '');
	i.value = 'text';
	let event = new Event('customChange');
	i.dispatchEvent(event);

	test.assertEqual(testTie.someB, 'text');

	//  removal of element should untie
	document.body.removeChild(i);

	await test.waitNextMicrotask();

	i.value = 'changed text';
	event = new Event('customChange');
	i.dispatchEvent(event);

	test.assertEqual(testTie.someB, 'text');
});

suite.runTest({ name: 'binding custom event custom value property' }, async test => {
	testTie.someC = 'new value';

	const d = document.createElement('div');
	testTie.someC = 'new value';
	d[DataTier.CHANGE_EVENT_NAME_PROVIDER] = 'customChange';
	d[DataTier.DEFAULT_TIE_TARGET_PROVIDER] = 'customValue';
	d.customValue = '';
	d.dataset.tie = 'eventsTest:someC';
	document.body.appendChild(d);

	await test.waitNextMicrotask();

	test.assertEqual(d.customValue, testTie.someC);
	d.customValue = 'text';
	d.dispatchEvent(new Event('customChange'));

	test.assertEqual(testTie.someC, 'text');
});

suite.runTest({ name: 'regular event/value multiple bindings' }, async test => {
	const testTie = DataTier.ties.create('eventsA', { test: 'some', other: 'thing' });

	const i = document.createElement('input');
	i.dataset.tie = 'eventsA:test, eventsA:other => customProp';
	document.body.appendChild(i);

	await test.waitNextMicrotask();
	test.assertEqual(i.value, testTie.test);
	test.assertEqual(i.customProp, testTie.other);

	i.value = 'text';
	i.dispatchEvent(new Event('change'));

	await test.waitNextMicrotask();
	test.assertEqual(testTie.test, i.value);
	test.assertEqual(testTie.other, 'thing');
});

suite.runTest({ name: 'custom event/value multiple bindings' }, async test => {
	const testTie = DataTier.ties.create('eventsB', { test: 'some', other: 'thing' });

	const d = document.createElement('input');
	d[DataTier.CHANGE_EVENT_NAME_PROVIDER] = 'customChange';
	d[DataTier.DEFAULT_TIE_TARGET_PROVIDER] = 'customValue';
	d.dataset.tie = 'eventsB:test, eventsB:other => customProp';
	document.body.appendChild(d);

	await test.waitNextMicrotask();
	test.assertEqual(d.customValue, testTie.test);
	test.assertEqual(d.customProp, testTie.other);

	d.customValue = 'text';
	d.dispatchEvent(new Event('customChange'));

	await test.waitNextMicrotask();
	test.assertEqual(testTie.test, d.customValue);
	test.assertEqual(testTie.other, 'thing');
});

suite.runTest({ name: 'deeply nested model update' }, async test => {
	const testModel = DataTier.ties.create('deepNestModelUpdate', {});

	const i = document.createElement('input');
	i.dataset.tie = 'deepNestModelUpdate:one.two.three';
	document.body.appendChild(i);

	await test.waitNextMicrotask();

	i.value = 'new value';
	i.dispatchEvent(new Event('change'));

	await test.waitNextMicrotask();

	test.assertEqual(testModel.one && testModel.one.two && testModel.one.two.three, 'new value');
});

suite.runTest({ name: 'removed view is untied' }, async test => {
	const testModel = DataTier.ties.create('untieRemoved', { test: 'test' });

	const i = document.createElement('input');
	i.dataset.tie = 'untieRemoved:test';
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