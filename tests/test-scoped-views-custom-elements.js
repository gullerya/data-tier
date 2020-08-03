import { getSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const suite = getSuite({ name: 'Testing scoped views (scoped)' });

suite.runTest({ name: 'custom elements - cascading' }, async test => {
	customElements.define('suite-view', class extends HTMLElement {
		constructor() {
			super();
			this.attachShadow({ mode: 'open' }).innerHTML = `
				<span data-tie="scope:total"></span>
				<test-view data-tie="scope:test => scope"></test-view>
			`;
		}
	});

	customElements.define('test-view', class extends HTMLElement {
		constructor() {
			super();
			this.attachShadow({ mode: 'open' }).innerHTML = `
				<span data-tie="scope:status"></span>
				<span data-tie="scope:result"></span>
			`;
		}
	});

	const tieKey = 'scopedCustomElements';
	DataTier.ties.create(tieKey, {
		total: 7,
		test: {
			status: 'running',
			result: 'none'
		}
	});

	const sv = document.createElement('suite-view');
	sv.dataset.tie = `${tieKey} => scope`;

	document.body.appendChild(sv);
	await test.waitNextMicrotask();

	console.log(sv);
});
