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

		if (flat['string'] !== 'some') fail();
		if (flat['number'] !== 669847) fail();
		if (flat['boolean'] !== true) fail();
		if (flat['nullified'] !== null) fail();
		if (flat['objectLevel1.string'] !== 'some') fail();
		if (flat['objectLevel1.number'] !== 669847) fail();
		if (flat['objectLevel1.boolean'] !== true) fail();
		if (flat['objectLevel1.nullified'] !== null) fail();
		if (flat['objectLevel1.objectLevel2.string'] !== 'some') fail();
		if (flat['objectLevel1.objectLevel2.number'] !== 669847) fail();
		if (flat['objectLevel1.objectLevel2.boolean'] !== true) fail();
		if (flat['objectLevel1.objectLevel2.nullified'] !== null) fail();
		if (flat['objectLevel1.objectLevel2.objectLevel3..string'] !== 'some') fail();
		if (flat['objectLevel1.objectLevel2.objectLevel3..number'] !== 669847) fail();
		if (flat['objectLevel1.objectLevel2.objectLevel3..boolean'] !== true) fail();
		if (flat['objectLevel1.objectLevel2.objectLevel3..nullified'] !== null) fail();

		//	TODO: add assertions for array

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