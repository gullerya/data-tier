import * as DataTier from '../dist/data-tier.js';

let suite = Utils.JustTest.createSuite({name: 'Testing Custom Elements when Undefined yet'}),
	tie = DataTier.ties.create('testCustomsUndefined', {text: 'some text'});

class CustomElementA extends HTMLElement {
	constructor() {
		super();
	}

	get value() {
		return this.__value;
	}

	set value(newSrc) {
		this.__value = newSrc.toUpperCase();
		this.textContent = this.__value;
	}
}

class CustomInputA extends HTMLInputElement {
	constructor() {
		super();
	}

	get valueA() {
		return this.value;
	}

	set valueA(newSrc) {
		this.value = newSrc.toUpperCase();
	}
}

suite.addTest({name: 'testing custom elements - autonomous: undefined first and adding to DOM'}, (pass, fail) => {
	let e = document.createElement('custom-element-a');
	e.dataset.tie = 'testCustomsUndefined:text => value';
	if (e.value) fail('precondition failed - was not expecting to get any value, got "' + e.value + '"');

	document.body.appendChild(e);

	setTimeout(() => {
		if (e.value) fail('precondition failed - was not expecting to get any value, got "' + e.value + '"');

		customElements.define('custom-element-a', CustomElementA);

		setTimeout(() => {
			if (e.value !== tie.model.text.toUpperCase()) fail('textContent of the element expected to be ' + tie.model.text.toUpperCase() + ', found: ' + e.value);
			pass();
		}, 0)
	}, 0);
});

suite.addTest({name: 'testing custom elements - extended: undefined first and adding to DOM'}, (pass, fail) => {
	let e = document.createElement('input', {is: 'custom-input-a'});
	e.dataset.tie = 'testCustomsUndefined:text => valueA';
	if (e.value) fail('precondition failed - was not expecting to get any value, got "' + e.value + '"');

	document.body.appendChild(e);

	setTimeout(() => {
		if (e.value) fail('precondition failed - was not expecting to get any value, got "' + e.value + '"');

		customElements.define('custom-input-a', CustomInputA, {extends: 'input'});

		setTimeout(() => {
			if (e.value !== tie.model.text.toUpperCase()) fail('value of the element expected to be ' + tie.model.text.toUpperCase() + ', found: ' + e.value);
			pass();
		}, 0)
	}, 0);
});

suite.run();