(function () {
	'use strict';

	var suite = window.Utils.JustTest.createSuite({ name: 'Core functionality test: model to view binding' }),
		user = { name: 'some', age: 7, address: { street: 'str', apt: 9 } };

	var s1, s2, s3, s4;
	s1 = document.createElement('div');
	s1.dataset.tie = 'user.name';
	document.body.appendChild(s1);
	s2 = document.createElement('div');
	s2.dataset.tie = 'user.age';
	document.body.appendChild(s2);
	s3 = document.createElement('div');
	s3.dataset.tie = 'user.address.street';
	document.body.appendChild(s3);
	s4 = document.createElement('div');
	s4.dataset.tie = 'user.address.apt';
	document.body.appendChild(s4);

	suite.addTest({ name: 'update view when model bound' }, function (pass, fail) {
		window.Utils.DataTier.tieData('user', user);
		if (s1.textContent !== user.name) fail(new Error('expected the content to be updated'));
		if (s2.textContent != user.age) fail(new Error('expected the content to be updated'));
		if (s3.textContent !== user.address.street) fail(new Error('expected the content to be updated'));
		if (s4.textContent != user.address.apt) fail(new Error('expected the content to be updated'));
		pass();
	});

	suite.addTest({ name: 'update view when model changes' }, function (pass, fail) {
		user.name = 'other';
		setTimeout(function () {
			if (s1.textContent !== user.name) fail(new Error('expected the content to be "other"'));
			pass();
		}, 0);
	});

	suite.addTest({ name: 'update view when path changes (deep)' }, function (pass, fail) {
		s1.dataset.tie = 'user.address.street';
		setTimeout(function () {
			if (s1.textContent !== user.address.street) fail(new Error('expected the content to be "str"; found: "' + s1.textContent + '"'));
			pass();
		}, 0);
	});

	suite.addTest({ name: 'update view when model changes (deep)' }, function (pass, fail) {
		user.address.street = 'Street';
		setTimeout(function () {
			if (s1.textContent !== user.address.street) fail(new Error('expected the content to be "Street"'));
			if (s3.textContent !== user.address.street) fail(new Error('expected the content to be "Street"'));
			pass();
		}, 0);
	});

	suite.addTest({ name: 'adding new view (zero depth) with path defined' }, function (pass, fail) {
		var newEl = document.createElement('div');
		newEl.dataset.tie = 'user.name';
		document.body.appendChild(newEl);
		setTimeout(function () {
			if (newEl.textContent !== user.name) fail(new Error('expected the content to be "other"'));
			pass();
		}, 0);
	});

	suite.addTest({ name: 'adding few views (with depth) with paths defined' }, function (pass, fail) {
		var newElA = document.createElement('div'), newElB = document.createElement('div');
		newElA.dataset.tie = 'user.name';
		newElB.dataset.tie = 'user.address.apt';
		newElA.appendChild(newElB);
		document.body.appendChild(newElA);
		setTimeout(function () {
			if (newElA.textContent !== user.name) fail(new Error('expected the content to be "other"'));
			if (newElB.textContent != user.address.apt) fail(new Error('expected the content to be 7'));
			pass();
		}, 0);
	});

	suite.run();
})();