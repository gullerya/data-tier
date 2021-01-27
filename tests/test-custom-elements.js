import { getSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const
	suite = getSuite({ name: 'Testing Custom Elements behavior' }),
	model = {
		text: 'some text',
		date: new Date()
	};

DataTier.ties.create('testCustomsA', model);
DataTier.ties.create('testCustomsB', model);

class CustomElement extends HTMLElement {
	get value() {
		return this.__value;
	}

	set value(newSrc) {
		this.__value = newSrc.toUpperCase();
		this.textContent = this.__value;
	}
}

customElements.define('custom-element', CustomElement);

suite.runTest({ name: 'testing basic controllers: binding value of custom element' }, async test => {
	const e = document.createElement('custom-element');
	e.dataset.tie = 'testCustomsA:text => value';
	if (e.value) test.fail('precondition of the test failed');
	document.body.appendChild(e);

	await test.waitNextMicrotask();

	test.assertEqual(e.value, model.text.toUpperCase());
});