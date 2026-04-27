import { test } from '@gullerya/just-test';
import { assert } from '@gullerya/just-test/assert';
import { waitNextTask } from '@gullerya/just-test/timing';
import * as DataTier from '../dist/data-tier.js';

const
	model = {
		text: 'some text',
		date: new Date()
	};

DataTier.ties.create('testCustomsA', model);
DataTier.ties.create('testCustomsB', model);

class CustomElement extends HTMLElement {
	get value() {
		return this.__value;
	}

	set value(newSrc) {
		this.__value = newSrc.toUpperCase();
		this.textContent = this.__value;
	}
}

customElements.define('custom-element', CustomElement);

test('testing basic controllers: binding value of custom element', async () => {
	const e = document.createElement('custom-element');
	e.dataset.tie = 'testCustomsA:text => value';
	if (e.value) assert.fail('precondition of the test failed');
	document.body.appendChild(e);

	await waitNextTask();

	assert.equal(e.value, model.text.toUpperCase());
});