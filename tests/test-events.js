import * as DataTier from '../dist/data-tier.js';
import { Observable } from '../dist/object-observer.js';

let suite = Utils.JustTest.createSuite({ name: 'Testing events' }),
	testTie = DataTier.ties.create('eventsTest', Observable.from({}));

function waitNextMicrotask() {
	return new Promise(resolve => {
		resolve();
	});
}

suite.addTest({ name: 'binding/unbinding default event' }, async (pass, fail) => {
	let i = document.createElement('input'), event;
	i.dataset.tie = 'eventsTest:someA';
	document.body.appendChild(i);

	await waitNextMicrotask();

	if (i.value !== '') fail('expected to have empty value, found "' + i.value + '"');
	i.value = 'text';
	event = new Event('change');
	i.dispatchEvent(event);

	if (testTie.model.someA !== 'text') fail('expected to have value "text" in tied model, found "' + testTie.model.someA + '"');

	//  removal of element should untie
	document.body.removeChild(i);

	await waitNextMicrotask();

	i.value = 'changed text';
	event = new Event('change');
	i.dispatchEvent(event);

	if (testTie.model.someA !== 'text') fail('expected the value to stay "text" in tied model, found "' + testTie.model.someA + '"');

	pass();
});

suite.addTest({ name: 'binding/unbinding default event (checkbox)' }, async (pass, fail) => {
	let i = document.createElement('input'), event;
	i.type = 'checkbox';
	i.dataset.tie = 'eventsTest:bool';
	document.body.appendChild(i);

	await waitNextMicrotask();

	if (i.value !== 'on') fail('expected to have value "on" (checkbox special), found "' + i.value + '"');
	i.checked = true;
	event = new Event('change');
	i.dispatchEvent(event);

	if (testTie.model.bool !== true) fail('expected to have value "true" in tied model, found "' + testTie.model.bool + '"');

	//  removal of element should untie
	document.body.removeChild(i);

	await waitNextMicrotask();

	i.checked = false;
	event = new Event('change');
	i.dispatchEvent(event);

	if (testTie.model.bool !== true) fail('expected the value to stay "true" in tied model, found "' + testTie.model.bool + '"');

	pass();
});

suite.addTest({ name: 'binding/unbinding custom event default value property' }, async (pass, fail) => {
	let i = document.createElement('input');
	i[DataTier.CHANGE_EVENT_NAME_PROVIDER] = 'customChange';
	i.dataset.tie = 'eventsTest:someB';
	document.body.appendChild(i);

	await waitNextMicrotask();

	if (i.value !== '') fail('expected to have empty value, found "' + i.value + '"');
	i.value = 'text';
	let event = new Event('customChange');
	i.dispatchEvent(event);

	if (testTie.model.someB !== 'text') fail('expected to have value "text" in tied model, found "' + testTie.model.someB + '"');

	//  removal of element should untie
	document.body.removeChild(i);

	await waitNextMicrotask();

	i.value = 'changed text';
	event = new Event('customChange');
	i.dispatchEvent(event);

	if (testTie.model.someB !== 'text') fail('expected the value to stay "text" in tied model, found "' + testTie.model.someB + '"');

	pass();
});

suite.addTest({ name: 'binding custom event custom value property' }, async (pass, fail) => {
	testTie.model.someC = 'new value';

	let d = document.createElement('div');
	testTie.model.someC = 'new value';
	d[DataTier.CHANGE_EVENT_NAME_PROVIDER] = 'customChange';
	d[DataTier.DEFAULT_TIE_TARGET_PROVIDER] = 'customValue';
	d.customValue = '';
	d.dataset.tie = 'eventsTest:someC';
	document.body.appendChild(d);

	await waitNextMicrotask();

	if (d.customValue !== testTie.model.someC) fail('expected to have "' + testTie.model.someC + '", found "' + d.customValue + '"');
	d.customValue = 'text';
	d.dispatchEvent(new Event('customChange'));

	if (testTie.model.someC !== 'text') fail('expected to have value "text" in tied model, found "' + testTie.model.someC + '"');

	pass();
});

suite.run();