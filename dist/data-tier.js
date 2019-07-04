import { Observable } from './object-observer.js';

export const CHANGE_EVENT_NAME_PROVIDER = 'changeEventName';
export const DEFAULT_TIE_TARGET_PROVIDER = 'defaultTieTarget';
export const ties = new Ties();
export const addRootDocument = rootDocument => {
	if (!rootDocument || (Node.DOCUMENT_NODE !== rootDocument.nodeType && Node.DOCUMENT_FRAGMENT_NODE !== rootDocument.nodeType)) {
		throw new Error('invalid argument, NULL or not one of: DOCUMENT_NODE, DOCUMENT_FRAGMENT_NODE');
	}
	if (roots.has(rootDocument)) {
		console.warn('any root document may be added only once');
		return;
	}

	initDocumentObserver(rootDocument);

	console.info('DT: scanning the ' + rootDocument + ' for a views...');
	let baseDocumentScanStartTime = performance.now();
	let collected = addTree(rootDocument);
	console.info('DT: ... scanning the ' + rootDocument + ' for a views DONE (took ' +
		Math.floor((performance.now() - baseDocumentScanStartTime) * 100) / 100 + 'ms, collected ' +
		collected + ' element/s)');
	roots.add(rootDocument);
};
export const removeRootDocument = rootDocument => {
	if (roots.has(rootDocument)) {
		discard(rootDocument);
	} else {
		console.warn('no root document ' + rootDocument + ' known');
	}
};

console.info('DT: starting initialization...');
let initStartTime = performance.now();

const
	initParams = {},
	PRIVATE_MODEL_SYMBOL = Symbol('private-tie-model-key'),
	roots = new WeakSet(),
	views = {},
	viewsParams = new WeakMap(),
	PARAM_SPLITTER = /\s*=>\s*/,
	MULTI_PARAMS_SPLITTER = /\s*[,;]\s*/;

//  read init params
Array
	.from(new URL(import.meta.url).searchParams)
	.forEach(entryPair => {
		initParams[entryPair[0]] = entryPair[1]
	});

if (Object.keys(initParams).length) {
	console.info('DT: init params are as following');
	console.dir(initParams);
} else {
	console.info('DT: no init params found');
}

