import { createSuite } from '../node_modules/just-test/dist/just-test.min.js';
import { ties } from '../dist/data-tier.js';
import { extractViewParams } from '../dist/dt-utils.js';

const suite = createSuite({ name: 'Testing tie params' });

//	tie param structure is defined as following:
//	{
//		tieKey: <string>,
//		rawPath: <string>,
//		path: <string[]>,
//		targetProperty: <string>
//	}

//	single
//
suite.runTest({ name: 'no param defined' }, test => {
	const el = document.createElement('div');
	const vp = extractViewParams(el);
	test.assertEqual(null, vp);
});

suite.runTest({ name: 'single param - full' }, test => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieName:path.to.go => data';

	const vps = extractViewParams(el);
	test.assertTrue(Array.isArray(vps));
	test.assertEqual(1, vps.length);

	const vp = vps[0];
	test.assertEqual('tieName', vp.tieKey);
	test.assertEqual('path.to.go', vp.rawPath);
	test.assertTrue(Array.isArray(vp.path));
	test.assertEqual(3, vp.path.length);
	test.assertEqual('data', vp.targetProperty);
});

suite.runTest({ name: 'single param - short' }, test => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieName:path.to.go';

	const vps = extractViewParams(el);
	test.assertTrue(Array.isArray(vps));
	test.assertEqual(1, vps.length);

	const vp = vps[0];
	test.assertEqual('tieName', vp.tieKey);
	test.assertEqual('path.to.go', vp.rawPath);
	test.assertTrue(Array.isArray(vp.path));
	test.assertEqual(3, vp.path.length);
	test.assertEqual('textContent', vp.targetProperty);
});

suite.runTest({ name: 'single param - short (short path)' }, test => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieName:path';

	const vps = extractViewParams(el);
	test.assertTrue(Array.isArray(vps));
	test.assertEqual(1, vps.length);

	const vp = vps[0];
	test.assertEqual('tieName', vp.tieKey);
	test.assertEqual('path', vp.rawPath);
	test.assertTrue(Array.isArray(vp.path));
	test.assertEqual(1, vp.path.length);
	test.assertEqual('textContent', vp.targetProperty);
});

suite.runTest({ name: 'single param - root' }, test => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieName';

	const vps = extractViewParams(el);
	test.assertTrue(Array.isArray(vps));
	test.assertEqual(1, vps.length);

	const vp = vps[0];
	test.assertEqual('tieName', vp.tieKey);
	test.assertEqual('', vp.rawPath);
	test.assertTrue(Array.isArray(vp.path));
	test.assertEqual(0, vp.path.length);
	test.assertEqual('textContent', vp.targetProperty);
});

suite.runTest({ name: 'single param - long with root' }, test => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieName => data';

	const vps = extractViewParams(el);
	test.assertTrue(Array.isArray(vps));
	test.assertEqual(1, vps.length);

	const vp = vps[0];
	test.assertEqual('tieName', vp.tieKey);
	test.assertEqual('', vp.rawPath);
	test.assertTrue(Array.isArray(vp.path));
	test.assertEqual(0, vp.path.length);
	test.assertEqual('data', vp.targetProperty);
});

//	multi
//
suite.runTest({ name: 'multi param - full' }, test => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieNameA:path.to.go => data, tieNameB:other.path => test';

	const vps = extractViewParams(el);
	test.assertTrue(Array.isArray(vps));
	test.assertEqual(2, vps.length);

	let vp = vps[0];
	test.assertEqual('tieNameA', vp.tieKey);
	test.assertEqual('path.to.go', vp.rawPath);
	test.assertTrue(Array.isArray(vp.path));
	test.assertEqual(3, vp.path.length);
	test.assertEqual('data', vp.targetProperty);
	vp = vps[1];
	test.assertEqual('tieNameB', vp.tieKey);
	test.assertEqual('other.path', vp.rawPath);
	test.assertTrue(Array.isArray(vp.path));
	test.assertEqual(2, vp.path.length);
	test.assertEqual('test', vp.targetProperty);
});

suite.runTest({ name: 'multi param - short' }, test => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieNameA:path.to.go => data, tieNameB:other.path';

	const vps = extractViewParams(el);
	test.assertTrue(Array.isArray(vps));
	test.assertEqual(2, vps.length);

	let vp = vps[0];
	test.assertEqual('tieNameA', vp.tieKey);
	test.assertEqual('path.to.go', vp.rawPath);
	test.assertTrue(Array.isArray(vp.path));
	test.assertEqual(3, vp.path.length);
	test.assertEqual('data', vp.targetProperty);
	vp = vps[1];
	test.assertEqual('tieNameB', vp.tieKey);
	test.assertEqual('other.path', vp.rawPath);
	test.assertTrue(Array.isArray(vp.path));
	test.assertEqual(2, vp.path.length);
	test.assertEqual('textContent', vp.targetProperty);
});

