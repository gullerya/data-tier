import { getSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

let clickCounter = 0;
const suite = getSuite({ name: 'Testing functions dynamic binding' });

suite.runTest({ name: 'bind onclick logic' }, async test => {
	const tn = test.getRandom(8);
	const user = {
		name: 'click me',
		clickHandler: () => {
			clickCounter++;
			DataTier.ties.get(tn).name = 'click again';
			DataTier.ties.get(tn).clickHandler = () => clickCounter += 2;
		}
	};
	const d = document.createElement('div');
	DataTier.ties.create(tn, user);
	d.dataset.tie = `${tn}:clickHandler => onclick, ${tn}:name => textContent`;
	document.body.appendChild(d);

	await test.waitNextMicrotask();

	d.click();
	if (d.textContent !== 'click again' || clickCounter !== 1) test.fail('expected to register result of a first click');

	d.click();
	if (clickCounter !== 3) test.fail('expected to register result of a second click');
});