(function () {
	'use strict';

	var suite = window.Utils.JustTest.createSuite({ name: 'Testing Arrays with Repeaters' }), users = [];
	window.Modules.DataTier.Ties.create('usersA', users);

	var c = document.createElement('div'), t, c1, e1, e2, e3;
	t = document.createElement('template');
	c1 = document.createElement('div');
	e1 = document.createElement('span');
	e2 = document.createElement('span');
	e3 = document.createElement('span');
	c.dataset.tieList = 'usersA => user';
	e1.dataset.tieText = 'user.name';
	e2.dataset.tieText = 'user.age';
	e3.dataset.tieText = 'user.address.street';
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

		function onViewUpdate(e) {
			if (c.childElementCount !== 2) fail('expected child elements of repeater to be 2, found: ' + c.childElementCount);
			//	TODO: ensure the content of the repeated child is as expected
			c.removeEventListener('viewupdate', onViewUpdate);
			pass();
		}
		c.addEventListener('viewupdate', onViewUpdate);

		users.push({
			name: 'A',
			age: 5,
			address: { street: 'some street' }
		});
	});

	suite.addTest({ name: 'array binding - bulk update' }, function (pass, fail) {
		function onViewUpdate(e) {
			if (c.childElementCount !== 6) fail('expected child elements of repeater to be 6, found: ' + c.childElementCount);
			//	TODO: ensure the content of the repeated child is as expected
			c.removeEventListener('viewupdate', onViewUpdate);
			pass();
		}
		c.addEventListener('viewupdate', onViewUpdate);

		window.Modules.DataTier.Ties.obtain('usersA').data = [
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
	});

	suite.addTest({ name: 'array binding - huge bulk update (2000 rows)' }, function (pass, fail) {
		var a = [], i;

		function onViewUpdate(e) {
			if (c.childElementCount !== 2001) fail('expected child elements of repeater to be 2001, found: ' + c.childElementCount);
			//	TODO: ensure the content of the repeated child is as expected
			c.removeEventListener('viewupdate', onViewUpdate);
			pass();
		}
		c.addEventListener('viewupdate', onViewUpdate);

		for (i = 0; i < 2000; i++) {
			a.push({
				name: 'A',
				age: 6,
				address: { street: 'some street 1' }
			});
		}
		window.Modules.DataTier.Ties.obtain('usersA').data = a;
	});

	suite.run();
})();