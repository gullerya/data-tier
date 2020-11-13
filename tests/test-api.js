import { getSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const suite = getSuite({ name: 'Testing Tie APIs' });

suite.runTest({ name: 'add/remove Tie - positive simple flow' }, test => {
	const tieName = 'tieApiPosTest';
	let tie = DataTier.ties.get(tieName);

	if (tie) test.fail('expected to NOT have tie when not yet defined');

	tie = DataTier.ties.create(tieName);

	if (!tie) test.fail('expected to get recently created tie');

	if (tie !== DataTier.ties.get(tieName)) test.fail('expected to deterministically get the same tie back');

	DataTier.ties.remove(tie);

	if (DataTier.ties.get(tieName)) test.fail('expected the tie to be removed');

	DataTier.ties.remove('someNonExistingTieNameShouldNotFailTheFlow');
});

suite.runTest({ name: 'create Tie - negative tests' }, test => {
	try {
		DataTier.ties.create();
		test.fail('should not be able to create tie without name');
	} catch (e) {
		//
	}

	try {
		DataTier.ties.create('');
		test.fail('should not be able to create tie with empty name');
	} catch (e) {
		//
	}

	try {
		DataTier.ties.create('underscore_prohibited');
		test.fail('should not be able to create tie with improper name');
	} catch (e) {
		//
	}

	try {
		DataTier.ties.create({});
		test.fail('should not be able to create tie with improper name');
	} catch (e) {
		//
	}

	try {
		DataTier.ties.create('validTieName', 'not an object');
		test.fail('should not be able to create tie with not-an-object');
	} catch (e) {
		if (DataTier.ties.get('validTieName')) {
			test.fail('should not have the corrupted tie in the bag');
		}
	}

	try {
		DataTier.ties.create('validTieName', { observe: 'string and not a function' });
		test.fail('should not be able to create tie with a non-Observable object which has some of Observable properties occupied');
	} catch (e) {
		//
	}

	try {
		DataTier.ties.create('validTieA', {});
		DataTier.ties.create('validTieA');
		test.fail('should not be able to create tie with an already existing name');
	} catch (e) {
		//
	} finally {
		DataTier.ties.remove('validTieA');
	}
});

suite.runTest({ name: 'get Tie - negative tests' }, test => {
	try {
		DataTier.ties.get();
		test.fail('should not be able to get tie without name');
	} catch (e) {
		//
	}

	try {
		DataTier.ties.get('');
		test.fail('should not be able to get tie with empty name');
	} catch (e) {
		//
	}

	try {
		DataTier.ties.get('underscore_prohibited');
		test.fail('should not be able to get tie with improper name');
	} catch (e) {
		//
	}

	try {
		DataTier.ties.get({});
		test.fail('should not be able to get tie with improper name');
	} catch (e) {
		//
	}
});

suite.runTest({ name: 'remove Tie - negative tests' }, test => {
	try {
		DataTier.ties.remove();
		test.fail('should not be able to remove tie without name');
	} catch (e) {
		//
	}

	try {
		DataTier.ties.remove('');
		test.fail('should not be able to remove tie with empty name');
	} catch (e) {
		//
	}

	try {
		DataTier.ties.remove('underscore_prohibited');
		test.fail('should not be able to remove tie with improper name');
	} catch (e) {
		//
	}

	try {
		DataTier.ties.remove({});
		test.fail('should not be able to remove tie with improper name');
	} catch (e) {
		//
	}
});

suite.runTest({ name: 'create/remove Tie - no object provided' }, test => {
	const t = DataTier.ties.create('noGivenOTieA');

	test.assertEqual('object', typeof t);
	test.assertTrue('observe' in t);
});

suite.runTest({ name: 'create/remove Tie - plain object provided' }, test => {
	const o = { test: 'some' };
	const t = DataTier.ties.create('noGivenOTieB', o);

	test.assertNotEqual(o, t);
	test.assertEqual('object', typeof t);
	test.assertEqual('some', t.test);
	test.assertTrue('observe' in t);
});

suite.runTest({ name: 'create/remove Tie - plain array provided' }, test => {
	const a = ['a', 'b', 'c'];
	const t = DataTier.ties.create('noGivenOTieC', a);

	test.assertNotEqual(a, t);
	test.assertEqual('object', typeof t);
	test.assertTrue(Array.isArray(t));
	test.assertEqual('a', t[0]);
	test.assertTrue('observe' in t);
});

suite.runTest({ name: 'root APIs - negative tests' }, test => {
	try {
		DataTier.addDocument();
		test.fail('should not be able to add undefined root document');
	} catch (e) {
		//
	}

	try {
		DataTier.addDocument(null);
		test.fail('should not be able to add null root document');
	} catch (e) {
		//
	}

	try {
		DataTier.addDocument(document.createElement('span'));
		test.fail('should not be able to add non-document');
	} catch (e) {
		//
	}

	const rootDocument = document.createDocumentFragment();
	let addResult = DataTier.addDocument(rootDocument);
	test.assertTrue(addResult);
	addResult = DataTier.addDocument(rootDocument);
	test.assertFalse(addResult);

	let removeResult = DataTier.removeDocument(rootDocument);
	test.assertTrue(removeResult);
	removeResult = DataTier.removeDocument(rootDocument);
	test.assertFalse(removeResult);
});