class Tie {
	constructor(name) {
		this[PRIVATE_MODEL_SYMBOL] = null;
		Object.defineProperty(this, 'name', { value: name });
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
			this.processDataChanges([{ path: [] }]);
			if (oldModel) oldModel.revoke();
		}
	}

	processDataChanges(changes) {
		let tieName = this.name,
			i, l, change, changedObject, arrPath, changedPath, pl, tiedPath, pathViews, pvl,
			tieViews = views[tieName],
			tiedPaths = Object.keys(tieViews),
			arrayFullUpdate,
			fullUpdatesMap = {};

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
					arrayFullUpdate = true;
				}
			} else {
				changedPath = arrPath && arrPath.length ? arrPath.join('.') : '';
				arrayFullUpdate = false;
			}

			pl = tiedPaths.length;
			while (pl) {
				tiedPath = tiedPaths[--pl];
				if (tiedPath.indexOf(changedPath) === 0) {
					pathViews = tieViews[tiedPath];
					pvl = pathViews.length;
					while (pvl) {
						update(pathViews[--pvl], changedPath, !arrayFullUpdate ? change : null);
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
		if (ts[name]) {
			throw new Error('tie (' + name + ') is already present and MAY NOT be re-created');
		}
		validateTieName(name);
		ensureObservable(model);
		let result = new Tie(name);
		ts[name] = result;
		if (!views.hasOwnProperty(name)) views[name] = {};
		result.model = model;
		return result;
	};

	this.remove = function remove(tieToRemove) {
		let tieNameToRemove;
		if (typeof tieToRemove === 'object' && tieToRemove.name) {
			tieNameToRemove = tieToRemove.name;
		} else if (typeof tieToRemove === 'string' && validateTieName(tieToRemove)) {
			tieNameToRemove = tieToRemove;
		} else {
			throw new Error('tie to remove MUST either be a valid tie name or tie self');
		}

		delete views[tieNameToRemove];
		let tie = ts[tieNameToRemove];
		if (tie) {
			if (tie[PRIVATE_MODEL_SYMBOL]) {
				tie[PRIVATE_MODEL_SYMBOL].revoke();
			}
			delete ts[tieNameToRemove];
		}
	};

	function validateTieName(name) {
		if (!name || typeof name !== 'string') {
			throw new Error('tie name MUST be a non empty string');
		}
		if (!vp.test(name)) {
			throw new Error('tie name MUST contain alphanumeric characters ONLY (use ' + vp + ' to check yourself); "' + name + '" not fits');
		}
		return true;
	}

	Object.freeze(this);
}

function ensureObservable(o) {
	if (typeof o === 'undefined' || o === null) {
		return o;
	} else if (typeof o !== 'object') {
		throw new Error(o + ' is not an object');
	} else if (Observable.isObservable(o)) {
		return o;
	} else if (!Observable) {
		throw new Error(o + ' is not of type Observable and no embedded Observable implementation found');
	} else if (o.observe || o.unobserve || o.revoke) {
		throw new Error(o + ' is not of type Observable and can not be transformed into Observable (some of the properties already occupied?)');
	} else {
		return Observable.from(o);
	}
}

function getPath(ref, path) {
	if (!ref) return null;
	let i = 0, l = path.length, n;
	for (; i < l; i++) {
		n = path[i];
		if (ref && ref.hasOwnProperty(n)) ref = ref[n];
		else return null;
	}
	return ref;
}

function setPath(ref, path, value) {
	if (!ref) return;
	let i = 0, l = path.length, n;
	for (; i < l - 1; i++) {
		n = path[i];
		if (ref[n] && typeof ref[n] === 'object') {
			ref = ref[n];
		} else {
			ref = {};
			ref[n] = ref;
		}
	}
	ref[path[i]] = value;
}

function changeListener(event) {
	let element = event.currentTarget, tieParams, tieParam, tie, i, newValue;
	tieParams = viewsParams.get(element);
	i = tieParams.length;
	while (i) {
		tieParam = tieParams[--i];
		tie = ties.get(tieParam.tieName);
		if (tie) {
			newValue = element.nodeName === 'INPUT' && element.type === 'checkbox'
				? element.checked
				: element[getDefaultTargetProperty(element)];
			setPath(tie[PRIVATE_MODEL_SYMBOL], tieParam.path, newValue);
		} else {
			console.warn('no Tie identified by "' + tieParam.tieName + '" found');
		}
	}
}

function addChangeListenerIfRelevant(element) {
	let cen = obtainChangeEventName(element);
	if (cen) {
		element.addEventListener(cen, changeListener);
	}
}

function delChangeListener(element) {
	let cen = obtainChangeEventName(element);
	if (cen) {
		element.removeEventListener(cen, changeListener);
	}
}

function obtainChangeEventName(element) {
	let changeEventName = element[CHANGE_EVENT_NAME_PROVIDER];
	if (!changeEventName) {
		if (element.nodeName === 'INPUT' ||
			element.nodeName === 'SELECT' ||
			element.nodeName === 'TEXTAREA') {
			changeEventName = 'change';
		}
	}
	return changeEventName;
}

function add(element) {
	if (element.matches(':defined')) {
		processAddedElement(element);
	} else {
		let customElementToWait = '';
		if (element.localName.indexOf('-') > 0) {
			customElementToWait = element.localName;
		} else {
			let matches = /.*is\s*=\s*"([^"]+)"\s*.*/.exec(element.outerHTML);
			if (matches && matches.length > 1) {
				customElementToWait = matches[1];
			}
		}
		if (customElementToWait) {
			customElements.whenDefined(customElementToWait).then(() => processAddedElement(element));
		} else {
			console.warn('failed to determine yet undefined custom element name of ' + element + ' to wait for definition; processing as usual');
			processAddedElement(element);
		}
	}
}

function processAddedElement(element) {
	let tieParams, tieName, rawPath, tieViews, pathViews, i = 0, l;
	tieParams = extractTieParams(element);
	for (l = tieParams.length; i < l; i++) {
		tieName = tieParams[i].tieName;
		rawPath = tieParams[i].rawPath;
		tieViews = views[tieName] || (views[tieName] = {});
		pathViews = tieViews[rawPath] || (tieViews[rawPath] = []);
		if (pathViews.indexOf(element) < 0) {
			pathViews.push(element);
			viewsParams.set(element, tieParams);
			update(element);
			addChangeListenerIfRelevant(element);
		}
	}

	if (element.shadowRoot) {
		addRootDocument(element.shadowRoot);
	}
}

function extractTieParams(element) {
	let result = [], param;
	if (element && element.dataset && (param = element.dataset.tie)) {
		result = parseTiePropertiesParam(param, element);
	}
	return result;
}

//	syntax example: data-tie="orders:0.address.street => textContent"
function parseTiePropertyParam(rawParam, element) {
	let parts = rawParam.split(PARAM_SPLITTER),
		origin,
		rawPath;
	//  add default 'to' property if needed
	if (parts.length === 1) {
		parts.push(getDefaultTargetProperty(element));
	}
	//  process 'from' part
	origin = parts[0].split(':');
	if (!origin.length || origin.length > 2 || !origin[0]) {
		throw new Error('invalid tie value; found: "' + rawParam + '"; expected (example): "orders:0.address.street => textContent"');
	}
	rawPath = origin.length > 1 ? origin[1] : '';
	return {
		tieName: origin[0],
		rawPath: rawPath,
		path: rawPath.split('.').filter(node => node),
		targetProperty: parts[1]
	};
}

