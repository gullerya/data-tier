import { createSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const
	suite = createSuite({ name: 'Testing Custom Elements when Undefined yet' }),
	tie = DataTier.ties.create('testCustomsUndefined', { text: 'some text' });

class CustomElementA extends HTMLElement {
	get value() {
		return this.__value;
	}

	set value(newSrc) {
		this.__value = newSrc.toUpperCase();
		this.textContent = this.__value;
	}
}

class CustomInputA extends HTMLInputElement {
	get valueA() {
		return this.value;
	}

	set valueA(newSrc) {
		this.value = newSrc.toUpperCase();
	}
}

suite.addTest({ name: 'testing custom elements - autonomous: undefined first and adding to DOM' }, async test => {
	const e = document.createElement('custom-element-a');
	e.dataset.tie = 'testCustomsUndefined:text => value';
	if (e.value) test.fail('precondition failed - was not expecting to get any value, got "' + e.value + '"');

	document.body.appendChild(e);

	await new Promise(resolve => setTimeout(resolve, 0));

	if (e.value) test.fail('precondition failed - was not expecting to get any value, got "' + e.value + '"');

	customElements.define('custom-element-a', CustomElementA);

	await new Promise(resolve => setTimeout(resolve, 0));

	if (e.value !== tie.model.text.toUpperCase()) test.fail('textContent of the element expected to be ' + tie.model.text.toUpperCase() + ', found: ' + e.value);
	test.pass();
});

suite.addTest({ name: 'testing custom elements - extended: undefined first and adding to DOM' }, async test => {
	const e = document.createElement('input', { is: 'custom-input-a' });
	e.dataset.tie = 'testCustomsUndefined:text => valueA';
	if (e.value) test.fail('precondition failed - was not expecting to get any value, got "' + e.value + '"');

	document.body.appendChild(e);

	await new Promise(resolve => setTimeout(resolve, 0));

	if (e.value) test.fail('precondition failed - was not expecting to get any value, got "' + e.value + '"');

	customElements.define('custom-input-a', CustomInputA, { extends: 'input' });

	await new Promise(resolve => setTimeout(resolve, 0));

	if (e.value !== tie.model.text.toUpperCase()) test.fail('value of the element expected to be ' + tie.model.text.toUpperCase() + ', found: ' + e.value);
	test.pass();
});

suite.run();