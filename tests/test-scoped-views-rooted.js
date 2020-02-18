import { getSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const suite = getSuite({ name: 'Testing scoped views (rooted)' });

suite.runTest({ name: 'scoped in shadow - flow a' }, async test => {
	const sv = document.createElement('div');
	sv.setAttribute('data-tie-scope', '1');

	const sh = sv.attachShadow({ mode: 'open' });
	const iv = document.createElement('span');
	iv.dataset.tie = 'scope:data.name';

	sh.appendChild(iv);
	document.body.appendChild(sv);

	await test.waitNextMicrotask();
	test.assertEqual('', iv.textContent);
	const model = DataTier.ties.create(sv, { data: { name: 'some' } });
	test.assertEqual('some', iv.textContent);

	model.data.name = 'else';
	test.assertEqual('else', iv.textContent);
});

suite.runTest({ name: 'scoped in shadow - flow b' }, async test => {
	const sv = document.createElement('div');
	sv.setAttribute('data-tie-scope', '1');
	const model = DataTier.ties.create(sv, { data: { name: 'some' } });

	const sh = sv.attachShadow({ mode: 'open' });
	const iv = document.createElement('span');
	iv.dataset.tie = 'scope:data.name';

	document.body.appendChild(sv);

	sh.appendChild(iv);
	await test.waitNextMicrotask();
	test.assertEqual('some', iv.textContent);

	model.data.name = 'else';
	test.assertEqual('else', iv.textContent);
});

suite.runTest({ name: 'scoped in shadow - move around' }, async test => {
	const sv1 = document.createElement('div');
	const sv2 = document.createElement('div');
	sv1.setAttribute('data-tie-scope', '1');
	sv2.setAttribute('data-tie-scope', '1');
	const sh1 = sv1.attachShadow({ mode: 'open' });
	const sh2 = sv2.attachShadow({ mode: 'open' });
	document.body.appendChild(sv1);
	document.body.appendChild(sv2);

	const model1 = DataTier.ties.create(sv1, { data: { name: 'some1' } });
	const model2 = DataTier.ties.create(sv2, { data: { name: 'some2' } });

	const iv = document.createElement('span');
	iv.dataset.tie = 'scope:data.name';

	document.body.appendChild(iv);
	await test.waitNextMicrotask();
	test.assertEqual('', iv.textContent);

	sh1.appendChild(iv);
	await test.waitNextMicrotask();
	test.assertEqual('some1', iv.textContent);
	model1.data.name = 'else1';
	test.assertEqual('else1', iv.textContent);

	sh2.appendChild(iv);
	await test.waitNextMicrotask();
	test.assertEqual('some2', iv.textContent);
	model2.data.name = 'else2';
	test.assertEqual('else2', iv.textContent);
});

suite.runTest({ name: 'scoped in shadow - move around and changes flow' }, async test => {
	const sv1 = document.createElement('div');
	const sv2 = document.createElement('div');
	sv1.setAttribute('data-tie-scope', '1');
	sv2.setAttribute('data-tie-scope', '1');
	const sh1 = sv1.attachShadow({ mode: 'open' });
	const sh2 = sv2.attachShadow({ mode: 'open' });
	document.body.appendChild(sv1);
	document.body.appendChild(sv2);

	const model1 = DataTier.ties.create(sv1, { data: { name: 'some1' } });
	const model2 = DataTier.ties.create(sv2, { data: { name: 'some2' } });

	const iv = document.createElement('input');
	iv.dataset.tie = 'scope:data.name';

	document.body.appendChild(iv);
	await test.waitNextMicrotask();
	test.assertEqual('', iv.value);

	sh1.appendChild(iv);
	await test.waitNextMicrotask();
	test.assertEqual('some1', iv.value);
	model1.data.name = 'else1';
	test.assertEqual('else1', iv.value);
	iv.value = 'value1';
	iv.dispatchEvent(new Event('change'));
	await test.waitNextMicrotask();
	test.assertEqual('value1', model1.data.name);

	sh2.appendChild(iv);
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