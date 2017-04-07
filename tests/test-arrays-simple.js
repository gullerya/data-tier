(function () {
	'use strict';

	var suite = window.Utils.JustTest.createSuite({ name: 'Testing Arrays' }), users = [], oUsers = Observable.from(users);

	DataTier.ties.create('users', oUsers);

	var d = document.createElement('div'), e1, e2, e3;
	e1 = document.createElement('div');
	e2 = document.createElement('div');
	e3 = document.createElement('div');
	e1.dataset.tieText = 'users.0.name';
	e2.dataset.tieText = 'users.1.name';
	e3.dataset.tieText = 'users.1.address.street';
	d.appendChild(e1);
	d.appendChild(e2);
	d.appendChild(e3);
	document.body.appendChild(d);

	suite.addTest({ name: 'array binding - adding element' }, function (pass, fail) {
		setTimeout(function () {
			if (e1.textContent !== '') fail('preliminary check failed');
			if (e2.textContent !== '') fail('preliminary check failed');
			if (e3.textContent !== '') fail('preliminary check failed');
			oUsers.push({
				name: 'A'
			});
			if (e1.textContent !== 'A') fail('expected textContent to be A');
			oUsers[0].name = 'AA';
			if (e1.textContent !== 'AA') fail('expected textContent to be AA');
			pass();
		}, 0);
	});

	suite.addTest({ name: 'array binding - replacing element directly' }, function (pass, fail) {
		if (e1.textContent !== 'AA') fail('preliminary check failed');
		oUsers[0] = {
			name: 'B'
		};
		if (e1.textContent !== 'B') fail('expected textContent to be B');
		pass();
	});

	suite.addTest({ name: 'array binding - replacing element with splice' }, function (pass, fail) {
		if (e1.textContent !== 'B') fail('preliminary check failed');
		oUsers.splice(0, 1, {
			name: 'C'
		});
		setTimeout(function () {
			if (e1.textContent !== 'C') fail('expected textContent to be C');
			pass();
		}, 0);
	});

	suite.addTest({ name: 'array binding - removing element via splice' }, function (pass, fail) {
		if (e1.textContent !== 'C') fail('preliminary check failed');
		oUsers.splice(0, 1);
		setTimeout(function () {
			if (e1.textContent !== '') fail('expected textContent to be empty');
			pass();
		}, 0);
	});

	suite.addTest({ name: 'array binding - removing element via pop' }, function (pass, fail) {
		if (e1.textContent !== '') fail('preliminary check failed');
		oUsers.push({ name: 'D' });
		setTimeout(function () {
			if (e1.textContent !== 'D') fail('expected textContent to be D');
			oUsers.pop();
			setTimeout(function () {
				if (e1.textContent !== '') fail('expected textContent to be empty');
				pass();
			}, 0);
		}, 0);
	});

	suite.run();
})();