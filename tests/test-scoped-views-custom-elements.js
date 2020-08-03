import { getSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const suite = getSuite({ name: 'Testing scoped views (scoped)' });

suite.runTest({ name: 'custom elements - cascading' }, async test => {
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

	const tieKey = 'scopedCustomElements';
	const model = DataTier.ties.create(tieKey, {
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
	await test.waitNextMicrotask();
	test.assertEqual('7', sv.shadowRoot.firstElementChild.textContent);
	test.assertEqual('running', sv.shadowRoot.lastElementChild.shadowRoot.firstElementChild.textContent);
	test.assertEqual('none', sv.shadowRoot.lastElementChild.shadowRoot.lastElementChild.textContent);

	//	check B - changes are propagated 1
	model.total = 1;
	model.test.status = 'finished';
	model.test.result = 'success';
	await test.waitNextMicrotask();
	test.assertEqual('1', sv.shadowRoot.firstElementChild.textContent);
	test.assertEqual('finished', sv.shadowRoot.lastElementChild.shadowRoot.firstElementChild.textContent);
	test.assertEqual('success', sv.shadowRoot.lastElementChild.shadowRoot.lastElementChild.textContent);

	//	check C - changes are propagated 2
	model.total = 2;
	model.test.status = 'pending';
	model.test.result = 'nothing';
	await test.waitNextMicrotask();
	test.assertEqual('2', sv.shadowRoot.firstElementChild.textContent);
	test.assertEqual('pending', sv.shadowRoot.lastElementChild.shadowRoot.firstElementChild.textContent);
	test.assertEqual('nothing', sv.shadowRoot.lastElementChild.shadowRoot.lastElementChild.textContent);

	//	check D - change to the nested object as a whole
	model.total = 3;
	model.test = {
		status: 'done',
		result: 'normal'
	}
	await test.waitNextMicrotask();
	test.assertEqual('3', sv.shadowRoot.firstElementChild.textContent);
	test.assertEqual('done', sv.shadowRoot.lastElementChild.shadowRoot.firstElementChild.textContent);
	test.assertEqual('normal', sv.shadowRoot.lastElementChild.shadowRoot.lastElementChild.textContent);

	//	check E - nested one - change again the inner properties
	model.total = 4;
	model.test.status = 'one_more';
	model.test.result = 'unfailable';
	await test.waitNextMicrotask();
	test.assertEqual('4', sv.shadowRoot.firstElementChild.textContent);
	test.assertEqual('one_more', sv.shadowRoot.lastElementChild.shadowRoot.firstElementChild.textContent);
	test.assertEqual('unfailable', sv.shadowRoot.lastElementChild.shadowRoot.lastElementChild.textContent);
});
