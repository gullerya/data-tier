import { getSuite } from '../node_modules/just-test/dist/just-test.min.js';
import { extractViewParams, TARGET_TYPES } from '../dist/utils.js';

const suite = getSuite({ name: 'Testing tie attribute API (event)' });

//	tie param structure is defined as following:
//	{
//		tieKey: <string>,
//		rawPath: <string>,
//		path: <string[]>,
//		targetType: TARGET_TYPES.ATTRIBUTE,
//		targetKey: <string>,
//		changeEvent: <string>,
//		fParams: null,
//		iClasses: <string[]>
//	}

//	single
//
suite.runTest({ name: 'single param - full' }, test => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieKey:path.to.go e> event';

	const vps = extractViewParams(el);
	test.assertTrue(Array.isArray(vps));
	test.assertEqual(1, vps.length);

	const vp = vps[0];
	test.assertEqual('tieKey', vp.tieKey);
	test.assertEqual('path.to.go', vp.rawPath);
	test.assertTrue(Array.isArray(vp.path));
	test.assertEqual(3, vp.path.length);
	test.assertEqual(TARGET_TYPES.EVENT, vp.targetType);
	test.assertEqual('event', vp.targetKey);
	test.assertEqual(null, vp.changeEvent);
});

suite.runTest({ name: 'single param - tieKey as a root' }, test => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieKey e> event';

	const vps = extractViewParams(el);
	test.assertTrue(Array.isArray(vps));
	test.assertEqual(1, vps.length);

	const vp = vps[0];
	test.assertEqual('tieKey', vp.tieKey);
	test.assertEqual('', vp.rawPath);
	test.assertTrue(Array.isArray(vp.path));
	test.assertEqual(0, vp.path.length);
	test.assertEqual(TARGET_TYPES.EVENT, vp.targetType);
	test.assertEqual('event', vp.targetKey);
	test.assertEqual(null, vp.changeEvent);
});

//	multi
//
suite.runTest({ name: 'multi param - full' }, test => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieKey:path.to.go e> event1, tieKey e> event2';

	const vps = extractViewParams(el);
	test.assertTrue(Array.isArray(vps));
	test.assertEqual(2, vps.length);

	let vp = vps[0];
	test.assertEqual('tieKey', vp.tieKey);
	test.assertEqual('path.to.go', vp.rawPath);
	test.assertTrue(Array.isArray(vp.path));
	test.assertEqual(3, vp.path.length);
	test.assertEqual(TARGET_TYPES.EVENT, vp.targetType);
	test.assertEqual('event1', vp.targetKey);
	test.assertEqual(null, vp.changeEvent);

	vp = vps[1];
	test.assertEqual('tieKey', vp.tieKey);
	test.assertEqual('', vp.rawPath);
	test.assertTrue(Array.isArray(vp.path));
	test.assertEqual(0, vp.path.length);
	test.assertEqual(TARGET_TYPES.EVENT, vp.targetType);
	test.assertEqual('event2', vp.targetKey);
	test.assertEqual(null, vp.changeEvent);
});

suite.runTest({ name: 'multi param - tieKey as a root' }, test => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieKey1 e> event1, tieKey2:path e> event2';

	const vps = extractViewParams(el);
	test.assertTrue(Array.isArray(vps));
	test.assertEqual(2, vps.length);

	let vp = vps[0];
	test.assertEqual('tieKey1', vp.tieKey);
	test.assertEqual('', vp.rawPath);
	test.assertTrue(Array.isArray(vp.path));
	test.assertEqual(0, vp.path.length);
	test.assertEqual(TARGET_TYPES.EVENT, vp.targetType);
	test.assertEqual('event1', vp.targetKey);
	test.assertEqual(null, vp.changeEvent);

	vp = vps[1];
	test.assertEqual('tieKey2', vp.tieKey);
	test.assertEqual('path', vp.rawPath);
	test.assertTrue(Array.isArray(vp.path));
	test.assertEqual(1, vp.path.length);
	test.assertEqual(TARGET_TYPES.EVENT, vp.targetType);
	test.assertEqual('event2', vp.targetKey);
	test.assertEqual(null, vp.changeEvent);
});
