(function () {
	'use strict';

	var suite = window.Utils.JustTest.createSuite({ name: 'Testing Custom View to Data Processor' }),
		data = window.Observable.from({
			text: 'some text',
			date: new Date()
		});

	suite.addTest({ name: 'testing setup of the processor from create', skip: true }, function (pass, fail) {
		var ie = document.createElement('span'), tie, e;

		function customVTDProc(input) {
			//	assuming for the test purposes that the path is on single node
			input.data[input.path[0]] = input.view.textContent.toUpperCase();
		}

		tie = window.DataTier.ties.create('testCustomVTDA', data);

		ie.dataset.tieText = 'testCustomVTDA:text';
		document.body.appendChild(ie);

		setTimeout(function () {
			if (ie.textContent !== data.text) fail('test precondition failed; value expected to be ' + data.text + ', found: ' + ie.textContent);

			tie.viewToDataProcessor = customVTDProc;
			e = new Event('change');
			ie.dispatchEvent(e);

			setTimeout(function () {
				if (ie.textContent !== data.text.toUpperCase()) fail('value expected to be ' + data.text.toUpperCase() + ', found: ' + ie.textContent);

				pass();
			});
		}, 0)
	});

	suite.run();
})();