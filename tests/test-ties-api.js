import { test } from '@gullerya/just-test';
import { assert } from '@gullerya/just-test/assert';
import { waitNextTask } from '@gullerya/just-test/timing';
import { getRandom } from '@gullerya/just-test/random';
import { ties, Observable } from '../dist/data-tier.js';


//	create API
//
test('create - none -> Observable', () => {
	assert.isTrue(Observable.isObservable(ties.create(getRandom(8))));
});

test('create - undefined -> Observable', () => {
	assert.isTrue(Observable.isObservable(ties.create(getRandom(8), undefined)));
});

test('create - null === null', () => {
	assert.equal(null, ties.create(getRandom(8), null));
});

test('create - Observable === Observable', () => {
	const o = Observable.from({});
	const m = ties.create(getRandom(8), o);
	assert.equal(o, m);
});

test('create - object -> Observable', () => {
	const o = {};
	const m = ties.create(getRandom(8), o);
	assert.isTrue(Observable.isObservable(m));
	assert.notEqual(o, m);
});

test('create - boolean === boolean', () => {
	assert.equal(true, ties.create(getRandom(8), true));
});

test('create - number === number', () => {
	assert.equal(123, ties.create(getRandom(8), 123));
});

test('create - string === string', () => {
	assert.equal('text', ties.create(getRandom(8), 'text'));
});

//	update API (existing tie)
//
test('update - none -> Error', () => {
	const tn = getRandom(8);
	ties.create(tn);
	assert.throws(() => ties.update(tn), 'illegal model');
});

test('update - undefined -> Observable', () => {
	const tn = getRandom(8);
	ties.create(tn);
	assert.throws(() => ties.update(tn, undefined), 'illegal model');
});

test('update - null === null', () => {
	const tn = getRandom(8);
	ties.create(tn);
	assert.equal(null, ties.update(tn, null));
});

test('update - Observable === Observable', () => {
	const tn = getRandom(8);
	const o = Observable.from({});
	ties.create(tn);
	assert.equal(o, ties.update(tn, o));
});

test('update - object -> Observable', () => {
	const tn = getRandom(8);
	const o = {};
	ties.create(tn);
	const m = ties.update(tn, o);
	assert.isTrue(Observable.isObservable(m));
	assert.notEqual(o, m);
});

test('update - boolean === boolean', () => {
	const tn = getRandom(8);
	ties.create(tn);
	assert.equal(true, ties.update(tn, true));
});

test('update - number === number', () => {
	const tn = getRandom(8);
	ties.create(tn);
	assert.equal(123, ties.update(tn, 123));
});

test('update - string === string', () => {
	const tn = getRandom(8);
	ties.create(tn);
	assert.equal('text', ties.update(tn, 'text'));
});

//	update API (non-existing tie)
//
test('update (create) - none -> Error', () => {
	assert.throws(() => ties.update(getRandom(8)), 'illegal model');
});

test('update (create) - undefined -> Observable', () => {
	assert.throws(() => ties.update(getRandom(8), undefined), 'illegal model');
});

test('update (create) - null === null', () => {
	assert.equal(null, ties.update(getRandom(8), null));
});

test('update (create) - Observable === Observable', () => {
	const o = Observable.from({});
	assert.equal(o, ties.update(getRandom(8), o));
});

test('update (create) - object -> Observable', () => {
	const o = {};
	const m = ties.update(getRandom(8), o);
	assert.isTrue(Observable.isObservable(m));
	assert.notEqual(o, m);
});

test('update (create) - boolean === boolean', () => {
	assert.equal(true, ties.update(getRandom(8), true));
});

test('update (create) - number === number', () => {
	assert.equal(123, ties.update(getRandom(8), 123));
});

test('update (create) - string === string', () => {
	assert.equal('text', ties.update(getRandom(8), 'text'));
});

const modelVariations = [undefined, null, {}, [], true, 123, 'text'];
for (const modelVariation of modelVariations) {
	let modelType = `'${typeof modelVariation}'`;
	if (Array.isArray(modelVariation)) {
		modelType += ' (Array)';
	} else if (modelVariation === null) {
		modelType += ' (null)';
	}

	test(`create and tie as root - ${modelType}`, async () => {
		const
			key = getRandom(8),
			v = document.createElement('div');

		ties.create(key, modelVariation);
		v.dataset.tie = `${key} => data`;
		document.body.appendChild(v);

		await waitNextTask();

		assert.equal(ties.get(key), v.data);
	});

	if (modelVariation !== undefined) {
		test(`update and tie nested - ${modelType}`, async () => {
			const
				key = getRandom(8),
				v = document.createElement('div');

			ties.create(key, { prop: 'text' });
			v.dataset.tie = `${key}:prop => data`;
			document.body.appendChild(v);

			await waitNextTask();
			assert.equal('text', v.data);

			ties.update(key, modelVariation);
			assert.equal(ties.get(key) ? ties.get(key).prop : ties.get(key), v.data);
		});
	}
}
