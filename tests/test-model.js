import { getSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../src/data-tier.js';

const
	suite = getSuite({ name: 'Testing model changes' }),
	user = { name: 'some', age: 7, address: { street: 'str', apt: 9 } };

suite.runTest({ name: 'new model bound' }, async test => {
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
});

suite.runTest({ name: 'primitive model changes' }, async test => {
	DataTier.ties.create('modelB', user);

	const s1 = document.createElement('input');
	s1.dataset.tie = 'modelB:name => value';
	document.body.appendChild(s1);

	await test.waitNextMicrotask();

	test.assertEqual(s1.value, user.name);
	DataTier.ties.get('modelB').name = 'other';
	test.assertEqual(s1.value, 'other');
});

suite.runTest({ name: 'deep model changes (graph replace)' }, async test => {
	DataTier.ties.create('modelC', user);

	const s3 = document.createElement('div');
	s3.dataset.tie = 'modelC:address.street => textContent';
	document.body.appendChild(s3);

	await test.waitNextMicrotask();
	test.assertEqual(s3.textContent, 'str');

	DataTier.ties.get('modelC').address.street = 'Street';

	test.assertEqual(s3.textContent, DataTier.ties.get('modelC').address.street);
});

suite.runTest({ name: 'binding view to object' }, async test => {
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

	s3.dataset.tie = 'modelF:address';
	test.assertEqual(s3.textContent, '');
	t.address = { street: 'street name', apt: 17 };
	t.address.toString = function () {
		return 'Street: ' + this.street + '; Apt: ' + this.apt
	};

	await test.waitNextMicrotask();

	test.assertEqual(s4.textContent, '17');
	test.assertEqual(s3.textContent, t.address.toString());
});

suite.runTest({ name: 'deep model, NULL base' }, async test => {
	DataTier.ties.create('testNullBase', {
		address: null
	});
	const
		d1 = document.createElement('div'),
		d2 = document.createElement('div'),
		d3 = document.createElement('div');
	d1.dataset.tie = 'testNullBase';
	d2.dataset.tie = 'testNullBase:address';
	d3.dataset.tie = 'testNullBase:address.city';
	document.body.appendChild(d1);
	document.body.appendChild(d2);
	document.body.appendChild(d3);

	await test.waitNextMicrotask();

	test.assertEqual('[object Object]', d1.textContent);
	test.assertEqual('', d2.textContent);
	test.assertEqual('', d3.textContent);
});

suite.runTest({ name: 'deep model, NULL IN path' }, async test => {
	DataTier.ties.create('testNullIn', {
		user: {
			address: null
		}
	});
	const
		d1 = document.createElement('div'),
		d2 = document.createElement('div'),
		d3 = document.createElement('div');
	d1.dataset.tie = 'testNullIn';
	d2.dataset.tie = 'testNullIn:user.address';
	d3.dataset.tie = 'testNullIn:user.address.city';
	document.body.appendChild(d1);
	document.body.appendChild(d2);
	document.body.appendChild(d3);

	await test.waitNextMicrotask();

	test.assertEqual('[object Object]', d1.textContent);
	test.assertEqual('', d2.textContent);
	test.assertEqual('', d3.textContent);
});