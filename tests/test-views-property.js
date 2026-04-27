import { test } from '@gullerya/just-test';
import { assert } from '@gullerya/just-test/assert';
import { waitNextTask } from '@gullerya/just-test/timing';
import { getRandom } from '@gullerya/just-test/random';
import * as DataTier from '../dist/data-tier.js';


const user = { name: 'some name', age: 7, address: { street: 'str', apt: 9 } };

test('adding root model to view - model first', async () => {
	const tieName = getRandom(8);
	DataTier.ties.create(tieName, { test: 'test' });

	const newEl = document.createElement('div');
	newEl.dataset.tie = tieName + ' => data';
	document.body.appendChild(newEl);

	await waitNextTask();

	assert.isTrue(newEl.data !== null && newEl.data !== undefined);
	assert.equal('test', newEl.data.test);
});

test('adding root model to view - view first', async () => {
	const tieName = getRandom(8);

	const newEl = document.createElement('div');
	newEl.dataset.tie = tieName + ' => data';
	document.body.appendChild(newEl);

	await waitNextTask();

	DataTier.ties.create(tieName, { test: 'test' });

	assert.isTrue(newEl.data !== null && newEl.data !== undefined);
	assert.equal('test', newEl.data.test);
});

test('update view when path changes (deep)', async () => {
	const tn = getRandom(8);
	DataTier.ties.create(tn, user);
	const s1 = document.createElement('div');

	s1.dataset.tie = `${tn}:name => textContent`;
	document.body.appendChild(s1);

	await waitNextTask();

	if (s1.textContent !== user.name) assert.fail(new Error('preliminary check failed'));
	s1.dataset.tie = `${tn}:address.street => textContent`;

	await waitNextTask();

	if (s1.textContent !== user.address.street) assert.fail(new Error('expected the content to be "' + user.address.street + '"; found: "' + s1.textContent + '"'));
});

test('adding new view (zero depth) with path defined', async () => {
	DataTier.ties.create('viewsB', user);

	const newEl = document.createElement('div');
	newEl.dataset.tie = 'viewsB:name';
	document.body.appendChild(newEl);

	await waitNextTask();

	if (newEl.textContent !== user.name) assert.fail(new Error('expected the content to be "' + user.name + '"'));
});

test('adding few views (with depth) with paths defined', async () => {
	DataTier.ties.create('viewsC', user);

	const newElA = document.createElement('div'), newElB = document.createElement('div');
	newElA.dataset.tie = 'viewsC:name => textContent';
	newElB.dataset.tie = 'viewsC:address.apt => textContent';
	document.body.appendChild(newElA);
	document.body.appendChild(newElB);

	await waitNextTask();

	if (newElA.textContent !== user.name) assert.fail(new Error('expected the content to be "' + user.name + '"'));
	if (newElB.textContent !== user.address.apt.toString()) assert.fail(new Error('expected the content to be "' + user.address.apt + '"'));
});

test('adding checkbox view and verifying its default value set correctly', async () => {
	const newEl = document.createElement('input');
	newEl.type = 'checkbox';
	newEl.dataset.tie = 'cbValueTest:test';
	document.body.appendChild(newEl);
	DataTier.ties.create('cbValueTest', { test: true });

	await waitNextTask();

	if (newEl.checked !== true) assert.fail(new Error('expected the value to be "true", but found "' + newEl.checked + '"'));
});

test('adding source and verifying its default value set correctly', async () => {
	const tieName = getRandom(8);
	const newEl = document.createElement('source');
	newEl.dataset.tie = tieName + ':test';
	document.body.appendChild(newEl);
	DataTier.ties.create(tieName, { test: 'some.non.existing.url' });

	await waitNextTask();

	assert.isTrue(newEl.src.endsWith('some.non.existing.url'));
});

