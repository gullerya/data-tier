import * as DataTier from '../dist/data-tier.js';

let suite = Utils.JustTest.createSuite({name: 'Testing functions dynamic binding'}),
	clickCounter = 0,
	user = {
		name: 'click me',
		clickHandler: function(e) {
			clickCounter++;
			DataTier.ties.get('functionalTest').model.name = 'click again';
			DataTier.ties.get('functionalTest').model.clickHandler = function() {
				clickCounter += 2;
			}
		}
	};

DataTier.ties.create('functionalTest', user);

suite.addTest({name: 'bind onclick logic'}, (pass, fail) => {
	let d = document.createElement('div');
	d.dataset.tie = 'functionalTest:clickHandler => onclick, functionalTest:name => textContent';
	document.body.appendChild(d);

	setTimeout(() => {
		d.click();
		if (d.textContent !== 'click again' || clickCounter !== 1) fail('expected to register result of a first click');

		d.click();
		if (clickCounter !== 3) fail('expected to register result of a second click');

		pass();
	}, 0);
});

suite.run();