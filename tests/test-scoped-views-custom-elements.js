import { test } from '@gullerya/just-test';
import { assert } from '@gullerya/just-test/assert';
import { waitNextTask } from '@gullerya/just-test/timing';
import { getRandom } from '@gullerya/just-test/random';
import * as DataTier from '../dist/data-tier.js';


customElements.define('ce-suite-view', class extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' }).innerHTML = `
			<span data-tie="scope:total"></span>
			<ce-test-view data-tie="scope:test => scope"></ce-test-view>
		`;
	}
});

customElements.define('ce-test-view', class extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' }).innerHTML = `
			<span data-tie="scope:status"></span>
			<span data-tie="scope:result"></span>
		`;
	}
});

test('custom elements - cascading', async () => {
	const tieKey = getRandom(8);
	DataTier.ties.create(tieKey);
	const model = DataTier.ties.update(tieKey, {
		total: 7,
		test: {
			status: 'running',
			result: 'none'
		}
	});

	const sv = document.createElement('ce-suite-view');
	sv.dataset.tie = `${tieKey} => scope`;
	document.body.appendChild(sv);

	//	check A - injected and updated deep
	await waitNextTask();
	assert.equal('7', sv.shadowRoot.firstElementChild.textContent);
	assert.equal('running', sv.shadowRoot.lastElementChild.shadowRoot.firstElementChild.textContent);
	assert.equal('none', sv.shadowRoot.lastElementChild.shadowRoot.lastElementChild.textContent);

	//	check B - changes are propagated 1
	model.total = 1;
	model.test.status = 'finished';
	model.test.result = 'success';
	await waitNextTask();
	assert.equal('1', sv.shadowRoot.firstElementChild.textContent);
	assert.equal('finished', sv.shadowRoot.lastElementChild.shadowRoot.firstElementChild.textContent);
	assert.equal('success', sv.shadowRoot.lastElementChild.shadowRoot.lastElementChild.textContent);

	//	check C - changes are propagated 2
	model.total = 2;
	model.test.status = 'pending';
	model.test.result = 'nothing';
	await waitNextTask();
	assert.equal('2', sv.shadowRoot.firstElementChild.textContent);
	assert.equal('pending', sv.shadowRoot.lastElementChild.shadowRoot.firstElementChild.textContent);
	assert.equal('nothing', sv.shadowRoot.lastElementChild.shadowRoot.lastElementChild.textContent);

	//	check D - change to the nested object as a whole
	model.total = 3;
	model.test = {
		status: 'done',
		result: 'normal'
	};
	await waitNextTask();
	assert.equal('3', sv.shadowRoot.firstElementChild.textContent);
	assert.equal('done', sv.shadowRoot.lastElementChild.shadowRoot.firstElementChild.textContent);
	assert.equal('normal', sv.shadowRoot.lastElementChild.shadowRoot.lastElementChild.textContent);

	//	check E - nested one - change again the inner properties
	model.total = 4;
	model.test.status = 'one_more';
	model.test.result = 'unfailable';
	await waitNextTask();
	assert.equal('4', sv.shadowRoot.firstElementChild.textContent);
	assert.equal('one_more', sv.shadowRoot.lastElementChild.shadowRoot.firstElementChild.textContent);
	assert.equal('unfailable', sv.shadowRoot.lastElementChild.shadowRoot.lastElementChild.textContent);
});
