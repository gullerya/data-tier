(function() {
	'use strict';

	let suite = Utils.JustTest.createSuite({name: 'Testing erroneous cases'});

	suite.addTest({name: 'adding view with empty controller value'}, function(pass, fail) {
		let elem = document.createElement('div');

		elem.dataset.tieText = '';

		document.body.appendChild(elem);
		pass();
	});

	suite.addTest({name: 'accessing in other place the observable that was replaced'}, function(pass, fail) {
		let inner = {},
			raw = {o: inner},
			data = DataTier.ties.create('errorA', raw),
			elem = document.createElement('div');

		data.data.observe(changes =>
			changes.forEach(change =>
				console.dir(change)));
		elem.dataset.tieProperty = 'errorA => textContent';

		document.body.appendChild(elem);

		setTimeout(() => {
			data.data.o = inner;

			document.body.removeChild(elem);

			setTimeout(() => {

				document.body.appendChild(elem);

			}, 0);

			pass();
		}, 0);
	});

	suite.run();
})();