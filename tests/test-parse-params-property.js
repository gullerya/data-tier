import { getSuite } from '../node_modules/just-test/dist/just-test.min.js';
import { extractViewParams, TARGET_TYPES } from '../dist/utils.js';

const suite = getSuite({ name: 'Testing tie properties API (declaration)' });

//	tie param structure is defined as following:
//	{
//		tieKey: <string>,
//		rawPath: <string>,
//		path: <string[]>,
//		targetType: TARGET_TYPES.PROPERTY,
//		targetKey: <string>,
//		changeEvent: <string>,
//		fParams: null,
//		iClasses: <string[]>
//	}

//	single
//
suite.runTest({ name: 'single param - full with event' }, test => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieName:path.to.go => data => event';

	const vps = extractViewParams(el);
	test.assertTrue(Array.isArray(vps));
	test.assertEqual(1, vps.length);

	const vp = vps[0];
	test.assertEqual('tieName', vp.tieKey);
	test.assertEqual('path.to.go', vp.rawPath);
	test.assertTrue(Array.isArray(vp.path));
	test.assertEqual(3, vp.path.length);
	test.assertEqual(TARGET_TYPES.PROPERTY, vp.targetType);
	test.assertEqual('data', vp.targetKey);
	test.assertEqual('event', vp.changeEvent);
});

suite.runTest({ name: 'single param - full (no event)' }, test => {
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
	test.assertEqual(TARGET_TYPES.PROPERTY, vp.targetType);
	test.assertEqual('data', vp.targetKey);
	test.assertEqual(null, vp.changeEvent);
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
	test.assertEqual(TARGET_TYPES.PROPERTY, vp.targetType);
	test.assertEqual('textContent', vp.targetKey);
	test.assertEqual(null, vp.changeEvent);
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
	test.assertEqual(TARGET_TYPES.PROPERTY, vp.targetType);
	test.assertEqual('textContent', vp.targetKey);
	test.assertEqual(null, vp.changeEvent);
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
	test.assertEqual(TARGET_TYPES.PROPERTY, vp.targetType);
	test.assertEqual('textContent', vp.targetKey);
	test.assertEqual(null, vp.changeEvent);
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
	test.assertEqual(TARGET_TYPES.PROPERTY, vp.targetType);
	test.assertEqual('data', vp.targetKey);
	test.assertEqual(null, vp.changeEvent);
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
	test.assertEqual(TARGET_TYPES.PROPERTY, vp.targetType);
	test.assertEqual('data', vp.targetKey);
	test.assertEqual(null, vp.changeEvent);

	vp = vps[1];
	test.assertEqual('tieNameB', vp.tieKey);
	test.assertEqual('other.path', vp.rawPath);
	test.assertTrue(Array.isArray(vp.path));
	test.assertEqual(2, vp.path.length);
	test.assertEqual(TARGET_TYPES.PROPERTY, vp.targetType);
	test.assertEqual('test', vp.targetKey);
	test.assertEqual(null, vp.changeEvent);
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
	test.assertEqual(TARGET_TYPES.PROPERTY, vp.targetType);
	test.assertEqual('data', vp.targetKey);
	test.assertEqual(null, vp.changeEvent);

	vp = vps[1];
	test.assertEqual('tieNameB', vp.tieKey);
	test.assertEqual('other.path', vp.rawPath);
	test.assertTrue(Array.isArray(vp.path));
	test.assertEqual(2, vp.path.length);
	test.assertEqual(TARGET_TYPES.PROPERTY, vp.targetType);
	test.assertEqual('textContent', vp.targetKey);
	test.assertEqual(null, vp.changeEvent);
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
	test.assertEqual(TARGET_TYPES.PROPERTY, vp.targetType);
	test.assertEqual('data', vp.targetKey);
	test.assertEqual(null, vp.changeEvent);

	vp = vps[1];
	test.assertEqual('tieNameB', vp.tieKey);
	test.assertEqual('path', vp.rawPath);
	test.assertTrue(Array.isArray(vp.path));
	test.assertEqual(1, vp.path.length);
	test.assertEqual(TARGET_TYPES.PROPERTY, vp.targetType);
	test.assertEqual('textContent', vp.targetKey);
	test.assertEqual(null, vp.changeEvent);
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
	test.assertEqual(TARGET_TYPES.PROPERTY, vp.targetType);
	test.assertEqual('data', vp.targetKey);
	test.assertEqual(null, vp.changeEvent);

	vp = vps[1];
	test.assertEqual('tieNameB', vp.tieKey);
	test.assertEqual('', vp.rawPath);
	test.assertTrue(Array.isArray(vp.path));
	test.assertEqual(0, vp.path.length);
	test.assertEqual(TARGET_TYPES.PROPERTY, vp.targetType);
	test.assertEqual('textContent', vp.targetKey);
	test.assertEqual(null, vp.changeEvent);
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
	test.assertEqual(TARGET_TYPES.PROPERTY, vp.targetType);
	test.assertEqual('data', vp.targetKey);
	test.assertEqual(null, vp.changeEvent);

	vp = vps[1];
	test.assertEqual('tieNameB', vp.tieKey);
	test.assertEqual('', vp.rawPath);
	test.assertTrue(Array.isArray(vp.path));
	test.assertEqual(0, vp.path.length);
	test.assertEqual(TARGET_TYPES.PROPERTY, vp.targetType);
	test.assertEqual('some', vp.targetKey);
	test.assertEqual(null, vp.changeEvent);
});

