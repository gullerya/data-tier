(function() {
	'use strict';

	let suite = Utils.JustTest.createSuite({name: 'Testing controllers appliance'}),
		data = {
			text: 'some text',
			date: new Date()
		},
		testControllersTieA = DataTier.ties.create('testControllersA', Observable.from(data)),
		testControllersTieB = DataTier.ties.create('testControllersB', Observable.from(data));

	suite.addTest({name: 'testing basic controllers: text content'}, function(pass, fail) {
		let e = document.createElement('div');
		e.dataset.tieText = 'testControllersA.text';
		document.body.appendChild(e);
		setTimeout(function() {
			if (e.textContent !== data.text) fail('textContent of the element expected to be ' + data.text + ', found: ' + e.textContent);
			pass();
		}, 0)
	});

	suite.addTest({name: 'testing basic controllers: value'}, function(pass, fail) {
		let e = document.createElement('input');
		e.dataset.tieValue = 'testControllersA.text';
		document.body.appendChild(e);
		setTimeout(function() {
			if (e.value !== data.text) fail('value of the element expected to be ' + data.text + ', found: ' + e.value);
			pass();
		}, 0)
	});

	suite.addTest({name: 'testing basic controllers: date text content'}, function(pass, fail) {
		let e = document.createElement('div');
		e.dataset.tieDateText = 'testControllersA.date';
		document.body.appendChild(e);
		setTimeout(function() {
			if (e.textContent !== data.date.toLocaleString()) fail('textContent of the element expected to be ' + (data.date.toLocaleString()) + ', found: ' + e.textContent);
			pass();
		}, 0)
	});

	suite.addTest({name: 'testing basic controllers: date value'}, function(pass, fail) {
		let e = document.createElement('div');
		e.dataset.tieDateValue = 'testControllersA.date';
		document.body.appendChild(e);
		setTimeout(function() {
			if (e.value !== data.date.toLocaleString()) fail('textContent of the element expected to be ' + (data.date.toLocaleString()) + ', found: ' + e.value);
			pass();
		}, 0)
	});

	suite.addTest({name: 'testing basic controllers: classes'}, function(pass, fail) {
		let e = document.createElement('div'),
			cl = Observable.from({});
		DataTier.ties.create('classesList', cl);
		e.dataset.tieClasses = 'classesList';
		document.body.appendChild(e);

		setTimeout(function() {
			if (Array.from(e.classList).length) fail('a list of classes expected to be empty');

			//	adding single class
			cl['class-a'] = true;
			if (e.classList.length !== 1) fail('a list of classes expected to be of length 1');
			if (Array.from(e.classList).indexOf('class-a') < 0) fail('a list of classed expected to contain "class-a"');

			//	adding non-managed class to verify it's not affected
			e.classList.add('non-managed');
			if (e.classList.length !== 2) fail('preliminary check failed: a list of classes expected to be of length 2, found ' + e.classList.length);

			//	adding few classes
			cl['class-b'] = 'some truthy stuff';
			cl['class-c'] = 4;
			if (e.classList.length !== 4) fail('a list of classes expected to be of length 4, found ' + e.classList.length);
			if (Array.from(e.classList).indexOf('class-a') < 0) fail('a list of classed expected to contain "class-a"');
			if (Array.from(e.classList).indexOf('class-b') < 0) fail('a list of classed expected to contain "class-b"');
			if (Array.from(e.classList).indexOf('class-c') < 0) fail('a list of classed expected to contain "class-c"');
			if (Array.from(e.classList).indexOf('non-managed') < 0) fail('a list of classed expected to contain "non-managed"');

			//	setting all of them to be falsysh
			cl['class-c'] = null;
			cl['class-b'] = '';
			cl['class-a'] = 0;
			if (e.classList.length !== 1) fail('a list of classes expected to be of 1 class (non-managed)');

			pass();
		}, 0);
	});

	suite.addTest({name: 'testing adding controller AFTER the elements were added'}, function(pass, fail) {
		let e = document.createElement('div');
		e.dataset.tieUCText = 'testControllersA.text';
		document.body.appendChild(e);
		setTimeout(function() {
			if (e.textContent !== '') fail('textContent of not yet defined controller expected to be empty');

			window.DataTier.controllers.add('tieUCText', {
				dataToView: function(data, view) {
					view.textContent = data ? data.toUpperCase() : '';
				}
			});

			if (e.textContent !== testControllersTieA.data.text.toUpperCase()) fail('textContent expected to be ' + testControllersTieA.data.text.toUpperCase());

			pass();
		}, 0);
	});

	suite.run();
})();