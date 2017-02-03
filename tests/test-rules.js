(function () {
	'use strict';

	var suite = window.Utils.JustTest.createSuite({ name: 'Testing Rules appliance' }),
		data = {
			text: 'some text',
			date: new Date()
		},
		testRulesTieA = window.DataTier.ties.create('testRulesA', Observable.from(data)),
		testRulesTieB = window.DataTier.ties.create('testRulesB', Observable.from(data));

	suite.addTest({ name: 'testing basic rules: text content' }, function (pass, fail) {
		var e = document.createElement('div');
		e.dataset.tieText = 'testRulesA.text';
		document.body.appendChild(e);
		setTimeout(function () {
			if (e.textContent !== data.text) fail('textContent of the element expected to be ' + data.text + ', found: ' + e.textContent);
			pass();
		}, 0)
	});

	suite.addTest({ name: 'testing basic rules: value' }, function (pass, fail) {
		var e = document.createElement('input');
		e.dataset.tieValue = 'testRulesA.text';
		document.body.appendChild(e);
		setTimeout(function () {
			if (e.value !== data.text) fail('value of the element expected to be ' + data.text + ', found: ' + e.value);
			pass();
		}, 0)
	});

	suite.addTest({ name: 'testing basic rules: date text content' }, function (pass, fail) {
		var e = document.createElement('div');
		e.dataset.tieDateText = 'testRulesA.date';
		document.body.appendChild(e);
		setTimeout(function () {
			if (e.textContent !== data.date.toLocaleString()) fail('textContent of the element expected to be ' + (data.date.toLocaleString()) + ', found: ' + e.textContent);
			pass();
		}, 0)
	});

	suite.addTest({ name: 'testing basic rules: date value' }, function (pass, fail) {
		var e = document.createElement('div');
		e.dataset.tieDateValue = 'testRulesA.date';
		document.body.appendChild(e);
		setTimeout(function () {
			if (e.value !== data.date.toLocaleString()) fail('textContent of the element expected to be ' + (data.date.toLocaleString()) + ', found: ' + e.value);
			pass();
		}, 0)
	});

	suite.addTest({ name: 'testing adding rule AFTER the elements were added' }, function (pass, fail) {
		var e = document.createElement('div');
		e.dataset.tieUCText = 'testRulesA.text';
		document.body.appendChild(e);
		setTimeout(function () {
			if (e.textContent !== '') fail('textContent of not yet defined rule expected to be empty');

			window.DataTier.rules.add('tieUCText', {
				dataToView: function (data, view) {
					view.textContent = data ? data.toUpperCase() : '';
				}
			});

			if (e.textContent !== testRulesTieA.data.text.toUpperCase()) fail('textContent expected to be ' + testRulesTieA.data.text.toUpperCase());

			pass();
		}, 0);
	});

	suite.addTest({ name: 'testing classes rule' }, function (pass, fail) {
		var e = document.createElement('div'),
			cl = Observable.from([]);
		DataTier.ties.create('classesList', cl);
		e.dataset.tieClasses = 'classesList';
		document.body.appendChild(e);

		setTimeout(function () {
			if (Array.from(e.classList).length) fail('a list of classes expected to be empty');

			//	adding single class
			cl.push('class-a');
			if (Array.from(e.classList).length !== 1) fail('a list of classes expected to be of lenght 1');
			if (Array.from(e.classList).indexOf('class-a') < 0) fail('a list of classed expected to contain "class-a"');

			//	adding few classes
			cl.push('class-b', 'class-c');
			if (Array.from(e.classList).length !== 3) fail('a list of classes expected to be of lenght 3');
			if (Array.from(e.classList).indexOf('class-a') < 0) fail('a list of classed expected to contain "class-a"');
			if (Array.from(e.classList).indexOf('class-b') < 0) fail('a list of classed expected to contain "class-b"');
			if (Array.from(e.classList).indexOf('class-c') < 0) fail('a list of classed expected to contain "class-c"');

			//	removing all of them
			cl.splice(0, 3);
			if (Array.from(e.classList).length) fail('a list of classes expected to be empty');

			pass();
		}, 0);
	});

	suite.run();
})();