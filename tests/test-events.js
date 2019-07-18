import { createSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';
import { Observable } from '../dist/object-observer.js';

const
	suite = createSuite({ name: 'Testing events' }),
	testTie = DataTier.ties.create('eventsTest', Observable.from({}));

function waitNextMicrotask() {
	return new Promise(resolve => {
		resolve();
	});
}

suite.addTest({ name: 'binding/unbinding default event' }, async test => {
	const i = document.createElement('input');
	let event;
	i.dataset.tie = 'eventsTest:someA';
	document.body.appendChild(i);

	await waitNextMicrotask();

	if (i.value !== '') test.fail('expected to have empty value, found "' + i.value + '"');
	i.value = 'text';
	event = new Event('change');
	i.dispatchEvent(event);

	if (testTie.model.someA !== 'text') test.fail('expected to have value "text" in tied model, found "' + testTie.model.someA + '"');

	//  removal of element should untie
	document.body.removeChild(i);

	await waitNextMicrotask();

	i.value = 'changed text';
	event = new Event('change');
	i.dispatchEvent(event);

	if (testTie.model.someA !== 'text') test.fail('expected the value to stay "text" in tied model, found "' + testTie.model.someA + '"');

	test.pass();
});

suite.addTest({ name: 'binding/unbinding default event (checkbox)' }, async test => {
	const i = document.createElement('input');
	let event;
	i.type = 'checkbox';
	i.dataset.tie = 'eventsTest:bool';
	document.body.appendChild(i);

	await waitNextMicrotask();

	if (i.value !== 'on') test.fail('expected to have value "on" (checkbox special), found "' + i.value + '"');
	i.checked = true;
	event = new Event('change');
	i.dispatchEvent(event);

	if (testTie.model.bool !== true) test.fail('expected to have value "true" in tied model, found "' + testTie.model.bool + '"');

	//  removal of element should untie
	document.body.removeChild(i);

	await waitNextMicrotask();

	i.checked = false;
	event = new Event('change');
	i.dispatchEvent(event);

	if (testTie.model.bool !== true) test.fail('expected the value to stay "true" in tied model, found "' + testTie.model.bool + '"');

	test.pass();
});

suite.addTest({ name: 'binding/unbinding custom event default value property' }, async test => {
	const i = document.createElement('input');
	i[DataTier.CHANGE_EVENT_NAME_PROVIDER] = 'customChange';
	i.dataset.tie = 'eventsTest:someB';
	document.body.appendChild(i);

	await waitNextMicrotask();

	if (i.value !== '') test.fail('expected to have empty value, found "' + i.value + '"');
	i.value = 'text';
	let event = new Event('customChange');
	i.dispatchEvent(event);

	if (testTie.model.someB !== 'text') test.fail('expected to have value "text" in tied model, found "' + testTie.model.someB + '"');

	//  removal of element should untie
	document.body.removeChild(i);

	await waitNextMicrotask();

	i.value = 'changed text';
	event = new Event('customChange');
	i.dispatchEvent(event);

	if (testTie.model.someB !== 'text') test.fail('expected the value to stay "text" in tied model, found "' + testTie.model.someB + '"');

	test.pass();
});

suite.addTest({ name: 'binding custom event custom value property' }, async test => {
	testTie.model.someC = 'new value';

	const d = document.createElement('div');
	testTie.model.someC = 'new value';
	d[DataTier.CHANGE_EVENT_NAME_PROVIDER] = 'customChange';
	d[DataTier.DEFAULT_TIE_TARGET_PROVIDER] = 'customValue';
	d.customValue = '';
	d.dataset.tie = 'eventsTest:someC';
	document.body.appendChild(d);

	await waitNextMicrotask();

	if (d.customValue !== testTie.model.someC) test.fail('expected to have "' + testTie.model.someC + '", found "' + d.customValue + '"');
	d.customValue = 'text';
	d.dispatchEvent(new Event('customChange'));

	if (testTie.model.someC !== 'text') test.fail('expected to have value "text" in tied model, found "' + testTie.model.someC + '"');

	test.pass();
});

suite.addTest({ name: 'regular event/value multiple bindings' }, async test => {
	const testTie = DataTier.ties.create('eventsA', { test: 'some', other: 'thing' });

	const i = document.createElement('input');
	i.dataset.tie = 'eventsA:test, eventsA:other => customProp';
	document.body.appendChild(i);

	await waitNextMicrotask();
	test.assertEqual(i.value, testTie.model.test);
	test.assertEqual(i.customProp, testTie.model.other);

	i.value = 'text';
	i.dispatchEvent(new Event('change'));

	await waitNextMicrotask();
	test.assertEqual(testTie.model.test, i.value);
	test.assertEqual(testTie.model.other, 'thing');

	test.pass();
});

suite.addTest({ name: 'custom event/value multiple bindings' }, async test => {
	const testTie = DataTier.ties.create('eventsB', { test: 'some', other: 'thing' });

	const d = document.createElement('input');
	d[DataTier.CHANGE_EVENT_NAME_PROVIDER] = 'customChange';
	d[DataTier.DEFAULT_TIE_TARGET_PROVIDER] = 'customValue';
	d.dataset.tie = 'eventsB:test, eventsB:other => customProp';
	document.body.appendChild(d);

	await waitNextMicrotask();
	test.assertEqual(d.customValue, testTie.model.test);
	test.assertEqual(d.customProp, testTie.model.other);

	d.customValue = 'text';
	d.dispatchEvent(new Event('customChange'));

	await waitNextMicrotask();
	test.assertEqual(testTie.model.test, d.customValue);
	test.assertEqual(testTie.model.other, 'thing');

	test.pass();
});

suite.run();