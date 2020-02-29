import { Ties } from './ties.js';
import {
	SCOPE_ROOT_KEY,
	VIEW_PARAMS_KEY,
	DEFAULT_TIE_TARGET_PROVIDER,
	getTargetProperty,
	extractViewParams,
	CHANGE_EVENT_NAME_PROVIDER,
	addChangeListener,
	delChangeListener,
	getPath,
	setPath,
	setViewProperty,
	callViewFunction
} from './utils.js';
import { addView, delView } from './views.js';

export {
	DEFAULT_TIE_TARGET_PROVIDER,
	CHANGE_EVENT_NAME_PROVIDER
}

export const params = Object.freeze(Array.from(new URL(import.meta.url).searchParams).reduce((a, c) => { a[c[0]] = c[1]; return a; }, {}));
export const addRootDocument = rootDocument => {
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
export const removeRootDocument = rootDocument => {
	if (roots.has(rootDocument)) {
		dropTree(rootDocument);
		roots.delete(rootDocument);
		return true;
	} else {
		console.warn('no root document ' + rootDocument + ' known');
		return false;
	}
};

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

export const ties = new Ties();

function changeListener(event) {
	const
		element = event.currentTarget,
		targetProperty = getTargetProperty(element),
		viewParams = element[VIEW_PARAMS_KEY];
	let tieParam, tie, newValue;

	let i = viewParams.length;
	while (i) {
		tieParam = viewParams[--i];
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

function add(element) {
	if (element.matches(':defined')) {
		if (element.hasAttribute && element.hasAttribute('data-tie-scope') && !element[SCOPE_ROOT_KEY]) {
			ties.create(element);
		}

		const viewParams = extractViewParams(element);
		if (viewParams) {
			addView(element, viewParams);
			updateFromView(element);
			addChangeListener(element, changeListener);
		}

		if (element.shadowRoot && !element.hasAttribute('data-tie-blackbox')) {
			addRootDocument(element.shadowRoot);
		}
	} else {
		waitUndefined(element);
	}
}

function waitUndefined(element) {
	let tag = '';
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

function updateFromView(element) {
	const viewParams = element[VIEW_PARAMS_KEY];
	let i = viewParams.length;
	while (i) {
		const param = viewParams[--i];
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
			setViewProperty(element, param, value);
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
			if (Node.ELEMENT_NODE === next.nodeType && !next[VIEW_PARAMS_KEY]) {
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
	while (i) {
		next = list[--i];
		viewParams = next[VIEW_PARAMS_KEY];

		//	untie
		if (viewParams) {
			delView(next, viewParams);
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
		viewParams = element[VIEW_PARAMS_KEY];
		if (viewParams) {
			delView(element, viewParams);
			delChangeListener(element, changeListener);
		}
	}

	if (newParam) {
		viewParams = extractViewParams(element);
		if (viewParams) {
			addView(element, viewParams);
			updateFromView(element);
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
			while (i2) {
				node = added[--i2];
				nodeType = node.nodeType;
				if (Node.ELEMENT_NODE === nodeType) {
					addTree(node);
				}
			}

			//	process removed nodes
			removed = change.removedNodes;
			i3 = removed.length;
			while (i3) {
				node = removed[--i3];
				nodeType = node.nodeType;
				if (Node.ELEMENT_NODE === nodeType) {
					dropTree(node);
				}
			}
		}
	}
}

if (params.autostart !== 'false' && params.autostart !== false) {
	addRootDocument(document);
}

console.info('DT: ... initialization DONE (took ' + Math.floor((performance.now() - initStartTime) * 100) / 100 + 'ms)');