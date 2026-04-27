import { test } from '@gullerya/just-test';
import { assert } from '@gullerya/just-test/assert';
import { extractViewParams, TARGET_TYPES } from '../dist/utils.js';

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
test('single param - full with event', () => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieName:path.to.go => data => event';

	const vps = extractViewParams(el);
	assert.isTrue(Array.isArray(vps));
	assert.equal(1, vps.length);

	const vp = vps[0];
	assert.equal('tieName', vp.tieKey);
	assert.equal('path.to.go', vp.rawPath);
	assert.isTrue(Array.isArray(vp.path));
	assert.equal(3, vp.path.length);
	assert.equal(TARGET_TYPES.PROPERTY, vp.targetType);
	assert.equal('data', vp.targetKey);
	assert.equal('event', vp.changeEvent);
});

test('single param - full (no event)', () => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieName:path.to.go => data';

	const vps = extractViewParams(el);
	assert.isTrue(Array.isArray(vps));
	assert.equal(1, vps.length);

	const vp = vps[0];
	assert.equal('tieName', vp.tieKey);
	assert.equal('path.to.go', vp.rawPath);
	assert.isTrue(Array.isArray(vp.path));
	assert.equal(3, vp.path.length);
	assert.equal(TARGET_TYPES.PROPERTY, vp.targetType);
	assert.equal('data', vp.targetKey);
	assert.equal(null, vp.changeEvent);
});

test('single param - short', () => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieName:path.to.go';

	const vps = extractViewParams(el);
	assert.isTrue(Array.isArray(vps));
	assert.equal(1, vps.length);

	const vp = vps[0];
	assert.equal('tieName', vp.tieKey);
	assert.equal('path.to.go', vp.rawPath);
	assert.isTrue(Array.isArray(vp.path));
	assert.equal(3, vp.path.length);
	assert.equal(TARGET_TYPES.PROPERTY, vp.targetType);
	assert.equal('textContent', vp.targetKey);
	assert.equal(null, vp.changeEvent);
});

test('single param - short (short path)', () => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieName:path';

	const vps = extractViewParams(el);
	assert.isTrue(Array.isArray(vps));
	assert.equal(1, vps.length);

	const vp = vps[0];
	assert.equal('tieName', vp.tieKey);
	assert.equal('path', vp.rawPath);
	assert.isTrue(Array.isArray(vp.path));
	assert.equal(1, vp.path.length);
	assert.equal(TARGET_TYPES.PROPERTY, vp.targetType);
	assert.equal('textContent', vp.targetKey);
	assert.equal(null, vp.changeEvent);
});

test('single param - root', () => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieName';

	const vps = extractViewParams(el);
	assert.isTrue(Array.isArray(vps));
	assert.equal(1, vps.length);

	const vp = vps[0];
	assert.equal('tieName', vp.tieKey);
	assert.equal('', vp.rawPath);
	assert.isTrue(Array.isArray(vp.path));
	assert.equal(0, vp.path.length);
	assert.equal(TARGET_TYPES.PROPERTY, vp.targetType);
	assert.equal('textContent', vp.targetKey);
	assert.equal(null, vp.changeEvent);
});

test('single param - long with root', () => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieName => data';

	const vps = extractViewParams(el);
	assert.isTrue(Array.isArray(vps));
	assert.equal(1, vps.length);

	const vp = vps[0];
	assert.equal('tieName', vp.tieKey);
	assert.equal('', vp.rawPath);
	assert.isTrue(Array.isArray(vp.path));
	assert.equal(0, vp.path.length);
	assert.equal(TARGET_TYPES.PROPERTY, vp.targetType);
	assert.equal('data', vp.targetKey);
	assert.equal(null, vp.changeEvent);
});

//	multi
//
test('multi param - full', () => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieNameA:path.to.go => data, tieNameB:other.path => test';

	const vps = extractViewParams(el);
	assert.isTrue(Array.isArray(vps));
	assert.equal(2, vps.length);

	let vp = vps[0];
	assert.equal('tieNameA', vp.tieKey);
	assert.equal('path.to.go', vp.rawPath);
	assert.isTrue(Array.isArray(vp.path));
	assert.equal(3, vp.path.length);
	assert.equal(TARGET_TYPES.PROPERTY, vp.targetType);
	assert.equal('data', vp.targetKey);
	assert.equal(null, vp.changeEvent);

	vp = vps[1];
	assert.equal('tieNameB', vp.tieKey);
	assert.equal('other.path', vp.rawPath);
	assert.isTrue(Array.isArray(vp.path));
	assert.equal(2, vp.path.length);
	assert.equal(TARGET_TYPES.PROPERTY, vp.targetType);
	assert.equal('test', vp.targetKey);
	assert.equal(null, vp.changeEvent);
});

