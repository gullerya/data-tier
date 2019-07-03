import * as DataTier from '../dist/data-tier.js';

const
	suite = Utils.JustTest.createSuite({ name: 'Testing Shadowing in ShadowDom' });

customElements.define('open-shadow-test', class extends HTMLElement {
	constructor() {
		super();
		let shadowRoot = this.attachShadow({ mode: 'open' });
		shadowRoot.innerHTML = `
			<span data-tie="tieForShadowDom:data">default content</span>
		`;
	}

	set customContent(c) {
		this.shadowRoot.firstElementChild.textContent = c;
	}
});

customElements.define('closed-shadow-test', class extends HTMLElement {
	constructor() {
		super();
		this._shadowRoot = this.attachShadow({ mode: 'closed' });
		this._shadowRoot.innerHTML = `
			<span data-tie="tieForShadowDom:data">default content</span>
		`;
	}

	get ownShadowRootProp() {
		return this._shadowRoot;
	}
});

customElements.define('open-shadow-deep-test', class extends HTMLElement {
	constructor() {
		super();
		let shadowRoot = this.attachShadow({ mode: 'open' });
		shadowRoot.innerHTML = `
			<open-shadow-test data-tie="tieForShadowDom:data => customContent"></open-shadow-test>
		`;
	}
});

suite.addTest({ name: 'Open ShadowDom should be auto-tied (add element self)' }, async (pass, fail) => {
	const tieName = 'tieForShadowDom';
	let tie = DataTier.ties.create(tieName, { data: 'data' });

	//	test add element with shadow DOM
	let ce = document.createElement('open-shadow-test');
	document.body.appendChild(ce);
	await new Promise(resolve => setInterval(resolve, 0));
	let c = ce.shadowRoot.firstElementChild.textContent;
	if (c !== 'data') fail('expected textContent to be "data" but found "' + c + '"');

	//	test remove element with shadow DOM
	document.body.removeChild(ce);
	await new Promise(resolve => setInterval(resolve, 0));
	tie.model.data = 'not to be found';
	c = ce.shadowRoot.firstElementChild.textContent;
	if (c !== 'data') fail('expected textContent to be "data" but found "' + c + '"');

	DataTier.ties.remove(tie);

	pass();
});

suite.addTest({ name: 'Open ShadowDom should be auto-tied (add as child)' }, async (pass, fail) => {
	const tieName = 'tieForShadowDom';
	let tie = DataTier.ties.create(tieName, { data: 'data' });

	//	test add element with shadow HOST as its child
	let parent = document.createElement('div');
	let ce = document.createElement('open-shadow-test');
	parent.appendChild(ce);
	document.body.appendChild(parent);
	await new Promise(resolve => setInterval(resolve, 0));
	let c = ce.shadowRoot.firstElementChild.textContent;
	if (c !== 'data') fail('expected textContent to be "data" but found "' + c + '"');

	//	test removnig element with shadow HOST as its child
	document.body.removeChild(parent);
	await new Promise(resolve => setInterval(resolve, 0));
	tie.model.data = 'not to be found';
	c = ce.shadowRoot.firstElementChild.textContent;
	if (c !== 'data') fail('expected textContent to be "data" but found "' + c + '"');

	DataTier.ties.remove(tie);

	pass();
});

suite.addTest({ name: 'Open ShadowDom should observe DOM Mutations (self being child)' }, async (pass, fail) => {
	const tieName = 'tieForShadowDom';
	let tie = DataTier.ties.create(tieName, { data: 'data' });

	//	first, validate all in place
	let parent = document.createElement('div');
	let ce = document.createElement('open-shadow-test');
	parent.appendChild(ce);
	document.body.appendChild(parent);
	await new Promise(resolve => setInterval(resolve, 0));
	let c = ce.shadowRoot.firstElementChild.textContent;
	if (c !== 'data') fail('expected textContent to be "data" but found "' + c + '"');

	//	now, append new child and see it being processed
	let newChild = document.createElement('span');
	newChild.dataset.tie = 'tieForShadowDom:data';
	ce.shadowRoot.appendChild(newChild);
	await new Promise(resolve => setInterval(resolve, 0));
	c = ce.shadowRoot.lastElementChild.textContent;
	if (c !== 'data') fail('expected textContent to be "data" but found "' + c + '"');

	DataTier.ties.remove(tie);

	pass();
});

