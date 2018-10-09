import * as DataTier from '../../dist/module/data-tier.js';

let suite = Utils.JustTest.createSuite({name: 'Testing Custom Elements behavior'}),
	model = {
		text: 'some text',
		date: new Date()
	};

DataTier.ties.create('testCustomsA', model);
DataTier.ties.create('testCustomsB', model);

class CustomElement extends HTMLElement {
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

customElements.define('custom-element', CustomElement);

class CustomInput extends HTMLInputElement {
	constructor() {
		super();
	}
}

customElements.define('custom-input', CustomInput, {extends: 'input'});

suite.addTest({name: 'testing basic controllers: binding value of custom element'}, (pass, fail) => {
	let e = document.createElement('custom-element');
	e.dataset.tie = 'testCustomsA:text => value';
	if (e.value) fail('precondition of the test failed');
	document.body.appendChild(e);
	setTimeout(function() {
		if (e.value !== model.text.toUpperCase()) fail('textContent of the element expected to be ' + model.text.toUpperCase() + ', found: ' + e.value);
		pass();
	}, 0)
});

suite.addTest({name: 'testing basic controllers: custom input'}, (pass, fail) => {
	let e = document.createElement('input', {is: 'custom-input'}),
		tie = DataTier.ties.create('customInsTie', [
			{text: 'some'},
			{text: 'more'}
		]);
	e.dataset.tie = 'customInsTie:0.text => value';
	document.body.appendChild(e);

	setTimeout(() => {
		if (e.value !== tie.model[0].text) fail('value of the element expected to be ' + tie.model[0].text.toUpperCase() + ', found: ' + e.value);

		let ev = new Event('change');
		e.dispatchEvent(ev);

		setTimeout(() => {

			pass();
		}, 0);
	}, 0)
});

suite.run();