import { test } from '@gullerya/just-test';
import { assert } from '@gullerya/just-test/assert';
import { waitNextTask } from '@gullerya/just-test/timing';
import { getRandom } from '@gullerya/just-test/random';
import * as DataTier from '../dist/data-tier.js';


test('targeting to data- property should set attribute', async () => {
	const tieName = getRandom(8);
	DataTier.ties.create(tieName, { test: 'test' });

	const newEl = document.createElement('div');
	newEl.dataset.tie = `${tieName}:test a> data-test`;
	document.body.appendChild(newEl);

	await waitNextTask();

	assert.equal(newEl.getAttribute('data-test'), 'test');
	assert.equal(newEl.dataset.test, 'test');
});

test('tie as a root', async () => {
	const tieName = getRandom(8);
	DataTier.ties.create(tieName, 'value');

	const newEl = document.createElement('div');
	newEl.dataset.tie = `${tieName} a> attr-test`;
	document.body.appendChild(newEl);

	await waitNextTask();

	assert.equal(newEl.getAttribute('attr-test'), 'value');
});

test('two way binding e2e', async () => {
	const tieName = getRandom(8);
	const tie = DataTier.ties.create(tieName, { test: 'test' });

	const newEl = document.createElement('div');
	newEl.dataset.tie = `${tieName}:test a> test-attribute => change`;
	document.body.appendChild(newEl);

	await waitNextTask();

	assert.equal(newEl.getAttribute('test-attribute'), 'test');

	newEl.setAttribute('test-attribute', 'else');
	newEl.dispatchEvent(new Event('change'));

	assert.equal('else', tie.test);
});

test('tie boolean (true) correctly', async () => {
	const tieName = getRandom(8);
	DataTier.ties.create(tieName, { test: true });

	const newEl = document.createElement('div');
	newEl.dataset.tie = `${tieName}:test a> attr`;
	document.body.appendChild(newEl);

	await waitNextTask();

	assert.equal(newEl.getAttribute('attr'), 'true');
});

test('tie boolean (false) correctly', async () => {
	const tieName = getRandom(8);
	DataTier.ties.create(tieName, { test: false });

	const newEl = document.createElement('div');
	newEl.dataset.tie = `${tieName}:test a> attr`;
	document.body.appendChild(newEl);

	await waitNextTask();

	assert.equal(newEl.getAttribute('attr'), 'false');
});

test('tie number (0) correctly', async () => {
	const tieName = getRandom(8);
	DataTier.ties.create(tieName, { test: 0 });

	const newEl = document.createElement('div');
	newEl.dataset.tie = `${tieName}:test a> attr`;
	document.body.appendChild(newEl);

	await waitNextTask();

	assert.equal(newEl.getAttribute('attr'), '0');
});

test('tie number (123) correctly', async () => {
	const tieName = getRandom(8);
	DataTier.ties.create(tieName, { test: 123 });

	const newEl = document.createElement('div');
	newEl.dataset.tie = `${tieName}:test a> attr`;
	document.body.appendChild(newEl);

	await waitNextTask();

	assert.equal(newEl.getAttribute('attr'), '123');
});

test('tie string (empty) correctly', async () => {
	const tieName = getRandom(8);
	DataTier.ties.create(tieName, { test: '' });

	const newEl = document.createElement('div');
	newEl.dataset.tie = `${tieName}:test a> attr`;
	document.body.appendChild(newEl);

	await waitNextTask();

	assert.equal(newEl.getAttribute('attr'), '');
});

test('tie string ("some") correctly', async () => {
	const tieName = getRandom(8);
	DataTier.ties.create(tieName, { test: 'some' });

	const newEl = document.createElement('div');
	newEl.dataset.tie = `${tieName}:test a> attr`;
	document.body.appendChild(newEl);

	await waitNextTask();

	assert.equal(newEl.getAttribute('attr'), 'some');
});

test('tie undefined correctly', async () => {
	const tieName = getRandom(8);
	const tie = DataTier.ties.create(tieName, { test: 'some' });

	const newEl = document.createElement('div');
	newEl.dataset.tie = `${tieName}:test a> attr`;
	document.body.appendChild(newEl);

	await waitNextTask();
	assert.equal(newEl.getAttribute('attr'), 'some');

	tie.test = undefined;
	assert.isFalse(newEl.hasAttribute('attr'));
});

test('tie null correctly', async () => {
	const tieName = getRandom(8);
	const tie = DataTier.ties.create(tieName, { test: 'some' });

	const newEl = document.createElement('div');
	newEl.dataset.tie = `${tieName}:test a> attr`;
	document.body.appendChild(newEl);

	await waitNextTask();
	assert.equal(newEl.getAttribute('attr'), 'some');

	tie.test = null;
	assert.isFalse(newEl.hasAttribute('attr'));
});