import { test } from '@gullerya/just-test';
import { assert } from '@gullerya/just-test/assert';
import { waitNextTask } from '@gullerya/just-test/timing';
import { getRandom } from '@gullerya/just-test/random';
import * as DataTier from '../dist/data-tier.js';


const user = { name: 'some', age: 7, address: { street: 'str', apt: 9 } };

test('new model bound', async () => {
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

	await waitNextTask();

	assert.equal(s1.value, user.name);
	assert.equal(s2.textContent, user.age.toString());
	assert.equal(s3.textContent, user.address.street);
	assert.equal(s4.textContent, user.address.apt.toString());
});

test('primitive model changes', async () => {
	DataTier.ties.create('modelB', user);

	const s1 = document.createElement('input');
	s1.dataset.tie = 'modelB:name => value';
	document.body.appendChild(s1);

	await waitNextTask();

	assert.equal(s1.value, user.name);
	DataTier.ties.get('modelB').name = 'other';
	assert.equal(s1.value, 'other');
});

test('deep model changes (graph replace)', async () => {
	DataTier.ties.create('modelC', user);

	const s3 = document.createElement('div');
	s3.dataset.tie = 'modelC:address.street => textContent';
	document.body.appendChild(s3);

	await waitNextTask();
	assert.equal(s3.textContent, 'str');

	DataTier.ties.get('modelC').address.street = 'Street';

	assert.equal(s3.textContent, DataTier.ties.get('modelC').address.street);
});

test('binding view to object', async () => {
	const
		s1 = document.createElement('input'),
		s2 = document.createElement('div'),
		s3 = document.createElement('div'),
		s4 = document.createElement('div');
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
	assert.equal(s3.textContent, '');
	t.address = { street: 'street name', apt: 17 };
	t.address.toString = function () {
		return 'Street: ' + this.street + '; Apt: ' + this.apt;
	};

	await waitNextTask();

	assert.equal(s4.textContent, '17');
	assert.equal(s3.textContent, t.address.toString());
});

test('deep model, NULL base', async () => {
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

	await waitNextTask();

	assert.equal('[object Object]', d1.textContent);
	assert.equal('', d2.textContent);
	assert.equal('', d3.textContent);
});

test('deep model, NULL IN path', async () => {
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

	await waitNextTask();

	assert.equal('[object Object]', d1.textContent);
	assert.equal('', d2.textContent);
	assert.equal('', d3.textContent);
});

//	nullish values should turn to empty string for
//	* textContent target
//	* value target of INPUT, SELECT, TEXTAREA
for (const nullish of [undefined, null]) {
	test(`'${nullish}' to empty string - textContent`, async () => {
		const tn = getRandom(8);
		DataTier.ties.create(tn, { p: nullish });

		const e1 = document.createElement('span');
		e1.dataset.tie = `${tn}:p`;
		document.body.appendChild(e1);
		await waitNextTask();
		assert.equal('', e1.textContent);

		const e2 = document.createElement('div');
		e2.dataset.tie = `${tn}:p => textContent`;
		document.body.appendChild(e2);
		await waitNextTask();
		assert.equal('', e2.textContent);
	});

	for (const inputish of ['input', 'select', 'textarea']) {
		test(`'${nullish}' to empty string - value - ${inputish}`, async () => {
			const tn = getRandom(8);
			DataTier.ties.create(tn, { v: nullish });

			const e1 = document.createElement(inputish);
			e1.dataset.tie = `${tn}:v`;
			document.body.appendChild(e1);
			await waitNextTask();
			assert.equal('', e1.textContent);

			const e2 = document.createElement(inputish);
			e2.dataset.tie = `${tn}:v => value`;
			document.body.appendChild(e2);
			await waitNextTask();
			assert.equal('', e2.textContent);
		});
	}

	test(`'${nullish}' preserved - value - non-input-like`, async () => {
		const tn = getRandom(8);
		DataTier.ties.create(tn, { p: nullish });

		const e = document.createElement('div');
		e.dataset.tie = `${tn}:p => value`;
		document.body.appendChild(e);
		await waitNextTask();
		assert.equal(nullish, e.value);
	});
}