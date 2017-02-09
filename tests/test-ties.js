(function () {
	'use strict';

	var suite = window.Utils.JustTest.createSuite({ name: 'Testing ties' });

	suite.addTest({ name: 'adding a tie and then a view' }, function (pass, fail) {
		var newEl = document.createElement('div'),
			text = 'text test A';

		DataTier.ties.create('tiesTestA', Observable.from({ name: text }));

		newEl.dataset.tieText = 'tiesTestA.name';
		document.body.appendChild(newEl);

		setTimeout(function () {
			if (newEl.textContent !== text) fail(new Error('expected the content to be "' + text + '", found: ' + newEl.textContent));
			pass();
		}, 0);
	});

	suite.addTest({ name: 'adding a view and then a tie' }, function (pass, fail) {
		var newEl = document.createElement('div'),
			text = 'text test B';

		newEl.dataset.tieText = 'tiesTestB.name';
		document.body.appendChild(newEl);


		setTimeout(function () {
			DataTier.ties.create('tiesTestB', Observable.from({ name: text }));
			if (newEl.textContent !== text) fail(new Error('expected the content to be "' + text + '", found: ' + newEl.textContent));
			pass();
		}, 0);
	});

	suite.addTest({ name: 'creating a tie with an undefined data' }, function (pass, fail) {
		var newEl = document.createElement('div'),
			o = { text: 'text test C' },
			t = DataTier.ties.create('tiesTestC');
		newEl.dataset.tieText = 'tiesTestC.text';
		document.body.appendChild(newEl);

		setTimeout(function () {
			if (newEl.textContent) fail(new Error('preliminary expectation failed: expected the content to be empty'));
			t.data = Observable.from(o);
			if (newEl.textContent != o.text) fail(new Error('expected the content to be "' + o.text + '"; found: ' + newEl.textContent));
			pass();
		}, 0);
	});

	suite.addTest({ name: 'creating a tie with a NULL data' }, function (pass, fail) {
		var newEl = document.createElement('div'),
			o = { text: 'text test D' },
			t = DataTier.ties.create('tiesTestD', null);
		newEl.dataset.tieText = 'tiesTestD.text';
		document.body.appendChild(newEl);

		setTimeout(function () {
			if (newEl.textContent) fail(new Error('preliminary expectation failed: expected the content to be empty'));
			t.data = Observable.from(o);
			if (newEl.textContent != o.text) fail(new Error('expected the content to be "' + o.text + '"; found: ' + newEl.textContent));
			pass();
		}, 0);
	});

	suite.run();
})();