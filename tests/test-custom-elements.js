import { createSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const
	suite = createSuite({ name: 'Testing Custom Elements behavior' }),
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

class CustomInput extends HTMLInputElement {
}

customElements.define('custom-input', CustomInput, { extends: 'input' });

suite.runTest({ name: 'testing basic controllers: binding value of custom element' }, async test => {
	const e = document.createElement('custom-element');
	e.dataset.tie = 'testCustomsA:text => value';
	if (e.value) test.fail('precondition of the test failed');
	document.body.appendChild(e);

	await test.waitNextMicrotask();

	if (e.value !== model.text.toUpperCase()) test.fail('textContent of the element expected to be ' + model.text.toUpperCase() + ', found: ' + e.value);
});

suite.runTest({ name: 'testing basic controllers: custom input' }, async test => {
	const
		e = document.createElement('input', { is: 'custom-input' }),
		tie = DataTier.ties.create('customInsTie', [
			{ text: 'some' },
			{ text: 'more' }
		]);
	e.dataset.tie = 'customInsTie:0.text => value';
	document.body.appendChild(e);

	await test.waitNextMicrotask();

	if (e.value !== tie.model[0].text) test.fail('value of the element expected to be ' + tie.model[0].text.toUpperCase() + ', found: ' + e.value);

	e.value = 'lowercase';
	const ev = new Event('change');
	e.dispatchEvent(ev);

	await test.waitNextMicrotask();

	if (tie.model[0].text !== 'lowercase') test.fail('value of the model expected to be ' + e.value + ' but found ' + tie.model[0].text);
});