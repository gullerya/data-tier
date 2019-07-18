import { createSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const
	suite = createSuite({ name: 'Testing model changes' }),
	user = { name: 'some', age: 7, address: { street: 'str', apt: 9 } };

suite.addTest({ name: 'new model bound' }, async test => {
	DataTier.ties.create('modelA', user);

	const
		s1 = document.createElement('input'),
		s2 = document.createElement('div'),
		s3 = document.createElement('div'),
		s4 = document.createElement('div');
	s1.dataset.tie = 'modelA:name => value';
	document.body.appendChild(s1);
	s2.dataset.tie = 'modelA:age => textContent';
	document.body.appendChild(s2);
	s3.dataset.tie = 'modelA:address.street => textContent';
	document.body.appendChild(s3);
	s4.dataset.tie = 'modelA:address.apt => textContent';
	document.body.appendChild(s4);

	await test.waitNextMicrotask();

	test.assertEqual(s1.value, user.name);
	test.assertEqual(s2.textContent, user.age.toString());
	test.assertEqual(s3.textContent, user.address.street);
	test.assertEqual(s4.textContent, user.address.apt.toString());

	test.pass();
});

suite.addTest({ name: 'primitive model changes' }, async test => {
	DataTier.ties.create('modelB', user);

	const s1 = document.createElement('input');
	s1.dataset.tie = 'modelB:name => value';
	document.body.appendChild(s1);

	await test.waitNextMicrotask();

	test.assertEqual(s1.value, user.name);
	DataTier.ties.get('modelB').model.name = 'other';
	test.assertEqual(s1.value, 'other');

	test.pass();
});

suite.addTest({ name: 'deep model changes (graph replace)' }, async test => {
	DataTier.ties.create('modelC', user);

	const s3 = document.createElement('div');
	s3.dataset.tie = 'modelC:address.street => textContent';
	document.body.appendChild(s3);

	await test.waitNextMicrotask();
	test.assertEqual(s3.textContent, 'str');

	DataTier.ties.get('modelC').model.address.street = 'Street';

	test.assertEqual(s3.textContent, DataTier.ties.get('modelC').model.address.street);

	test.pass();
});

suite.addTest({ name: 'full model replace (to null)' }, test => {
	const
		s1 = document.createElement('input'),
		s2 = document.createElement('div'),
		s3 = document.createElement('div'),
		s4 = document.createElement('div')
	s1.dataset.tie = 'modelD:name => value';
	document.body.appendChild(s1);
	s2.dataset.tie = 'modelD:age => textContent';
	document.body.appendChild(s2);
	s3.dataset.tie = 'modelD:address.street => textContent';
	document.body.appendChild(s3);
	s4.dataset.tie = 'modelD:address.apt => textContent';
	document.body.appendChild(s4);

	const t = DataTier.ties.create('modelD', user);
	t.model = null;
	test.assertEqual(s1.value, '');
	test.assertEqual(s2.textContent, '');
	test.assertEqual(s3.textContent, '');
	test.assertEqual(s4.textContent, '');

	test.pass();
});

suite.addTest({ name: 'full model replace (to new data)' }, async test => {
	const
		s1 = document.createElement('input'),
		s2 = document.createElement('div'),
		s3 = document.createElement('div'),
		s4 = document.createElement('div')
	s1.dataset.tie = 'modelE:name => value';
	document.body.appendChild(s1);
	s2.dataset.tie = 'modelE:age => textContent';
	document.body.appendChild(s2);
	s3.dataset.tie = 'modelE:address.street => textContent';
	document.body.appendChild(s3);
	s4.dataset.tie = 'modelE:address.apt => textContent';
	document.body.appendChild(s4);

	const t = DataTier.ties.create('modelE', user);
	t.model = { name: 'something else', age: 6 };

	await test.waitNextMicrotask();

	test.assertEqual(s1.value, 'something else');
	test.assertEqual(s2.textContent, '6');
	test.assertEqual(s3.textContent, '');
	test.assertEqual(s4.textContent, '');

	test.pass();
});

suite.addTest({ name: 'binding view to object' }, async test => {
	const
		s1 = document.createElement('input'),
		s2 = document.createElement('div'),
		s3 = document.createElement('div'),
		s4 = document.createElement('div')
	s1.dataset.tie = 'modelF:name => value';
	document.body.appendChild(s1);
	s2.dataset.tie = 'modelF:age => textContent';
	document.body.appendChild(s2);
	s3.dataset.tie = 'modelF:address.street => textContent';
	document.body.appendChild(s3);
	s4.dataset.tie = 'modelF:address.apt => textContent';
	document.body.appendChild(s4);
	const t = DataTier.ties.create('modelF', user);

	s3.dataset.tie = 'modelF:address => textContent';
	test.assertEqual(s3.textContent, '');
	t.model.address = { street: 'street name', apt: 17 };
	t.model.address.toString = function () {
		return 'Street: ' + this.street + '; Apt: ' + this.apt
	};

	await test.waitNextMicrotask();

	test.assertEqual(s4.textContent, '17');
	test.assertEqual(s3.textContent, t.model.address.toString());

	test.pass();
});

suite.run();