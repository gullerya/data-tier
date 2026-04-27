import { test } from '@gullerya/just-test';
import { assert } from '@gullerya/just-test/assert';
import { waitNextTask } from '@gullerya/just-test/timing';
import { getRandom } from '@gullerya/just-test/random';
import * as DataTier from '../dist/data-tier.js';


test('adding object and immediatelly removing it', async () => {
	const
		tn = getRandom(8),
		m = DataTier.ties.create(tn, []);

	//	adding object 1, then adding tied scoped element
	m.push({ test: 'someA' });
	const e1 = document.createElement('div');
	e1.dataset.tie = `${tn}:0 => scope, scope:test`;
	document.body.appendChild(e1);

	//	adding object 2, then adding tied scoped element
	m.push({ test: 'someB' });
	const e2 = document.createElement('div');
	e2.dataset.tie = `${tn}:1 => scope, scope:test`;
	document.body.appendChild(e2);

	//	verify
	await waitNextTask();
	assert.equal('someA', e1.textContent);
	assert.equal('someB', e2.textContent);

	//	cloned content, so the elements selves should remain the same
	m.splice(0);
	e1.appendChild(e2);
	assert.equal('someAsomeB', e1.textContent);
	assert.equal('someB', e2.textContent);
});
