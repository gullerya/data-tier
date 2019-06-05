import * as DataTier from '../dist/data-tier.js';

let suite = Utils.JustTest.createSuite({name: 'Testing events'}),
	testTie = DataTier.ties.create('eventsTest', {});

suite.addTest({name: 'binding default event'}, (pass, fail) => {
	let i = document.createElement('input');
	i.dataset.tie = 'eventsTest:someA';
	document.body.appendChild(i);

	setTimeout(() => {
		if (i.value !== '') fail('expected to have empty value, found "' + i.value + '"');
		i.value = 'text';
		let event = new Event('change');
		i.dispatchEvent(event);

		if (testTie.model.someA !== 'text') fail('expected to have value "text" in tied model, found "' + testTie.model.someA + '"');

		pass();
	}, 0);
});

suite.addTest({name: 'binding custom event default value property'}, (pass, fail) => {
	let i = document.createElement('input');
	i[DataTier.CHANGE_EVENT_NAME_PROVIDER] = 'customChange';
	i.dataset.tie = 'eventsTest:someB';
	document.body.appendChild(i);

	setTimeout(() => {
		if (i.value !== '') fail('expected to have empty value, found "' + i.value + '"');
		i.value = 'text';
		let event = new Event('customChange');
		i.dispatchEvent(event);

		if (testTie.model.someB !== 'text') fail('expected to have value "text" in tied model, found "' + testTie.model.someB + '"');

		pass();
	}, 0);
});

suite.addTest({name: 'binding custom event custom value property'}, (pass, fail) => {
	let d = document.createElement('div');
	d[DataTier.CHANGE_EVENT_NAME_PROVIDER] = 'customChange';
	d[DataTier.DEFAULT_TIE_TARGET_PROVIDER] = 'customValue';
	d.customValue = '';
	d.dataset.tie = 'eventsTest:someC';
	document.body.appendChild(d);

	setTimeout(() => {
		if (d.customValue !== '') fail('expected to have empty customValue, found "' + d.customValue + '"');
		d.customValue = 'text';
		let event = new Event('customChange');
		d.dispatchEvent(event);

		if (testTie.model.someC !== 'text') fail('expected to have value "text" in tied model, found "' + testTie.model.someC + '"');

		pass();
	}, 0);
});

suite.run();