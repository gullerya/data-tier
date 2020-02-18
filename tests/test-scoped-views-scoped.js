import { getSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const suite = getSuite({ name: 'Testing scoped views (scoped)' });

suite.runTest({ name: 'scoped - self' }, async test => {
	const sv = document.createElement('input');
	sv.setAttribute('data-tie-scope', '1');
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
	sv.setAttribute('data-tie-scope', '1');

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
	sv.setAttribute('data-tie-scope', '1');
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
	sv1.setAttribute('data-tie-scope', '1');
	sv2.setAttribute('data-tie-scope', '1');
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
	sv1.setAttribute('data-tie-scope', '1');
	sv2.setAttribute('data-tie-scope', '1');
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