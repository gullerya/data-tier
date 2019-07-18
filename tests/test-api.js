import { createSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const suite = createSuite({ name: 'Testing Tie APIs' });

suite.addTest({ name: 'add/remove Tie - positive simple flow' }, test => {
	const tieName = 'tieApiPosTest';
	let tie = DataTier.ties.get(tieName);

	if (tie) test.fail('expected to NOT have tie when not yet defined');

	tie = DataTier.ties.create(tieName);

	if (!tie) test.fail('expected to get recently created tie');

	if (tie !== DataTier.ties.get(tieName)) test.fail('expected to deterministically get the same tie back');

	DataTier.ties.remove(tie);

	if (DataTier.ties.get(tieName)) test.fail('expected the tie to be removed');

	DataTier.ties.remove('someNonExistingTieNameShouldNotFailTheFlow');

	test.pass();
});

suite.addTest({ name: 'create Tie - negative tests' }, test => {
	try {
		DataTier.ties.create();
		test.fail('should not be able to create tie without name');
	} catch (e) {
	}

	try {
		DataTier.ties.create('');
		test.fail('should not be able to create tie with empty name');
	} catch (e) {
	}

	try {
		DataTier.ties.create('underscore_prohibited');
		test.fail('should not be able to create tie with improper name');
	} catch (e) {
	}

	try {
		DataTier.ties.create({});
		test.fail('should not be able to create tie with improper name');
	} catch (e) {
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
	}

	try {
		DataTier.ties.create('validTieA', {});
		DataTier.ties.create('validTieA');
		test.fail('should not be able to create tie with an already existing name');
	} catch (e) {
	} finally {
		DataTier.ties.remove('validTieA');
	}

	test.pass();
});

suite.addTest({ name: 'get Tie - negative tests' }, test => {
	try {
		DataTier.ties.get();
		test.fail('should not be able to get tie without name');
	} catch (e) {
	}

	try {
		DataTier.ties.get('');
		test.fail('should not be able to get tie with empty name');
	} catch (e) {
	}

	try {
		DataTier.ties.get('underscore_prohibited');
		test.fail('should not be able to get tie with improper name');
	} catch (e) {
	}

	try {
		DataTier.ties.get({});
		test.fail('should not be able to get tie with improper name');
	} catch (e) {
	}

	test.pass();
});

suite.addTest({ name: 'remove Tie - negative tests' }, test => {
	try {
		DataTier.ties.remove();
		test.fail('should not be able to remove tie without name');
	} catch (e) {
	}

	try {
		DataTier.ties.remove('');
		test.fail('should not be able to remove tie with empty name');
	} catch (e) {
	}

	try {
		DataTier.ties.remove('underscore_prohibited');
		test.fail('should not be able to remove tie with improper name');
	} catch (e) {
	}

	try {
		DataTier.ties.remove({});
		test.fail('should not be able to remove tie with improper name');
	} catch (e) {
	}

	test.pass();
});

suite.addTest({ name: 'root APIs - negative tests' }, test => {
	try {
		DataTier.addRootDocument();
		test.fail('should not be able to add undefined root document');
	} catch (e) {
	}

	try {
		DataTier.addRootDocument(null);
		test.fail('should not be able to add null root document');
	} catch (e) {
	}

	try {
		DataTier.addRootDocument(document.createElement('span'));
		test.fail('should not be able to add non-document');
	} catch (e) {
	}

	const rootDocument = document.createDocumentFragment();
	let addResult = DataTier.addRootDocument(rootDocument);
	test.assertTrue(addResult);
	addResult = DataTier.addRootDocument(rootDocument);
	test.assertFalse(addResult);

	let removeResult = DataTier.removeRootDocument(rootDocument);
	test.assertTrue(removeResult);
	removeResult = DataTier.removeRootDocument(rootDocument);
	test.assertFalse(removeResult);

	test.pass();
});

suite.run();
