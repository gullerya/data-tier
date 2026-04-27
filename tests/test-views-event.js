import { test } from '@gullerya/just-test';
import { assert } from '@gullerya/just-test/assert';
import { waitNextTask } from '@gullerya/just-test/timing';
import { getRandom } from '@gullerya/just-test/random';
import * as DataTier from '../dist/data-tier.js';


test('base e2e flow', async () => {
	let calls = 0;
	const tieName = getRandom(8);
	const tie = DataTier.ties.create(tieName, {
		listener: () => {
			calls++;
		}
	});

	const newEl = document.createElement('div');
	newEl.dataset.tie = `${tieName}:listener e> change`;
	document.body.appendChild(newEl);

	await waitNextTask();

	newEl.dispatchEvent(new CustomEvent('change'));
	assert.equal(1, calls);

	tie.listener = null;
	newEl.dispatchEvent(new CustomEvent('change'));
	assert.equal(1, calls);
});

test('tie as a root', async () => {
	let calls = 0;
	const tieName = getRandom(8);
	DataTier.ties.create(tieName, () => {
		calls++;
	});

	const newEl = document.createElement('div');
	newEl.dataset.tie = `${tieName} e> event`;
	document.body.appendChild(newEl);

	await waitNextTask();

	newEl.dispatchEvent(new CustomEvent('event'));
	assert.equal(1, calls);
});

test('tie not a function', async () => {
	const tieName = getRandom(8);
	DataTier.ties.create(tieName, { test: 'test' });

	const newEl = document.createElement('div');
	newEl.dataset.tie = `${tieName}:test e> event`;
	document.body.appendChild(newEl);

	await waitNextTask();

	newEl.dispatchEvent(new Event('event'));
});

test('re-tie should leave only one listener', async () => {
	let calls1 = 0, calls2 = 0;
	const listener1 = () => calls1++;
	const listener2 = () => calls2++;
	const tieName = getRandom(8);
	const tie = DataTier.ties.create(tieName, { listener: listener1 });

	const newEl = document.createElement('div');
	newEl.dataset.tie = `${tieName}:listener e> event`;
	document.body.appendChild(newEl);

	await waitNextTask();

	newEl.dispatchEvent(new Event('event'));
	assert.equal(1, calls1);
	assert.equal(0, calls2);

	tie.listener = listener2;

	newEl.dispatchEvent(new Event('event'));
	assert.equal(1, calls1);
	assert.equal(1, calls2);
});
