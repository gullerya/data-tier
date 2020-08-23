import { getSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const
	suite = getSuite({ name: 'Testing AnyProperty Controller' }),
	model = DataTier.ties.create('anyPropTestsModel', {
		text: 'some text',
		date: new Date(),
		bool: false,
		number: 3,
		obj: { innerProp: 'toValidate' }
	});

suite.runTest({ name: 'testing any-property - text' }, async test => {
	const e = document.createElement('div');
	e.dataset.tie = 'anyPropTestsModel:text => anyProp';
	document.body.appendChild(e);

	await test.waitNextMicrotask();

	test.assertEqual(e.anyProp, model.text);
});

suite.runTest({ name: 'testing any-property - date' }, async test => {
	const e = document.createElement('div');
	e.dataset.tie = 'anyPropTestsModel:date => anyProp';
	document.body.appendChild(e);

	await test.waitNextMicrotask();

	test.assertEqual(e.anyProp, model.date);
});

suite.runTest({ name: 'testing any-property - boolean' }, async test => {
	const e = document.createElement('div');
	e.dataset.tie = 'anyPropTestsModel:bool => anyProp';
	document.body.appendChild(e);

	await test.waitNextMicrotask();

	test.assertEqual(e.anyProp, model.bool);
});

suite.runTest({ name: 'testing any-property - number' }, async test => {
	const e = document.createElement('div');
	e.dataset.tie = 'anyPropTestsModel:number => anyProp';
	document.body.appendChild(e);

	await test.waitNextMicrotask();

	test.assertEqual(e.anyProp, model.number);
});

suite.runTest({ name: 'testing any-property - obj' }, async test => {
	const e = document.createElement('div');
	e.dataset.tie = 'anyPropTestsModel:obj => anyProp';
	document.body.appendChild(e);

	await test.waitNextMicrotask();

	test.assertEqual(e.anyProp.innerProp, model.obj.innerProp);
});
