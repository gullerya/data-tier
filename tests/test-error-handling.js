import { createSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const suite = createSuite({ name: 'Testing erroneous cases' });

suite.addTest({ name: 'adding view with empty tie definition' }, test => {
	const elem = document.createElement('div');

	elem.dataset.tie = '';

	document.body.appendChild(elem);
	test.pass();
});

suite.addTest({ name: 'accessing in other place the observable that was replaced' }, async test => {
	const
		inner = {},
		raw = { o: inner },
		data = DataTier.ties.create('errorA', raw),
		elem = document.createElement('div');

	data.model.observe(changes =>
		changes.forEach(change =>
			console.dir(change)));
	elem.dataset.tie = 'errorA => textContent';

	document.body.appendChild(elem);

	await new Promise(resolve => setTimeout(resolve, 0));

	data.model.o = inner;

	document.body.removeChild(elem);

	await new Promise(resolve => setTimeout(resolve, 0));

	document.body.appendChild(elem);

	test.pass();
});

suite.run();
