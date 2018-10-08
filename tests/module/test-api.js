import * as DataTier from '../../dist/module/data-tier.js';

let suite = Utils.JustTest.createSuite({name: 'Testing Tie APIs'});

suite.addTest({name: 'create Tie - negative tests'}, (pass, fail) => {
	try {
		DataTier.ties.create();
		fail('should not be able to create tie without name');
	} catch (e) { }

	try {
		DataTier.ties.create('');
		fail('should not be able to create tie with empty name');
	} catch (e) { }

	try {
		DataTier.ties.create('underscore_prohibited');
		fail('should not be able to create tie with improper name');
	} catch (e) { }

	try {
		DataTier.ties.create({});
		fail('should not be able to create tie with improper name');
	} catch (e) { }

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
	} catch (e) { }

	try {
		DataTier.ties.get('');
		fail('should not be able to get tie with empty name');
	} catch (e) { }

	try {
		DataTier.ties.get('underscore_prohibited');
		fail('should not be able to get tie with improper name');
	} catch (e) { }

	try {
		DataTier.ties.get({});
		fail('should not be able to get tie with improper name');
	} catch (e) { }

	pass();
});

suite.addTest({name: 'remove Tie - negative tests'}, (pass, fail) => {
	try {
		DataTier.ties.remove();
		fail('should not be able to remove tie without name');
	} catch (e) { }

	try {
		DataTier.ties.remove('');
		fail('should not be able to remove tie with empty name');
	} catch (e) { }

	try {
		DataTier.ties.remove('underscore_prohibited');
		fail('should not be able to remove tie with improper name');
	} catch (e) { }

	try {
		DataTier.ties.remove({});
		fail('should not be able to remove tie with improper name');
	} catch (e) { }

	pass();
});

suite.run();
