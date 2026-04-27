import { test } from '@gullerya/just-test';
import { assert } from '@gullerya/just-test/assert';
import { waitNextTask } from '@gullerya/just-test/timing';
import { getRandom, CHAR_SOURCES } from '@gullerya/just-test/random';
import * as DataTier from '../dist/data-tier.js';


class CustomElementA extends HTMLElement {
	get value() {
		return this.__value;
	}

	set value(newSrc) {
		this.__value = newSrc.toUpperCase();
		this.textContent = this.__value;
	}
}

test('testing custom elements - autonomous: undefined first and adding to DOM', async () => {
	const tieName = getRandom(8);
	const ceSuffix = getRandom(4, CHAR_SOURCES.alphaLower);
	const tie = DataTier.ties.create(tieName, { text: 'some text' });
	const e = document.createElement('ce-' + ceSuffix);
	e.dataset.tie = `${tieName}:text => value`;
	if (e.value) assert.fail('precondition failed - was not expecting to get any value, got "' + e.value + '"');

	document.body.appendChild(e);

	await waitNextTask();

	if (e.value) assert.fail('precondition failed - was not expecting to get any value, got "' + e.value + '"');

	customElements.define('ce-' + ceSuffix, CustomElementA);

	await waitNextTask();

	assert.equal(tie.text.toUpperCase(), e.value);
});