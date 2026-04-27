import { test } from '@gullerya/just-test';
import { assert } from '@gullerya/just-test/assert';
import { waitNextTask } from '@gullerya/just-test/timing';
import { getRandom } from '@gullerya/just-test/random';
import * as DataTier from '../dist/data-tier.js';


test('array manipulation flow', async () => {
	const
		tn = getRandom(8),
		ordersTie = DataTier.ties.create(tn, []),
		element = document.createElement('div');

	//	add element with static binding on element 2
	element.dataset.tie = `${tn}:2 => textContent`;
	document.body.appendChild(element);
	await waitNextTask();
	assert.equal('', element.textContent);

	//	add array having element 2
	ordersTie.push('0', '1', '2', '3');
	assert.equal('2', element.textContent);

	//	unshift
	ordersTie.unshift('primordial');
	assert.equal('1', element.textContent);

	//	shift
	ordersTie.shift();
	assert.equal('2', element.textContent);
	ordersTie.shift();
	assert.equal('3', element.textContent);
	ordersTie.shift();
	assert.equal('', element.textContent);

	//	push
	ordersTie.push('_');
	assert.equal('_', element.textContent);

	//	pop
	ordersTie.pop();
	assert.equal('', element.textContent);
});

test('array multi-manipulation flow', async () => {
	const
		testTie = DataTier.ties.create('testMulti', []),
		element = document.createElement('div');

	element.dataset.tie = 'testMulti:0 => textContent';
	document.body.appendChild(element);
	await waitNextTask();
	if (element.textContent !== '') assert.fail('[multi] expected textContent to be [], found ' + element.textContent);

	testTie.push('one', 'two', 'tree');
	if (element.textContent !== 'one') assert.fail('expected textContent to be [one], found ' + element.textContent);
});

test('array - full replace', async () => {
	const
		tieName = getRandom(8),
		testTie = DataTier.ties.create(tieName, { data: [] }),
		element = document.createElement('div');

	element.dataset.tie = tieName + ':data => data';
	document.body.appendChild(element);

	await waitNextTask();
	assert.isTrue(Array.isArray(element.data));
	assert.equal(0, element.data.length);

	Array.prototype.push.apply(testTie.data, [0, 1, 2, 3]);
	assert.equal(4, element.data.length);
	assert.equal(2, element.data[2]);
});