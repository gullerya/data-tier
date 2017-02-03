(function () {
	'use strict';

	var suite = window.Utils.JustTest.createSuite({ name: 'Testing Custom Elements behavior' }),
		data = {
			text: 'some text',
			date: new Date()
		},
		oData = Observable.from(data),
		testTieCustomElementsA = window.DataTier.ties.create('testCustomsA', oData),
		testTieCustomElementsB = window.DataTier.ties.create('testCustomsB', oData);

	document.registerElement('custom-element', {
		prototype: Object.create(HTMLInputElement.prototype, {
			createdCallback: {
				value: function () {
					this.style.cssText = 'display:block;width:200px;height:22px;border:1px solid #aaa;';
					this.__value = '';
				}
			},
			value: {
				get: function () { return this.__value; },
				set: function (v) { this.__value = v.toUpperCase(); this.textContent = this.__value; }
			}
		})
	});

	suite.addTest({ name: 'testing basic rules: binding value of custom element' }, function (pass, fail) {
		var e = document.createElement('custom-element');
		e.dataset.tieValue = 'testCustomsA.text';
		if (e.value !== '') fail('precondition of the test failed');
		document.body.appendChild(e);
		setTimeout(function () {
			if (e.value !== data.text.toUpperCase()) fail('textContent of the element expected to be ' + data.text.toUpperCase() + ', found: ' + e.value);
			pass();
		}, 0)
	});

	suite.addTest({ name: 'testing basic rules: custom element within a repeater' }, function (pass, fail) {
		var c = document.createElement('div'),
			t = document.createElement('template'),
			e = document.createElement('custom-element'),
			tie;
		tie = window.DataTier.ties.create('repeaterWithCustomEls', Observable.from([
			{ text: 'some' },
			{ text: 'more' }
		]));
		t.dataset.tieList = 'repeaterWithCustomEls => item';
		e.dataset.tieValue = 'item.text';
		t.content.appendChild(e);
		c.appendChild(t);
		document.body.appendChild(c);
		setTimeout(function () {
			Array.prototype.slice.call(c.getElementsByTagName('custom-element'), 0).forEach(function (item, index) {
				if (item.textContent !== tie.data[index].text.toUpperCase()) fail('value of the element expected to be ' + tie.data[index].text.toUpperCase() + ', found: ' + item.textContent);
			});
			pass();
		}, 0)
	});

	suite.run();
})();