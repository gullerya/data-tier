(() => {
	'use strict';

	let suite = Utils.JustTest.createSuite({name: 'Testing Arrays with Repeaters'}), users = [],
		oUsers = Observable.from(users);

	DataTier.ties.create('usersA', oUsers);

	let c = document.createElement('div'), t, c1, e1, e2, e3, e4, e5;
	t = document.createElement('template');
	c1 = document.createElement('div');
	e1 = document.createElement('span');
	e2 = document.createElement('span');
	e3 = document.createElement('span');
	e4 = document.createElement('span');
	e5 = document.createElement('span');
	t.dataset.tieList = 'usersA => user';
	e1.dataset.tieText = 'user.name';
	e2.dataset.tieText = 'user.age';
	e3.dataset.tieText = 'user.address.street';
	e4.textContent = 'Some plain text to test with';
	e5.dataset.tieText = 'user.index';
	c1.appendChild(e1);
	c1.appendChild(e2);
	c1.appendChild(e3);
	c1.appendChild(e4);
	c1.appendChild(e5);
	t.content.appendChild(c1);
	c.appendChild(t);
	c.style.cssText = 'position:relative;height:200px;overflow:auto';
	document.body.appendChild(c);

	suite.addTest({name: 'array binding - verification array as top level object'}, (pass, fail) => {
		setTimeout(() => {
			if (e1.textContent !== '') fail('preliminary check failed');
			if (e2.textContent !== '') fail('preliminary check failed');
			if (e3.textContent !== '') fail('preliminary check failed');

			oUsers.push({
				name: 'A',
				age: 5,
				address: {street: 'some street'}
			});

			setTimeout(() => {
				if (c.childElementCount !== 2) fail('expected child elements of repeater to be 2, found: ' + c.childElementCount);
				if (c.childNodes[1].childNodes[0].textContent !== 'A') fail('expected first repeated sub-child text to be "A", found: ' + c.childNodes[1].childNodes[0].textContent);
				if (c.childNodes[1].childNodes[1].textContent !== '5') fail('expected first repeated sub-child text to be "5", found: ' + c.childNodes[1].childNodes[1].textContent);
				if (c.childNodes[1].childNodes[2].textContent !== 'some street') fail('expected first repeated sub-child text to be "some street", found: ' + c.childNodes[1].childNodes[2].textContent);
				pass();
			}, 0);
		}, 0);
	});

	suite.addTest({name: 'array binding - verification array as subgraph'}, (pass, fail) => {
		let container = document.createElement('div'),
			user = {roles: []},
			oUser = Observable.from(user);

		DataTier.ties.create('userRoles', oUser);

		container.innerHTML = '<template data-tie-list="userRoles.roles => role"><span data-tie-text="role.name"></span></template>';
		document.body.appendChild(container);

		setTimeout(() => {
			if (container.children.length !== 1) fail('preliminary check failed, expected to have at this point only 1 child');

			oUser.roles.push({
				name: 'employee'
			});

			setTimeout(() => {
				if (container.children.length !== 2) fail('expected to have 2 children');
				pass();
			}, 0);
		}, 0);
	});

	suite.addTest({name: 'array binding - bulk update'}, (pass, fail) => {
		//	timeout need since the initial setup includes injection of the html about and it's preprocessing, which is made in async way
		setTimeout(() => {
			let d = [
				{
					name: 'A',
					age: 5,
					address: {street: 'some street 1'}
				},
				{
					name: 'B',
					age: 8,
					address: {street: 'some street 2'}
				},
				{
					name: 'C',
					age: 15,
					address: {street: 'some street 3'}
				},
				{
					name: 'D',
					age: 54,
					address: {street: 'some street 4'}
				},
				{
					name: 'E',
					age: 13,
					address: {street: 'some street 5'}
				}
			];

			DataTier.ties.get('usersA').data = d;

			setTimeout(() => {
				if (c.childElementCount !== d.length + 1) fail('expected child elements of repeater to be ' + (d.length + 1) + ', found: ' + c.childElementCount);
				for (let i = 0; i < d.length; i++) {
					if (c.childNodes[i + 1].childNodes[0].textContent !== d[i].name) fail('unexpected text content of repeated element ' + i + ' sub-child 0');
					if (c.childNodes[i + 1].childNodes[1].textContent !== d[i].age.toString()) fail('unexpected text content of repeated element ' + i + ' sub-child 1');
					if (c.childNodes[i + 1].childNodes[2].textContent !== d[i].address.street) fail('unexpected text content of repeated element ' + i + ' sub-child 2');
				}
				pass();
			}, 0);
		}, 0);
	});

	suite.addTest({name: 'array binding - reducing array (shift, pop, splice)'}, (pass, fail) => {
		//	timeout need since the initial setup includes injection of the html about and it's preprocessing, which is made in async way
		setTimeout(() => {
			let d = [
				{
					name: 'Azzz',
					age: 5,
					address: {street: 'some street 1'}
				},
				{
					name: 'Bzzz',
					age: 8,
					address: {street: 'some street 2'}
				},
				{
					name: 'Czzz',
					age: 15,
					address: {street: 'some street 3'}
				},
				{
					name: 'Dzzz',
					age: 54,
					address: {street: 'some street 4'}
				},
				{
					name: 'Ezzz',
					age: 13,
					address: {street: 'some street 5'}
				}
			];

			DataTier.ties.get('usersA').data = d;

			setTimeout(() => {
				if (c.childElementCount !== d.length + 1) fail('expected child elements of repeater to be ' + (d.length + 1) + ', found: ' + c.childElementCount);
				for (let i = 0; i < d.length; i++) {
					if (c.childNodes[i + 1].childNodes[0].textContent !== d[i].name) fail('unexpected text content of repeated element ' + i + ' sub-child 0');
					if (c.childNodes[i + 1].childNodes[1].textContent !== d[i].age.toString()) fail('unexpected text content of repeated element ' + i + ' sub-child 1');
					if (c.childNodes[i + 1].childNodes[2].textContent !== d[i].address.street) fail('unexpected text content of repeated element ' + i + ' sub-child 2');
				}

				DataTier.ties.get('usersA').data.shift();
				d.shift();
				setTimeout(() => {
					if (c.childElementCount !== d.length + 1) fail('expected child elements of repeater to be ' + (d.length + 1) + ', found: ' + c.childElementCount);
					for (let i = 0; i < d.length; i++) {
						if (c.childNodes[i + 1].childNodes[0].textContent !== d[i].name) fail('unexpected text content of repeated element ' + i + ' sub-child 0');
						if (c.childNodes[i + 1].childNodes[1].textContent !== d[i].age.toString()) fail('unexpected text content of repeated element ' + i + ' sub-child 1');
						if (c.childNodes[i + 1].childNodes[2].textContent !== d[i].address.street) fail('unexpected text content of repeated element ' + i + ' sub-child 2');
					}

					DataTier.ties.get('usersA').data.pop();
					d.pop();
					setTimeout(() => {
						if (c.childElementCount !== d.length + 1) fail('expected child elements of repeater to be ' + (d.length + 1) + ', found: ' + c.childElementCount);
						for (let i = 0; i < d.length; i++) {
							if (c.childNodes[i + 1].childNodes[0].textContent !== d[i].name) fail('unexpected text content of repeated element ' + i + ' sub-child 0');
							if (c.childNodes[i + 1].childNodes[1].textContent !== d[i].age.toString()) fail('unexpected text content of repeated element ' + i + ' sub-child 1');
							if (c.childNodes[i + 1].childNodes[2].textContent !== d[i].address.street) fail('unexpected text content of repeated element ' + i + ' sub-child 2');
						}

						DataTier.ties.get('usersA').data.splice(1, 1);
						d.splice(1, 1);
						setTimeout(() => {
							if (c.childElementCount !== d.length + 1) fail('expected child elements of repeater to be ' + (d.length + 1) + ', found: ' + c.childElementCount);
							for (let i = 0; i < d.length; i++) {
								if (c.childNodes[i + 1].childNodes[0].textContent !== d[i].name) fail('unexpected text content of repeated element ' + i + ' sub-child 0');
								if (c.childNodes[i + 1].childNodes[1].textContent !== d[i].age.toString()) fail('unexpected text content of repeated element ' + i + ' sub-child 1');
								if (c.childNodes[i + 1].childNodes[2].textContent !== d[i].address.street) fail('unexpected text content of repeated element ' + i + ' sub-child 2');
							}
							pass();
						}, 0);
					}, 0);
				}, 0);
			}, 0);
		}, 0);
	});

	suite.addTest({name: 'array binding - huge bulk update (20000 rows, mostly new)'}, (pass, fail) => {
		//	timeout need since the initial setup includes injection of the html about and it's pre-processing, which is made in async way
		setTimeout(() => {
			let a = [], i, rowsNumber = 20000;

			//	basic content inflation
			for (i = 0; i < rowsNumber; i++) {
				a.push({
					index: i,
					name: 'A',
					age: 6,
					address: {street: 'some street 1'}
				});
			}
			DataTier.ties.get('usersA').data = a;

			//	verifying inflation
			setTimeout(() => {
				if (c.childElementCount !== DataTier.ties.get('usersA').data.length + 1)
					fail('expected child elements of repeater to be ' + (DataTier.ties.get('usersA').data.length + 1) + ', found: ' + c.childElementCount);
				for (i = 0; i < DataTier.ties.get('usersA').data.length; i++) {
					if (c.childNodes[i + 1].childNodes[4].textContent !== DataTier.ties.get('usersA').data[i].index.toString())
						fail('expected text value ' + DataTier.ties.get('usersA').data[i].index + ', found: ' + c.childNodes[i + 1].childNodes[4].textContent);
				}

				//	mutating arbitrary element
				DataTier.ties.get('usersA').data[121].address.street = 'something new';

				//	verifying that the tying kept correct
				setTimeout(() => {
					if (c.childNodes[122].childNodes[2].textContent !== 'something new')
						fail('expected randomly mutated text to be "something new", found: ' + c.childNodes[122].childNodes[2].textContent);

					pass();
				}, 0);
			}, 0);
		}, 0);
	});

	suite.addTest({
		name: 'array binding - huge bulk update (20000 rows, updating due to unshift)'
	}, (pass, fail) => {
		//	timeout need since the initial setup includes injection of the html about and it's pre-processing, which is made in async way
		setTimeout(() => {

			//	massive change of the existing content
			DataTier.ties.get('usersA').data.sort((i1, i2) => {
				if (i1.index > i2.index) return -1;
				else return 1;
			});

			setTimeout(() => {
				//	verifying the massive update
				if (c.childElementCount !== DataTier.ties.get('usersA').data.length + 1)
					fail('expected child elements of repeater to be ' + (DataTier.ties.get('usersA').data.length + 1) + ', found: ' + c.childElementCount);
				for (let i = 0; i < DataTier.ties.get('usersA').data.length; i++) {
					if (c.childNodes[i + 1].childNodes[4].textContent !== DataTier.ties.get('usersA').data[i].index.toString())
						fail('expected text value ' + DataTier.ties.get('usersA').data[i].index + ', found: ' + c.childNodes[i + 1].childNodes[4].textContent);
				}

				//	mutating arbitrary element
				DataTier.ties.get('usersA').data[121].address.street = 'something new';

				//	verifying that the tying kept correct
				setTimeout(() => {
					if (c.childNodes[122].childNodes[2].textContent !== 'something new')
						fail('expected randomly mutated text to be "something new", found: ' + c.childNodes[122].childNodes[2].textContent);

					pass();
				}, 0);
			});

		}, 0);
	});

	suite.run();
})();