import { getSuite } from '../node_modules/just-test/dist/just-test.min.js';
import { extractViewParams } from '../dist/utils.js';

const suite = getSuite({ name: 'Testing tie API - negative (declaration)' });

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

suite.runTest({ name: 'no param defined' }, test => {
	const el = document.createElement('div');
	const vp = extractViewParams(el);
	test.assertEqual(null, vp);
});

suite.runTest({ name: 'illegal target type directive' }, () => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieKey:path.to.go -> attr';
	extractViewParams(el);
});