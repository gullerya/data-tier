(function () {
	'use strict';

	var suite = window.Utils.JustTest.createSuite({ name: 'view update flows' }),
		user = { name: 'some', age: 7, address: { street: 'str', apt: 9 } };

	var s1, s2, s3, s4;
	s1 = document.createElement('span');
	s1.dataset.path = 'user.name';
	document.body.appendChild(s1);
	s2 = document.createElement('span');
	s2.dataset.path = 'user.age';
	document.body.appendChild(s2);
	s3 = document.createElement('span');
	s3.dataset.path = 'user.address.street';
	document.body.appendChild(s3);
	s4 = document.createElement('span');
	s4.dataset.path = 'user.address.apt';
	document.body.appendChild(s4);

	suite.addTest({ name: 'update existing element upon binding the model' }, function (pass, fail) {
		window.Utils.DataTier.bind('user', user);
		if (s1.textContent !== 'some') fail(new Error('expected the content to be updated'));
		if (s2.textContent !== '7') fail(new Error('expected the content to be updated'));
		if (s3.textContent !== 'str') fail(new Error('expected the content to be updated'));
		if (s4.textContent !== '9') fail(new Error('expected the content to be updated'));
		pass();
	});

	suite.addTest({ name: 'update existing element upon model change' }, function (pass, fail) {
		user.name = 'other';
		setTimeout(function () {
			if (s1.textContent !== 'other') fail(new Error('expected the content to be "other"'));
			pass();
		}, 0);
	});

	suite.addTest({ name: 'update existing element upon path change (deep)' }, function (pass, fail) {
		s1.dataset.path = 'user.address.street';
		setTimeout(function () {
			if (s1.textContent !== 'str') fail(new Error('expected the content to be "str"'));
			pass();
		}, 0);
	});

	suite.addTest({ name: 'update existing element upon model change (deep)' }, function (pass, fail) {
		user.address.street = 'Street';
		setTimeout(function () {
			if (s1.textContent !== 'Street') fail(new Error('expected the content to be "Street"'));
			if (s3.textContent !== 'Street') fail(new Error('expected the content to be "Street"'));
			pass();
		}, 0);
	});

	suite.run();
})();