test('multi param - short', () => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieNameA:path.to.go => data, tieNameB:other.path';

	const vps = extractViewParams(el);
	assert.isTrue(Array.isArray(vps));
	assert.equal(2, vps.length);

	let vp = vps[0];
	assert.equal('tieNameA', vp.tieKey);
	assert.equal('path.to.go', vp.rawPath);
	assert.isTrue(Array.isArray(vp.path));
	assert.equal(3, vp.path.length);
	assert.equal(TARGET_TYPES.PROPERTY, vp.targetType);
	assert.equal('data', vp.targetKey);
	assert.equal(null, vp.changeEvent);

	vp = vps[1];
	assert.equal('tieNameB', vp.tieKey);
	assert.equal('other.path', vp.rawPath);
	assert.isTrue(Array.isArray(vp.path));
	assert.equal(2, vp.path.length);
	assert.equal(TARGET_TYPES.PROPERTY, vp.targetType);
	assert.equal('textContent', vp.targetKey);
	assert.equal(null, vp.changeEvent);
});

test('multi param - short (short path)', () => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieNameA:path => data, tieNameB:path';

	const vps = extractViewParams(el);
	assert.isTrue(Array.isArray(vps));
	assert.equal(2, vps.length);

	let vp = vps[0];
	assert.equal('tieNameA', vp.tieKey);
	assert.equal('path', vp.rawPath);
	assert.isTrue(Array.isArray(vp.path));
	assert.equal(1, vp.path.length);
	assert.equal(TARGET_TYPES.PROPERTY, vp.targetType);
	assert.equal('data', vp.targetKey);
	assert.equal(null, vp.changeEvent);

	vp = vps[1];
	assert.equal('tieNameB', vp.tieKey);
	assert.equal('path', vp.rawPath);
	assert.isTrue(Array.isArray(vp.path));
	assert.equal(1, vp.path.length);
	assert.equal(TARGET_TYPES.PROPERTY, vp.targetType);
	assert.equal('textContent', vp.targetKey);
	assert.equal(null, vp.changeEvent);
});

test('multi param - root', () => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieNameA => data, tieNameB';

	const vps = extractViewParams(el);
	assert.isTrue(Array.isArray(vps));
	assert.equal(2, vps.length);

	let vp = vps[0];
	assert.equal('tieNameA', vp.tieKey);
	assert.equal('', vp.rawPath);
	assert.isTrue(Array.isArray(vp.path));
	assert.equal(0, vp.path.length);
	assert.equal(TARGET_TYPES.PROPERTY, vp.targetType);
	assert.equal('data', vp.targetKey);
	assert.equal(null, vp.changeEvent);

	vp = vps[1];
	assert.equal('tieNameB', vp.tieKey);
	assert.equal('', vp.rawPath);
	assert.isTrue(Array.isArray(vp.path));
	assert.equal(0, vp.path.length);
	assert.equal(TARGET_TYPES.PROPERTY, vp.targetType);
	assert.equal('textContent', vp.targetKey);
	assert.equal(null, vp.changeEvent);
});

test('multi param - long with root', () => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieNameA => data, tieNameB => some';

	const vps = extractViewParams(el);
	assert.isTrue(Array.isArray(vps));
	assert.equal(2, vps.length);

	let vp = vps[0];
	assert.equal('tieNameA', vp.tieKey);
	assert.equal('', vp.rawPath);
	assert.isTrue(Array.isArray(vp.path));
	assert.equal(0, vp.path.length);
	assert.equal(TARGET_TYPES.PROPERTY, vp.targetType);
	assert.equal('data', vp.targetKey);
	assert.equal(null, vp.changeEvent);

	vp = vps[1];
	assert.equal('tieNameB', vp.tieKey);
	assert.equal('', vp.rawPath);
	assert.isTrue(Array.isArray(vp.path));
	assert.equal(0, vp.path.length);
	assert.equal(TARGET_TYPES.PROPERTY, vp.targetType);
	assert.equal('some', vp.targetKey);
	assert.equal(null, vp.changeEvent);
});

