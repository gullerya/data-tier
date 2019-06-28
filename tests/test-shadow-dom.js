import * as DataTier from '../dist/data-tier.js';

let suite = Utils.JustTest.createSuite({name: 'Testing Shadowing in ShadowDom'}),
	addAsRoot = false;

customElements.define('shadowing-test', class extends HTMLElement {
	constructor() {
		super();
		let shadowRoot = this.attachShadow({mode: 'open'});
		shadowRoot.innerHTML = `
			<span id="test-a" data-tie="tieForShadowDom:data">default content</span>
		`;
		if (addAsRoot) DataTier.addRootDocument(shadowRoot);
	}

	disconnectedCallback() {
		DataTier.removeRootDocument(this.shadowRoot);
	}
});

suite.addTest({name: 'ShadowDom as such should not be influenced by the DataTier'}, (pass, fail) => {
	const tieName = 'tieForShadowDom';
	let tie = DataTier.ties.create(tieName, {data: 'data'});

	addAsRoot = false;
	let ce = document.createElement('shadowing-test');
	document.body.appendChild(ce);

	let c = ce.shadowRoot.getElementById('test-a').textContent;
	if (c !== 'default content') fail('expected textContent to be "default content" but found "' + c + '"');

	DataTier.ties.remove(tie);

	pass();
});

suite.addTest({name: 'ShadowDom added as root to DataTier'}, async (pass, fail) => {
	const tieName = 'tieForShadowDom';
	let tie = DataTier.ties.create(tieName, {data: 'data'});

	addAsRoot = true;
	let ce = document.createElement('shadowing-test');
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
