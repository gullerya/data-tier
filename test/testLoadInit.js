(function () {
	'use strict';

	var suite = window.Utils.JustTest.createSuite({ name: 'Testing Loading and Init' });

	suite.addTest({ name: 'basic loading test' }, function (pass, fail) {
		if (!window.Modules.DataTier) fail('expected the library to exist in the default namespace');
		pass();
	});

	suite.addTest({ name: 'advanced loading test - custom namespace as object' }, function (pass, fail) {
		var xhr = new XMLHttpRequest(),
			namespace = {};
		xhr.open('get', '../src/data-tier.js');
		xhr.onload = function () {
			new Function(xhr.responseText)({ namespace: namespace });
			if (!namespace.DataTier || !namespace.DataTier.Ties) fail('expected the library to exists in specified namespace');
			namespace.DataTier.dispose();
			pass();
		}
		xhr.send();
	});

	suite.run();
})();