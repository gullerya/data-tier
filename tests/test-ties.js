import { createSuite } from '../node_modules/just-test/dist/just-test.min.js';
import { ties } from '../dist/data-tier.js';

const suite = createSuite({ name: 'Testing ties' });

suite.runTest({ name: 'adding a tie and then a view' }, async test => {
	const
		newEl = document.createElement('div'),
		text = 'text test A';

	ties.create('tiesTestA', { name: text });

	newEl.dataset.tie = 'tiesTestA:name => textContent';
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();

	if (newEl.textContent !== text) test.fail(new Error('expected the content to be "' + text + '", found: ' + newEl.textContent));
});

suite.runTest({ name: 'adding a view and then a tie' }, async test => {
	const
		newEl = document.createElement('div'),
		text = 'text test B';

	newEl.dataset.tie = 'tiesTestB:name => textContent';
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();

	ties.create('tiesTestB', { name: text });
	if (newEl.textContent !== text) test.fail(new Error('expected the content to be "' + text + '", found: ' + newEl.textContent));
});

suite.runTest({ name: 'creating a tie with an undefined data' }, async test => {
	const
		newEl = document.createElement('div'),
		o = { text: 'text test C' },
		t = ties.create('tiesTestC');
	newEl.dataset.tie = 'tiesTestC:text => textContent';
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();

	if (newEl.textContent) test.fail(new Error('preliminary expectation failed: expected the content to be empty'));
	t.model = o;
	if (newEl.textContent !== o.text) test.fail(new Error('expected the content to be "' + o.text + '"; found: ' + newEl.textContent));
});

suite.runTest({ name: 'creating a tie with a NULL data' }, async test => {
	const
		newEl = document.createElement('div'),
		o = { text: 'text test D' },
		t = ties.create('tiesTestD', null);
	newEl.dataset.tie = 'tiesTestD:text => textContent';
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();

	if (newEl.textContent) test.fail(new Error('preliminary expectation failed: expected the content to be empty'));
	t.model = o;
	if (newEl.textContent !== o.text) test.fail(new Error('expected the content to be "' + o.text + '"; found: ' + newEl.textContent));
});

suite.runTest({ name: 'setting a tie with a non Observable object' }, async test => {
	const
		newEl = document.createElement('div'),
		o = { text: 'text test E' },
		t = ties.create('tiesTestE', o);
	newEl.dataset.tie = 'tiesTestE:text => textContent';
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();

	if (newEl.textContent !== o.text) test.fail(new Error('expected the content to be "' + o.text + '"; found: ' + newEl.textContent));

	const newO = { text: 'text test E new' };
	t.model = newO;

	await test.waitNextMicrotask();

	if (newEl.textContent !== newO.text) test.fail(new Error('expected the content to be "text test E new"; found: ' + newEl.textContent));
});

suite.runTest({ name: 'setting a tie with a non object value - negative' }, test => {
	try {
		ties.create('tiesTestE', 5);
		test.fail('flow was not supposed to get to this point');
	} catch (e) {
	}
});

suite.runTest({ name: 'tie should be sealed - negative' }, test => {
	try {
		const tie = ties.create('tiesTestSealed', {});
		tie.someProp = 'text';
		test.fail('flow was not supposed to get to this point');
	} catch (e) {
	}
});