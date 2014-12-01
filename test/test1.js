(function () {
	'use strict';

	var suite = window.Utils.JustTest.createSuite('testing the tests :)');

	suite.createCase(function (pass, fail) {
		pass('this is passed');
	});

	suite.createCase({}, function (pass, fail) {
		fail('this is failed');
	});

	suite.createCase({ description: 'throwing' }, function (pass, fail) {
		//	timeout should happen here
	});

	suite.run();
})();