suite.addTest({ name: 'Closed ShadowDom should not be auto-tied, but by API (element self)' }, async (pass, fail) => {
	const tieName = 'tieForShadowDom';
	let tie = DataTier.ties.create(tieName, { data: 'data' }),
		ce, e, c;

	//	add closed shadow HOST
	ce = document.createElement('closed-shadow-test');
	document.body.appendChild(ce);
	await new Promise(resolve => setInterval(resolve, 0));
	e = ce.ownShadowRootProp.firstElementChild;
	c = e.textContent;
	if (c !== 'default content') fail('expected textContent to be "default content" but found "' + c + '"');

	//	add it explicitly to the DataTier
	DataTier.addRootDocument(ce.ownShadowRootProp);
	tie.model.data = 'other content';
	c = e.textContent;
	if (c !== 'other content') fail('expected textContent to be "other content" but found "' + c + '"');

	//  removing closed shadow HOST
	document.body.removeChild(ce);
	await new Promise(resolve => setTimeout(resolve, 0));
	tie.model.data = 'one more time';
	c = e.textContent;
	if (c !== 'one more time') fail('expected textContent to be "one more time" but found "' + c + '"');

	//	remove explicitly from DataTier
	DataTier.removeRootDocument(ce.ownShadowRootProp);
	tie.model.data = 'now should not change';
	c = e.textContent;
	if (c !== 'one more time') fail('expected textContent to be "one more time" but found "' + c + '"');

	DataTier.ties.remove(tie);

	pass();
});

suite.addTest({ name: 'Closed ShadowDom should not be auto-tied, but by API (as child of other element)' }, async (pass, fail) => {
	const tieName = 'tieForShadowDom';
	let tie = DataTier.ties.create(tieName, { data: 'data' }),
		parent, ce, e, c;

	//	add closed shadow HOST
	parent = document.createElement('div');
	ce = document.createElement('closed-shadow-test');
	parent.appendChild(ce);
	document.body.appendChild(parent);
	await new Promise(resolve => setInterval(resolve, 0));
	e = ce.ownShadowRootProp.firstElementChild;
	c = e.textContent;
	if (c !== 'default content') fail('expected textContent to be "default content" but found "' + c + '"');

	//	add it explicitly to the DataTier
	DataTier.addRootDocument(ce.ownShadowRootProp);
	tie.model.data = 'other content';
	c = e.textContent;
	if (c !== 'other content') fail('expected textContent to be "other content" but found "' + c + '"');

	//  removing closed shadow HOST
	document.body.removeChild(parent);
	await new Promise(resolve => setTimeout(resolve, 0));
	tie.model.data = 'one more time';
	c = e.textContent;
	if (c !== 'one more time') fail('expected textContent to be "one more time" but found "' + c + '"');

	//	remove explicitly from DataTier
	DataTier.removeRootDocument(ce.ownShadowRootProp);
	tie.model.data = 'now should not change';
	c = e.textContent;
	if (c !== 'one more time') fail('expected textContent to be "one more time" but found "' + c + '"');

	DataTier.ties.remove(tie);

	pass();
});

suite.addTest({ name: 'Closed ShadowDom should observe DOM Mutations (self being child)' }, async (pass, fail) => {
	const tieName = 'tieForShadowDom';
	let tie = DataTier.ties.create(tieName, { data: 'data' });

	//	first, validate all in place
	let parent = document.createElement('div');
	let ce = document.createElement('closed-shadow-test');
	parent.appendChild(ce);
	document.body.appendChild(parent);
	DataTier.addRootDocument(ce.ownShadowRootProp);
	await new Promise(resolve => setInterval(resolve, 0));
	let c = ce.ownShadowRootProp.firstElementChild.textContent;
	if (c !== 'data') fail('expected textContent to be "data" but found "' + c + '"');

	//	now, append new child and see it being processed
	let newChild = document.createElement('span');
	newChild.dataset.tie = 'tieForShadowDom:data';
	ce.ownShadowRootProp.appendChild(newChild);
	await new Promise(resolve => setInterval(resolve, 0));
	c = ce.ownShadowRootProp.lastElementChild.textContent;
	if (c !== 'data') fail('expected textContent to be "data" but found "' + c + '"');

	DataTier.ties.remove(tie);

	pass();
});

suite.addTest({ name: 'Open ShadowDom should be able to have another custom element within it (also tied)' }, async (pass, fail) => {
	const tieName = 'tieForShadowDom';
	let tie = DataTier.ties.create(tieName, { data: 'custom content' });

	//	first, validate all in place
	let parent = document.createElement('div');
	let ce = document.createElement('open-shadow-deep-test');
	parent.appendChild(ce);
	document.body.appendChild(parent);
	await new Promise(resolve => setInterval(resolve, 0));
	let c = ce.shadowRoot.firstElementChild.shadowRoot.firstElementChild.textContent;
	if (c !== 'custom content') fail('expected textContent to be "custom content" but found "' + c + '"');

	DataTier.ties.remove(tie);

	pass();
});

suite.run();
