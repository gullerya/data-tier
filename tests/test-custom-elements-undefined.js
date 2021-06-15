import { getSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const suite = getSuite({ name: 'Testing Custom Elements when Undefined yet' });

class CustomElementA extends HTMLElement {
	get value() {
		return this.__value;
	}

	set value(newSrc) {
		this.__value = newSrc.toUpperCase();
		this.textContent = this.__value;
	}
}

suite.runTest({ name: 'testing custom elements - autonomous: undefined first and adding to DOM' }, async test => {
	const tieName = test.getRandom(8);
	const ceSuffix = test.getRandom(4, ['abcdefghijklmnopqrstuvwxyz']);
	const tie = DataTier.ties.create(tieName, { text: 'some text' });
	const e = document.createElement('ce-' + ceSuffix);
	e.dataset.tie = `${tieName}:text => value`;
	if (e.value) test.fail('precondition failed - was not expecting to get any value, got "' + e.value + '"');

	document.body.appendChild(e);

	await test.waitNextMicrotask();

	if (e.value) test.fail('precondition failed - was not expecting to get any value, got "' + e.value + '"');

	customElements.define('ce-' + ceSuffix, CustomElementA);

	await test.waitNextMicrotask();

	test.assertEqual(tie.text.toUpperCase(), e.value);
});