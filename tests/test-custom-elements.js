(function() {
	'use strict';

	let suite = Utils.JustTest.createSuite({name: 'Testing Custom Elements behavior'}),
		data = {
			text: 'some text',
			date: new Date()
		},
		oData = Observable.from(data),
		testTieCustomElementsA = DataTier.ties.create('testCustomsA', oData),
		testTieCustomElementsB = DataTier.ties.create('testCustomsB', oData);

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

	suite.addTest({name: 'testing basic controllers: binding value of custom element'}, function(pass, fail) {
		let e = document.createElement('custom-element');
		e.dataset.tieValue = 'testCustomsA.text';
		if (e.value !== '') fail('precondition of the test failed');
		document.body.appendChild(e);
		setTimeout(function() {
			if (e.value !== data.text.toUpperCase()) fail('textContent of the element expected to be ' + data.text.toUpperCase() + ', found: ' + e.value);
			pass();
		}, 0)
	});

	suite.addTest({name: 'testing basic controllers: custom element within a repeater'}, function(pass, fail) {
		let c = document.createElement('div'),
			t = document.createElement('template'),
			e = document.createElement('custom-element'),
			tie;
		tie = window.DataTier.ties.create('repeaterWithCustomEls', Observable.from([
			{text: 'some'},
			{text: 'more'}
		]));
		t.dataset.tieList = 'repeaterWithCustomEls => item';
		e.dataset.tieValue = 'item.text';
		t.content.appendChild(e);
		c.appendChild(t);
		document.body.appendChild(c);
		setTimeout(function() {
			Array.prototype.slice.call(c.getElementsByTagName('custom-element'), 0).forEach(function(item, index) {
				if (item.textContent !== tie.data[index].text.toUpperCase()) fail('value of the element expected to be ' + tie.data[index].text.toUpperCase() + ', found: ' + item.textContent);
			});
			pass();
		}, 0)
	});

	suite.run();
})();