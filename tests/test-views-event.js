import { getSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const suite = getSuite({ name: 'Testing views changes - event tying' });

suite.runTest({ name: 'base e2e flow' }, async test => {
	let calls = 0;
	const tieName = test.getRandom(8);
	const tie = DataTier.ties.create(tieName, {
		listener: () => {
			calls++;
		}
	});

	const newEl = document.createElement('div');
	newEl.dataset.tie = `${tieName}:listener e> change`;
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();

	newEl.dispatchEvent(new CustomEvent('change'));
	test.assertEqual(1, calls);

	tie.listener = null;
	newEl.dispatchEvent(new CustomEvent('change'));
	test.assertEqual(1, calls);
});

suite.runTest({ name: 'tie as a root' }, async test => {
	let calls = 0;
	const tieName = test.getRandom(8);
	DataTier.ties.create(tieName, () => {
		calls++;
	});

	const newEl = document.createElement('div');
	newEl.dataset.tie = `${tieName} e> event`;
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();

	newEl.dispatchEvent(new CustomEvent('event'));
	test.assertEqual(1, calls);
});

suite.runTest({ name: 'tie not a function' }, async test => {
	const tieName = test.getRandom(8);
	DataTier.ties.create(tieName, { test: 'test' });

	const newEl = document.createElement('div');
	newEl.dataset.tie = `${tieName}:test e> event`;
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();

	newEl.dispatchEvent(new Event('event'));
});

suite.runTest({ name: 're-tie should leave only one listener' }, async test => {
	let calls1 = 0, calls2 = 0;
	const listener1 = () => calls1++;
	const listener2 = () => calls2++;
	const tieName = test.getRandom(8);
	const tie = DataTier.ties.create(tieName, { listener: listener1 });

	const newEl = document.createElement('div');
	newEl.dataset.tie = `${tieName}:listener e> event`;
	document.body.appendChild(newEl);

	await test.waitNextMicrotask();

	newEl.dispatchEvent(new Event('event'));
	test.assertEqual(1, calls1);
	test.assertEqual(0, calls2);

	tie.listener = listener2;

	newEl.dispatchEvent(new Event('event'));
	test.assertEqual(1, calls1);
	test.assertEqual(1, calls2);
});
