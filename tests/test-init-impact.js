import { getSuite } from '../node_modules/just-test/dist/just-test.min.js';
import * as DataTier from '../dist/data-tier.js';

const suite = getSuite({ name: 'Bench: document init' });
const skip = true;

const DocumentSizes = [1000, 3000, 5000, 7000, 12000];
const domChunks = [
	`<div><div><div>
			<input><input><select></select>
		</div>
		<div>
			<input><input><select></select>
	</div></div></div>`,
	`<div><div><div>
			<input data-tie="tieKeyA:some.path => value => input">
			<input><select></select>
		</div>
		<div>
			<input data-tie="tieKeyB:some.path">
			<input><select></select>
	</div></div></div>`,
	`<div><div><div>
			<input data-tie="tieKeyA:some.path => value => input">
			<input data-tie="tieKeyB:some.path => value => input">
			<select></select>
		</div>
		<div>
			<input data-tie="tieKeyC:some.path">
			<input data-tie="tieKeyD:some.path">
			<select data-tie="tieKeyE:some.path"></select>
	</div></div></div>`,
	`<div><div><div data-tie="tieKeyA:some.path">
			<input data-tie="tieKeyB:some.path => value => input">
			<input data-tie="tieKeyC:some.path => value => input">
			<select></select>
		</div>
		<div data-tie="tieKeyD:some.path">
			<input data-tie="tieKeyE:some.path">
			<input data-tie="tieKeyF:some.path">
			<select data-tie="tieKeyG:some.path"></select>
	</div></div></div>`
];

for (const docSize of DocumentSizes) {

	if (skip) {
		continue;
	}

	for (const domChunk of domChunks) {
		const dom = new Array(docSize / 10)
			.fill(domChunk)
			.join();

		const f = document.createElement('iframe');
		document.body.appendChild(f);
		f.contentDocument.body.innerHTML = dom;
		const totalElements = f.contentDocument.body.querySelectorAll('*').length;
		const tiedElements = f.contentDocument.body.querySelectorAll('[data-tie]').length;

		suite.runTest({ name: `perform init on DOM; total elements: ${totalElements}, tied elements: ${tiedElements}` }, test => {
			test.assertEqual(docSize, totalElements);

			let startTime = performance.now();
			DataTier.addDocument(f.contentDocument);
			let endTime = performance.now();
			console.log(`scan of ${totalElements}/${tiedElements} elements took ${endTime - startTime}ms`);

			startTime = performance.now();
			DataTier.removeDocument(f.contentDocument);
			endTime = performance.now();
			console.log(`untie of ${totalElements}/${tiedElements} elements took ${endTime - startTime}ms`);
		});
	}
}
