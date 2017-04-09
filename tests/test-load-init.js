(function() {
	'use strict';

	let suite = Utils.JustTest.createSuite({name: 'Testing Loading and Init'});

	suite.addTest({name: 'basic loading test'}, function(pass, fail) {
		if (!DataTier) fail('expected the library to exist in the default namespace');
		pass();
	});

	suite.run();
})();