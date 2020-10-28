import { Ties } from './ties.js';
import { Views } from './views.js';
import {
	DEFAULT_TIE_TARGET_PROVIDER,
	CHANGE_EVENT_NAME_PROVIDER,
	getTargetProperty,
	extractViewParams,
	addChangeListener,
	delChangeListener,
	getPath,
	setPath,
	callViewFunction
} from './utils.js';

export {
	ties,
	version,
	addRootDocument,
	removeRootDocument,
	DEFAULT_TIE_TARGET_PROVIDER,
	CHANGE_EVENT_NAME_PROVIDER
}

const initStartTime = performance.now();
const version = 'DT-VERSION-PLACEHOLDER';

console.info(`DT (${version}): starting initialization...`);

const
	MUTATION_OBSERVER_OPTIONS = {
		childList: true,
		subtree: true,
		attributes: true,
		attributeOldValue: true,
		attributeFilter: ['data-tie'],
		characterData: false,
		characterDataOldValue: false
	},
	roots = new WeakSet(),
	PARAMS_KEY = Symbol('view.params.key'),
	SCOPE_ROOT_TIE_KEY = Symbol('scope.root.tie.key');

class Instance {
	constructor() {
		this.params = Object.freeze(Array.from(new URL(import.meta.url).searchParams).reduce((a, c) => { a[c[0]] = c[1]; return a; }, {}));
		this.paramsKey = PARAMS_KEY;
		this.scopeRootTieKey = SCOPE_ROOT_TIE_KEY;
		this.ties = new Ties(this);
		this.views = new Views(this);
		this.addTree = addTree;
	}
}

const instance = new Instance();
const ties = instance.ties;

function addRootDocument(rootDocument) {
	if (!rootDocument || (Node.DOCUMENT_NODE !== rootDocument.nodeType && Node.DOCUMENT_FRAGMENT_NODE !== rootDocument.nodeType)) {
		throw new Error('invalid argument, must be one of: DOCUMENT_NODE, DOCUMENT_FRAGMENT_NODE');
	}
	if (roots.has(rootDocument)) {
		console.warn('any root document may be added only once');
		return false;
	}

	new MutationObserver(processDomChanges).observe(rootDocument, MUTATION_OBSERVER_OPTIONS);

	addTree(rootDocument);
	roots.add(rootDocument);
	return true;
}

function removeRootDocument(rootDocument) {
	if (roots.has(rootDocument)) {
		dropTree(rootDocument);
		roots.delete(rootDocument);
		return true;
	} else {
		console.warn('no root document ' + rootDocument + ' known');
		return false;
	}
}

function changeListener(event) {
	const
		element = event.currentTarget,
		targetProperty = getTargetProperty(element),
		viewParams = element[PARAMS_KEY];
	let tieParam, tie, newValue;

	if (!viewParams) {
		return;
	}
	let i = viewParams.length;
	while (i--) {
		tieParam = viewParams[i];
		if (tieParam.targetProperty !== targetProperty) {
			continue;
		}

		tie = ties.get(tieParam.tieKey);
		if (tie) {
			newValue = element[targetProperty];
			setPath(tie, tieParam.path, newValue);
		}
	}
}

function processCandidateView(element) {
	if (element.matches(':defined')) {
		const viewParams = extractViewParams(element, SCOPE_ROOT_TIE_KEY);
		if (viewParams) {
			instance.views.addView(element, viewParams);
			addChangeListener(element, changeListener);
			updateFromView(element, viewParams);
		}

		if (element.shadowRoot && !element.hasAttribute('data-tie-blackbox')) {
			addRootDocument(element.shadowRoot);
		}
	} else {
		waitUndefined(element);
	}
}

function waitUndefined(element) {
	let tag;
	if (element.localName.indexOf('-') > 0) {
		tag = element.localName;
	} else {
		const matches = /.*is\s*=\s*"([^"]+)"\s*.*/.exec(element.outerHTML);
		if (matches && matches.length > 1) {
			tag = matches[1];
		}
	}
	if (tag) {
		customElements.whenDefined(tag).then(() => processCandidateView(element));
	} else {
		console.warn('failed to determine tag of yet undefined custom element ' + element + ', abandoning');
	}
}

function updateFromView(element, viewParams) {
	let i = viewParams.length;
	while (i--) {
		const param = viewParams[i];
		if (param.isFunctional) {
			let someData = false;
			const args = [];
			param.fParams.forEach(fp => {
				let arg;
				const tie = ties.get(fp.tieKey);
				if (tie) {
					arg = getPath(tie, fp.path);
					someData = true;
				}
				args.push(arg);
			});
			if (someData) {
				args.push(null);
				callViewFunction(element, param.targetProperty, args);
			}
		} else {
			const tie = ties.get(param.tieKey);
			if (!tie) {
				continue;
			}
			let value = getPath(tie, param.path);
			if (typeof value === 'undefined') {
				value = '';
			}
			instance.views.setViewProperty(element, param, value);
		}
	}
}

function addTree(root) {
	processCandidateView(root)
	if (root.childElementCount) {
		const tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
		let nextNode;
		while ((nextNode = tw.nextNode())) {
			if (!nextNode[PARAMS_KEY]) {
				processCandidateView(nextNode);
			}
		}
	}
}

function dropTree(root) {
	let list = [root], i, next, viewParams;
	if (root.childElementCount) {
		list = Array.from(root.querySelectorAll('*'));
		list.unshift(root);
	}

	i = list.length;
	while (i--) {
		next = list[i];
		viewParams = next[PARAMS_KEY];

		//	untie
		if (viewParams) {
			instance.views.delView(next, viewParams);
			delChangeListener(next, changeListener);
		}

		//	remove as root
		if (next.shadowRoot && !next.hasAttribute('data-tie-blackbox')) {
			removeRootDocument(next.shadowRoot);
		}
	}
}

function onTieParamChange(element, oldParam, newParam) {
	let viewParams;
	if (oldParam) {
		viewParams = element[PARAMS_KEY];
		if (viewParams) {
			instance.views.delView(element, viewParams);
			delChangeListener(element, changeListener);
		}
	}

	if (newParam) {
		viewParams = extractViewParams(element, SCOPE_ROOT_TIE_KEY);
		if (viewParams) {
			instance.views.addView(element, viewParams);
			updateFromView(element, viewParams);
			addChangeListener(element, changeListener);
		}
	}
}

function processDomChanges(changes) {
	const started = performance.now();

	const l = changes.length;
	let i = 0, change, changeType;

	for (; i < l; i++) {
		change = changes[i];
		changeType = change.type;
		if (changeType === 'attributes') {
			const
				attributeName = change.attributeName,
				node = change.target,
				oldValue = change.oldValue,
				newValue = node.getAttribute(attributeName);
			if (oldValue !== newValue) {
				onTieParamChange(node, oldValue, newValue);
			}
		} else if (changeType === 'childList') {
			//	todo: filter duplicates and not an elements
			const an = change.addedNodes;
			for (let ai = 0, al = an.length; ai < al; ai++) {
				addTree(an[ai]);
			}

			const rn = change.removedNodes;
			for (let di = 0, dl = rn.length; di < dl; di++) {
				dropTree(rn[di]);
			}
		}
	}

	console.log(`${changes.length} changes processed in ${performance.now() - started}ms`);
}

if (instance.params.autostart !== 'false' && instance.params.autostart !== false) {
	addRootDocument(document);
}

console.info(`DT (${version}): ... initialization DONE (took ${(performance.now() - initStartTime).toFixed(2)}ms)`);