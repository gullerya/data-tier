(function () {
	'use strict';

	var suite = window.Utils.JustTest.createSuite({ name: 'Testing Arrays with Repeaters' }), users = [];
	window.Utils.DataTier.Ties.create('usersA', users);

	var c = document.createElement('div'), t, c1, e1, e2, e3;
	t = document.createElement('template');
	c1 = document.createElement('div');
	e1 = document.createElement('span');
	e2 = document.createElement('span');
	e3 = document.createElement('span');
	c.dataset.tieList = 'usersA => user';
	e1.dataset.tie = 'user.name';
	e2.dataset.tie = 'user.age';
	e3.dataset.tie = 'user.address.street';
	c1.appendChild(e1);
	c1.appendChild(e2);
	c1.appendChild(e3);
	t.content.appendChild(c1);
	c.appendChild(t);
	c.style.cssText = 'position:relative;height:200px;overflow:auto';
	document.body.appendChild(c);

	suite.addTest({ name: 'array binding - verification' }, function (pass, fail) {
		if (e1.textContent !== '') fail('preliminary check failed');
		if (e2.textContent !== '') fail('preliminary check failed');
		if (e3.textContent !== '') fail('preliminary check failed');
		users.push({
			name: 'A',
			age: 5,
			address: { street: 'some street' }
		});
		setTimeout(function () {
			if (e1.textContent !== '') fail('expected textContent of the template to be empty');
			//	TODO: check the inflated content
			pass();
		}, 0);
	});

	suite.addTest({ name: 'array binding - bulk update' }, function (pass, fail) {
		window.Utils.DataTier.Ties.obtain('usersA').data = [
			{
				name: 'A',
				age: 5,
				address: { street: 'some street 1' }
			},
			{
				name: 'B',
				age: 8,
				address: { street: 'some street 2' }
			},
			{
				name: 'C',
				age: 15,
				address: { street: 'some street 3' }
			},
			{
				name: 'D',
				age: 54,
				address: { street: 'some street 4' }
			},
			{
				name: 'E',
				age: 13,
				address: { street: 'some street 5' }
			}
		];
		setTimeout(function () {
			//	TODO: do the verification of the generated content here
			pass();
		}, 0);
	});

	suite.addTest({ name: 'array binding - huge bulk update (2000 rows)' }, function (pass, fail) {
		var a = [], i;
		for (i = 0; i < 2000; i++) {
			a.push({
				name: 'A',
				age: 6,
				address: { street: 'some street 1' }
			});
		}
		window.Utils.DataTier.Ties.obtain('usersA').data = a;
		setTimeout(function () {
			//	TODO: do the verification of the generated content here
			pass();
		}, 0);
	});

	suite.run();
})();