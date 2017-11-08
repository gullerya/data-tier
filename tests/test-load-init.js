(function() {
	'use strict';

	let suite = Utils.JustTest.createSuite({name: 'Testing Loading and Init'});

	suite.addTest({name: 'basic loading test'}, function(pass, fail) {
		if (!DataTier) fail('expected the library to exist in the default namespace but not found');
		if (!Observable) fail('expected the default Observable implementing library to exist in the given namespace, but not found');
		pass();
	});

	suite.addTest({name: 'custom namespace loading test'}, function(pass, fail) {
		let ns = {};
		fetch('../dist/data-tier.js')
			.then(response => {
				if (response.ok) {
					return response.text();
				} else {
					fail('failed to obtain DataTier script');
				}
			})
			.then(script => {
				Function(script).call(ns);
				if (!ns.DataTier) fail('expected the library to exist in the given namespace, but not found');
				if (!ns.Observable) fail('expected the default Observable implementing library to exist in the given namespace, but not found');
				pass();
			})
			.catch(fail);
	});

	suite.run();
})();