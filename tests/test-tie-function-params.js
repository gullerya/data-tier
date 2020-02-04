import { getSuite } from '../node_modules/just-test/dist/just-test.min.js';
import { extractViewParams } from '../dist/dt-utils.js';

const suite = getSuite({ name: 'Testing tie functional params' });

//	tie param structure is defined as following:
//	{
//		tieKey: <string>,
//		rawPath: <string>,
//		path: <string[]>,
//		targetProperty: <string>,
//		isFunctional: true
//		fParams: [
//			{
//				tieKey: <string>,
//				rawPath: <string>
//			}
//		]
//	}

//	single
//
suite.runTest({ name: 'func param - single root' }, test => {
	const el = document.createElement('div');
	el.dataset.tie = 'f(tieName)';

	const vps = extractViewParams(el);
	test.assertTrue(Array.isArray(vps));
	test.assertEqual(1, vps.length);

	let vp = vps[0];
	test.assertEqual(null, vp.tieKey);
	test.assertEqual(null, vp.rawPath);
	test.assertEqual(null, vp.path);
	test.assertEqual('f', vp.targetProperty);
	test.assertTrue(vp.isFunctional);
	test.assertTrue(Array.isArray(vp.fParams));
	test.assertEqual(1, vp.fParams.length);
	test.assertEqual('tieName', vp.fParams[0].tieKey);
	test.assertEqual('', vp.fParams[0].rawPath);
	test.assertTrue(Array.isArray(vp.fParams[0].path));
	test.assertEqual(0, vp.fParams[0].path.length);
});

suite.runTest({ name: 'func param - single deep' }, test => {
	const el = document.createElement('div');
	el.dataset.tie = 'f(tieName:some.path.to.data)';

	const vps = extractViewParams(el);
	test.assertTrue(Array.isArray(vps));
	test.assertEqual(1, vps.length);

	let vp = vps[0];
	test.assertEqual(null, vp.tieKey);
	test.assertEqual(null, vp.rawPath);
	test.assertEqual(null, vp.path);
	test.assertEqual('f', vp.targetProperty);
	test.assertTrue(vp.isFunctional);
	test.assertTrue(Array.isArray(vp.fParams));
	test.assertEqual(1, vp.fParams.length);
	test.assertEqual('tieName', vp.fParams[0].tieKey);
	test.assertEqual('some.path.to.data', vp.fParams[0].rawPath);
	test.assertTrue(Array.isArray(vp.fParams[0].path));
	test.assertEqual(4, vp.fParams[0].path.length);
	test.assertEqual('some', vp.fParams[0].path[0]);
	test.assertEqual('path', vp.fParams[0].path[1]);
	test.assertEqual('to', vp.fParams[0].path[2]);
	test.assertEqual('data', vp.fParams[0].path[3]);
});

suite.runTest({ name: 'func param - multi root' }, test => {
	const el = document.createElement('div');
	el.dataset.tie = 'f(tieNameA, tieNameB)';

	const vps = extractViewParams(el);
	test.assertTrue(Array.isArray(vps));
	test.assertEqual(1, vps.length);

	let vp = vps[0];
	test.assertEqual(null, vp.tieKey);
	test.assertEqual(null, vp.rawPath);
	test.assertEqual(null, vp.path);
	test.assertEqual('f', vp.targetProperty);
	test.assertTrue(vp.isFunctional);
	test.assertTrue(Array.isArray(vp.fParams));
	test.assertEqual(2, vp.fParams.length);
	test.assertEqual('tieNameA', vp.fParams[0].tieKey);
	test.assertEqual('', vp.fParams[0].rawPath);
	test.assertTrue(Array.isArray(vp.fParams[0].path));
	test.assertEqual(0, vp.fParams[0].path.length);
	test.assertEqual('tieNameB', vp.fParams[1].tieKey);
	test.assertEqual('', vp.fParams[1].rawPath);
	test.assertTrue(Array.isArray(vp.fParams[1].path));
	test.assertEqual(0, vp.fParams[1].path.length);
});

suite.runTest({ name: 'func param - multi mixed' }, test => {
	const el = document.createElement('div');
	el.dataset.tie = 'f(tieNameA, tieNameB:some.path.to.data)';

	const vps = extractViewParams(el);
	test.assertTrue(Array.isArray(vps));
	test.assertEqual(1, vps.length);

	let vp = vps[0];
	test.assertEqual(null, vp.tieKey);
	test.assertEqual(null, vp.rawPath);
	test.assertEqual(null, vp.path);
	test.assertEqual('f', vp.targetProperty);
	test.assertTrue(vp.isFunctional);
	test.assertTrue(Array.isArray(vp.fParams));
	test.assertEqual(2, vp.fParams.length);
	test.assertEqual('tieNameA', vp.fParams[0].tieKey);
	test.assertEqual('', vp.fParams[0].rawPath);
	test.assertTrue(Array.isArray(vp.fParams[0].path));
	test.assertEqual(0, vp.fParams[0].path.length);
	test.assertEqual('tieNameB', vp.fParams[1].tieKey);
	test.assertEqual('some.path.to.data', vp.fParams[1].rawPath);
	test.assertTrue(Array.isArray(vp.fParams[1].path));
	test.assertEqual(4, vp.fParams[1].path.length);
	test.assertEqual('some', vp.fParams[1].path[0]);
	test.assertEqual('path', vp.fParams[1].path[1]);
	test.assertEqual('to', vp.fParams[1].path[2]);
	test.assertEqual('data', vp.fParams[1].path[3]);
});