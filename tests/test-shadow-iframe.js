import { getSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const suite = getSuite({ name: 'Testing Shadowing in iFrame' });

suite.runTest({ name: 'iframe as such should not be influenced by the DataTier' }, test => {
	const tieName = test.getRandom(8);
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

suite.runTest({ name: 'iframe added as root to DataTier should be tied' }, test => {
	const tieName = test.getRandom(8);
	const tie = DataTier.ties.create(tieName, { data: 'data' });

	const iframe = document.createElement('iframe');
	document.body.appendChild(iframe);
	iframe.contentDocument.body.innerHTML = `
		<div id="test-a" data-tie="${tieName}:data">default content</div>
	`;

	const e = iframe.contentDocument.getElementById('test-a');
	let c = e.textContent;
	test.assertEqual('default content', c);

	//  adding the iframe to the game
	DataTier.addDocument(iframe.contentDocument);
	c = e.textContent;
	test.assertEqual('data', c);

	//  ongoing change test
	tie.data = 'change';
	c = e.textContent;
	test.assertEqual('change', c);

	//  removing the iframe should cleanup things
	DataTier.removeDocument(iframe.contentDocument);
	document.body.removeChild(iframe);
	tie.data = 'one more time';
	c = e.textContent;
	test.assertEqual('change', c);

	DataTier.ties.remove(tie);
});

suite.runTest({ name: 'iframe pulling DataTier should be tied' }, async test => {
	const tieName = test.getRandom(8);

	const iframe = document.createElement('iframe');
	iframe.src = './iframes/iframe-internal-tying.html';
	document.body.appendChild(iframe);

	await waitIFrameLoad(iframe);

	iframe.contentWindow.DataTier.ties.create(tieName, { text: 'text text' });

	const e = iframe.contentDocument.createElement('div');
	e.dataset.tie = `${tieName}:text`;
	iframe.contentDocument.body.appendChild(e);

	await test.waitNextMicrotask();

	test.assertEqual('text text', e.textContent);
});

suite.runTest({ name: 'iframe pulling DataTier should not leak to the parent' }, async test => {
	const tieName = test.getRandom(8);

	const e = document.createElement('div');
	e.dataset.tie = `${tieName}:text`;
	e.textContent = 'default text';
	document.body.appendChild(e);

	const iframe = document.createElement('iframe');
	iframe.src = './iframes/iframe-internal-tying.html';
	document.body.appendChild(iframe);

	await waitIFrameLoad(iframe);

	iframe.contentWindow.DataTier.ties.create(tieName, { text: 'text text' });

	await test.waitNextMicrotask();

	test.assertEqual('default text', e.textContent);
});

async function waitIFrameLoad(iframe) {
	await new Promise(r => iframe.addEventListener('load', r));
}