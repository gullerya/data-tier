(() => {
	'use strict';

	let suite = Utils.JustTest.createSuite({name: 'Testing Custom View to Data Controller'}),
		data = Observable.from({
			text: 'some text',
			date: new Date()
		});

	suite.addTest({name: 'testing setup of the controller from create'}, (pass, fail) => {
		let ie = document.createElement('input'), e;

		DataTier.ties.create('testCustomVTDA', data);
		DataTier.controllers.add('tieMyValue1', {
			toView: (data, view) => {
				view.value = data;
			},
			toData: input => {
				//	assuming for the test purposes that the path is on single node
				input.data[input.path[0]] = input.view.value.toUpperCase();
			},
			changeDOMEventType: 'myChange'
		});

		ie.dataset.tieMyValue1 = 'testCustomVTDA.text';
		document.body.appendChild(ie);

		setTimeout(function() {
			if (ie.value !== data.text) fail('test precondition failed; value expected to be ' + data.text + ', found: ' + ie.value);

			e = new Event('myChange');
			ie.dispatchEvent(e);

			setTimeout(function() {
				if (ie.value.toUpperCase() !== data.text) fail('value expected to be ' + data.text.toUpperCase() + ', found: ' + ie.value);

				pass();
			});
		}, 0)
	});

	suite.run();
})();