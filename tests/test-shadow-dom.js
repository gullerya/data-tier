import * as DataTier from '../dist/data-tier.js';

const
	suite = Utils.JustTest.createSuite({ name: 'Testing Shadowing in ShadowDom' });

customElements.define('open-shadow-test', class extends HTMLElement {
	constructor() {
		super();
		let shadowRoot = this.attachShadow({ mode: 'open' });
		shadowRoot.innerHTML = `
			<span id="test-a" data-tie="tieForShadowDom:data">default content</span>
		`;
	}
});

suite.addTest({ name: 'Open ShadowDom should be auto-tied (add element self)' }, async (pass, fail) => {
	const tieName = 'tieForShadowDom';
	let tie = DataTier.ties.create(tieName, { data: 'data' });

	let ce = document.createElement('open-shadow-test');
	document.body.appendChild(ce);

	await new Promise(resolve => setInterval(resolve, 0));

	let c = ce.shadowRoot.getElementById('test-a').textContent;
	if (c !== 'data') fail('expected textContent to be "data" but found "' + c + '"');

	DataTier.ties.remove(tie);

	pass();
});

suite.addTest({ name: 'Open ShadowDom should be auto-tied (add as child)' }, async (pass, fail) => {
	const tieName = 'tieForShadowDom';
	let tie = DataTier.ties.create(tieName, { data: 'data' });

	let parent = document.createElement('div');
	let ce = document.createElement('open-shadow-test');
	parent.appendChild(ce);
	document.body.appendChild(parent);

	await new Promise(resolve => setInterval(resolve, 0));

	let c = ce.shadowRoot.getElementById('test-a').textContent;
	if (c !== 'data') fail('expected textContent to be "data" but found "' + c + '"');

	DataTier.ties.remove(tie);

	pass();
});

suite.addTest({ name: 'ShadowDom added as root to DataTier' }, async (pass, fail) => {
	const tieName = 'tieForShadowDom';
	let tie = DataTier.ties.create(tieName, { data: 'data' });

	let ce = document.createElement('open-shadow-test');
	document.body.appendChild(ce);

	let e = ce.shadowRoot.getElementById('test-a'),
		c = e.textContent;
	if (c !== 'data') fail('expected textContent to be "data" but found "' + c + '"');

	tie.model.data = 'change';
	c = e.textContent;
	if (c !== 'change') fail('expected textContent to be "change" but found "' + c + '"');

	//  removing the custom element should cleanup things
	document.body.removeChild(ce);
	await new Promise(resolve => setTimeout(resolve, 0));
	tie.model.data = 'one more time';
	c = e.textContent;
	if (c !== 'change') fail('expected textContent to be "change" but found "' + c + '"');

	DataTier.ties.remove(tie);

	pass();
});

suite.run();
