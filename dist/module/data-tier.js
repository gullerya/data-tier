import Observable from './object-observer.js';

export const ties = new Ties();

const
	PRIVATE_MODEL_SYMBOL = Symbol('private-tie-model-key'),
	views = {},
	viewsParams = new WeakMap(),
	PARAM_SPLITTER = /\s*=>\s*/,
	MULTI_PARAMS_SPLITTER = /\s*[,;]\s*/;

class Tie {
	constructor(name) {
		this[PRIVATE_MODEL_SYMBOL] = null;
		Object.defineProperty(this, 'name', {value: name});
		Object.seal(this);
	}

	get model() {
		return this[PRIVATE_MODEL_SYMBOL];
	}

	set model(input) {
		let oldModel = this[PRIVATE_MODEL_SYMBOL];
		if (input !== oldModel) {
			let newModel = ensureObservable(input);
			if (newModel) {
				newModel.observe(this.processDataChanges.bind(this));
			}
			this[PRIVATE_MODEL_SYMBOL] = newModel;
			this.processDataChanges([{path: []}]);
			if (oldModel) oldModel.revoke();
		}
	}

	processDataChanges(changes) {
		let tieName = this.name,
			tieData = this[PRIVATE_MODEL_SYMBOL],
			i, l, change, arrPath, changedPath, pl, tiedPath, pathViews, pvl,
			tieViews = views[tieName],
			tiedPaths = Object.keys(tieViews),
			arrayFullUpdate;

		if (!tiedPaths.length) return;

		for (i = 0, l = changes.length; i < l; i++) {
			change = changes[i];
			arrPath = change.path;

			if (Array.isArray(change.object) &&
				(change.type === 'insert' || change.type === 'delete') &&
				!isNaN(arrPath[arrPath.length - 1])) {
				changedPath = arrPath.slice(0, -1).join('.');
				arrayFullUpdate = true;
			} else {
				changedPath = arrPath && arrPath.length ? arrPath.join('.') : '';
				arrayFullUpdate = false;
			}

			pl = tiedPaths.length;
			while (pl--) {
				tiedPath = tiedPaths[pl];
				if (tiedPath.indexOf(changedPath) === 0) {
					pathViews = tieViews[tiedPath];
					pvl = pathViews.length;
					while (pvl--) {
						update(pathViews[pvl], tieData, changedPath, !arrayFullUpdate ? change : null);
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

	this.get = function get(name) {
		validateTieName(name);
		return ts[name];
	};

	this.create = function create(name, model) {
		validateTieName(name);
		if (ts[name]) {
			throw new Error('tie (' + name + ') is already present and MAY NOT be re-created');
		}
		let result = new Tie(name);
		ts[name] = result;
		if (!views.hasOwnProperty(name)) views[name] = {};
		result.model = model;
		return result;
	};

	this.remove = function remove(name) {
		validateTieName(name);
		delete views[name];
		let tie = ts[name];
		if (tie) {
			if (tie[PRIVATE_MODEL_SYMBOL]) {
				tie[PRIVATE_MODEL_SYMBOL].revoke();
			}
			delete ts[name];
		}
	};

	function validateTieName(name) {
		if (!name || typeof name !== 'string') {
			throw new Error('tie name MUST be a non empty string');
		}
		if (!vp.test(name)) {
			throw new Error('tie name MUST contain alphanumeric characters ONLY (use ' + vp + ' to check yourself); "' + name + '" not fits');
		}
	}

	Object.freeze(this);
}

function ensureObservable(o) {
	if (typeof o === 'undefined' || o === null) {
		return o;
	} else if (typeof o !== 'object') {
		throw new Error(o + ' is not of type Observable and not an object');
	} else if (Observable.isObservable(o)) {
		return o;
	} else if (!Observable) {
		throw new Error(o + ' is not of type Observable and no embedded Observable implementation found');
	} else if (typeof o.observe === 'function' || typeof o.unobserve === 'function' || typeof o.revoke === 'function') {
		throw new Error(o + ' is not of type Observable and can not be transformed into Observable (some of its functions already implemented?)');
	} else {
		return Observable.from(o);
	}
}

function getPath(ref, path) {
	if (!ref) return;
	let i = 0, l = path.length, n;
	for (; i < l; i++) {
		n = path[i];
		if (ref && ref.hasOwnProperty(n)) ref = ref[n];
		else return;
	}
	return ref;
}

function setPath(ref, path, value) {
	if (!ref) return;
	let i = 0, l = path.length, n;
	for (; i < l - 1; i++) {
		n = path[i];
		ref = ref[n] && typeof ref[n] === 'object' ? ref[n] : ref[n] = {};
	}
	ref[path[i]] = value;
}

function changeListener(event) {
	let element = event.currentTarget, tieParams, tieParam, tie, i;
	tieParams = viewsParams.get(element);
	i = tieParams.length;
	while (i--) {
		tieParam = tieParams[i];
		tie = ties.get(tieParam.tieName);
		if (tie) {
			setPath(tie[PRIVATE_MODEL_SYMBOL], tieParam.path, element.value);
		} else {
			console.warn('no Tie identified by "' + tieParam.tieName + '" found');
		}
	}
}

//	TODO: here we'll add and extensibility contract for custom elements to provide us a hint that specific custom element also able to raise change event
function addChangeListenerIfRelevant(view) {
	if (view.nodeName === 'INPUT' ||
		view.nodeName === 'SELECT' ||
		view.nodeName === 'TEXTAREA') {
		view.addEventListener('change', changeListener);
	}
}

function delChangeListener(view) {
	view.removeEventListener('change', changeListener);
}

function add(element) {
	if (element.nodeName === 'IFRAME') {
		initDocumentObserver(element.contentDocument);
		element.addEventListener('load', function() {
			initDocumentObserver(this.contentDocument);
			collect(this.contentDocument);
		});
		collect(element.contentDocument);
	} else if (Node.ELEMENT_NODE === element.nodeType) {
		if (element.localName.indexOf('-') < 0 && !element.hasAttribute('is')) {
			processAddedElement(element);
		} else {
			customElements.whenDefined(element.getAttribute('is') || element.localName).then(() => processAddedElement(element));
		}
	}
}

function processAddedElement(element) {
	let tieParams, tieName, rawPath, tieViews, pathViews, tie,
		i = 0, l;
	tieParams = extractTieParams(element);
	for (l = tieParams.length; i < l; i++) {
		tieName = tieParams[i].tieName;
		rawPath = tieParams[i].rawPath;
		tieViews = views[tieName] || (views[tieName] = {});
		pathViews = tieViews[rawPath] || (tieViews[rawPath] = []);
		if (pathViews.indexOf(element) < 0) {
			pathViews.push(element);
			viewsParams.set(element, tieParams);
			tie = ties.get(tieName);
			update(element, tie ? tie[PRIVATE_MODEL_SYMBOL] : null);
			addChangeListenerIfRelevant(element);
		}
	}
}

function extractTieParams(element) {
	let result = [], param;
	if (element && element.dataset && (param = element.dataset.tie)) {
		result = parseTiePropertiesParam(param);
	}
	return result;
}

//	syntax example: data-tie="orders:0.address.street > textContent"
function parseTiePropertyParam(rawParam) {
	if (!rawParam || typeof rawParam !== 'string') {
		throw new Error('invalid tie value; found: "' + rawParam + '"; expected (example): "orders:0.address.street > textContent"');
	}
	let parts = rawParam.split(PARAM_SPLITTER),
		origin,
		rawPath;
	if (parts.length !== 2 || !parts[1]) {
		throw new Error('invalid tie value; found: "' + rawParam + '"; expected (example): "orders:0.address.street > textContent"');
	}
	origin = parts[0].split(':');
	if (!origin.length || origin.length > 2 || !origin[0]) {
		throw new Error('invalid tie value; found: "' + rawParam + '"; expected (example): "orders:0.address.street > textContent"');
	}
	rawPath = origin.length > 1 ? origin[1] : '';
	return {
		tieName: origin[0],
		rawPath: rawPath,
		path: rawPath.split('.'),
		targetProperty: parts[1]
	};
}

//	syntax example: data-tie="orders:0.address.street > textContent, orders:0.address.apt > title"
function parseTiePropertiesParam(multiParam) {
	if (!multiParam || typeof multiParam !== 'string') {
		throw new Error('invalid tie value; found: "' + multiParam + '"; expected (example): "orders:0.address.street > textContent, orders:0.address.apt > title"');
	}
	let result = [], rawParams = multiParam.split(MULTI_PARAMS_SPLITTER),
		i = 0, l = rawParams.length;
	for (; i < l; i++) {
		try {
			result.push(parseTiePropertyParam(rawParams[i]));
		} catch (e) {
			console.error('failed to parse one of a multi param parts', e)
		}
	}
	return result;
}

function update(element, tieData, changedPath, change) {
	let parsedParams, param, newValue, i = 0, l;
	parsedParams = viewsParams.get(element);
	for (l = parsedParams.length; i < l; i++) {
		param = parsedParams[i];
		if (changedPath && param.rawPath.indexOf(changedPath) !== 0) {
			continue;
		}
		if (!change || changedPath !== param.rawPath) {
			newValue = getPath(tieData, param.path);
		} else {
			newValue = change.value;
		}
		if (typeof newValue === 'undefined') {
			newValue = '';
		}
		if (param.targetProperty === 'value' && element.nodeName === 'INPUT' && element.type === 'checkbox') {
			element.checked = newValue;
		} else {
			element[param.targetProperty] = newValue;
		}
	}
}

function collect(rootElement) {
	if (rootElement && (rootElement.nodeType === Node.DOCUMENT_NODE || rootElement.nodeType === Node.ELEMENT_NODE)) {
		let list, i;
		if (rootElement.nodeName === 'IFRAME') {
			list = rootElement.contentDocument.getElementsByTagName('*');
		} else {
			list = rootElement.getElementsByTagName('*');
		}

		add(rootElement);
		i = list.length;
		while (i--) add(list[i]);
	}
}

function discard(rootElement) {
	if (rootElement && rootElement.getElementsByTagName) {
		let list = rootElement.getElementsByTagName('*'),
			element, tieParams, tieParam, pathViews, index,
			i = 0, l = list.length, j, k;
		for (; i <= l; i++) {
			element = i < l ? list[i] : rootElement;
			tieParams = viewsParams.get(element);
			for (j = 0, k = tieParams.length; j < k; j++) {
				tieParam = tieParams[j];
				if (!views[tieParam.tieName]) continue;
				pathViews = views[tieParam.tieName][tieParam.rawPath];
				index = pathViews.indexOf(element);
				if (index >= 0) {
					pathViews.splice(index, 1);
					delChangeListener(element);
				}
			}
			viewsParams.delete(element);
		}
	}
}

function move(element, attributeName, oldParam, newParam) {
	let tieParams, i, l, tieParam, tieViews, pathViews, index;
	if (oldParam) {
		tieParams = viewsParams.get(element);
		for (i = 0, l = tieParams.length; i < l; i++) {
			tieParam = tieParams[i];
			if (!views[tieParam.tieName]) continue;
			pathViews = views[tieParam.tieName][tieParam.rawPath];
			if (pathViews) {
				index = pathViews.indexOf(element);
				if (index >= 0) {
					pathViews.splice(index, 1);
				}
			}
		}
		delChangeListener(element);
	}

	if (newParam) {
		tieParams = parseTiePropertiesParam(newParam);
		viewsParams.set(element, tieParams);
		for (i = 0, l = tieParams.length; i < l; i++) {
			tieParam = tieParams[i];
			tieViews = views[tieParam.tieName] || (views[tieParam.tieName] = {});
			pathViews = tieViews[tieParam.rawPath] || (tieViews[tieParam.rawPath] = []);
			if (pathViews.indexOf(element) < 0) {
				pathViews.push(element);
				update(element, ties.get(tieParam.tieName)[PRIVATE_MODEL_SYMBOL], tieParam.rawPath);
			}
		}
		addChangeListenerIfRelevant(element);
	}
}

function processDomChanges(changes) {
	let i = 0, l = changes.length, node, change, changeType,
		attributeName, added, i2, removed, i3;
	for (; i < l; i++) {
		change = changes[i];
		changeType = change.type;
		if (changeType === 'attributes') {
			attributeName = change.attributeName;
			if (attributeName === 'data-tie') {
				node = change.target;
				move(node, attributeName, change.oldValue, node.getAttribute(attributeName));
			} else if (attributeName === 'src') {
				node = change.target;
				if (node.nodeName === 'IFRAME') {
					discard(node.contentDocument);
				}
			}
		} else if (changeType === 'childList') {
			//	process added nodes
			added = change.addedNodes;
			i2 = added.length;
			while (i2--) {
				node = added[i2];
				if (node.nodeName === 'IFRAME') {
					if (node.contentDocument) {
						initDocumentObserver(node.contentDocument);
						collect(node.contentDocument);
					}
					node.addEventListener('load', function() {
						initDocumentObserver(this.contentDocument);
						collect(this.contentDocument);
					});
				} else {
					if (node.nodeType === Node.DOCUMENT_NODE || node.nodeType === Node.ELEMENT_NODE) {
						collect(node);
					}
				}
			}

			//	process removed nodes
			removed = change.removedNodes;
			i3 = removed.length;
			while (i3--) {
				node = removed[i3];
				if (node.nodeName === 'IFRAME') {
					discard(node.contentDocument);
				} else {
					if (node.nodeType === Node.DOCUMENT_NODE || node.nodeType === Node.ELEMENT_NODE) {
						discard(node);
					}
				}
			}
		}
	}
}

function initDocumentObserver(document) {
	let domObserver = new MutationObserver(processDomChanges);
	domObserver.observe(document, {
		childList: true,
		attributes: true,
		characterData: false,
		subtree: true,
		attributeOldValue: true,
		characterDataOldValue: false
	});
}

initDocumentObserver(document);
collect(document);