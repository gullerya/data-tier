import { createSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const
	suite = createSuite({ name: 'Testing model changes' }),
	user = { name: 'some', age: 7, address: { street: 'str', apt: 9 } };

const
	s1 = document.createElement('input'),
	s2 = document.createElement('div'),
	s3 = document.createElement('div'),
	s4 = document.createElement('div');

s1.dataset.tie = 'userA:name => value';
document.body.appendChild(s1);
s2.dataset.tie = 'userA:age => textContent';
document.body.appendChild(s2);
s3.dataset.tie = 'userA:address.street => textContent';
document.body.appendChild(s3);
s4.dataset.tie = 'userA:address.apt => textContent';
document.body.appendChild(s4);

suite.addTest({ name: 'new model bound' }, async test => {
	DataTier.ties.create('userA', user);

	const
		s1 = document.createElement('input'),
		s2 = document.createElement('div'),
		s3 = document.createElement('div'),
		s4 = document.createElement('div');

	s1.dataset.tie = 'userA:name => value';
	document.body.appendChild(s1);
	s2.dataset.tie = 'userA:age => textContent';
	document.body.appendChild(s2);
	s3.dataset.tie = 'userA:address.street => textContent';
	document.body.appendChild(s3);
	s4.dataset.tie = 'userA:address.apt => textContent';
	document.body.appendChild(s4);

	await new Promise(resolve => setTimeout(resolve, 0));

	if (s1.value !== user.name) test.fail(new Error('expected the content to be updated'));
	if (s2.textContent !== user.age.toString()) test.fail(new Error('expected the content to be updated'));
	if (s3.textContent !== user.address.street) test.fail(new Error('expected the content to be updated'));
	if (s4.textContent !== user.address.apt.toString()) test.fail(new Error('expected the content to be updated'));

	DataTier.ties.remove('userA');
	test.pass();
});

suite.addTest({ name: 'primitive model changes' }, async test => {
	DataTier.ties.create('userB', user);

	const s1 = document.createElement('input');

	s1.dataset.tie = 'userB:name => value';
	document.body.appendChild(s1);

	await new Promise(resolve => setTimeout(resolve, 0));

	if (s1.value !== user.name) test.fail(new Error('preliminary check failed'));
	DataTier.ties.get('userB').model.name = 'other';
	if (s1.value !== 'other') test.fail(new Error('expected the content to be "other"'));
	DataTier.ties.remove('userB');
	test.pass();
});

suite.addTest({ name: 'deep model changes (graph replace)' }, test => {
	DataTier.ties.create('userC', user);

	const s3 = document.createElement('div');

	s3.dataset.tie = 'userC:address.street => textContent';
	document.body.appendChild(s3);

	DataTier.ties.get('userC').model.address.street = 'Street';

	if (s3.textContent !== DataTier.ties.get('userC').model.address.street) test.fail(new Error('expected the content to be "Street"'));

	DataTier.ties.remove('userC');
	test.pass();
});

suite.addTest({ name: 'full model replace (to null)' }, test => {
	const
		s1 = document.createElement('input'),
		s2 = document.createElement('div'),
		s3 = document.createElement('div'),
		s4 = document.createElement('div');

	s1.dataset.tie = 'userD:name => value';
	document.body.appendChild(s1);
	s2.dataset.tie = 'userD:age => textContent';
	document.body.appendChild(s2);
	s3.dataset.tie = 'userD:address.street => textContent';
	document.body.appendChild(s3);
	s4.dataset.tie = 'userD:address.apt => textContent';
	document.body.appendChild(s4);

	const t = DataTier.ties.create('userD', user);
	t.model = null;
	if (s1.value !== '') test.fail(new Error('expected the content to be emptied'));
	if (s2.textContent !== '') test.fail(new Error('expected the content to be emptied'));
	if (s3.textContent !== '') test.fail(new Error('expected the content to be emptied'));
	if (s4.textContent !== '') test.fail(new Error('expected the content to be emptied'));
	DataTier.ties.remove('userD');
	test.pass();
});

suite.addTest({ name: 'full model replace (to new data)' }, async test => {
	const t = DataTier.ties.create('userA', user);
	t.model = { name: 'something else', age: 6 };

	await new Promise(resolve => setTimeout(resolve, 0));

	if (s1.value !== 'something else') test.fail(new Error('expected the content to be "something else"'));
	if (s2.textContent !== '6') test.fail(new Error('expected the content to be "6"'));
	if (s3.textContent !== '') test.fail(new Error('expected the content to be emptied'));
	if (s4.textContent !== '') test.fail(new Error('expected the content to be emptied'));

	DataTier.ties.remove('userA');
	test.pass();
});

suite.addTest({ name: 'binding view to object' }, async test => {
	const t = DataTier.ties.create('userA', user);

	s3.dataset.tie = 'userA:address => textContent';
	if (s3.textContent !== '') test.fail(new Error('expected the content to be empty, found: ' + s3.textContent));
	t.model.address = { street: 'street name', apt: 17 };
	t.model.address.toString = function () {
		return 'Street: ' + this.street + '; Apt: ' + this.apt
	};

	await new Promise(resolve => setTimeout(resolve, 0));

	if (s4.textContent !== '17') test.fail(new Error('expected the content to be 17'));
	if (s3.textContent !== t.model.address.toString()) test.fail(new Error('expected the content to be string of object'));

	DataTier.ties.remove('userA');
	test.pass();
});

suite.run();