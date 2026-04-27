import { test } from '@gullerya/just-test';
import { assert } from '@gullerya/just-test/assert';
import { extractViewParams } from '../dist/utils.js';

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

test('no param defined', () => {
	const el = document.createElement('div');
	const vp = extractViewParams(el);
	assert.equal(null, vp);
});

test('illegal target type directive', () => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieKey:path.to.go -> attr';
	extractViewParams(el);
});