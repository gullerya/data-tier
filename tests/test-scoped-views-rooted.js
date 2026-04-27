import { test } from '@gullerya/just-test';
import { assert } from '@gullerya/just-test/assert';
import { waitNextTask } from '@gullerya/just-test/timing';
import * as DataTier from '../dist/data-tier.js?inst=scope-rooted';

test('scoped in shadow - flow a', async () => {
	const sv = document.createElement('div');
	DataTier.ties.create(sv);

	const sh = sv.attachShadow({ mode: 'open' });
	const iv = document.createElement('span');
	iv.dataset.tie = 'scope:data.name';

	sh.appendChild(iv);
	document.body.appendChild(sv);

	await waitNextTask();
	assert.equal('', iv.textContent);
	const model = DataTier.ties.get(sv);
	model.data = { name: 'some' };
	assert.equal('some', iv.textContent);

	model.data.name = 'else';
	assert.equal('else', iv.textContent);
});

test('scoped in shadow - flow b', async () => {
	const sv = document.createElement('div');
	const model = DataTier.ties.create(sv, { data: { name: 'some' } });

	const sh = sv.attachShadow({ mode: 'open' });
	const iv = document.createElement('span');
	iv.dataset.tie = 'scope:data.name';

	document.body.appendChild(sv);
	sh.appendChild(iv);
	await waitNextTask();
	assert.equal('some', iv.textContent);

	model.data.name = 'else';
	assert.equal('else', iv.textContent);
});

test('scoped in shadow - move around', async () => {
	const sv1 = document.createElement('div');
	const sv2 = document.createElement('div');
	const sh1 = sv1.attachShadow({ mode: 'open' });
	const sh2 = sv2.attachShadow({ mode: 'open' });
	document.body.appendChild(sv1);
	document.body.appendChild(sv2);

	const model1 = DataTier.ties.create(sv1, { data: { name: 'some1' } });
	const model2 = DataTier.ties.create(sv2, { data: { name: 'some2' } });

	const iv = document.createElement('span');
	iv.dataset.tie = 'scope:data.name';

	document.body.appendChild(iv);
	await waitNextTask();
	assert.equal('', iv.textContent);

	sh1.appendChild(iv);
	await waitNextTask();
	assert.equal('some1', iv.textContent);
	model1.data.name = 'else1';
	assert.equal('else1', iv.textContent);

	sh2.appendChild(iv);
	await waitNextTask();
	assert.equal('some2', iv.textContent);
	model2.data.name = 'else2';
	assert.equal('else2', iv.textContent);
});

test('scoped in shadow - move around and changes flow', async () => {
	const sv1 = document.createElement('div');
	const sv2 = document.createElement('div');
	DataTier.ties.create(sv1);
	DataTier.ties.create(sv2);
	const sh1 = sv1.attachShadow({ mode: 'open' });
	const sh2 = sv2.attachShadow({ mode: 'open' });
	document.body.appendChild(sv1);
	document.body.appendChild(sv2);

	await waitNextTask();

	const model1 = DataTier.ties.get(sv1);
	model1.data = { name: 'some1' };
	const model2 = DataTier.ties.get(sv2);
	model2.data = { name: 'some2' };

	const iv = document.createElement('input');
	iv.dataset.tie = 'scope:data.name';

	document.body.appendChild(iv);
	await waitNextTask();
	assert.equal('', iv.value);

	sh1.appendChild(iv);
	await waitNextTask();
	assert.equal('some1', iv.value);
	model1.data.name = 'else1';
	assert.equal('else1', iv.value);
	iv.value = 'value1';
	iv.dispatchEvent(new Event('change'));
	await waitNextTask();
	assert.equal('value1', model1.data.name);

	sh2.appendChild(iv);
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

test('move scoped view from scope to scope', async () => {
	//	create scope 1
	const s1 = document.createElement('div');
	DataTier.ties.create(s1, { data: 'scope1' });
	document.body.appendChild(s1);

	//	create scope 2
	const s2 = document.createElement('div');
	DataTier.ties.create(s2, { data: 'scope2' });
	document.body.appendChild(s2);

	//	create scoped view
	const sv = document.createElement('span');
	sv.dataset.tie = 'scope:data';

	//	1. append to body - no effect expected
	document.body.appendChild(sv);
	await waitNextTask();
	assert.equal('', sv.textContent);

	//	2. append to scope A - assert value
	s1.appendChild(sv);
	await waitNextTask();
	assert.equal('scope1', sv.textContent);

	//	3. append to scope B - assert value
	s2.appendChild(sv);
	await waitNextTask();
	assert.equal('scope2', sv.textContent);
});