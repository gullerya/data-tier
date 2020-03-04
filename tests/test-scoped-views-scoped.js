import { getSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const suite = getSuite({ name: 'Testing scoped views (scoped)' });

suite.runTest({ name: 'scoped - self' }, async test => {
	const sv = document.createElement('input');
	DataTier.ties.create(sv);
	sv.dataset.tie = 'scope:data.name';

	document.body.appendChild(sv);

	await test.waitNextMicrotask();
	test.assertEqual('', sv.value);
	const model = DataTier.ties.get(sv);
	model.data = { name: 'some' };
	test.assertEqual('some', sv.value);

	//	model to view
	model.data.name = 'else';
	test.assertEqual('else', sv.value);

	//	view to model
	sv.value = 'change again';
	sv.dispatchEvent(new Event('change'));
	await test.waitNextMicrotask();
	test.assertEqual('change again', model.data.name);
});

suite.runTest({ name: 'scoped - child a' }, async test => {
	const sv = document.createElement('div');
	DataTier.ties.create(sv);

	const iv = document.createElement('input');
	iv.dataset.tie = 'scope:data.name';

	sv.appendChild(iv);
	document.body.appendChild(sv);

	await test.waitNextMicrotask();
	test.assertEqual('', iv.value);
	const model = DataTier.ties.get(sv);
	model.data = { name: 'some' };
	test.assertEqual('some', iv.value);

	//	model to view
	model.data.name = 'else';
	test.assertEqual('else', iv.value);

	//	view to model
	iv.value = 'change again';
	iv.dispatchEvent(new Event('change'));
	await test.waitNextMicrotask();
	test.assertEqual('change again', model.data.name);
});

suite.runTest({ name: 'scoped - child b' }, async test => {
	const sv = document.createElement('div');
	const model = DataTier.ties.create(sv, { data: { name: 'some' } });

	const iv = document.createElement('span');
	iv.dataset.tie = 'scope:data.name';

	document.body.appendChild(sv);

	sv.appendChild(iv);
	await test.waitNextMicrotask();
	test.assertEqual('some', iv.textContent);

	model.data.name = 'else';
	test.assertEqual('else', iv.textContent);
});

suite.runTest({ name: 'scoped - move around' }, async test => {
	const sv1 = document.createElement('div');
	const sv2 = document.createElement('div');
	DataTier.ties.create(sv1);
	DataTier.ties.create(sv2);
	document.body.appendChild(sv1);
	document.body.appendChild(sv2);

	await test.waitNextMicrotask();

	const model1 = DataTier.ties.get(sv1);
	model1.data = { name: 'some1' };
	const model2 = DataTier.ties.get(sv2);
	model2.data = { name: 'some2' };

	const iv = document.createElement('span');
	iv.dataset.tie = 'scope:data.name';

	document.body.appendChild(iv);
	await test.waitNextMicrotask();
	test.assertEqual('', iv.textContent);

	sv1.appendChild(iv);
	await test.waitNextMicrotask();
	test.assertEqual('some1', iv.textContent);
	model1.data.name = 'else1';
	test.assertEqual('else1', iv.textContent);

	sv2.appendChild(iv);
	await test.waitNextMicrotask();
	test.assertEqual('some2', iv.textContent);
	model2.data.name = 'else2';
	test.assertEqual('else2', iv.textContent);
});

suite.runTest({ name: 'scoped - move around and changes flow' }, async test => {
	const sv1 = document.createElement('div');
	const sv2 = document.createElement('div');
	document.body.appendChild(sv1);
	document.body.appendChild(sv2);

	const model1 = DataTier.ties.create(sv1, { data: { name: 'some1' } });
	const model2 = DataTier.ties.create(sv2, { data: { name: 'some2' } });

	const iv = document.createElement('input');
	iv.dataset.tie = 'scope:data.name';

	document.body.appendChild(iv);
	await test.waitNextMicrotask();
	test.assertEqual('', iv.value);

	sv1.appendChild(iv);
	await test.waitNextMicrotask();
	test.assertEqual('some1', iv.value);
	model1.data.name = 'else1';
	test.assertEqual('else1', iv.value);
	iv.value = 'value1';
	iv.dispatchEvent(new Event('change'));
	await test.waitNextMicrotask();
	test.assertEqual('value1', model1.data.name);

	sv2.appendChild(iv);
	await test.waitNextMicrotask();
	test.assertEqual('some2', iv.value);
	model2.data.name = 'else2';
	test.assertEqual('else2', iv.value);
	iv.value = 'value2';
	iv.dispatchEvent(new Event('change'));
	await test.waitNextMicrotask();
	test.assertEqual('value2', model2.data.name);
	test.assertEqual('value1', model1.data.name);
});

suite.runTest({ name: 'scoped - nested scopes - views first' }, async test => {
	const tn = test.getRandom(8);
	const v = document.createElement('div');
	const m = DataTier.ties.create(tn, {
		firstName: 'first',
		lastName: 'last',
		address: {
			city: 'city',
			street: 'street'
		}
	});
	v.innerHTML = `
		<div data-tie="${tn} => scope">
			<span data-tie="scope:firstName"></span>
			<span data-tie="scope:lastName"></span>

			<div data-tie="scope:address => scope">
				<span data-tie="scope:city"></span>
				<span data-tie="scope:street"></span>
			</div>
		</div>
	`;

	document.body.appendChild(v);

	await test.waitNextMicrotask();

	test.assertEqual(m.firstName, v.firstElementChild.children[0].textContent);
	test.assertEqual(m.lastName, v.firstElementChild.children[1].textContent);
	test.assertEqual(m.address.city, v.firstElementChild.children[2].children[0].textContent);
	test.assertEqual(m.address.street, v.firstElementChild.children[2].children[1].textContent);

	m.firstName = 'FIRST';
	m.address.city = 'CITY';
	test.assertEqual(m.firstName, v.firstElementChild.children[0].textContent);
	test.assertEqual(m.address.city, v.firstElementChild.children[2].children[0].textContent);
});