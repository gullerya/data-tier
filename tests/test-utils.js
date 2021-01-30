import { getSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as Utils from '../dist/utils.js';

const suite = getSuite({ name: 'Testing utils' });

//	undefined, null
[undefined, null].forEach(v => {
	suite.runTest({ name: `getPath - nullish - '${v}'` }, test => {
		test.assertEqual(v, Utils.getPath(v));
		test.assertEqual(v, Utils.getPath(v, ['some', 'path']));
	});
});

//	primitives
[true, 123, 'text'].forEach(v => {
	suite.runTest({ name: `getPath - primitives - ${v}` }, test => {
		test.assertEqual(v, Utils.getPath(v, []));
		test.assertEqual(undefined, Utils.getPath(v, ['some', 'path']));
	});
});

//	object/Array
[{ 0: { 0: 'value' } }, [['value']]].forEach(v => {
	suite.runTest({ name: `getPath - objects - ${Array.isArray(v) ? 'Array' : 'object'}` }, test => {
		//	root path
		test.assertEqual(v, Utils.getPath(v, []));
		//	exising deep
		test.assertEqual('value', Utils.getPath(v, ['0', 0]));
		//	non-existing deep
		test.assertEqual(undefined, Utils.getPath(v, ['non', 'existing']));
	});
});

//	performance tuning
suite.runTest({ name: 'getPath - performance tuning', skip: true }, test => {
	const o = { levelA: { levelB: { levelC: 'text' } } }
	let i = 100000000;
	while (i--) {
		test.assertEqual('text', Utils.getPath(o, ['levelA', 'levelB', 'levelC']));
	}
});