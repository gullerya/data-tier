import { getSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const suite = getSuite({ name: 'Testing Shadowing in ShadowDom' });

customElements.define('open-shadow-test', class extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
	}
});

customElements.define('closed-shadow-test-a', class extends HTMLElement {
	constructor() {
		super();
		this._shadowRoot = this.attachShadow({ mode: 'closed' });
		this._shadowRoot.innerHTML = `
			<span data-tie="tieForClosedShadowDomA:data">default content</span>
		`;
	}

	get ownShadowRootProp() {
		return this._shadowRoot;
	}
});

customElements.define('closed-shadow-test-b', class extends HTMLElement {
	constructor() {
		super();
		this._shadowRoot = this.attachShadow({ mode: 'closed' });
		this._shadowRoot.innerHTML = `
			<span data-tie="tieForClosedShadowDomB:data">default content</span>
		`;
	}

	get ownShadowRootProp() {
		return this._shadowRoot;
	}
});

customElements.define('closed-shadow-test-c', class extends HTMLElement {
	constructor() {
		super();
		this._shadowRoot = this.attachShadow({ mode: 'closed' });
		this._shadowRoot.innerHTML = `
			<span data-tie="tieForClosedShadowDomC:data">default content</span>
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
		DataTier.ties.get('tieForShadowDom').childData = childData;
	}

	get customContent() {
		return null;
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

customElements.define('open-shadow-parent-test-b', class extends HTMLElement {
	constructor() {
		super();
		const shadowRoot = this.attachShadow({ mode: 'open' });
		shadowRoot.innerHTML = `
			<open-shadow-child-test data-tie="tieForOpenShadowDomParentB:data => customContent"></open-shadow-child-test>
		`;
	}
});

suite.runTest({ name: 'Open ShadowDom should be auto-tied (add element self)' }, async test => {
	const tieName = 'tieForShadowDomA';
	const tie = DataTier.ties.create(tieName, { data: 'data' });

	//	test add element with shadow DOM
	const ce = document.createElement('open-shadow-test');
	ce.shadowRoot.innerHTML = '<span data-tie="tieForShadowDomA:data">default content</span>';

	document.body.appendChild(ce);
	await test.waitNextMicrotask();
	let c = ce.shadowRoot.firstElementChild.textContent;
	test.assertEqual(c, 'data');

	//	test remove element with shadow DOM
	document.body.removeChild(ce);
	await test.waitNextMicrotask();
	tie.data = 'not to be found';
	c = ce.shadowRoot.firstElementChild.textContent;
	test.assertEqual(c, 'data');
});

suite.runTest({ name: 'Open ShadowDom should be auto-tied (add as child)' }, async test => {
	const tieName = 'tieForShadowDomB';
	const tie = DataTier.ties.create(tieName, { data: 'data' });

	//	test add element with shadow HOST as its child
	const pe = document.createElement('div');
	const ce = document.createElement('open-shadow-test');
	ce.shadowRoot.innerHTML = '<span data-tie="tieForShadowDomB:data">default content</span>';
	pe.appendChild(ce);
	document.body.appendChild(pe);
	await test.waitNextMicrotask();
	let c = ce.shadowRoot.firstElementChild.textContent;
	test.assertEqual(c, 'data');

	//	test removnig element with shadow HOST as its child
	document.body.removeChild(pe);
	await test.waitNextMicrotask();
	tie.data = 'not to be found';
	c = ce.shadowRoot.firstElementChild.textContent;
	test.assertEqual(c, 'data');
});

suite.runTest({ name: 'Open ShadowDom should observe DOM Mutations (self being child)' }, async test => {
	const tieName = 'tieForShadowDomC';
	DataTier.ties.create(tieName, { data: 'data' });

	//	first, validate all in place
	const pe = document.createElement('div');
	const ce = document.createElement('open-shadow-test');
	ce.shadowRoot.innerHTML = '<span data-tie="tieForShadowDomC:data">default content</span>';
	pe.appendChild(ce);
	document.body.appendChild(pe);
	await test.waitNextMicrotask();
	let c = ce.shadowRoot.firstElementChild.textContent;
	test.assertEqual(c, 'data');

	//	now, append new child and see it being processed
	const newChild = document.createElement('span');
	newChild.dataset.tie = 'tieForShadowDomC:data';
	ce.shadowRoot.appendChild(newChild);
	await test.waitNextMicrotask();
	c = ce.shadowRoot.lastElementChild.textContent;
	test.assertEqual(c, 'data');
});

suite.runTest({ name: 'Closed ShadowDom should not be auto-tied, but by API (element self)' }, async test => {
	const tieName = 'tieForClosedShadowDomA';
	const tie = DataTier.ties.create(tieName, { data: 'data' });
	let c;

	//	add closed shadow HOST
	const ce = document.createElement('closed-shadow-test-a');
	document.body.appendChild(ce);
	await test.waitNextMicrotask();
	const e = ce.ownShadowRootProp.firstElementChild;
	c = e.textContent;
	test.assertEqual(c, 'default content');

	//	add it explicitly to the DataTier
	DataTier.addRootDocument(ce.ownShadowRootProp);
	tie.data = 'other content';
	c = e.textContent;
	test.assertEqual(c, 'other content');

	//  removing closed shadow HOST
	document.body.removeChild(ce);
	await test.waitNextMicrotask();
	tie.data = 'one more time';
	c = e.textContent;
	test.assertEqual(c, 'one more time');

	//	remove explicitly from DataTier
	DataTier.removeRootDocument(ce.ownShadowRootProp);
	tie.data = 'now should not change';
	c = e.textContent;
	test.assertEqual(c, 'one more time');
});

suite.runTest({ name: 'Closed ShadowDom should not be auto-tied, but by API (as child of other element)' }, async test => {
	const tieName = 'tieForClosedShadowDomB';
	const tie = DataTier.ties.create(tieName, { data: 'data' });
	let c;

	//	add closed shadow HOST
	const pe = document.createElement('div');
	const ce = document.createElement('closed-shadow-test-b');
	pe.appendChild(ce);
	document.body.appendChild(pe);
	await test.waitNextMicrotask();
	const e = ce.ownShadowRootProp.firstElementChild;
	c = e.textContent;
	test.assertEqual(c, 'default content');

	//	add it explicitly to the DataTier
	DataTier.addRootDocument(ce.ownShadowRootProp);
	tie.data = 'other content';
	c = e.textContent;
	test.assertEqual(c, 'other content');

	//  removing closed shadow HOST
	document.body.removeChild(pe);
	await test.waitNextMicrotask();
	tie.data = 'one more time';
	c = e.textContent;
	test.assertEqual(c, 'one more time');

	//	remove explicitly from DataTier
	DataTier.removeRootDocument(ce.ownShadowRootProp);
	tie.data = 'now should not change';
	c = e.textContent;
	test.assertEqual(c, 'one more time');
});

suite.runTest({ name: 'Closed ShadowDom should observe DOM Mutations (self being child)' }, async test => {
	const tieName = 'tieForClosedShadowDomC';
	DataTier.ties.create(tieName, { data: 'data' });

	//	first, validate all in place
	const pe = document.createElement('div');
	const ce = document.createElement('closed-shadow-test-c');
	pe.appendChild(ce);
	document.body.appendChild(pe);
	DataTier.addRootDocument(ce.ownShadowRootProp);
	await test.waitNextMicrotask();
	let c = ce.ownShadowRootProp.firstElementChild.textContent;
	test.assertEqual(c, 'data');

	//	now, append new child and see it being processed
	const newChild = document.createElement('span');
	newChild.dataset.tie = 'tieForClosedShadowDomC:data';
	ce.ownShadowRootProp.appendChild(newChild);
	await test.waitNextMicrotask();
	c = ce.ownShadowRootProp.lastElementChild.textContent;
	test.assertEqual(c, 'data');
});

// nested tied shadow DOMs

suite.runTest({ name: 'Open ShadowDom should be able to have another custom element within it (also tied)' }, async test => {
	const tieName = 'tieForShadowDom';
	DataTier.ties.create(tieName, { data: 'custom content' });

	//	first, validate all in place
	const ce = document.createElement('open-shadow-parent-test');
	document.body.appendChild(ce);
	await test.waitNextMicrotask();
	const c = ce.shadowRoot.firstElementChild.shadowRoot.firstElementChild.textContent;
	test.assertEqual(c, 'custom content');
});

suite.runTest({ name: 'Open ShadowDom should be able to have another custom element within it (also tied) - self as child' }, async test => {
	const tieName = 'tieForOpenShadowDomParentB';
	DataTier.ties.create(tieName, { data: 'custom content' });

	//	first, validate all in place
	const pe = document.createElement('div');
	const ce = document.createElement('open-shadow-parent-test-b');
	pe.appendChild(ce);
	document.body.appendChild(pe);
	await test.waitNextMicrotask();
	const c = ce.shadowRoot.firstElementChild.shadowRoot.firstElementChild.textContent;
	test.assertEqual(c, 'custom content');
});

suite.runTest({ name: 'Open ShadowDom should be propertly tied even if defined only after the tying' }, async test => {
	const tieName = 'tieForShadowDomUndefinedFirst';
	DataTier.ties.create(tieName, { data: 'custom content' });

	//	create undefined element and attach it to living DOM (may also be already found in DOM)
	const ue = document.createElement('undefined-first-shadow-holder');
	document.body.appendChild(ue);

	//	now let's define it with some inner element that is tied to the data
	customElements.define('undefined-first-shadow-holder', class extends HTMLElement {
		constructor() {
			super();
			this.attachShadow({ mode: 'open' });
			this.shadowRoot.innerHTML = `
				<open-shadow-child-test data-tie="tieForShadowDomUndefinedFirst:data => customContent">
				</open-shadow-child-test>
			`;
		}
	});

	await test.waitNextMicrotask();
	const it = ue.shadowRoot.firstElementChild.shadowRoot.firstElementChild.textContent;
	test.assertEqual(it, 'custom content');
});

suite.runTest({ name: 'Shadow Dom already has inner element with Shadow DOM themselves' }, async test => {
	const tid = test.getRandom(8);
	const tie = DataTier.ties.create(tid, { data: 'some' });
	let child1;
	let child2;
	let touches = 0;

	customElements.define('shadow-in-shadow-child', class extends HTMLElement {
		constructor() {
			super();
			this.attachShadow({ mode: 'open' });
		}

		set data(data) {
			touches++;
			this.innerText = data;
		}
	});

	customElements.define('shadow-in-shadow-parent', class extends HTMLElement {
		constructor() {
			super();
			this.attachShadow({ mode: 'open' });
		}

		connectedCallback() {
			child1 = document.createElement('shadow-in-shadow-child');
			child1.dataset.tie = `${tid}:data => data`;
			child2 = document.createElement('shadow-in-shadow-child');
			child2.dataset.tie = `${tid}:data => data`;
			this.appendChild(child1);
			this.appendChild(child2);
		}
	});

	document.body.appendChild(document.createElement('shadow-in-shadow-parent'));

	await test.waitNextMicrotask();
	test.assertEqual(tie.data, child1.textContent);
	test.assertEqual(tie.data, child2.textContent);
	test.assertEqual(2, touches);
});