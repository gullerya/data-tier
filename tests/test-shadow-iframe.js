import { getSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../src/data-tier.js';

const suite = getSuite({ name: 'Testing Shadowing in iFrame' });

suite.runTest({ name: 'iframe as such should not be influenced by the DataTier' }, test => {
	const tieName = test.getRandom(8, ['numeric']);
	const tie = DataTier.ties.create(tieName, { data: 'data' });

	const iframe = document.createElement('iframe');
	document.body.appendChild(iframe);
	iframe.contentDocument.body.innerHTML = `
		<div id="test-a" data-tie="${tieName}:data">default content</div>
	`;

	const c = iframe.contentDocument.getElementById('test-a').textContent;
	test.assertEqual('default content', c);

	DataTier.ties.remove(tie);
});

suite.runTest({ name: 'iFrame added as root to DataTier' }, test => {
	const tieName = test.getRandom(8, ['numeric']);
	const tie = DataTier.ties.create(tieName, { data: 'data' });

	const iframe = document.createElement('iframe');
	document.body.appendChild(iframe);
	iframe.contentDocument.body.innerHTML = `
		<div id="test-a" data-tie="${tieName}:data">default content</div>
	`;

	const e = iframe.contentDocument.getElementById('test-a');
	let c = e.textContent;
	test.assertEqual('default content', c);

	//  adding the shadowed iframe to the game
	DataTier.addRootDocument(iframe.contentDocument);
	c = e.textContent;
	test.assertEqual('data', c);

	//  ongoing change test
	tie.data = 'change';
	c = e.textContent;
	test.assertEqual('change', c);

	//  removing the iframe should cleanup things
	DataTier.removeRootDocument(iframe.contentDocument);
	document.body.removeChild(iframe);
	tie.data = 'one more time';
	c = e.textContent;
	test.assertEqual('change', c);

	DataTier.ties.remove(tie);
});