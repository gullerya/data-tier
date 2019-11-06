import { createSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const
	suite = createSuite({ name: 'Testing views bound to attributes' });

suite.runTest({ name: 'add element with attr binding', skip: true }, async test => {
	DataTier.ties.create('attrsA', { some: 'thing' });
	const v = document.createElement('div');

	v.dataset.tie = 'attrsA:some => attr(textContent)';
	document.body.appendChild(v);

	await test.waitNextMicrotask();
});