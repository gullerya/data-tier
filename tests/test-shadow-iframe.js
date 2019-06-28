import * as DataTier from '../dist/data-tier.js';

let suite = Utils.JustTest.createSuite({name: 'Testing Shadowing in iFrame'});

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

suite.run();
