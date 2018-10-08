(() => {
	'use strict';

	let suite = Utils.JustTest.createSuite({name: 'Testing AnyProperty Controller'}),
		data = {
			text: 'some text',
			date: new Date()
		};

	DataTier.ties.create('testAnyPropA', data);

	suite.addTest({name: 'testing any-property controller: binding test A'}, (pass, fail) => {
		let e = document.createElement('div');
		e.dataset.tieProperty = 'testAnyPropA.text => textContent';
		document.body.appendChild(e);
		setTimeout(function() {
			if (e.textContent !== data.text) fail('textContent of the element expected to be "' + data.text + '", found: ' + e.textContent);
			pass();
		}, 0)
	});

	suite.run();
})();