test('multi param - duplicate target (explicit) - negative', () => {
	const originalConsoleError = console.error;
	const consoleErrorMessages = [];
	console.error = m => consoleErrorMessages.push(m);

	const el = document.createElement('div');
	el.dataset.tie = 'tieNameA => data, tieNameB => data';

	const vps = extractViewParams(el);
	assert.equal(1, consoleErrorMessages.length);
	assert.isTrue(consoleErrorMessages[0].endsWith('property \'data\' tied more than once; all but first tie dismissed'));
	assert.isTrue(Array.isArray(vps));
	assert.equal(1, vps.length);

	const vp = vps[0];
	assert.equal('tieNameA', vp.tieKey);
	assert.equal('', vp.rawPath);
	assert.isTrue(Array.isArray(vp.path));
	assert.equal(0, vp.path.length);
	assert.equal(TARGET_TYPES.PROPERTY, vp.targetType);
	assert.equal('data', vp.targetKey);
	assert.equal(null, vp.changeEvent);

	console.error = originalConsoleError;
});

test('multi param - duplicate target (implicit) - negative', () => {
	const originalConsoleError = console.error;
	const consoleErrorMessages = [];
	console.error = m => consoleErrorMessages.push(m);

	const el = document.createElement('div');
	el.dataset.tie = 'tieNameA, tieNameB';

	const vps = extractViewParams(el);
	assert.equal(1, consoleErrorMessages.length);
	assert.isTrue(consoleErrorMessages[0].endsWith('property \'textContent\' tied more than once; all but first tie dismissed'));
	assert.isTrue(Array.isArray(vps));
	assert.equal(1, vps.length);

	const vp = vps[0];
	assert.equal('tieNameA', vp.tieKey);
	assert.equal('', vp.rawPath);
	assert.isTrue(Array.isArray(vp.path));
	assert.equal(0, vp.path.length);
	assert.equal(TARGET_TYPES.PROPERTY, vp.targetType);
	assert.equal('textContent', vp.targetKey);
	assert.equal(null, vp.changeEvent);

	console.error = originalConsoleError;
});

test('multi param - duplicate target (mixed) - negative', () => {
	const originalConsoleError = console.error;
	const consoleErrorMessages = [];
	console.error = m => consoleErrorMessages.push(m);

	const el = document.createElement('div');
	el.dataset.tie = 'tieNameA, tieNameB => textContent';

	const vps = extractViewParams(el);
	assert.equal(1, consoleErrorMessages.length);
	assert.isTrue(consoleErrorMessages[0].endsWith('property \'textContent\' tied more than once; all but first tie dismissed'));
	assert.isTrue(Array.isArray(vps));
	assert.equal(1, vps.length);

	const vp = vps[0];
	assert.equal('tieNameA', vp.tieKey);
	assert.equal('', vp.rawPath);
	assert.isTrue(Array.isArray(vp.path));
	assert.equal(0, vp.path.length);
	assert.equal(TARGET_TYPES.PROPERTY, vp.targetType);
	assert.equal('textContent', vp.targetKey);
	assert.equal(null, vp.changeEvent);

	console.error = originalConsoleError;
});

test('classList param - basic', () => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieName => classList';

	const vps = extractViewParams(el);
	assert.isTrue(Array.isArray(vps));
	assert.equal(1, vps.length);

	const vp = vps[0];
	assert.equal('tieName', vp.tieKey);
	assert.equal('', vp.rawPath);
	assert.isTrue(Array.isArray(vp.path));
	assert.equal(0, vp.path.length);
	assert.equal(TARGET_TYPES.PROPERTY, vp.targetType);
	assert.equal('classList', vp.targetKey);
	assert.equal(null, vp.changeEvent);
	assert.isTrue(Array.isArray(vp.iClasses));
	assert.equal(0, vp.iClasses.length);
});

test('classList param - existing classes via classList', () => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieName => classList';
	el.classList.add('a', 'b', 'c');

	const vps = extractViewParams(el);
	assert.isTrue(Array.isArray(vps));
	assert.equal(1, vps.length);

	const vp = vps[0];
	assert.isTrue(Array.isArray(vp.iClasses));
	assert.equal(3, vp.iClasses.length);
	assert.isTrue(vp.iClasses.includes('a'));
	assert.isTrue(vp.iClasses.includes('b'));
	assert.isTrue(vp.iClasses.includes('c'));
});

test('classList param - existing classes via className', () => {
	const el = document.createElement('div');
	el.dataset.tie = 'tieName => classList';
	el.className = 'a b c c';

	const vps = extractViewParams(el);
	assert.isTrue(Array.isArray(vps));
	assert.equal(1, vps.length);

	const vp = vps[0];
	assert.isTrue(Array.isArray(vp.iClasses));
	assert.equal(3, vp.iClasses.length);
	assert.isTrue(vp.iClasses.includes('a'));
	assert.isTrue(vp.iClasses.includes('b'));
	assert.isTrue(vp.iClasses.includes('c'));
});