//	syntax example: data-tie="orders:0.address.street => textContent, orders:0.address.apt => title"
function parseTiePropertiesParam(multiParam, element) {
	if (!multiParam || typeof multiParam !== 'string') {
		throw new Error('invalid tie value; found: "' + multiParam +
			'"; expected (example): "orders:0.address.street => textContent, orders:0.address.apt => title"');
	}
	let result = [], rawParams = multiParam.split(MULTI_PARAMS_SPLITTER),
		i = 0, l = rawParams.length;
	for (; i < l; i++) {
		if (!rawParams[i]) {
			continue;
		}
		try {
			result.push(parseTiePropertyParam(rawParams[i], element));
		} catch (e) {
			console.error('failed to parse one of a multi param parts', e)
		}
	}
	return result;
}

function getDefaultTargetProperty(element) {
	let result = element[DEFAULT_TIE_TARGET_PROVIDER];
	if (!result) {
		let eName = element.nodeName;
		if (eName === 'INPUT' || eName === 'SELECT' || eName === 'TEXTAREA') {
			result = 'value';
		} else if (eName === 'IMG' || eName === 'IFRAME' || eName === 'SOURCE') {
			result = 'src';
		} else {
			result = 'textContent';
		}
	}
	return result;
}

function update(element, changedPath, change) {
	let parsedParams, param, tie, tieData, newValue, i = 0, l, tp;
	parsedParams = viewsParams.get(element);
	for (l = parsedParams.length; i < l; i++) {
		param = parsedParams[i];
		if (changedPath && param.rawPath.indexOf(changedPath) !== 0) {
			continue;
		}
		tie = ties.get(param.tieName);
		if (!tie) {
			continue;
		}

		tieData = tie.model;
		if (!change || changedPath !== param.rawPath || typeof change.value === 'undefined') {
			newValue = getPath(tieData, param.path);
		} else {
			newValue = change.value;
		}
		if (typeof newValue === 'undefined') {
			newValue = '';
		}
		tp = param.targetProperty;
		if (tp === 'value' && element.nodeName === 'INPUT' && element.type === 'checkbox') {
			element.checked = newValue;
		} else if (tp === 'href') {
			element.href.baseVal = newValue;
		} else {
			element[tp] = newValue;
		}
	}
}

function addTree(rootElement) {
	let list = rootElement.querySelectorAll('*'),
		i = list.length,
		result = list.length;

	if (Node.ELEMENT_NODE === rootElement.nodeType) {
		add(rootElement);
		result++;
	}
	while (i) {
		try {
			add(list[--i]);
		} catch (e) {
			console.error('failed to process/add element', e);
		}
	}

	return result;
}

function discard(rootElement) {
	if (rootElement.querySelectorAll) {
		let list = rootElement.querySelectorAll('*'),
			element, tieParams, tieParam, pathViews, index,
			i = 0, l = list.length, j, k;
		for (; i <= l; i++) {
			element = i < l ? list[i] : rootElement;
			tieParams = viewsParams.get(element);

			//	untie
			if (tieParams) {
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

			//	remove as root
			if (element.shadowRoot) {
				removeRootDocument(element.shadowRoot);
			}
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
		tieParams = parseTiePropertiesParam(newParam, element);
		viewsParams.set(element, tieParams);
		for (i = 0, l = tieParams.length; i < l; i++) {
			tieParam = tieParams[i];
			tieViews = views[tieParam.tieName] || (views[tieParam.tieName] = {});
			pathViews = tieViews[tieParam.rawPath] || (tieViews[tieParam.rawPath] = []);
			if (pathViews.indexOf(element) < 0) {
				pathViews.push(element);
				update(element, tieParam.rawPath);
			}
		}
		addChangeListenerIfRelevant(element);
	}
}

function processDomChanges(changes) {
	let i = 0, l = changes.length, node, nodeType, change, changeType,
		attributeName, added, i2, removed, i3;
	for (; i < l; i++) {
		change = changes[i];
		changeType = change.type;
		if (changeType === 'attributes') {
			attributeName = change.attributeName;
			if (attributeName === 'data-tie') {
				node = change.target;
				move(node, attributeName, change.oldValue, node.getAttribute(attributeName));
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
					discard(node);
				}
			}
		}
	}
}

function initDocumentObserver(document) {
	console.info('DT: initializing DOM observer on ' + document);
	let domObserver = new MutationObserver(processDomChanges);
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