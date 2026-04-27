import { test } from '@gullerya/just-test';
import { waitNextTask } from '@gullerya/just-test/timing';
import { getRandom } from '@gullerya/just-test/random';
import * as DataTier from '../dist/data-tier.js';


test('adding view with empty tie definition', () => {
	const elem = document.createElement('div');

	elem.dataset.tie = '';

	document.body.appendChild(elem);
});

test('accessing in other place the observable that was replaced', async () => {
	const
		inner = {},
		raw = { o: inner },
		tn = getRandom(8),
		data = DataTier.ties.create(tn, raw),
		elem = document.createElement('div');

	DataTier.Observable.observe(data, changes =>
		changes.forEach(change =>
			console.dir(change)));
	elem.dataset.tie = `${tn} => textContent`;

	document.body.appendChild(elem);

	await waitNextTask();

	data.o = inner;

	document.body.removeChild(elem);

	await waitNextTask();

	document.body.appendChild(elem);
});