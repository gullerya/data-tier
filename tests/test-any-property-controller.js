import { test } from '@gullerya/just-test';
import { assert } from '@gullerya/just-test/assert';
import { waitNextTask } from '@gullerya/just-test/timing';
import * as DataTier from '../dist/data-tier.js';

const
	model = DataTier.ties.create('anyPropTestsModel', {
		text: 'some text',
		date: new Date(),
		bool: false,
		number: 3,
		obj: { innerProp: 'toValidate' }
	});

test('testing any-property - text', async () => {
	const e = document.createElement('div');
	e.dataset.tie = 'anyPropTestsModel:text => anyProp';
	document.body.appendChild(e);

	await waitNextTask();

	assert.equal(e.anyProp, model.text);
});

test('testing any-property - date', async () => {
	const e = document.createElement('div');
	e.dataset.tie = 'anyPropTestsModel:date => anyProp';
	document.body.appendChild(e);

	await waitNextTask();

	assert.equal(e.anyProp, model.date);
});

test('testing any-property - boolean', async () => {
	const e = document.createElement('div');
	e.dataset.tie = 'anyPropTestsModel:bool => anyProp';
	document.body.appendChild(e);

	await waitNextTask();

	assert.equal(e.anyProp, model.bool);
});

test('testing any-property - number', async () => {
	const e = document.createElement('div');
	e.dataset.tie = 'anyPropTestsModel:number => anyProp';
	document.body.appendChild(e);

	await waitNextTask();

	assert.equal(e.anyProp, model.number);
});

test('testing any-property - obj', async () => {
	const e = document.createElement('div');
	e.dataset.tie = 'anyPropTestsModel:obj => anyProp';
	document.body.appendChild(e);

	await waitNextTask();

	assert.equal(e.anyProp.innerProp, model.obj.innerProp);
});
