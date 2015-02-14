(function () {
	'use strict';

	var suite = window.Utils.JustTest.createSuite({ name: 'Testing model changes' }),
		user = { name: 'some', age: 7, address: { street: 'str', apt: 9 } };

	var s1, s2, s3, s4;
	s1 = document.createElement('div');
	s1.dataset.tie = 'userA.name';
	document.body.appendChild(s1);
	s2 = document.createElement('div');
	s2.dataset.tie = 'userA.age';
	document.body.appendChild(s2);
	s3 = document.createElement('div');
	s3.dataset.tie = 'userA.address.street';
	document.body.appendChild(s3);
	s4 = document.createElement('div');
	s4.dataset.tie = 'userA.address.apt';
	document.body.appendChild(s4);

	suite.addTest({ name: 'new model bound' }, function (pass, fail) {
		window.Utils.DataTier.tieData('userA', user);
		if (s1.textContent !== user.name) fail(new Error('expected the content to be updated'));
		if (s2.textContent != user.age) fail(new Error('expected the content to be updated'));
		if (s3.textContent !== user.address.street) fail(new Error('expected the content to be updated'));
		if (s4.textContent != user.address.apt) fail(new Error('expected the content to be updated'));
		pass();
	});

	suite.addTest({ name: 'primitive model changes' }, function (pass, fail) {
		user.name = 'other';
		setTimeout(function () {
			if (s1.textContent !== user.name) fail(new Error('expected the content to be "other"'));
			pass();
		}, 0);
	});

	suite.addTest({ name: 'deep model changes (graph replace)' }, function (pass, fail) {
		user.address.street = 'Street';
		setTimeout(function () {
			if (s3.textContent !== user.address.street) fail(new Error('expected the content to be "Street"'));
			pass();
		}, 0);
	});

	suite.run();
})();