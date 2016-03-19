(function () {
	'use strict';

	var suite = window.Utils.JustTest.createSuite({ name: 'Testing Arrays with Repeaters' }), users = [];
	window.modules.dataTier.Ties.obtain('usersA').data = users;

	var c = document.createElement('div'), t, c1, e1, e2, e3;
	t = document.createElement('template');
	c1 = document.createElement('div');
	e1 = document.createElement('span');
	e2 = document.createElement('span');
	e3 = document.createElement('span');
	t.dataset.tieList = 'usersA => user';
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
			if (c.childNodes[1].childNodes[0].textContent !== 'A') fail('expected first repeated sub-child text to be "A", found: ' + c.childNodes[1].childNodes[0].textContent);
			if (c.childNodes[1].childNodes[1].textContent !== '5') fail('expected first repeated sub-child text to be "5", found: ' + c.childNodes[1].childNodes[1].textContent);
			if (c.childNodes[1].childNodes[2].textContent !== 'some street') fail('expected first repeated sub-child text to be "some street", found: ' + c.childNodes[1].childNodes[2].textContent);
			c.removeEventListener('viewupdate', onViewUpdate);
			pass();
		}
		t.addEventListener('viewupdate', onViewUpdate);

		users.push({
			name: 'A',
			age: 5,
			address: { street: 'some street' }
		});
	});

	suite.addTest({ name: 'array binding - bulk update' }, function (pass, fail) {
		var d = [
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

		function onViewUpdate(e) {
			if (c.childElementCount !== 6) fail('expected child elements of repeater to be 6, found: ' + c.childElementCount);
			for (var i = 0; i < d.length; i++) {
				if (c.childNodes[i + 1].childNodes[0].textContent !== d[i].name) fail('unexpected text content of repeated element ' + i + ' sub-child 0');
				if (c.childNodes[i + 1].childNodes[1].textContent !== d[i].age.toString()) fail('unexpected text content of repeated element ' + i + ' sub-child 1');
				if (c.childNodes[i + 1].childNodes[2].textContent !== d[i].address.street) fail('unexpected text content of repeated element ' + i + ' sub-child 2');
			}
			c.removeEventListener('viewupdate', onViewUpdate);
			pass();
		}
		t.addEventListener('viewupdate', onViewUpdate);

		window.modules.dataTier.Ties.obtain('usersA').data = d;
	});

	suite.addTest({ name: 'array binding - huge bulk update (2000 rows)' }, function (pass, fail) {
		var a = [], i;

		function onViewUpdate(e) {
			if (c.childElementCount !== 2001) fail('expected child elements of repeater to be 2001, found: ' + c.childElementCount);
			//	TODO: ensure the content of the repeated child is as expected
			c.removeEventListener('viewupdate', onViewUpdate);
			pass();
		}
		t.addEventListener('viewupdate', onViewUpdate);

		for (i = 0; i < 2000; i++) {
			a.push({
				name: 'A',
				age: 6,
				address: { street: 'some street 1' }
			});
		}
		window.modules.dataTier.Ties.obtain('usersA').data = a;
	});

	suite.run();
})();