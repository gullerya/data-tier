import { DOMProcessor } from './dom-processor.js';
import { Ties } from './ties.js';
import { Views } from './views.js';

export { Observable } from './ties.js';

export const version = 'DT-VERSION-PLACEHOLDER';

const initStartTime = performance.now();
console.info(`DT (${version}): starting initialization...`);

class Instance {
	constructor() {
		this.params = Object.freeze(Array.from(new URL(import.meta.url).searchParams).reduce((a, c) => { a[c[0]] = c[1]; return a; }, {}));
		this.paramsKey = Symbol(`view.params.key`);
		this.domProcessor = new DOMProcessor(this);
		this.ties = new Ties(this);
		this.views = new Views(this);

		if (this.params.autostart !== 'false' && this.params.autostart !== false) {
			this.domProcessor.addDocument(document);
		}
	}
}

const instance = new Instance();

export const ties = instance.ties;
export const addDocument = instance.domProcessor.addDocument.bind(instance.domProcessor);
export const removeDocument = instance.domProcessor.removeDocument.bind(instance.domProcessor);

//	deprecated APIs
export const addRootDocument = addDocument;
export const removeRootDocument = removeDocument;

console.info(`DT (${version}): ... initialization DONE (took ${(performance.now() - initStartTime).toFixed(2)}ms)`);