test('adding anchor and verifying its default value set correctly', async () => {
	const tieName = getRandom(8);
	const newEl = document.createElement('a');
	newEl.dataset.tie = tieName + ':test';
	document.body.appendChild(newEl);
	DataTier.ties.create(tieName, { test: 'some.non.existing.url' });

	await waitNextTask();

	assert.isTrue(newEl.href.endsWith('some.non.existing.url'));
});

test('adding use and verifying its default value set correctly', async () => {
	const tieName = getRandom(8);
	const newEl = document.createElementNS('http://www.w3.org/2000/svg', 'use');
	newEl.dataset.tie = tieName + ':test';
	document.body.appendChild(newEl);
	DataTier.ties.create(tieName, { test: 'some.non.existing.url' });

	await waitNextTask();

	assert.equal('object', typeof newEl.href);
	assert.isTrue(newEl.href.baseVal.endsWith('some.non.existing.url'));
});

test('verify that falsish values (0, false, \'\') are visualized correctly', async () => {
	const newEl = document.createElement('div');
	DataTier.ties.create('falsishTest', { test: 0 });
	document.body.appendChild(newEl);
	newEl.dataset.tie = 'falsishTest:test => textContent';

	await waitNextTask();

	if (newEl.textContent !== '0') assert.fail(new Error('expected the value to be "0", but found "' + newEl.textContent + '"'));

	DataTier.ties.get('falsishTest').test = false;
	if (newEl.textContent !== 'false') assert.fail(new Error('expected the value to be "false", but found "' + newEl.textContent + '"'));

	DataTier.ties.get('falsishTest').test = '';
	if (newEl.textContent !== '') assert.fail(new Error('expected the value to be "", but found "' + newEl.textContent + '"'));

	DataTier.ties.get('falsishTest').test = null;
	if (newEl.textContent !== '') assert.fail(new Error('expected the value to be "", but found "' + newEl.textContent + '"'));
});

test('adding tie property after the element was added to the DOM', async () => {
	const newEl = document.createElement('div');
	DataTier.ties.create('postAdd', { test: 'text' });
	document.body.appendChild(newEl);
	newEl.dataset.tie = 'postAdd:test => textContent';

	await waitNextTask();

	if (newEl.textContent !== 'text') assert.fail(new Error('expected the value to be "text", but found ' + newEl.textContent));
});

test('mapping element to 2 different ties', async () => {
	const newEl = document.createElement('div');
	DataTier.ties.create('multiTiesA', { test: 'test' });
	DataTier.ties.create('multiTiesB', { else: 'else' });
	newEl.dataset.tie = 'multiTiesA:test => textContent, multiTiesB:else => testContent';
	document.body.appendChild(newEl);

	await waitNextTask();

	if (newEl.textContent !== 'test') assert.fail(new Error('expected the value to be "test", but found ' + newEl.textContent));
	if (newEl.testContent !== 'else') assert.fail(new Error('expected the value to be "else", but found ' + newEl.testContent));
});

test('adding nested DOM tree to see children are tied correctly', async () => {
	const
		parEl = document.createElement('div'),
		chilEl = document.createElement('div');
	DataTier.ties.create('nestedDomTree', { test: 'test' });

	chilEl.dataset.tie = 'nestedDomTree:test';
	parEl.appendChild(chilEl);
	document.body.appendChild(parEl);

	await waitNextTask();

	if (chilEl.textContent !== 'test') assert.fail(new Error('expected the text content to be "test", but found ' + chilEl.textContent));
});

test('adding view and immediatelly appending to it children', async () => {
	const
		parEl = document.createElement('div'),
		chilEl = document.createElement('div');
	let watchedProperty,
		chilElVisitedNumber = 0;
	DataTier.ties.create('nestedAppended', { test: 'test' });
	Object.defineProperty(chilEl, 'watchedProperty', {
		set: v => {
			watchedProperty = v;
			chilElVisitedNumber++;
		},
		get: () => watchedProperty
	});

	chilEl.dataset.tie = 'nestedAppended:test => watchedProperty';
	document.body.appendChild(parEl);
	parEl.appendChild(chilEl);

	await waitNextTask();

	if (chilEl.watchedProperty !== 'test') assert.fail(new Error('expected the watchedProperty to be "test", but found ' + chilEl.watchedProperty));
	if (chilElVisitedNumber > 1) assert.fail(new Error('element expected to be visited by DataTier only once, but found ' + chilElVisitedNumber));
});

