(function () {
	window.user = {
		name: 'ziv',
		age: 5
	}, dt = window.Utils.DataTier;

	dt.bind('user', window.user);

	//
	console.info('---------- Test is from here ---------------');
	window.user.name = 'new';

})();