suite.runTest({ name: 'multi param - short (short path)' }, test => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieNameA:path => data, tieNameB:path';

	const vps = extractViewParams(el);
	test.assertTrue(Array.isArray(vps));
	test.assertEqual(2, vps.length);

	let vp = vps[0];
	test.assertEqual('tieNameA', vp.tieKey);
	test.assertEqual('path', vp.rawPath);
	test.assertTrue(Array.isArray(vp.path));
	test.assertEqual(1, vp.path.length);
	test.assertEqual('data', vp.targetProperty);
	vp = vps[1];
	test.assertEqual('tieNameB', vp.tieKey);
	test.assertEqual('path', vp.rawPath);
	test.assertTrue(Array.isArray(vp.path));
	test.assertEqual(1, vp.path.length);
	test.assertEqual('textContent', vp.targetProperty);
});

suite.runTest({ name: 'multi param - root' }, test => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieNameA => data, tieNameB';

	const vps = extractViewParams(el);
	test.assertTrue(Array.isArray(vps));
	test.assertEqual(2, vps.length);

	let vp = vps[0];
	test.assertEqual('tieNameA', vp.tieKey);
	test.assertEqual('', vp.rawPath);
	test.assertTrue(Array.isArray(vp.path));
	test.assertEqual(0, vp.path.length);
	test.assertEqual('data', vp.targetProperty);
	vp = vps[1];
	test.assertEqual('tieNameB', vp.tieKey);
	test.assertEqual('', vp.rawPath);
	test.assertTrue(Array.isArray(vp.path));
	test.assertEqual(0, vp.path.length);
	test.assertEqual('textContent', vp.targetProperty);
});

suite.runTest({ name: 'multi param - long with root' }, test => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieNameA => data, tieNameB => some';

	const vps = extractViewParams(el);
	test.assertTrue(Array.isArray(vps));
	test.assertEqual(2, vps.length);

	let vp = vps[0];
	test.assertEqual('tieNameA', vp.tieKey);
	test.assertEqual('', vp.rawPath);
	test.assertTrue(Array.isArray(vp.path));
	test.assertEqual(0, vp.path.length);
	test.assertEqual('data', vp.targetProperty);
	vp = vps[1];
	test.assertEqual('tieNameB', vp.tieKey);
	test.assertEqual('', vp.rawPath);
	test.assertTrue(Array.isArray(vp.path));
	test.assertEqual(0, vp.path.length);
	test.assertEqual('some', vp.targetProperty);
});

suite.runTest({ name: 'multi param - duplicate target (explicit) - negative' }, test => {
	const originalConsoleError = console.error;
	const consoleErrorMessages = [];
	console.error = m => consoleErrorMessages.push(m);

	const el = document.createElement('div');
	el.dataset.tie = 'tieNameA => data, tieNameB => data';

	const vps = extractViewParams(el);
	test.assertEqual(1, consoleErrorMessages.length);
	test.assertTrue(consoleErrorMessages[0].endsWith('property "data" tied more than once; all but first dismissed'));
	test.assertTrue(Array.isArray(vps));
	test.assertEqual(1, vps.length);

	let vp = vps[0];
	test.assertEqual('tieNameA', vp.tieKey);
	test.assertEqual('', vp.rawPath);
	test.assertTrue(Array.isArray(vp.path));
	test.assertEqual(0, vp.path.length);
	test.assertEqual('data', vp.targetProperty);

	console.error = originalConsoleError;
});

suite.runTest({ name: 'multi param - duplicate target (implicit) - negative' }, test => {
	const originalConsoleError = console.error;
	const consoleErrorMessages = [];
	console.error = m => consoleErrorMessages.push(m);

	const el = document.createElement('div');
	el.dataset.tie = 'tieNameA, tieNameB';

	const vps = extractViewParams(el);
	test.assertEqual(1, consoleErrorMessages.length);
	test.assertTrue(consoleErrorMessages[0].endsWith('property "textContent" tied more than once; all but first dismissed'));
	test.assertTrue(Array.isArray(vps));
	test.assertEqual(1, vps.length);

	let vp = vps[0];
	test.assertEqual('tieNameA', vp.tieKey);
	test.assertEqual('', vp.rawPath);
	test.assertTrue(Array.isArray(vp.path));
	test.assertEqual(0, vp.path.length);
	test.assertEqual('textContent', vp.targetProperty);

	console.error = originalConsoleError;
});

suite.runTest({ name: 'multi param - duplicate target (mixed) - negative' }, test => {
	const originalConsoleError = console.error;
	const consoleErrorMessages = [];
	console.error = m => consoleErrorMessages.push(m);

	const el = document.createElement('div');
	el.dataset.tie = 'tieNameA, tieNameB => textContent';

	const vps = extractViewParams(el);
	test.assertEqual(1, consoleErrorMessages.length);
	test.assertTrue(consoleErrorMessages[0].endsWith('property "textContent" tied more than once; all but first dismissed'));
	test.assertTrue(Array.isArray(vps));
	test.assertEqual(1, vps.length);

	let vp = vps[0];
	test.assertEqual('tieNameA', vp.tieKey);
	test.assertEqual('', vp.rawPath);
	test.assertTrue(Array.isArray(vp.path));
	test.assertEqual(0, vp.path.length);
	test.assertEqual('textContent', vp.targetProperty);

	console.error = originalConsoleError;
});