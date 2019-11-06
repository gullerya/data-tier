import { createSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const suite = createSuite({ name: 'Testing AnyProperty Controller' }),
	model = {
		text: 'some text',
		date: new Date()
	};

DataTier.ties.create('testAnyPropA', model);

suite.runTest({ name: 'testing any-property controller: binding test A' }, async test => {
	const e = document.createElement('div');
	e.dataset.tie = 'testAnyPropA:text => textContent';
	document.body.appendChild(e);

	await test.waitNextMicrotask();

	if (e.textContent !== model.text) throw new Error('textContent of the element expected to be "' + model.text + '", found: ' + e.textContent);
});
