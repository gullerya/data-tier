import { test } from '@gullerya/just-test';
import { assert } from '@gullerya/just-test/assert';
import * as DataTier from '../dist/data-tier.js';

test('add/remove Tie - positive simple flow', () => {
	const tieName = 'tieApiPosTest';
	let tie = DataTier.ties.get(tieName);

	assert.isFalse(Boolean(tie), 'expected to NOT have tie when not yet defined');

	tie = DataTier.ties.create(tieName);

	assert.isTrue(Boolean(tie), 'expected to get recently created tie');
	assert.strictEqual(tie, DataTier.ties.get(tieName), 'expected to deterministically get the same tie back');

	DataTier.ties.remove(tie);

	assert.isFalse(Boolean(DataTier.ties.get(tieName)), 'expected the tie to be removed');

	DataTier.ties.remove('someNonExistingTieNameShouldNotFailTheFlow');
});

test('Observable is exposed', () => {
	assert.equal('object', typeof DataTier.Observable);
});

test('create tie - negative - no key', () => {
	assert.throws(() => DataTier.ties.create(), 'invalid key');
});

test('create tie - negative - empty key', () => {
	assert.throws(() => DataTier.ties.create(''), 'invalid key');
});

test('create tie - negative - underscore in key', () => {
	assert.throws(() => DataTier.ties.create('underscore_prohibited'), 'tie key MUST match');
});

test('create tie - negative - object key', () => {
	assert.throws(() => DataTier.ties.create({}), 'invalid key');
});

test('create tie - negative - duplicate key', () => {
	DataTier.ties.create('validTieA', {});
	assert.throws(() => DataTier.ties.create('validTieA'), 'already exists');
});

test('get Tie - negative tests', () => {
	assert.throws(() => DataTier.ties.get(), 'invalid key');
	assert.throws(() => DataTier.ties.get(''), 'invalid key');
	assert.throws(() => DataTier.ties.get({}), 'invalid key');
	//	valid-shape strings that are not registered return undefined (internal lookups, e.g., 'scope', rely on this)
	assert.strictEqual(undefined, DataTier.ties.get('nonExistingKey'));
	assert.strictEqual(undefined, DataTier.ties.get('scope'));
});

test('remove Tie - negative tests', () => {
	assert.throws(() => DataTier.ties.remove(), 'invalid tieToRemove');
	assert.throws(() => DataTier.ties.remove(''), 'invalid tieToRemove');
	//	valid-shape string for a non-existing tie is a silent no-op (idempotent removal)
	DataTier.ties.remove('nonExistingKey');
	//	remove({}) is remove-by-model-reference; silent no-op when no match
	DataTier.ties.remove({});
});

test('create/remove Tie - no object provided', () => {
	const t = DataTier.ties.create('noGivenOTieA');

	assert.equal('object', typeof t);
	assert.isTrue(DataTier.Observable.isObservable(t));
});

test('create/remove Tie - plain object provided', () => {
	const o = { test: 'some' };
	const t = DataTier.ties.create('noGivenOTieB', o);

	assert.notStrictEqual(o, t);
	assert.equal('object', typeof t);
	assert.equal('some', t.test);
	assert.isTrue(DataTier.Observable.isObservable(t));
});

test('create/remove Tie - plain array provided', () => {
	const a = ['a', 'b', 'c'];
	const t = DataTier.ties.create('noGivenOTieC', a);

	assert.notStrictEqual(a, t);
	assert.equal('object', typeof t);
	assert.isTrue(Array.isArray(t));
	assert.equal('a', t[0]);
	assert.isTrue(DataTier.Observable.isObservable(t));
});

test('root APIs - negative tests', () => {
	assert.throws(() => DataTier.addDocument());
	assert.throws(() => DataTier.addDocument(null));
	assert.throws(() => DataTier.addDocument(document.createElement('span')));

	const rootDocument = document.createDocumentFragment();
	let addResult = DataTier.addDocument(rootDocument);
	assert.isTrue(addResult);
	addResult = DataTier.addDocument(rootDocument);
	assert.isFalse(addResult);

	let removeResult = DataTier.removeDocument(rootDocument);
	assert.isTrue(removeResult);
	removeResult = DataTier.removeDocument(rootDocument);
	assert.isFalse(removeResult);
});
