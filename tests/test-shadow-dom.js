import * as DataTier from '../dist/data-tier.js';

let suite = Utils.JustTest.createSuite({name: 'Testing Shadowing in ShadowDom'});

suite.addTest({name: 'add/remove Tie - positive simple flow'}, (pass, fail) => {
	pass();
});

suite.run();
