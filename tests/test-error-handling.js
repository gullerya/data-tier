(function() {
	'use strict';

	let suite = Utils.JustTest.createSuite({name: 'Testing erroneous cases'});

	suite.addTest({name: 'adding view with empty controller value'}, function(pass, fail) {
		let elem = document.createElement('div');

		elem.dataset.tieText = '';

		document.body.appendChild(elem);
		pass();
	});

	suite.run();
})();