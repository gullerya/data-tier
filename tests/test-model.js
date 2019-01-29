import * as DataTier from '../dist/data-tier.js';

let suite = Utils.JustTest.createSuite({name: 'Testing model changes'}),
	user = {name: 'some', age: 7, address: {street: 'str', apt: 9}};

DataTier.ties.create('userA', user);

let s1, s2, s3, s4;
s1 = document.createElement('input');
s1.dataset.tie = 'userA:name => value';
document.body.appendChild(s1);
s2 = document.createElement('div');
s2.dataset.tie = 'userA:age => textContent';
document.body.appendChild(s2);
s3 = document.createElement('div');
s3.dataset.tie = 'userA:address.street => textContent';
document.body.appendChild(s3);
s4 = document.createElement('div');
s4.dataset.tie = 'userA:address.apt => textContent';
document.body.appendChild(s4);

suite.addTest({name: 'new model bound'}, (pass, fail) => {
	setTimeout(function () {
		if (s1.value !== user.name) fail(new Error('expected the content to be updated'));
		if (s2.textContent !== user.age.toString()) fail(new Error('expected the content to be updated'));
		if (s3.textContent !== user.address.street) fail(new Error('expected the content to be updated'));
		if (s4.textContent !== user.address.apt.toString()) fail(new Error('expected the content to be updated'));
		pass();
	}, 0);
});

suite.addTest({name: 'primitive model changes'}, (pass, fail) => {
	if (s1.value !== user.name) fail(new Error('preliminary check failed'));
	DataTier.ties.get('userA').model.name = 'other';
	if (s1.value !== 'other') fail(new Error('expected the content to be "other"'));
	pass();
});

suite.addTest({name: 'deep model changes (graph replace)'}, (pass, fail) => {
	DataTier.ties.get('userA').model.address.street = 'Street';

	if (s3.textContent !== DataTier.ties.get('userA').model.address.street) fail(new Error('expected the content to be "Street"'));
	pass();
});

suite.addTest({name: 'full model replace (to null)'}, (pass, fail) => {
	let t = DataTier.ties.get('userA');
	t.model = null;
	if (s1.value !== '') fail(new Error('expected the content to be emptied'));
	if (s2.textContent !== '') fail(new Error('expected the content to be emptied'));
	if (s3.textContent !== '') fail(new Error('expected the content to be emptied'));
	if (s4.textContent !== '') fail(new Error('expected the content to be emptied'));
	pass();
});

suite.addTest({name: 'full model replace (to new data)'}, (pass, fail) => {
	let t = DataTier.ties.get('userA');
	t.model = {name: 'something else', age: 6};
	setTimeout(function () {
		if (s1.value !== 'something else') fail(new Error('expected the content to be "something else"'));
		if (s2.textContent !== '6') fail(new Error('expected the content to be "6"'));
		if (s3.textContent !== '') fail(new Error('expected the content to be emptied'));
		if (s4.textContent !== '') fail(new Error('expected the content to be emptied'));
		pass();
	}, 0);
});

suite.addTest({name: 'binding view to object'}, (pass, fail) => {
	let t = DataTier.ties.get('userA');
	s3.dataset.tie = 'userA:address => textContent';
	if (s3.textContent !== '') fail(new Error('expected the content to be empty, found: ' + s3.textContent));
	t.model.address = {street: 'street name', apt: 17};
	t.model.address.toString = function () {
		return 'Street: ' + this.street + '; Apt: ' + this.apt
	};
	setTimeout(function () {
		if (s4.textContent !== '17') fail(new Error('expected the content to be 17'));
		if (s3.textContent !== t.model.address.toString()) fail(new Error('expected the content to be string of object'));
		pass();
	}, 0);
});

suite.run();