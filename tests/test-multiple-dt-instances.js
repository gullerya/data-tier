import { getSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTierA from '../src/data-tier.js?inst=a';
import * as DataTierB from '../src/data-tier.js?inst=b';

const suite = getSuite({ name: 'Testing multiple DataTier instances' });

suite.runTest({ name: 'tying multi tie multi instance - model first' }, async test => {
	const
		tnA = test.getRandom(8),
		tnB = test.getRandom(8),
		mA = DataTierA.ties.create(tnA, { text: 'textA' }),
		mB = DataTierB.ties.create(tnB, { text: 'textB' });

	const v = document.createElement('div');
	v.dataset.tie = `${tnA}:text => valueA, ${tnB}:text => valueB`;
	document.body.appendChild(v);

	await test.waitNextMicrotask();
	test.assertEqual(mA.text, v.valueA);
	test.assertEqual(mB.text, v.valueB);
});

suite.runTest({ name: 'tying multi tie multi instance - views first' }, async test => {
	const
		tnA = test.getRandom(8),
		tnB = test.getRandom(8);

	const v = document.createElement('div');
	v.dataset.tie = `${tnA}:text => valueA, ${tnB}:text => valueB`;
	document.body.appendChild(v);

	await test.waitNextMicrotask();

	const
		mA = DataTierA.ties.create(tnA, { text: 'textA' }),
		mB = DataTierB.ties.create(tnB, { text: 'textB' });

	test.assertEqual(mA.text, v.valueA);
	test.assertEqual(mB.text, v.valueB);
});
