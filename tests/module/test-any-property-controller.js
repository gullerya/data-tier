import * as DataTier from '../../dist/module/data-tier.js';

let suite = Utils.JustTest.createSuite({name: 'Testing AnyProperty Controller'}),
	model = {
		text: 'some text',
		date: new Date()
	};

DataTier.ties.create('testAnyPropA', model);

suite.addTest({name: 'testing any-property controller: binding test A'}, (pass, fail) => {
	let e = document.createElement('div');
	e.dataset.tie = 'testAnyPropA:text > textContent';
	document.body.appendChild(e);
	setTimeout(function() {
		if (e.textContent !== model.text) fail('textContent of the element expected to be "' + model.text + '", found: ' + e.textContent);
		pass();
	}, 0)
});

suite.run();