test('multiparam (with occasional comma duplicate)', async () => {
	const d = document.createElement('div');
	document.body.appendChild(d);

	DataTier.ties.create('multiParamWithCommas', { test: 'test' });

	d.dataset.tie = 'multiParamWithCommas:test,, multiParamWithCommas:test => data';

	await waitNextTask();

	assert.equal(d.textContent, 'test');
	assert.equal(d.data, 'test');
});

test('tie property changes cycle', async () => {
	const
		tn = getRandom(8),
		d = document.createElement('div');
	DataTier.ties.create(tn, { some: 'test' });
	document.body.appendChild(d);

	//	set tie to NULL
	d.dataset.tie = null;

	await waitNextTask();

	//	set tie to empty
	d.dataset.tie = '';

	await waitNextTask();

	//	set tie to existing value
	d.dataset.tie = tn + ':some';

	await waitNextTask();

	//	set tie to the same value again (ensure in debugger that update is not running here)
	d.dataset.tie = tn + ':some';

	await waitNextTask();
});

test('2 properties of the same tie, update runs only once, create tie first', async () => {
	const
		tn = getRandom(8),
		dataA = [],
		dataB = [];
	DataTier.ties.create(tn, { dataA: 'dataA', dataB: 'dataB' });

	const v = document.createElement('div');
	Object.defineProperties(v, {
		dataA: {
			set(value) { dataA.push(value); },
			get() { return null; }
		},
		dataB: {
			set(value) { dataB.push(value); },
			get() { return null; }
		}
	});
	v.dataset.tie = `${tn}:dataA => dataA, ${tn}:dataB => dataB`;

	document.body.appendChild(v);
	await waitNextTask();

	assert.equal(1, dataA.length);
	assert.equal(1, dataB.length);
});

test('2 properties of the same tie, update runs only once, create view first', async () => {
	const
		tn = getRandom(8),
		dataA = [],
		dataB = [];

	const v = document.createElement('div');
	Object.defineProperties(v, {
		dataA: {
			set(value) { dataA.push(value); },
			get() { return null; }
		},
		dataB: {
			set(value) { dataB.push(value); },
			get() { return null; }
		}
	});
	v.dataset.tie = `${tn}:dataA => dataA, ${tn}:dataB => dataB`;

	document.body.appendChild(v);
	await waitNextTask();

	DataTier.ties.create(tn, { dataA: 'dataA', dataB: 'dataB' });
	assert.equal(1, dataA.length);
	assert.equal(1, dataB.length);
});

test('2 properties of the same tie, update runs only once, update tie', async () => {
	const
		tn = getRandom(8),
		dataA = [],
		dataB = [];

	const v = document.createElement('div');
	Object.defineProperties(v, {
		dataA: {
			set(value) { dataA.push(value); },
			get() { return null; }
		},
		dataB: {
			set(value) { dataB.push(value); },
			get() { return null; }
		}
	});
	v.dataset.tie = `${tn}:data.a => dataA, ${tn}:data.b => dataB`;

	document.body.appendChild(v);
	await waitNextTask();

	const model = DataTier.ties.create(tn, { data: { a: 'dataA', b: 'dataB' } });
	dataA.splice(0);
	dataB.splice(0);

	model.data.a = 'nextA';
	assert.equal(1, dataA.length);
	assert.equal(0, dataB.length);
	dataA.splice(0);
	dataB.splice(0);

	model.data = { a: 'lastA', b: 'lastB' };
	assert.equal(1, dataA.length);
	assert.equal(1, dataB.length);
});