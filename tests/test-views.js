(() => {
	'use strict';

	let suite = Utils.JustTest.createSuite({name: 'Testing views changes'}),
		user = {name: 'some name', age: 7, address: {street: 'str', apt: 9}},
		observableUser = Observable.from(user);

	DataTier.ties.create('userB', observableUser);

	let s1, s2, s3, s4;
	s1 = document.createElement('div');
	s1.dataset.tieText = 'userB.name';
	document.body.appendChild(s1);
	s2 = document.createElement('div');
	s2.dataset.tieText = 'userB.age';
	document.body.appendChild(s2);
	s3 = document.createElement('div');
	s3.dataset.tieText = 'userB.address.street';
	document.body.appendChild(s3);
	s4 = document.createElement('div');
	s4.dataset.tieText = 'userB.address.apt';
	document.body.appendChild(s4);

	suite.addTest({name: 'update view when path changes (deep)'}, (pass, fail) => {
		setTimeout(() => {
			if (s1.textContent !== user.name) fail(new Error('preliminary check failed'));
			s1.dataset.tieText = 'userB.address.street';
			setTimeout(() => {
				if (s1.textContent !== user.address.street) fail(new Error('expected the content to be "' + user.address.street + '"; found: "' + s1.textContent + '"'));
				pass();
			}, 0);
		}, 0);
	});

	suite.addTest({name: 'adding new view (zero depth) with path defined'}, (pass, fail) => {
		let newEl = document.createElement('div');
		newEl.dataset.tieText = 'userB.name';
		document.body.appendChild(newEl);
		setTimeout(() => {
			if (newEl.textContent !== user.name) fail(new Error('expected the content to be "' + user.name + '"'));
			pass();
		}, 0);
	});

	suite.addTest({name: 'adding few views (with depth) with paths defined'}, (pass, fail) => {
		let newElA = document.createElement('div'), newElB = document.createElement('div');
		newElA.dataset.tieText = 'userB.name';
		newElB.dataset.tieText = 'userB.address.apt';
		document.body.appendChild(newElA);
		document.body.appendChild(newElB);
		setTimeout(() => {
			if (newElA.textContent !== user.name) fail(new Error('expected the content to be "' + user.name + '"'));
			if (newElB.textContent != user.address.apt) fail(new Error('expected the content to be "' + user.address.apt + '"'));
			pass();
		}, 0);
	});

	suite.addTest({name: 'adding checkbox view and verifying its value set correctly'}, (pass, fail) => {
		let newEl = document.createElement('input');
		newEl.type = 'checkbox';
		newEl.dataset.tieValue = 'cbValueTest.test';
		document.body.appendChild(newEl);
		DataTier.ties.create('cbValueTest', Observable.from({test: true}));
		setTimeout(() => {
			if (newEl.checked !== true) fail(new Error('expected the value to be "true", but found "' + newEl.checked + '"'));
			pass();
		}, 0);
	});

	suite.addTest({name: 'verify that falsish values (0, false, \'\') are visualized correctly'}, (pass, fail) => {
		let newEl = document.createElement('div');
		DataTier.ties.create('falsishTest', {test: 0});
		document.body.appendChild(newEl);
		newEl.dataset.tieText = 'falsishTest.test';
		setTimeout(() => {
			if (newEl.textContent !== '0') fail(new Error('expected the value to be "0", but found "' + newEl.textContent + '"'));

			DataTier.ties.get('falsishTest').data.test = false;
			if (newEl.textContent !== 'false') fail(new Error('expected the value to be "false", but found "' + newEl.textContent + '"'));

			DataTier.ties.get('falsishTest').data.test = '';
			if (newEl.textContent !== '') fail(new Error('expected the value to be "", but found "' + newEl.textContent + '"'));

			DataTier.ties.get('falsishTest').data.test = null;
			if (newEl.textContent !== '') fail(new Error('expected the value to be "", but found "' + newEl.textContent + '"'));

			pass();
		}, 0);
	});

	suite.run();
})();