(() => {
	'use strict';

	let suite = Utils.JustTest.createSuite({name: 'Testing Custom Elements behavior'}),
		data = {
			text: 'some text',
			date: new Date()
		};

	DataTier.ties.create('testCustomsA', data);
	DataTier.ties.create('testCustomsB', data);

	class CustomElement extends HTMLElement {
		constructor() {
			super();
			this.__value = '';
		}

		connectedCallback() {
			this.style.cssText = 'display:block;width:200px;height:22px;border:1px solid #aaa;';
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

	suite.addTest({name: 'testing basic processors: binding value of custom element'}, (pass, fail) => {
		let e = document.createElement('custom-element');
		e.dataset.tieValue = 'testCustomsA.text';
		if (e.value !== '') fail('precondition of the test failed');
		document.body.appendChild(e);
		setTimeout(function() {
			if (e.value !== data.text.toUpperCase()) fail('textContent of the element expected to be ' + data.text.toUpperCase() + ', found: ' + e.value);
			pass();
		}, 0)
	});

	suite.addTest({name: 'testing basic processors: custom element within a repeater'}, (pass, fail) => {
		let c = document.createElement('div'),
			t = document.createElement('template'),
			e = document.createElement('custom-element'),
			tie = DataTier.ties.create('repeaterWithCustomEls', [
				{text: 'some'},
				{text: 'more'}
			]);
		t.dataset.tieList = 'repeaterWithCustomEls => item';
		e.dataset.tieValue = 'item.text';
		t.content.appendChild(e);
		c.appendChild(t);
		document.body.appendChild(c);
		setTimeout(function() {
			Array.prototype.slice.call(c.getElementsByTagName('custom-element'), 0).forEach((item, index) => {
				if (item.textContent !== tie.data[index].text.toUpperCase()) fail('value of the element expected to be ' + tie.data[index].text.toUpperCase() + ', found: ' + item.textContent);
			});
			pass();
		}, 0)
	});

	suite.addTest({name: 'testing basic processors: custom input'}, (pass, fail) => {
		let e = document.createElement('input', {is: 'custom-input'}),
			tie = DataTier.ties.create('customInsTie', [
				{text: 'some'},
				{text: 'more'}
			]);
		e.dataset.tieMyValue = 'customInsTie.1.text';
		document.body.appendChild(e);

		DataTier.processors.add('tieMyValue', {
			toView: (data, view) => {
				view.value = ('' + data).toLowerCase();
			},
			toData: (params) => {
				params.data[params.path[0]] = params.view.value.toUpperCase();
			}
		});

		setTimeout(() => {
			if (e.value !== tie.data[1].text) fail('value of the element expected to be ' + tie.data[index].text.toUpperCase() + ', found: ' + item.textContent);

			let ev = new Event('change');
			e.dispatchEvent(ev);

			setTimeout(() => {

				pass();
			}, 0);
		}, 0)
	});

	suite.run();
})();