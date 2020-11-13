import { getSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const suite = getSuite({ name: 'Testing complex DOM changes (scoped)' });

suite.runTest({ name: 'adding object and immediatelly removing it' }, async test => {
	const
		tn = test.getRandom(8),
		m = DataTier.ties.create(tn, []);

	//	adding object 1, then adding the tied element
	m.push({ test: 'someA' });
	const e1 = document.createElement('div');
	DataTier.ties.create(e1);
	e1.dataset.tie = `${tn}:0 => scope, scope:test`;
	document.body.appendChild(e1);

	//	adding object 2, then adding the tied element
	m.push({ test: 'someB' });
	const e2 = document.createElement('div');
	DataTier.ties.create(e2);
	e2.dataset.tie = `${tn}:1 => scope, scope:test`;
	document.body.appendChild(e2);

	//	removing object 2, and removing the tied element
	await test.waitNextMicrotask();
	test.assertEqual('someA', e1.textContent);
	test.assertEqual('someB', e2.textContent);

	//	cloned content, so the elements selves should remain the same
	m.splice(0);
	e1.appendChild(e2);
	test.assertEqual('someAsomeB', e1.textContent);
	test.assertEqual('someB', e2.textContent);
});
