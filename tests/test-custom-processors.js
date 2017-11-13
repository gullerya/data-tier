(() => {
	'use strict';

	let suite = Utils.JustTest.createSuite({name: 'Testing Custom View to Data Processor'}),
		data = Observable.from({
			text: 'some text',
			date: new Date()
		});

	suite.addTest({name: 'testing setup of the processor from create'}, (pass, fail) => {
		let ie = document.createElement('input'), e;

		DataTier.ties.create('testCustomVTDA', data);
		DataTier.processors.add('tieMyValue1', {
			toView: (data, view) => {
				view.value = data;
			},
			toData: input => {
				//	assuming for the test purposes that the path is on single node
				input.data[input.path[0]] = input.view.value.toUpperCase();
			}
		});

		ie.dataset.tieMyValue1 = 'testCustomVTDA.text';
		document.body.appendChild(ie);

		setTimeout(function() {
			if (ie.value !== data.text) fail('test precondition failed; value expected to be ' + data.text + ', found: ' + ie.value);

			e = new Event('change');
			ie.dispatchEvent(e);

			setTimeout(function() {
				if (ie.value.toUpperCase() !== data.text) fail('value expected to be ' + data.text.toUpperCase() + ', found: ' + ie.value);

				pass();
			});
		}, 0)
	});

	suite.run();
})();