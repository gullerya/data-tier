import * as DataTier from '../dist/data-tier.js';

let suite = Utils.JustTest.createSuite({name: 'Testing Tie APIs'});

suite.addTest({name: 'add/remove Tie - positive simple flow'}, (pass, fail) => {
	const tieName = 'tieApiPosTest';
	let tie = DataTier.ties.get(tieName);

	if (tie) fail('expected to NOT have tie when not yet defined');

	tie = DataTier.ties.create(tieName);

	if (!tie) fail('expected to get recently created tie');

	if (tie !== DataTier.ties.get(tieName)) fail('expected to deterministically get the same tie back');

	DataTier.ties.remove(tie);

	if (DataTier.ties.get(tieName)) fail('expected the tie to be removed');

	DataTier.ties.remove('someNonExistingTieNameShouldNotFailTheFlow');

	pass();
});

suite.addTest({name: 'create Tie - negative tests'}, (pass, fail) => {
	try {
		DataTier.ties.create();
		fail('should not be able to create tie without name');
	} catch (e) {
	}

	try {
		DataTier.ties.create('');
		fail('should not be able to create tie with empty name');
	} catch (e) {
	}

	try {
		DataTier.ties.create('underscore_prohibited');
		fail('should not be able to create tie with improper name');
	} catch (e) {
	}

	try {
		DataTier.ties.create({});
		fail('should not be able to create tie with improper name');
	} catch (e) {
	}

	try {
		DataTier.ties.create('validTieName', 'not an object');
		fail('should not be able to create tie with not-an-object');
	} catch (e) {
		if (DataTier.ties.get('validTieName')) {
			fail('should not have the corrupted tie in the bag');
		}
	}

	try {
		DataTier.ties.create('validTieName', {observe: 'string and not a function'});
		fail('should not be able to create tie with a non-Observable object which has some of Observable properties occupied');
	} catch (e) {
	}

	try {
		DataTier.ties.create('validTieA', {});
		DataTier.ties.create('validTieA');
		fail('should not be able to create tie with an already existing name');
	} catch (e) {
	} finally {
		DataTier.ties.remove('validTieA');
	}

	pass();
});

suite.addTest({name: 'get Tie - negative tests'}, (pass, fail) => {
	try {
		DataTier.ties.get();
		fail('should not be able to get tie without name');
	} catch (e) {
	}

	try {
		DataTier.ties.get('');
		fail('should not be able to get tie with empty name');
	} catch (e) {
	}

	try {
		DataTier.ties.get('underscore_prohibited');
		fail('should not be able to get tie with improper name');
	} catch (e) {
	}

	try {
		DataTier.ties.get({});
		fail('should not be able to get tie with improper name');
	} catch (e) {
	}

	pass();
});

suite.addTest({name: 'remove Tie - negative tests'}, (pass, fail) => {
	try {
		DataTier.ties.remove();
		fail('should not be able to remove tie without name');
	} catch (e) {
	}

	try {
		DataTier.ties.remove('');
		fail('should not be able to remove tie with empty name');
	} catch (e) {
	}

	try {
		DataTier.ties.remove('underscore_prohibited');
		fail('should not be able to remove tie with improper name');
	} catch (e) {
	}

	try {
		DataTier.ties.remove({});
		fail('should not be able to remove tie with improper name');
	} catch (e) {
	}

	pass();
});

suite.run();
