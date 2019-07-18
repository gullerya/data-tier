import { createSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const suite = createSuite({ name: 'Testing Shadowing in ShadowDom' });

customElements.define('open-shadow-test', class extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
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

customElements.define('open-shadow-child-test', class extends HTMLElement {
	constructor() {
		super();
		const shadowRoot = this.attachShadow({ mode: 'open' });
		shadowRoot.innerHTML = `
			<span data-tie="tieForShadowDom:childData">default content</span>
		`;
	}

	set customContent(childData) {
		DataTier.ties.get('tieForShadowDom').model.childData = childData
	}
});

customElements.define('open-shadow-parent-test', class extends HTMLElement {
	constructor() {
		super();
		const shadowRoot = this.attachShadow({ mode: 'open' });
		shadowRoot.innerHTML = `
			<open-shadow-child-test data-tie="tieForShadowDom:data => customContent"></open-shadow-child-test>
		`;
	}
});

suite.addTest({ name: 'Open ShadowDom should be auto-tied (add element self)' }, async test => {
	const tieName = 'tieForShadowDomA';
	const tie = DataTier.ties.create(tieName, { data: 'data' });

	//	test add element with shadow DOM
	const
		ce = document.createElement('open-shadow-test');
	ce.shadowRoot.innerHTML = '<span data-tie="tieForShadowDomA:data">default content</span>';

	document.body.appendChild(ce);
	await new Promise(resolve => setTimeout(resolve, 0));
	let c = ce.shadowRoot.firstElementChild.textContent;
	if (c !== 'data') test.fail('expected textContent to be "data" but found "' + c + '"');

	//	test remove element with shadow DOM
	document.body.removeChild(ce);
	await new Promise(resolve => setTimeout(resolve, 0));
	tie.model.data = 'not to be found';
	c = ce.shadowRoot.firstElementChild.textContent;
	if (c !== 'data') test.fail('expected textContent to be "data" but found "' + c + '"');

	DataTier.ties.remove(tie);

	test.pass();
});

suite.addTest({ name: 'Open ShadowDom should be auto-tied (add as child)' }, async test => {
	const tieName = 'tieForShadowDomB';
	const tie = DataTier.ties.create(tieName, { data: 'data' });

	//	test add element with shadow HOST as its child
	const parent = document.createElement('div');
	const ce = document.createElement('open-shadow-test');
	ce.shadowRoot.innerHTML = '<span data-tie="tieForShadowDomB:data">default content</span>';
	parent.appendChild(ce);
	document.body.appendChild(parent);
	await new Promise(resolve => setTimeout(resolve, 0));
	let c = ce.shadowRoot.firstElementChild.textContent;
	if (c !== 'data') test.fail('expected textContent to be "data" but found "' + c + '"');

	//	test removnig element with shadow HOST as its child
	document.body.removeChild(parent);
	await new Promise(resolve => setTimeout(resolve, 0));
	tie.model.data = 'not to be found';
	c = ce.shadowRoot.firstElementChild.textContent;
	if (c !== 'data') test.fail('expected textContent to be "data" but found "' + c + '"');

	DataTier.ties.remove(tie);

	test.pass();
});

suite.addTest({ name: 'Open ShadowDom should observe DOM Mutations (self being child)' }, async test => {
	const tieName = 'tieForShadowDomC';
	const tie = DataTier.ties.create(tieName, { data: 'data' });

	//	first, validate all in place
	const parent = document.createElement('div');
	const ce = document.createElement('open-shadow-test');
	ce.shadowRoot.innerHTML = '<span data-tie="tieForShadowDomC:data">default content</span>';
	parent.appendChild(ce);
	document.body.appendChild(parent);
	await new Promise(resolve => setTimeout(resolve, 0));
	let c = ce.shadowRoot.firstElementChild.textContent;
	if (c !== 'data') test.fail('expected textContent to be "data" but found "' + c + '"');

	//	now, append new child and see it being processed
	const newChild = document.createElement('span');
	newChild.dataset.tie = 'tieForShadowDomC:data';
	ce.shadowRoot.appendChild(newChild);
	await new Promise(resolve => setTimeout(resolve, 0));
	c = ce.shadowRoot.lastElementChild.textContent;
	if (c !== 'data') test.fail('expected textContent to be "data" but found "' + c + '"');

	DataTier.ties.remove(tie);

	test.pass();
});

suite.addTest({ name: 'Closed ShadowDom should not be auto-tied, but by API (element self)' }, async test => {
	const tieName = 'tieForShadowDom';
	const tie = DataTier.ties.create(tieName, { data: 'data' });
	let c;

	//	add closed shadow HOST
	const ce = document.createElement('closed-shadow-test');
	document.body.appendChild(ce);
	await new Promise(resolve => setTimeout(resolve, 0));
	const e = ce.ownShadowRootProp.firstElementChild;
	c = e.textContent;
	if (c !== 'default content') test.fail('expected textContent to be "default content" but found "' + c + '"');

	//	add it explicitly to the DataTier
	DataTier.addRootDocument(ce.ownShadowRootProp);
	tie.model.data = 'other content';
	c = e.textContent;
	if (c !== 'other content') test.fail('expected textContent to be "other content" but found "' + c + '"');

	//  removing closed shadow HOST
	document.body.removeChild(ce);
	await new Promise(resolve => setTimeout(resolve, 0));
	tie.model.data = 'one more time';
	c = e.textContent;
	if (c !== 'one more time') test.fail('expected textContent to be "one more time" but found "' + c + '"');

	//	remove explicitly from DataTier
	DataTier.removeRootDocument(ce.ownShadowRootProp);
	tie.model.data = 'now should not change';
	c = e.textContent;
	if (c !== 'one more time') test.fail('expected textContent to be "one more time" but found "' + c + '"');

	DataTier.ties.remove(tie);

	test.pass();
});

suite.addTest({ name: 'Closed ShadowDom should not be auto-tied, but by API (as child of other element)' }, async test => {
	const tieName = 'tieForShadowDom';
	const tie = DataTier.ties.create(tieName, { data: 'data' });
	let c;

	//	add closed shadow HOST
	const parent = document.createElement('div');
	const ce = document.createElement('closed-shadow-test');
	parent.appendChild(ce);
	document.body.appendChild(parent);
	await new Promise(resolve => setTimeout(resolve, 0));
	const e = ce.ownShadowRootProp.firstElementChild;
	c = e.textContent;
	if (c !== 'default content') test.fail('expected textContent to be "default content" but found "' + c + '"');

	//	add it explicitly to the DataTier
	DataTier.addRootDocument(ce.ownShadowRootProp);
	tie.model.data = 'other content';
	c = e.textContent;
	if (c !== 'other content') test.fail('expected textContent to be "other content" but found "' + c + '"');

	//  removing closed shadow HOST
	document.body.removeChild(parent);
	await new Promise(resolve => setTimeout(resolve, 0));
	tie.model.data = 'one more time';
	c = e.textContent;
	if (c !== 'one more time') test.fail('expected textContent to be "one more time" but found "' + c + '"');

	//	remove explicitly from DataTier
	DataTier.removeRootDocument(ce.ownShadowRootProp);
	tie.model.data = 'now should not change';
	c = e.textContent;
	if (c !== 'one more time') test.fail('expected textContent to be "one more time" but found "' + c + '"');

	DataTier.ties.remove(tie);

	test.pass();
});

suite.addTest({ name: 'Closed ShadowDom should observe DOM Mutations (self being child)' }, async test => {
	const tieName = 'tieForShadowDom';
	const tie = DataTier.ties.create(tieName, { data: 'data' });

	//	first, validate all in place
	const parent = document.createElement('div');
	const ce = document.createElement('closed-shadow-test');
	parent.appendChild(ce);
	document.body.appendChild(parent);
	DataTier.addRootDocument(ce.ownShadowRootProp);
	await new Promise(resolve => setTimeout(resolve, 0));
	let c = ce.ownShadowRootProp.firstElementChild.textContent;
	if (c !== 'data') test.fail('expected textContent to be "data" but found "' + c + '"');

	//	now, append new child and see it being processed
	const newChild = document.createElement('span');
	newChild.dataset.tie = 'tieForShadowDom:data';
	ce.ownShadowRootProp.appendChild(newChild);
	await new Promise(resolve => setTimeout(resolve, 0));
	c = ce.ownShadowRootProp.lastElementChild.textContent;
	if (c !== 'data') test.fail('expected textContent to be "data" but found "' + c + '"');

	DataTier.ties.remove(tie);

	test.pass();
});

// nested tied shadow DOMs

suite.addTest({ name: 'Open ShadowDom should be able to have another custom element within it (also tied)' }, async test => {
	const tieName = 'tieForShadowDom';
	const tie = DataTier.ties.create(tieName, { data: 'custom content' });

	//	first, validate all in place
	const ce = document.createElement('open-shadow-parent-test');
	document.body.appendChild(ce);
	await new Promise(resolve => setTimeout(resolve, 0));
	const c = ce.shadowRoot.firstElementChild.shadowRoot.firstElementChild.textContent;
	if (c !== 'custom content') test.fail('expected textContent to be "custom content" but found "' + c + '"');

	DataTier.ties.remove(tie);

	test.pass();
});

suite.addTest({ name: 'Open ShadowDom should be able to have another custom element within it (also tied) - self as child' }, async test => {
	const tieName = 'tieForShadowDom';
	const tie = DataTier.ties.create(tieName, { data: 'custom content' });

	//	first, validate all in place
	const parent = document.createElement('div');
	const ce = document.createElement('open-shadow-parent-test');
	parent.appendChild(ce);
	document.body.appendChild(parent);
	await new Promise(resolve => setTimeout(resolve, 0));
	const c = ce.shadowRoot.firstElementChild.shadowRoot.firstElementChild.textContent;
	if (c !== 'custom content') test.fail('expected textContent to be "custom content" but found "' + c + '"');

	DataTier.ties.remove(tie);

	test.pass();
});

suite.addTest({ name: 'Open ShadowDom should be propertly tied even if defined only after the tying' }, async test => {
	const tieName = 'tieForShadowDom';
	const tie = DataTier.ties.create(tieName, { data: 'custom content' });

	//	create undefined element and attach it to living DOM (may also be already found in DOM)
	const ue = document.createElement('undefined-first-shadow-holder');
	document.body.appendChild(ue);

	//	now let's define it with some inner element that is tied to the data
	customElements.define('undefined-first-shadow-holder', class extends HTMLElement {
		constructor() {
			super();
			this.attachShadow({ mode: 'open' });
			this.shadowRoot.innerHTML = `<open-shadow-child-test data-tie="tieForShadowDom:data => customContent"></open-shadow-child-test>`;
		}
	});

	await new Promise(resolve => setTimeout(resolve, 0));
	const it = ue.shadowRoot.firstElementChild.shadowRoot.firstElementChild.textContent;
	if (it !== 'custom content') test.fail('unexpected content; expected "custom content" but found "' + it + '"');

	DataTier.ties.remove(tie);

	test.pass();
});

suite.run();
