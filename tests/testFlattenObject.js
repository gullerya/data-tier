(function () {
	'use strict';

	var suite = window.Utils.JustTest.createSuite({ name: 'Flattening Object' }),
		observer = new DataObserver(),
		data = {
			string: 'some',
			number: 669847,
			boolean: true,
			nullified: null,
			objectLevel1: {
				string: 'some',
				number: 669847,
				boolean: true,
				nullified: null,
				objectLevel2: {
					string: 'some',
					number: 669847,
					boolean: true,
					nullified: null,
					objectLevel3: {
						string: 'some',
						number: 669847,
						boolean: true,
						nullified: null,
					}
				}
			},
			array: [
				{
					string: 'some',
					number: 669847,
					boolean: true,
					nullified: null,
					object: {
						string: 'some',
						number: 669847,
						boolean: true,
						nullified: null,
						object: {
							string: 'some',
							number: 669847,
							boolean: true,
							nullified: null
						}
					}
				},
				{
					string: 'some',
					number: 669847,
					boolean: true,
					nullified: null,
					object: {
						string: 'some',
						number: 669847,
						boolean: true,
						nullified: null,
						object: {
							string: 'some',
							number: 669847,
							boolean: true,
							nullified: null
						}
					}
				},
				{
					string: 'some',
					number: 669847,
					boolean: true,
					nullified: null,
					object: {
						string: 'some',
						number: 669847,
						boolean: true,
						nullified: null,
						object: {
							string: 'some',
							number: 669847,
							boolean: true,
							nullified: null
						}
					}
				}
			]
		};

	suite.addTest({ name: 'test A - object' }, function (pass, fail) {
		var flat;

		flat = flatten(data);
		console.dir(flat);

		//	TODO: add assertions

		pass();
	});

	suite.addTest({ name: 'test B - array' }, function (pass, fail) {
		var dataArray = [], counter = 20, flat;

		while (counter--) {
			dataArray.push(data);
		}
		flat = flatten(dataArray);
		console.dir(flat);

		//	TODO: add assertions

		pass();
	});

	suite.run();
})();