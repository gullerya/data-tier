(function () {
	'use strict';

	var suite = window.Utils.JustTest.createSuite({ name: 'Testing views changes' }),
		user = { name: 'some', age: 7, address: { street: 'str', apt: 9 } };

	var s1, s2, s3, s4;
	s1 = document.createElement('div');
	s1.dataset.tie = 'userB.name';
	document.body.appendChild(s1);
	s2 = document.createElement('div');
	s2.dataset.tie = 'userB.age';
	document.body.appendChild(s2);
	s3 = document.createElement('div');
	s3.dataset.tie = 'userB.address.street';
	document.body.appendChild(s3);
	s4 = document.createElement('div');
	s4.dataset.tie = 'userB.address.apt';
	document.body.appendChild(s4);

	suite.addTest({ name: 'update view when path changes (deep)' }, function (pass, fail) {
		window.Utils.DataTier.tieData('userB', user);
		s1.dataset.tie = 'userB.address.street';
		setTimeout(function () {
			if (s1.textContent !== user.address.street) fail(new Error('expected the content to be "str"; found: "' + s1.textContent + '"'));
			pass();
		}, 0);
	});

	suite.addTest({ name: 'adding new view (zero depth) with path defined' }, function (pass, fail) {
		var newEl = document.createElement('div');
		newEl.dataset.tie = 'userB.name';
		document.body.appendChild(newEl);
		setTimeout(function () {
			if (newEl.textContent !== user.name) fail(new Error('expected the content to be "other"'));
			pass();
		}, 0);
	});

	suite.addTest({ name: 'adding few views (with depth) with paths defined' }, function (pass, fail) {
		var newElA = document.createElement('div'), newElB = document.createElement('div');
		newElA.dataset.tie = 'userB.name';
		newElB.dataset.tie = 'userB.address.apt';
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