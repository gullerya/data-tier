import { createSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const suite = createSuite({ name: 'Testing AnyProperty Controller' }),
	model = {
		text: 'some text',
		date: new Date()
	};

DataTier.ties.create('testAnyPropA', model);

suite.addTest({ name: 'testing any-property controller: binding test A' }, test => {
	const e = document.createElement('div');
	e.dataset.tie = 'testAnyPropA:text => textContent';
	document.body.appendChild(e);
	setTimeout(function () {
		if (e.textContent !== model.text) test.fail('textContent of the element expected to be "' + model.text + '", found: ' + e.textContent);
		test.pass();
	}, 0)
});

suite.run();
