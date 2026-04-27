import { test } from '@gullerya/just-test';
import { assert } from '@gullerya/just-test/assert';
import { waitNextTask } from '@gullerya/just-test/timing';
import { getRandom } from '@gullerya/just-test/random';
import * as DataTier from '../dist/data-tier.js';


test('scoped - self', async () => {
	const sv = document.createElement('input');
	DataTier.ties.create(sv);
	sv.dataset.tie = 'scope:data.name';

	document.body.appendChild(sv);

	await waitNextTask();
	assert.equal('', sv.value);
	const model = DataTier.ties.get(sv);
	model.data = { name: 'some' };
	assert.equal('some', sv.value);

	//	model to view
	model.data.name = 'else';
	assert.equal('else', sv.value);

	//	view to model
	sv.value = 'change again';
	sv.dispatchEvent(new Event('change'));
	await waitNextTask();
	assert.equal('change again', model.data.name);
});

test('scoped - child a', async () => {
	const sv = document.createElement('div');
	DataTier.ties.create(sv);

	const iv = document.createElement('input');
	iv.dataset.tie = 'scope:data.name';

	sv.appendChild(iv);
	document.body.appendChild(sv);

	await waitNextTask();
	assert.equal('', iv.value);
	const model = DataTier.ties.get(sv);
	model.data = { name: 'some' };
	assert.equal('some', iv.value);

	//	model to view
	model.data.name = 'else';
	assert.equal('else', iv.value);

	//	view to model
	iv.value = 'change again';
	iv.dispatchEvent(new Event('change'));
	await waitNextTask();
	assert.equal('change again', model.data.name);
});

test('scoped - child b', async () => {
	const sv = document.createElement('div');
	const model = DataTier.ties.create(sv, { data: { name: 'some' } });

	const iv = document.createElement('span');
	iv.dataset.tie = 'scope:data.name';

	document.body.appendChild(sv);

	sv.appendChild(iv);
	await waitNextTask();
	assert.equal('some', iv.textContent);

	model.data.name = 'else';
	assert.equal('else', iv.textContent);
});

test('scoped - move around', async () => {
	const sv1 = document.createElement('div');
	const sv2 = document.createElement('div');
	DataTier.ties.create(sv1);
	DataTier.ties.create(sv2);
	document.body.appendChild(sv1);
	document.body.appendChild(sv2);

	await waitNextTask();

	const model1 = DataTier.ties.get(sv1);
	model1.data = { name: 'some1' };
	const model2 = DataTier.ties.get(sv2);
	model2.data = { name: 'some2' };

	const iv = document.createElement('span');
	iv.dataset.tie = 'scope:data.name';

	document.body.appendChild(iv);
	await waitNextTask();
	assert.equal('', iv.textContent);

	sv1.appendChild(iv);
	await waitNextTask();
	assert.equal('some1', iv.textContent);
	model1.data.name = 'else1';
	assert.equal('else1', iv.textContent);

	sv2.appendChild(iv);
	await waitNextTask();
	assert.equal('some2', iv.textContent);
	model2.data.name = 'else2';
	assert.equal('else2', iv.textContent);
});

test('scoped - move around and changes flow', async () => {
	const sv1 = document.createElement('div');
	const sv2 = document.createElement('div');
	document.body.appendChild(sv1);
	document.body.appendChild(sv2);

	const model1 = DataTier.ties.create(sv1, { data: { name: 'some1' } });
	const model2 = DataTier.ties.create(sv2, { data: { name: 'some2' } });

	const iv = document.createElement('input');
	iv.dataset.tie = 'scope:data.name';

	document.body.appendChild(iv);
	await waitNextTask();
	assert.equal('', iv.value);

	sv1.appendChild(iv);
	await waitNextTask();
	assert.equal('some1', iv.value);
	model1.data.name = 'else1';
	assert.equal('else1', iv.value);
	iv.value = 'value1';
	iv.dispatchEvent(new Event('change'));
	await waitNextTask();
	assert.equal('value1', model1.data.name);

	sv2.appendChild(iv);
	await waitNextTask();
	assert.equal('some2', iv.value);
	model2.data.name = 'else2';
	assert.equal('else2', iv.value);
	iv.value = 'value2';
	iv.dispatchEvent(new Event('change'));
	await waitNextTask();
	assert.equal('value2', model2.data.name);
	assert.equal('value1', model1.data.name);
});

test('scoped - nested scopes - views first', async () => {
	const tn = getRandom(8);
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

	await waitNextTask();

	assert.equal(m.firstName, v.firstElementChild.children[0].textContent);
	assert.equal(m.lastName, v.firstElementChild.children[1].textContent);
	assert.equal(m.address.city, v.firstElementChild.children[2].children[0].textContent);
	assert.equal(m.address.street, v.firstElementChild.children[2].children[1].textContent);

	m.firstName = 'FIRST';
	m.address.city = 'CITY';
	assert.equal(m.firstName, v.firstElementChild.children[0].textContent);
	assert.equal(m.address.city, v.firstElementChild.children[2].children[0].textContent);
});