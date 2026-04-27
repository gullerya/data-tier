import { test } from '@gullerya/just-test';
import { assert } from '@gullerya/just-test/assert';
import { waitNextTask } from '@gullerya/just-test/timing';
import { getRandom } from '@gullerya/just-test/random';
import * as DataTier from '../dist/data-tier.js';


let clickCounter = 0;

test('bind onclick logic', async () => {
	const tn = getRandom(8);
	const user = {
		name: 'click me',
		clickHandler: () => {
			clickCounter++;
			DataTier.ties.get(tn).name = 'click again';
			DataTier.ties.get(tn).clickHandler = () => clickCounter += 2;
		}
	};
	const d = document.createElement('div');
	DataTier.ties.create(tn, user);
	d.dataset.tie = `${tn}:clickHandler => onclick, ${tn}:name => textContent`;
	document.body.appendChild(d);

	await waitNextTask();

	d.click();
	if (d.textContent !== 'click again' || clickCounter !== 1) assert.fail('expected to register result of a first click');

	d.click();
	if (clickCounter !== 3) assert.fail('expected to register result of a second click');
});