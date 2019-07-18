import { createSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const suite = createSuite({ name: 'Testing Shadowing in iFrame' });

suite.addTest({ name: 'iframe as such should not be influenced by the DataTier' }, test => {
	const tieName = 'tieForIFrame';
	const tie = DataTier.ties.create(tieName, { data: 'data' });

	const iframe = document.createElement('iframe');
	document.body.appendChild(iframe);
	iframe.contentDocument.body.innerHTML = `
		<div id="test-a" data-tie="tieForIFrame:data">default content</div>`;

	const c = iframe.contentDocument.getElementById('test-a').textContent;
	if (c !== 'default content') test.fail('expected textContent to be "default content" but found "' + c + '"');

	DataTier.ties.remove(tie);

	test.pass();
});

suite.addTest({ name: 'iFrame added as root to DataTier' }, test => {
	const tieName = 'tieForIFrame';
	const tie = DataTier.ties.create(tieName, { data: 'data' });

	const iframe = document.createElement('iframe');
	document.body.appendChild(iframe);
	iframe.contentDocument.body.innerHTML = `<div id="test-a" data-tie="tieForIFrame:data">default content</div>`;

	const e = iframe.contentDocument.getElementById('test-a');
	let c = e.textContent;
	if (c !== 'default content') test.fail('expected textContent to be "default content" but found "' + c + '"');

	//  adding the shadowed iframe to the game
	DataTier.addRootDocument(iframe.contentDocument);
	c = e.textContent;
	if (c !== 'data') test.fail('expected textContent to be "data" but found "' + c + '"');

	//  ongoing change test
	tie.model.data = 'change';
	c = e.textContent;
	if (c !== 'change') test.fail('expected textContent to be "change" but found "' + c + '"');

	//  removing the iframe should cleanup things
	DataTier.removeRootDocument(iframe.contentDocument);
	document.body.removeChild(iframe);
	tie.model.data = 'one more time';
	c = e.textContent;
	if (c !== 'change') test.fail('expected textContent to be "change" but found "' + c + '"');

	DataTier.ties.remove(tie);

	test.pass();
});

suite.run();
