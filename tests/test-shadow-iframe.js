import { test } from '@gullerya/just-test';
import { assert } from '@gullerya/just-test/assert';
import { waitNextTask } from '@gullerya/just-test/timing';
import { getRandom } from '@gullerya/just-test/random';
import * as DataTier from '../dist/data-tier.js';


test('iframe as such should not be influenced by the DataTier', () => {
	const tieName = getRandom(8);
	const tie = DataTier.ties.create(tieName, { data: 'data' });

	const iframe = document.createElement('iframe');
	document.body.appendChild(iframe);
	iframe.contentDocument.body.innerHTML = `
		<div id="test-a" data-tie="${tieName}:data">default content</div>
	`;

	const c = iframe.contentDocument.getElementById('test-a').textContent;
	assert.equal('default content', c);

	DataTier.ties.remove(tie);
});

test('iframe added as root to DataTier should be tied', () => {
	const tieName = getRandom(8);
	const tie = DataTier.ties.create(tieName, { data: 'data' });

	const iframe = document.createElement('iframe');
	document.body.appendChild(iframe);
	iframe.contentDocument.body.innerHTML = `
		<div id="test-a" data-tie="${tieName}:data">default content</div>
	`;

	const e = iframe.contentDocument.getElementById('test-a');
	let c = e.textContent;
	assert.equal('default content', c);

	//  adding the iframe to the game
	DataTier.addDocument(iframe.contentDocument);
	c = e.textContent;
	assert.equal('data', c);

	//  ongoing change test
	tie.data = 'change';
	c = e.textContent;
	assert.equal('change', c);

	//  removing the iframe should cleanup things
	DataTier.removeDocument(iframe.contentDocument);
	document.body.removeChild(iframe);
	tie.data = 'one more time';
	c = e.textContent;
	assert.equal('change', c);

	DataTier.ties.remove(tie);
});

//	TODO: iframe-loaded html fixtures need path/handler adjustments for just-test 4
test('iframe pulling DataTier should be tied', { skip: true }, async () => {
	const tieName = getRandom(8);

	const iframe = document.createElement('iframe');
	iframe.src = './iframes/iframe-internal-tying.html';
	document.body.appendChild(iframe);

	await waitIFrameLoad(iframe);

	iframe.contentWindow.DataTier.ties.create(tieName, { text: 'text text' });

	const e = iframe.contentDocument.createElement('div');
	e.dataset.tie = `${tieName}:text`;
	iframe.contentDocument.body.appendChild(e);

	await waitNextTask();

	assert.equal('text text', e.textContent);
});

test('iframe pulling DataTier should not leak to the parent', { skip: true }, async () => {
	const tieName = getRandom(8);

	const e = document.createElement('div');
	e.dataset.tie = `${tieName}:text`;
	e.textContent = 'default text';
	document.body.appendChild(e);

	const iframe = document.createElement('iframe');
	iframe.src = './iframes/iframe-internal-tying.html';
	document.body.appendChild(iframe);

	await waitIFrameLoad(iframe);

	iframe.contentWindow.DataTier.ties.create(tieName, { text: 'text text' });

	await waitNextTask();

	assert.equal('default text', e.textContent);
});

async function waitIFrameLoad(iframe) {
	await new Promise(r => iframe.addEventListener('load', r));
}