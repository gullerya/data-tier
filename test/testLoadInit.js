(function () {
	'use strict';

	var suite = window.Utils.JustTest.createSuite({ name: 'Testing Loading and Init' });

	suite.addTest({ name: 'basic loading test' }, function (pass, fail) {
		if (!window.modules.dataTier) fail('expected the library to exist in the default namespace');
		pass();
	});

	suite.run();
})();