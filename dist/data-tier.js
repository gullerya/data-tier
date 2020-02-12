import { Ties } from './ties.js';
import {
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
	ELEMENT_PROCESSED_SYMBOL = Symbol('element-processed'),
	VIEW_PARAMS_KEY = Symbol('view.params.key'),
	roots = new WeakSet(),
	views = {},
	scopedViews = new WeakMap();

export const ties = new Ties(VIEW_PARAMS_KEY, views);

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
	element[ELEMENT_PROCESSED_SYMBOL] = true;

	if (element.matches(':defined')) {
		const viewParams = extractViewParams(element);
		let i;

		if (viewParams && (i = viewParams.length)) {
			element[VIEW_PARAMS_KEY] = viewParams;
			while (i) {
				const next = viewParams[--i];
				if (next.isFunctional) {
					next.fParams.forEach(fp => {
						const tieKey = fp.tieKey;
						const rawPath = fp.rawPath;
						//	TODO: scoped views
						const tieViews = views[tieKey] || (views[tieKey] = {});
						const pathViews = tieViews[rawPath] || (tieViews[rawPath] = []);
						if (pathViews.indexOf(element) < 0) {
							pathViews.push(element);
						}
					});
				} else {
					const tieKey = next.tieKey;
					const rawPath = next.rawPath;
					let tieViews;
					if (next.scoped) {
						const parent = element.getRootNode().host;
						if (scopedViews.has(parent)) {
							tieViews = scopedViews.get(parent);
						} else {
							tieViews = {};
							scopedViews.set(parent, tieViews);
						}
					} else {
						tieViews = views[tieKey] || (views[tieKey] = {});
					}
					const pathViews = tieViews[rawPath] || (tieViews[rawPath] = []);
					if (pathViews.indexOf(element) < 0) {
						pathViews.push(element);
					}
				}
			}
			updateFromView(element);
			addChangeListener(element, changeListener);
		}

		if (element.hasAttribute('data-tie-root')) {
			ties.create(element);
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

function updateFromView(element, tiedPath) {
	const viewParams = element[VIEW_PARAMS_KEY];
	let i = viewParams.length;
	while (i) {
		const param = viewParams[--i];
		if (param.isFunctional) {
			if (!tiedPath || param.fParams.some(fp => fp.rawPath.indexOf(tiedPath) === 0)) {
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
			}
		} else {
			if (!tiedPath || param.rawPath.indexOf(tiedPath) === 0) {
				const tie = ties.get(param.tieKey);
				if (undefined === tie) {
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
}

function addTree(root) {
	let list = [root];
	if (root.childElementCount) {
		list = Array.from(root.querySelectorAll('*'));
		list.unshift(root);
	}

	let i = list.length;
	while (i) {
		try {
			const next = list[--i];
			if (Node.ELEMENT_NODE === next.nodeType && !next[ELEMENT_PROCESSED_SYMBOL]) {
				add(next);
			}
		} catch (e) {
			console.error('failed to process/add element', e);
		}
	}
}

function dropTree(root) {
	let list;
	if (root.childElementCount) {
		list = Array.from(root.querySelectorAll('*'));
		list.unshift(root);
	} else {
		list = [root];
	}

	let i = list.length;
	while (i) {
		const next = list[--i];
		const viewParams = next[VIEW_PARAMS_KEY];

		//	untie
		if (viewParams) {
			let j = viewParams.length;
			while (j) {
				const tieParam = viewParams[--j];
				if (!views[tieParam.tieKey]) continue;
				const pathViews = views[tieParam.tieKey][tieParam.rawPath];
				const index = pathViews.indexOf(next);
				if (index >= 0) {
					pathViews.splice(index, 1);
					delChangeListener(next, changeListener);
				}
			}
			delete next[VIEW_PARAMS_KEY];
		}

		//	remove as root
		if (next.shadowRoot) {
			removeRootDocument(next.shadowRoot);
		}
	}
}

function move(element, oldParam, newParam) {
	let viewParams, i, index;
	if (oldParam) {
		viewParams = element[VIEW_PARAMS_KEY];
		if (viewParams) {
			i = viewParams.length;
			while (i) {
				const tieParam = viewParams[--i];
				if (!views[tieParam.tieKey]) continue;
				const pathViews = views[tieParam.tieKey][tieParam.rawPath];
				if (pathViews) {
					index = pathViews.indexOf(element);
					if (index >= 0) {
						pathViews.splice(index, 1);
					}
				}
			}
			delChangeListener(element, changeListener);
		}
	}

	if (newParam) {
		viewParams = extractViewParams(element);
		if (viewParams && (i = viewParams.length)) {
			element[VIEW_PARAMS_KEY] = viewParams;
			while (i) {
				const tieParam = viewParams[--i];
				const tieViews = views[tieParam.tieKey] || (views[tieParam.tieKey] = {});
				const pathViews = tieViews[tieParam.rawPath] || (tieViews[tieParam.rawPath] = []);
				if (pathViews.indexOf(element) < 0) {
					pathViews.push(element);
					updateFromView(element, tieParam.rawPath);
				}
			}
			addChangeListener(element, changeListener);
		}
	}
}

function processDomChanges(changes) {
	const l = changes.length;
	let i = 0, node, nodeType, change, changeType, added, i2, removed, i3;
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
				move(node, oldValue, newValue);
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