suite.runTest({ name: 'multi param - duplicate target (explicit) - negative' }, test => {
	const originalConsoleError = console.error;
	const consoleErrorMessages = [];
	console.error = m => consoleErrorMessages.push(m);

	const el = document.createElement('div');
	el.dataset.tie = 'tieNameA => data, tieNameB => data';

	const vps = extractViewParams(el);
	test.assertEqual(1, consoleErrorMessages.length);
	test.assertTrue(consoleErrorMessages[0].endsWith('property \'data\' tied more than once; all but first tie dismissed'));
	test.assertTrue(Array.isArray(vps));
	test.assertEqual(1, vps.length);

	const vp = vps[0];
	test.assertEqual('tieNameA', vp.tieKey);
	test.assertEqual('', vp.rawPath);
	test.assertTrue(Array.isArray(vp.path));
	test.assertEqual(0, vp.path.length);
	test.assertEqual(TARGET_TYPES.PROPERTY, vp.targetType);
	test.assertEqual('data', vp.targetKey);
	test.assertEqual(null, vp.changeEvent);

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
	test.assertTrue(consoleErrorMessages[0].endsWith('property \'textContent\' tied more than once; all but first tie dismissed'));
	test.assertTrue(Array.isArray(vps));
	test.assertEqual(1, vps.length);

	const vp = vps[0];
	test.assertEqual('tieNameA', vp.tieKey);
	test.assertEqual('', vp.rawPath);
	test.assertTrue(Array.isArray(vp.path));
	test.assertEqual(0, vp.path.length);
	test.assertEqual(TARGET_TYPES.PROPERTY, vp.targetType);
	test.assertEqual('textContent', vp.targetKey);
	test.assertEqual(null, vp.changeEvent);

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
	test.assertTrue(consoleErrorMessages[0].endsWith('property \'textContent\' tied more than once; all but first tie dismissed'));
	test.assertTrue(Array.isArray(vps));
	test.assertEqual(1, vps.length);

	const vp = vps[0];
	test.assertEqual('tieNameA', vp.tieKey);
	test.assertEqual('', vp.rawPath);
	test.assertTrue(Array.isArray(vp.path));
	test.assertEqual(0, vp.path.length);
	test.assertEqual(TARGET_TYPES.PROPERTY, vp.targetType);
	test.assertEqual('textContent', vp.targetKey);
	test.assertEqual(null, vp.changeEvent);

	console.error = originalConsoleError;
});

suite.runTest({ name: 'classList param - basic' }, test => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieName => classList';

	const vps = extractViewParams(el);
	test.assertTrue(Array.isArray(vps));
	test.assertEqual(1, vps.length);

	const vp = vps[0];
	test.assertEqual('tieName', vp.tieKey);
	test.assertEqual('', vp.rawPath);
	test.assertTrue(Array.isArray(vp.path));
	test.assertEqual(0, vp.path.length);
	test.assertEqual(TARGET_TYPES.PROPERTY, vp.targetType);
	test.assertEqual('classList', vp.targetKey);
	test.assertEqual(null, vp.changeEvent);
	test.assertTrue(Array.isArray(vp.iClasses));
	test.assertEqual(0, vp.iClasses.length);
});

suite.runTest({ name: 'classList param - existing classes via classList' }, test => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieName => classList';
	el.classList.add('a', 'b', 'c');

	const vps = extractViewParams(el);
	test.assertTrue(Array.isArray(vps));
	test.assertEqual(1, vps.length);

	const vp = vps[0];
	test.assertTrue(Array.isArray(vp.iClasses));
	test.assertEqual(3, vp.iClasses.length);
	test.assertTrue(vp.iClasses.includes('a'));
	test.assertTrue(vp.iClasses.includes('b'));
	test.assertTrue(vp.iClasses.includes('c'));
});

suite.runTest({ name: 'classList param - existing classes via className' }, test => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieName => classList';
	el.className = 'a b c c';

	const vps = extractViewParams(el);
	test.assertTrue(Array.isArray(vps));
	test.assertEqual(1, vps.length);

	const vp = vps[0];
	test.assertTrue(Array.isArray(vp.iClasses));
	test.assertEqual(3, vp.iClasses.length);
	test.assertTrue(vp.iClasses.includes('a'));
	test.assertTrue(vp.iClasses.includes('b'));
	test.assertTrue(vp.iClasses.includes('c'));
});