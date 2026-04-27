import { test } from '@gullerya/just-test';
import { assert } from '@gullerya/just-test/assert';
import { extractViewParams, TARGET_TYPES } from '../dist/utils.js';

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
test('single param - full', () => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieKey:path.to.go e> event';

	const vps = extractViewParams(el);
	assert.isTrue(Array.isArray(vps));
	assert.equal(1, vps.length);

	const vp = vps[0];
	assert.equal('tieKey', vp.tieKey);
	assert.equal('path.to.go', vp.rawPath);
	assert.isTrue(Array.isArray(vp.path));
	assert.equal(3, vp.path.length);
	assert.equal(TARGET_TYPES.EVENT, vp.targetType);
	assert.equal('event', vp.targetKey);
	assert.equal(null, vp.changeEvent);
});

test('single param - tieKey as a root', () => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieKey e> event';

	const vps = extractViewParams(el);
	assert.isTrue(Array.isArray(vps));
	assert.equal(1, vps.length);

	const vp = vps[0];
	assert.equal('tieKey', vp.tieKey);
	assert.equal('', vp.rawPath);
	assert.isTrue(Array.isArray(vp.path));
	assert.equal(0, vp.path.length);
	assert.equal(TARGET_TYPES.EVENT, vp.targetType);
	assert.equal('event', vp.targetKey);
	assert.equal(null, vp.changeEvent);
});

//	multi
//
test('multi param - full', () => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieKey:path.to.go e> event1, tieKey e> event2';

	const vps = extractViewParams(el);
	assert.isTrue(Array.isArray(vps));
	assert.equal(2, vps.length);

	let vp = vps[0];
	assert.equal('tieKey', vp.tieKey);
	assert.equal('path.to.go', vp.rawPath);
	assert.isTrue(Array.isArray(vp.path));
	assert.equal(3, vp.path.length);
	assert.equal(TARGET_TYPES.EVENT, vp.targetType);
	assert.equal('event1', vp.targetKey);
	assert.equal(null, vp.changeEvent);

	vp = vps[1];
	assert.equal('tieKey', vp.tieKey);
	assert.equal('', vp.rawPath);
	assert.isTrue(Array.isArray(vp.path));
	assert.equal(0, vp.path.length);
	assert.equal(TARGET_TYPES.EVENT, vp.targetType);
	assert.equal('event2', vp.targetKey);
	assert.equal(null, vp.changeEvent);
});

test('multi param - tieKey as a root', () => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieKey1 e> event1, tieKey2:path e> event2';

	const vps = extractViewParams(el);
	assert.isTrue(Array.isArray(vps));
	assert.equal(2, vps.length);

	let vp = vps[0];
	assert.equal('tieKey1', vp.tieKey);
	assert.equal('', vp.rawPath);
	assert.isTrue(Array.isArray(vp.path));
	assert.equal(0, vp.path.length);
	assert.equal(TARGET_TYPES.EVENT, vp.targetType);
	assert.equal('event1', vp.targetKey);
	assert.equal(null, vp.changeEvent);

	vp = vps[1];
	assert.equal('tieKey2', vp.tieKey);
	assert.equal('path', vp.rawPath);
	assert.isTrue(Array.isArray(vp.path));
	assert.equal(1, vp.path.length);
	assert.equal(TARGET_TYPES.EVENT, vp.targetType);
	assert.equal('event2', vp.targetKey);
	assert.equal(null, vp.changeEvent);
});
