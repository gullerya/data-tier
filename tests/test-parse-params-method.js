import { test } from '@gullerya/just-test';
import { assert } from '@gullerya/just-test/assert';
import { extractViewParams, TARGET_TYPES } from '../dist/utils.js';

//	tie param structure is defined as following:
//	{
//		tieKey: <string>,
//		rawPath: <string>,
//		path: <string[]>,
//		targetType: TARGET_TYPES.METHOD,
//		targetKey: <string>,
//		fParams: [
//			{
//				tieKey: <string>,
//				rawPath: <string>
//			}
//		]
//	}

//	single
//
test('func param - single root', () => {
	const el = document.createElement('div');
	el.dataset.tie = 'f(tieName)';

	const vps = extractViewParams(el);
	assert.isTrue(Array.isArray(vps));
	assert.equal(1, vps.length);

	const vp = vps[0];
	assert.equal(null, vp.tieKey);
	assert.equal(null, vp.rawPath);
	assert.equal(null, vp.path);
	assert.equal(TARGET_TYPES.METHOD, vp.targetType);
	assert.equal('f', vp.targetKey);
	assert.isTrue(Array.isArray(vp.fParams));
	assert.equal(1, vp.fParams.length);
	assert.equal('tieName', vp.fParams[0].tieKey);
	assert.equal('', vp.fParams[0].rawPath);
	assert.isTrue(Array.isArray(vp.fParams[0].path));
	assert.equal(0, vp.fParams[0].path.length);
});

test('func param - single deep', () => {
	const el = document.createElement('div');
	el.dataset.tie = 'f(tieName:some.path.to.data)';

	const vps = extractViewParams(el);
	assert.isTrue(Array.isArray(vps));
	assert.equal(1, vps.length);

	const vp = vps[0];
	assert.equal(null, vp.tieKey);
	assert.equal(null, vp.rawPath);
	assert.equal(null, vp.path);
	assert.equal(TARGET_TYPES.METHOD, vp.targetType);
	assert.equal('f', vp.targetKey);
	assert.isTrue(Array.isArray(vp.fParams));
	assert.equal(1, vp.fParams.length);
	assert.equal('tieName', vp.fParams[0].tieKey);
	assert.equal('some.path.to.data', vp.fParams[0].rawPath);
	assert.isTrue(Array.isArray(vp.fParams[0].path));
	assert.equal(4, vp.fParams[0].path.length);
	assert.equal('some', vp.fParams[0].path[0]);
	assert.equal('path', vp.fParams[0].path[1]);
	assert.equal('to', vp.fParams[0].path[2]);
	assert.equal('data', vp.fParams[0].path[3]);
});

test('func param - multi root', () => {
	const el = document.createElement('div');
	el.dataset.tie = 'f(tieNameA, tieNameB)';

	const vps = extractViewParams(el);
	assert.isTrue(Array.isArray(vps));
	assert.equal(1, vps.length);

	const vp = vps[0];
	assert.equal(null, vp.tieKey);
	assert.equal(null, vp.rawPath);
	assert.equal(null, vp.path);
	assert.equal(TARGET_TYPES.METHOD, vp.targetType);
	assert.equal('f', vp.targetKey);
	assert.isTrue(Array.isArray(vp.fParams));
	assert.equal(2, vp.fParams.length);
	assert.equal('tieNameA', vp.fParams[0].tieKey);
	assert.equal('', vp.fParams[0].rawPath);
	assert.isTrue(Array.isArray(vp.fParams[0].path));
	assert.equal(0, vp.fParams[0].path.length);
	assert.equal('tieNameB', vp.fParams[1].tieKey);
	assert.equal('', vp.fParams[1].rawPath);
	assert.isTrue(Array.isArray(vp.fParams[1].path));
	assert.equal(0, vp.fParams[1].path.length);
});

test('func param - multi mixed', () => {
	const el = document.createElement('div');
	el.dataset.tie = 'f(tieNameA, tieNameB:some.path.to.data)';

	const vps = extractViewParams(el);
	assert.isTrue(Array.isArray(vps));
	assert.equal(1, vps.length);

	const vp = vps[0];
	assert.equal(null, vp.tieKey);
	assert.equal(null, vp.rawPath);
	assert.equal(null, vp.path);
	assert.equal(TARGET_TYPES.METHOD, vp.targetType);
	assert.equal('f', vp.targetKey);
	assert.isTrue(Array.isArray(vp.fParams));
	assert.equal(2, vp.fParams.length);
	assert.equal('tieNameA', vp.fParams[0].tieKey);
	assert.equal('', vp.fParams[0].rawPath);
	assert.isTrue(Array.isArray(vp.fParams[0].path));
	assert.equal(0, vp.fParams[0].path.length);
	assert.equal('tieNameB', vp.fParams[1].tieKey);
	assert.equal('some.path.to.data', vp.fParams[1].rawPath);
	assert.isTrue(Array.isArray(vp.fParams[1].path));
	assert.equal(4, vp.fParams[1].path.length);
	assert.equal('some', vp.fParams[1].path[0]);
	assert.equal('path', vp.fParams[1].path[1]);
	assert.equal('to', vp.fParams[1].path[2]);
	assert.equal('data', vp.fParams[1].path[3]);
});