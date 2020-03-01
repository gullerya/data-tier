import { Ties } from './ties.js';
import { Views } from './views.js';
import {
	DEFAULT_TIE_TARGET_PROVIDER as dttp,
	CHANGE_EVENT_NAME_PROVIDER as cenp,
	getTargetProperty,
	extractViewParams,
	addChangeListener,
	delChangeListener,
	getPath,
	setPath,
	callViewFunction
} from './utils.js';

console.info('DT: starting initialization...');
const initStartTime = performance.now();

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
	roots = new WeakSet();

class Instance {
	constructor() {
		this.params = Object.freeze(Array.from(new URL(import.meta.url).searchParams).reduce((a, c) => { a[c[0]] = c[1]; return a; }, {}));

		this.paramsKey = Symbol('view.params');
		this.scopeRootKey = Symbol('scope.root');
		this.ties = new Ties(this);
		this.views = new Views(this);
	}

	addRootDocument(rootDocument) {
		if (!rootDocument || (Node.DOCUMENT_NODE !== rootDocument.nodeType && Node.DOCUMENT_FRAGMENT_NODE !== rootDocument.nodeType)) {
			throw new Error('invalid argument, NULL or not one of: DOCUMENT_NODE, DOCUMENT_FRAGMENT_NODE');
		}
		if (roots.has(rootDocument)) {
			console.warn('any root document may be added only once');
			return false;
		}

		new MutationObserver(processDomChanges).observe(rootDocument, MUTATION_OBSERVER_OPTIONS);

		addTree(rootDocument);
		roots.add(rootDocument);
		return true;
	};

	removeRootDocument(rootDocument) {
		if (roots.has(rootDocument)) {
			dropTree(rootDocument);
			roots.delete(rootDocument);
			return true;
		} else {
			console.warn('no root document ' + rootDocument + ' known');
			return false;
		}
	};
}

const instance = new Instance();
export const ties = instance.ties;
export const DEFAULT_TIE_TARGET_PROVIDER = dttp;
export const CHANGE_EVENT_NAME_PROVIDER = cenp;
export const addRootDocument = instance.addRootDocument;
export const removeRootDocument = instance.removeRootDocument;

function changeListener(event) {
	const
		element = event.currentTarget,
		targetProperty = getTargetProperty(element),
		viewParams = element[instance.paramsKey];
	let tieParam, tie, newValue;

	let i = viewParams.length;
	while (i--) {
		tieParam = viewParams[i];
		if (tieParam.targetProperty !== targetProperty) {
			continue;
		}

		tie = instance.ties.get(tieParam.tieKey);
		if (tie) {
			newValue = element[targetProperty];
			setPath(tie, tieParam.path, newValue);
		}
	}
}

function add(element) {
	if (element.matches(':defined')) {
		const viewParams = extractViewParams(element, instance.scopeRootKey);
		if (viewParams) {
			instance.views.addView(element, viewParams);
			updateFromView(element, viewParams);
			addChangeListener(element, changeListener);
		}

		if (element.shadowRoot && !element.hasAttribute('data-tie-blackbox')) {
			instance.addRootDocument(element.shadowRoot);
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
		customElements.whenDefined(tag).then(() => add(element));
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
				const tie = instance.ties.get(fp.tieKey);
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
			const tie = instance.ties.get(param.tieKey);
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
	let list = [root], next;
	if (root.childElementCount) {
		list = Array.from(root.querySelectorAll('*'));
		list.unshift(root);
	}

	const l = list.length;
	for (let i = 0; i < l; i++) {
		try {
			next = list[i];
			if (Node.ELEMENT_NODE === next.nodeType && !next[instance.paramsKey]) {
				add(next);
			}
		} catch (e) {
			console.error('failed to process/add element', e);
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
		viewParams = next[instance.paramsKey];

		//	untie
		if (viewParams) {
			instance.views.delView(next, viewParams);
			delChangeListener(next, changeListener);
		}

		//	remove as root
		if (next.shadowRoot && !next.hasAttribute('data-tie-blackbox')) {
			instance.removeRootDocument(next.shadowRoot);
		}
	}
}

function onTieParamChange(element, oldParam, newParam) {
	let viewParams;
	if (oldParam) {
		viewParams = element[instance.paramsKey];
		if (viewParams) {
			instance.views.delView(element, viewParams);
			delChangeListener(element, changeListener);
		}
	}

	if (newParam) {
		viewParams = extractViewParams(element, instance.scopeRootKey);
		if (viewParams) {
			instance.views.addView(element, viewParams);
			updateFromView(element, viewParams);
			addChangeListener(element, changeListener);
		}
	}
}

function processDomChanges(changes) {
	const l = changes.length;
	let i = 0, node, nodeType, change, changeType, added, i2, removed, i3;
	//	collect all the changes to process and then do the processing

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
			//	process added nodes
			added = change.addedNodes;
			i2 = added.length;
			while (i2--) {
				node = added[i2];
				nodeType = node.nodeType;
				if (Node.ELEMENT_NODE === nodeType) {
					addTree(node);
				}
			}

			//	process removed nodes
			removed = change.removedNodes;
			i3 = removed.length;
			while (i3--) {
				node = removed[i3];
				nodeType = node.nodeType;
				if (Node.ELEMENT_NODE === nodeType) {
					dropTree(node);
				}
			}
		}
	}
}

if (instance.params.autostart !== 'false' && instance.params.autostart !== false) {
	instance.addRootDocument(document);
}

console.info('DT: ... initialization DONE (took ' + Math.floor((performance.now() - initStartTime) * 100) / 100 + 'ms)');