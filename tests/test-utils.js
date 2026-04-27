import { test } from '@gullerya/just-test';
import { assert } from '@gullerya/just-test/assert';
import * as Utils from '../dist/utils.js';

//	undefined, null
[undefined, null].forEach(v => {
	test(`getPath - nullish - '${v}'`, () => {
		assert.equal(v, Utils.getPath(v));
		assert.equal(v, Utils.getPath(v, ['some', 'path']));
	});
});

//	primitives
[true, 123, 'text'].forEach(v => {
	test(`getPath - primitives - ${v}`, () => {
		assert.equal(v, Utils.getPath(v, []));
		assert.equal(undefined, Utils.getPath(v, ['some', 'path']));
	});
});

//	object/Array
[{ 0: { 0: 'value' } }, [['value']]].forEach(v => {
	test(`getPath - objects - ${Array.isArray(v) ? 'Array' : 'object'}`, () => {
		//	root path
		assert.equal(v, Utils.getPath(v, []));
		//	exising deep
		assert.equal('value', Utils.getPath(v, ['0', 0]));
		//	non-existing deep
		assert.equal(undefined, Utils.getPath(v, ['non', 'existing']));
	});
});

//	performance tuning
test('getPath - performance tuning', { skip: true }, () => {
	const o = { levelA: { levelB: { levelC: 'text' } } };
	let i = 100000;
	while (i--) {
		assert.equal('text', Utils.getPath(o, ['levelA', 'levelB', 'levelC']));
	}
});