(function () {
	'use strict';

	var suite = window.Utils.JustTest.createSuite({ name: 'Testing Loading and Init' });

	suite.addTest({ name: 'basic loading test' }, function (pass, fail) {
		if (!window.DataTier) fail('expected the library to exist in the default namespace');
		pass();
	});

	suite.run();
})();