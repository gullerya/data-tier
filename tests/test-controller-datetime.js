(() => {
	'use strict';

	let suite = Utils.JustTest.createSuite({name: 'Testing DateTime Controller'});

	suite.addTest({name: 'tieDatetimeText - basic defaults'}, (pass, fail) => {
		let t = DataTier.ties.create('dateTimeA', {dateTime: null}),
			e = document.createElement('div');
		document.body.appendChild(e);
		e.dataset.tieDatetimeText = 'dateTimeA.dateTime';

		setTimeout(() => {
			//	case 1
			if (e.textContent !== '') fail('expected text content to be "", but found ' + e.textContent);

			//	case 2
			t.data.dateTime = new Date(2017, 1, 2, 13, 25, 37, 234);
			if (e.textContent !== '02/02/2017 13:25:37') fail('expected text content to be "02/02/2017 13:25:37", but found ' + e.textContent);

			//	case 3
			DataTier.controllers.get('tieDatetimeText').format = 'dd/MM/yyyy hh:mm:ss.fff';
			t.data.dateTime = new Date(2018, 2, 3, 14, 34, 56, 123);
			if (e.textContent !== '03/03/2018 14:34:56.123') fail('expected text content to be "03/03/2018 14:34:56.123", but found ' + e.textContent);

			//	case 4
			DataTier.controllers.get('tieDatetimeText').format = 'dd/MM/yy';
			t.data.dateTime = new Date(2018, 2, 3, 14, 34, 56, 123);
			if (e.textContent !== '03/03/18') fail('expected text content to be "03/03/18", but found ' + e.textContent);

			//	case 5
			DataTier.controllers.get('tieDatetimeText').format = 'hh-mm-ss';
			t.data.dateTime = new Date(2018, 2, 3, 14, 34, 56, 123);
			if (e.textContent !== '14-34-56') fail('expected text content to be "14-34-56", but found ' + e.textContent);

			pass();
		}, 0);
	});

	suite.addTest({name: 'array binding - replacing element directly'}, (pass, fail) => {
		pass();
	});

	suite.run();
})();