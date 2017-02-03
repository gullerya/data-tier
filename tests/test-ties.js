(function () {
	'use strict';

	var suite = window.Utils.JustTest.createSuite({ name: 'Testing ties' });

	suite.addTest({ name: 'adding a tie and then a view' }, function (pass, fail) {
		var newEl = document.createElement('div'),
			text = 'text test A';

		DataTier.ties.create('tiesTestA', Observable.from({ name: text }));

		newEl.dataset.tieText = 'tiesTestA:name';
		document.body.appendChild(newEl);

		setTimeout(function () {
			if (newEl.textContent !== text) fail(new Error('expected the content to be "' + text + '", found: ' + newEl.textContent));
			pass();
		}, 0);
	});

	suite.addTest({ name: 'adding a view and then a tie' }, function (pass, fail) {
		var newEl = document.createElement('div'),
			text = 'text test B';

		newEl.dataset.tieText = 'tiesTestB:name';
		document.body.appendChild(newEl);


		setTimeout(function () {
			DataTier.ties.create('tiesTestB', Observable.from({ name: text }));
			if (newEl.textContent !== text) fail(new Error('expected the content to be "' + text + '", found: ' + newEl.textContent));
			pass();
		}, 0);
	});

	suite.run();
})();