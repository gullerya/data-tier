import { createSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

let clickCounter = 0;
const suite = createSuite({ name: 'Testing functions dynamic binding' }),
	user = {
		name: 'click me',
		clickHandler: function (e) {
			clickCounter++;
			DataTier.ties.get('functionalTest').name = 'click again';
			DataTier.ties.get('functionalTest').clickHandler = function () {
				clickCounter += 2;
			}
		}
	};

DataTier.ties.create('functionalTest', user);

suite.runTest({ name: 'bind onclick logic' }, async test => {
	const d = document.createElement('div');
	d.dataset.tie = 'functionalTest:clickHandler => onclick, functionalTest:name => textContent';
	document.body.appendChild(d);

	await test.waitNextMicrotask();

	d.click();
	if (d.textContent !== 'click again' || clickCounter !== 1) test.fail('expected to register result of a first click');

	d.click();
	if (clickCounter !== 3) test.fail('expected to register result of a second click');
});