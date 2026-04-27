import { test } from '@gullerya/just-test';
import { assert } from '@gullerya/just-test/assert';
import { waitNextTask } from '@gullerya/just-test/timing';
import { getRandom } from '@gullerya/just-test/random';
import * as DataTierA from '../dist/data-tier.js?inst=a';
import * as DataTierB from '../dist/data-tier.js?inst=b';


test('tying multi tie multi instance - model first', async () => {
	const
		tnA = getRandom(8),
		tnB = getRandom(8),
		mA = DataTierA.ties.create(tnA, { text: 'textA' }),
		mB = DataTierB.ties.create(tnB, { text: 'textB' });

	const v = document.createElement('div');
	v.dataset.tie = `${tnA}:text => valueA, ${tnB}:text => valueB`;
	document.body.appendChild(v);

	await waitNextTask();
	assert.equal(mA.text, v.valueA);
	assert.equal(mB.text, v.valueB);
});

test('tying multi tie multi instance - views first', async () => {
	const
		tnA = getRandom(8),
		tnB = getRandom(8);

	const v = document.createElement('div');
	v.dataset.tie = `${tnA}:text => valueA, ${tnB}:text => valueB`;
	document.body.appendChild(v);

	await waitNextTask();

	const
		mA = DataTierA.ties.create(tnA, { text: 'textA' }),
		mB = DataTierB.ties.create(tnB, { text: 'textB' });

	assert.equal(mA.text, v.valueA);
	assert.equal(mB.text, v.valueB);
});