import * as DataTier from '../dist/data-tier.js';

let suite = Utils.JustTest.createSuite({name: 'Testing Shadowing in iFrame'});

suite.addTest({name: 'iframe as such should not be influenced by the DataTier'}, (pass, fail) => {
	const tieName = 'tieForIFrame';
	let tie = DataTier.ties.create(tieName, {data: 'data'});

	let iframe = document.createElement('iframe');
	document.body.appendChild(iframe);
	iframe.contentDocument.body.innerHTML = `
		<div id="test-a" data-tie="tieForIFrame:data">default content</div>`;

	let c = iframe.contentDocument.getElementById('test-a').textContent;
	if (c !== 'default content') fail('expected textContent to be "default content" but found "' + c + '"');

	DataTier.ties.remove(tie);

	pass();
});

suite.addTest({name: 'iFrame added as root to DataTier'}, (pass, fail) => {
	const tieName = 'tieForIFrame';
	let tie = DataTier.ties.create(tieName, {data: 'data'});

	let iframe = document.createElement('iframe');
	document.body.appendChild(iframe);
	iframe.contentDocument.body.innerHTML = `<div id="test-a" data-tie="tieForIFrame:data">default content</div>`;

	let e = iframe.contentDocument.getElementById('test-a'),
		c = e.textContent;
	if (c !== 'default content') fail('expected textContent to be "default content" but found "' + c + '"');

	//  adding the shadowed iframe to the game
	DataTier.addRootDocument(iframe.contentDocument);
	c = e.textContent;
	if (c !== 'data') fail('expected textContent to be "data" but found "' + c + '"');

	//  ongoing change test
	tie.model.data = 'change';
	c = e.textContent;
	if (c !== 'change') fail('expected textContent to be "change" but found "' + c + '"');

	//  removing the iframe should cleanup things
	DataTier.removeRootDocument(iframe.contentDocument);
	document.body.removeChild(iframe);
	tie.model.data = 'one more time';
	c = e.textContent;
	if (c !== 'change') fail('expected textContent to be "change" but found "' + c + '"');

	DataTier.ties.remove(tie);

	pass();
});

suite.run();
