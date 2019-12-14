import {
	ensureObservable,
	DEFAULT_TIE_TARGET_PROVIDER,
	getTargetProperty,
	extractViewParams,
	CHANGE_EVENT_NAME_PROVIDER,
	addChangeListener,
	delChangeListener,
	getPath,
	setPath
} from './dt-utils.js';

export {
	DEFAULT_TIE_TARGET_PROVIDER,
	CHANGE_EVENT_NAME_PROVIDER
}

export const ties = new Ties();
export const addRootDocument = rootDocument => {
	if (!rootDocument || (Node.DOCUMENT_NODE !== rootDocument.nodeType && Node.DOCUMENT_FRAGMENT_NODE !== rootDocument.nodeType)) {
		throw new Error('invalid argument, NULL or not one of: DOCUMENT_NODE, DOCUMENT_FRAGMENT_NODE');
	}
	if (roots.has(rootDocument)) {
		console.warn('any root document may be added only once');
		return false;
	}

	initDocumentObserver(rootDocument);

	console.debug('DT: scanning the document for a views...');
	const baseDocumentScanStartTime = performance.now();
	addTree(rootDocument);
	console.debug('DT: ... scanning the ' + rootDocument + ' for a views DONE (took ' +
		Math.floor((performance.now() - baseDocumentScanStartTime) * 100) / 100 + 'ms');
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
	ELEMENT_PROCESSED_SYMBOL = Symbol('element-processed'),
	VIEW_PARAMS_KEY = Symbol('view.params.key'),
	roots = new WeakSet(),
	views = {};

class Tie {
	constructor(key, model) {
		this.key = key;
		this.model = model;
		this.observer = Tie.processDataChanges.bind(this);
		this.model.observe(this.observer);
		Object.freeze(this);
	}

	static processDataChanges(changes) {
		const
			tieKey = this.key,
			tieModel = this.model,
			tieViews = views[tieKey],
			tiedPaths = Object.keys(tieViews),
			fullUpdatesMap = {};
		let i, l, change, changedObject, arrPath, changedPath = '', pl, tiedPath, pathViews, pvl;

		if (!tiedPaths.length) return;

		for (i = 0, l = changes.length; i < l; i++) {
			change = changes[i];
			changedObject = change.object;
			arrPath = change.path;

			if (Array.isArray(changedObject) &&
				(change.type === 'insert' || change.type === 'delete') &&
				!isNaN(arrPath[arrPath.length - 1])) {
				changedPath = arrPath.slice(0, -1).join('.');
				if (fullUpdatesMap[changedPath] === changedObject) {
					continue;
				} else {
					fullUpdatesMap[changedPath] = changedObject;
					change = null;
				}
			} else {
				const apl = arrPath.length;
				if (apl > 1) {
					for (let k = 0; k < apl - 1; k++) {
						changedPath += arrPath[k] + '.';
					}
					changedPath += arrPath[apl - 1];
				} else if (apl === 1) {
					changedPath = arrPath[0];
				}
			}

			pl = tiedPaths.length;
			while (pl) {
				tiedPath = tiedPaths[--pl];
				if (tiedPath.indexOf(changedPath) === 0) {
					pathViews = tieViews[tiedPath];
					pvl = pathViews.length;
					while (pvl) {
						updateFromTie(pathViews[--pvl], changedPath, change, tieKey, tieModel);
					}
				}
			}
		}
	}
}

function Ties() {
	const
		ts = {},
		vp = /^[a-zA-Z0-9]+$/;

	this.get = function get(key) {
		const t = ts[key];
		return t ? t.model : undefined;
	};

	this.create = function create(key, model) {
		if (ts[key]) {
			throw new Error('tie "' + key + '" already exists');
		}
		validateTieKey(key);

		if (!(key in views)) views[key] = {};

		const m = ensureObservable(model);
		ts[key] = new Tie(key, m);
		ts[key].observer([{ path: [] }]);

		return m;
	};

	this.remove = function remove(tieToRemove) {
		let tieNameToRemove;
		if (typeof tieToRemove === 'object') {
			tieNameToRemove = Object.keys(ts).find(key => ts[key].model === tieToRemove);
		} else if (typeof tieToRemove === 'string') {
			tieNameToRemove = tieToRemove;
		} else {
			throw new Error('tie to remove MUST either be a valid tie key or tie self');
		}

		delete views[tieNameToRemove];
		const tie = ts[tieNameToRemove];
		if (tie) {
			if (tie.model) {
				tie.model.revoke();
			}
			delete ts[tieNameToRemove];
		}
	};

	function validateTieKey(key) {
		if (!key || typeof key !== 'string') {
			throw new Error('tie key MUST be a non empty string');
		}
		if (!vp.test(key)) {
			throw new Error('tie key MUST match ' + vp + '; "' + key + '" is not');
		}
	}

	Object.freeze(this);
}

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
		let i = viewParams.length;
		while (i) {
			const next = viewParams[--i];
			const tieKey = next.tieKey;
			const rawPath = next.rawPath;
			const tieViews = views[tieKey] || (views[tieKey] = {});
			const pathViews = tieViews[rawPath] || (tieViews[rawPath] = []);
			if (pathViews.indexOf(element) < 0) {
				pathViews.push(element);
				element[VIEW_PARAMS_KEY] = viewParams;
				updateFromView(element);
				addChangeListener(element, changeListener);
			}
		}

		if (element.shadowRoot) {
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

function updateFromTie(element, changedPath, change, tieKey, tieModel) {
	const viewParams = element[VIEW_PARAMS_KEY];
	let i = viewParams.length;
	while (i) {
		const param = viewParams[--i];
		if (param.tieKey !== tieKey) {
			continue;
		}

		if (param.rawPath.indexOf(changedPath) === 0) {
			let newValue;
			if (changedPath !== param.rawPath || typeof change.value === 'undefined') {
				newValue = getPath(tieModel, param.path);
			} else {
				newValue = change.value;
			}
			if (typeof newValue === 'undefined') {
				newValue = '';
			}
			const tp = param.targetProperty;
			if (tp === 'value' && element.nodeName === 'INPUT' && element.type === 'checkbox') {
				element.checked = newValue;
			} else if (tp === 'href') {
				element.href.baseVal = newValue;
			} else {
				element[tp] = newValue;
			}
		}
	}
}

function updateFromView(element, changedPath) {
	const viewParams = element[VIEW_PARAMS_KEY];
	let i = viewParams.length;
	while (i) {
		const param = viewParams[--i];
		const tie = ties.get(param.tieKey);

		if (undefined === tie) {
			continue;
		}

		if (!changedPath || param.rawPath.indexOf(changedPath) === 0) {
			let value = getPath(tie, param.path);
			if (typeof value === 'undefined') {
				value = '';
			}
			const tp = param.targetProperty;
			if (tp === 'value' && element.nodeName === 'INPUT' && element.type === 'checkbox') {
				element.checked = value;
			} else if (tp === 'href') {
				element.href.baseVal = value;
			} else {
				element[tp] = value;
			}
		}
	}
}

function addTree(root) {
	let list;
	if (root.childElementCount) {
		list = Array.from(root.querySelectorAll('*'));
		list.unshift(root);
	} else {
		list = [root];
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
	let viewParams, i, l, index;
	if (oldParam) {
		viewParams = element[VIEW_PARAMS_KEY];
		for (i = 0, l = viewParams.length; i < l; i++) {
			const tieParam = viewParams[i];
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

	if (newParam) {
		viewParams = extractViewParams(element);
		element[VIEW_PARAMS_KEY] = viewParams;
		for (i = 0, l = viewParams.length; i < l; i++) {
			const tieParam = viewParams[i];
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

function processDomChanges(changes) {
	const l = changes.length;
	let i = 0, node, nodeType, change, changeType,
		attributeName, added, i2, removed, i3;
	for (; i < l; i++) {
		change = changes[i];
		changeType = change.type;
		if (changeType === 'attributes') {
			attributeName = change.attributeName;
			node = change.target;
			move(node, change.oldValue, node.getAttribute(attributeName));
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

function initDocumentObserver(document) {
	console.debug('DT: initializing DOM observer on document');
	const domObserver = new MutationObserver(processDomChanges);
	domObserver.observe(document, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeOldValue: true,
		attributeFilter: ['data-tie'],
		characterData: false,
		characterDataOldValue: false
	});
}

addRootDocument(document);

console.info('DT: ... initialization DONE (took ' + Math.floor((performance.now() - initStartTime) * 100) / 100 + 'ms)');