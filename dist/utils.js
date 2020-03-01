import { Observable } from './object-observer.min.js';

const
	DEFAULT_TIE_TARGET_PROVIDER = 'defaultTieTarget',
	CHANGE_EVENT_NAME_PROVIDER = 'changeEventName',
	PARAM_SPLITTER = /\s*=>\s*/,
	MULTI_PARAMS_SPLITTER = /\s*[,;]\s*/,
	DEFAULT_VALUE_ELEMENTS = {
		INPUT: 1, SELECT: 1, TEXTAREA: 1
	},
	DEFAULT_SRC_ELEMENTS = {
		IMG: 1, IFRAME: 1, SOURCE: 1
	},
	DEFAULT_HREF_ELEMENTS = {
		A: 1, ANIMATE: 1, AREA: 1, BASE: 1, DISCARD: 1, IMAGE: 1, LINK: 1, PATTERN: 1, use: 1
	},
	DEFAULT_CHANGE_ELEMENTS = {
		INPUT: 1, SELECT: 1, TEXTAREA: 1
	},
	randomKeySource = 'abcdefghijklmnopqrstuvwxyz0123456789',
	randomKeySourceLen = randomKeySource.length;

export {
	DEFAULT_TIE_TARGET_PROVIDER,
	ensureObservable,
	getTargetProperty,
	extractViewParams,
	CHANGE_EVENT_NAME_PROVIDER,
	addChangeListener,
	delChangeListener,
	getPath,
	setPath,
	callViewFunction,
	getRandomKey
}

class Parameter {
	constructor(tieKey, rawPath, path, targetProperty, isFunctional, fParams) {
		this.tieKey = tieKey;
		this.rawPath = rawPath;
		this.path = path;
		this.targetProperty = targetProperty;
		this.isFunctional = isFunctional;
		this.fParams = fParams;
		this.iClasses = null;
	}
}

function ensureObservable(o) {
	if (!o) {
		return Observable.from({});
	} else if (!Observable.isObservable(o)) {
		return Observable.from(o);
	} else {
		return o;
	}
}

function getTargetProperty(element) {
	let result = element[DEFAULT_TIE_TARGET_PROVIDER];
	if (!result) {
		const eName = element.nodeName;
		if (eName === 'INPUT' && element.type === 'checkbox') {
			result = 'checked';
		} else if (eName in DEFAULT_VALUE_ELEMENTS) {
			result = 'value';
		} else if (eName in DEFAULT_SRC_ELEMENTS) {
			result = 'src';
		} else if (eName in DEFAULT_HREF_ELEMENTS) {
			result = 'href';
		} else {
			result = 'textContent';
		}
	}
	return result;
}

function extractViewParams(element, scopeRootKey) {
	const rawParam = element.getAttribute('data-tie');
	if (rawParam) {
		return parseViewParams(rawParam, element, scopeRootKey);
	} else {
		return null;
	}
}

function parseViewParams(multiParam, element, scopeRootKey) {
	const
		result = [],
		keysTest = {},
		rawParams = multiParam.split(MULTI_PARAMS_SPLITTER),
		l = rawParams.length;
	let i = 0, next, fnext, parsedParam;
	for (; i < l; i++) {
		next = rawParams[i];
		if (!next) {
			continue;
		}
		if (fnext) {
			fnext += ',' + next;
		}
		if (next.indexOf('(') > 0) {
			fnext = next;
			if (fnext.indexOf(')') < 0) {
				continue;
			}
		}
		try {
			if (fnext) {
				parsedParam = parseFunctionParam(fnext, scopeRootKey);
				fnext = null;
			} else {
				parsedParam = parsePropertyParam(next, element, scopeRootKey);
			}
			if (parsedParam.targetProperty in keysTest) {
				console.error(`elements's property '${parsedParam.targetProperty}' tied more than once; all but first dismissed`);
			} else {
				result.push(parsedParam);
				keysTest[parsedParam.targetProperty] = true;
			}
		} catch (e) {
			console.error(`failed to parse one of a multi param parts (${next}), skipping it`, e)
		}
	}
	return result;
}

function parseFunctionParam(rawParam, scopeRootKey) {
	const parts = rawParam.split(/[()]/);
	const fParams = parts[1].split(/\s*,\s*/).map(fp => {
		const origin = fp.split(':');
		if (!origin.length || origin.length > 2 || !origin[0]) {
			throw new Error('invalid function tied value: ' + fp);
		}
		const rawPath = origin.length > 1 ? origin[1] : '';
		return {
			tieKey: origin[0],
			rawPath: rawPath,
			path: rawPath.split('.').filter(node => node)
		};
	});
	if (!fParams.length) {
		throw new Error(`functional tie parameter MUST have at least one tied argument, '${rawParam}' doesn't`);
	}

	return new Parameter(null, null, null, parts[0], true, fParams);
}

function parsePropertyParam(rawParam, element, scopeRootKey) {
	const parts = rawParam.split(PARAM_SPLITTER);

	//  add default 'to' property if needed
	if (parts.length === 1) {
		parts.push(getTargetProperty(element));
	}

	//  process 'from' part
	const origin = parts[0].split(':');
	if (!origin.length || origin.length > 2 || !origin[0]) {
		throw new Error(`invalid tie parameter '${rawParam}'; expected (example): "orders:0.address.street, orders:0.address.apt => title"`);
	}

	let tieKey = origin[0];
	if (origin[0] === 'scope') {
		tieKey = getScopeTieKey(element, scopeRootKey);
	}

	const rawPath = origin.length > 1 ? origin[1] : '';

	const result = new Parameter(tieKey, rawPath, rawPath.split('.').filter(node => node), parts[1], false, null);
	if (result.targetProperty === 'classList') {
		result.iClasses = Array.from(element.classList);
	}

	return result;
}

function getScopeTieKey(element, scopeRootKey) {
	let next = element,
		result = next[scopeRootKey];
	while (!result && next.parentNode) {
		next = next.parentNode;
		if (next.host) {
			next = next.host;
		}
		result = next[scopeRootKey];
	}
	return result || null;
}

function addChangeListener(element, changeListener) {
	const cen = obtainChangeEventName(element);
	if (cen) {
		element.addEventListener(cen, changeListener);
	}
}

function delChangeListener(element, changeListener) {
	const cen = obtainChangeEventName(element);
	if (cen) {
		element.removeEventListener(cen, changeListener);
	}
}

function obtainChangeEventName(element) {
	let changeEventName = element[CHANGE_EVENT_NAME_PROVIDER];
	if (!changeEventName) {
		if (element.nodeName in DEFAULT_CHANGE_ELEMENTS) {
			changeEventName = 'change';
		}
	}
	return changeEventName;
}

function getPath(ref, path) {
	if (!ref) return null;
	const p = path, l = p.length;
	if (!l) return ref;
	let r = ref, i = 0, n;
	for (; i < l - 1; i++) {
		n = p[i];
		r = r[n];
		if (r === null || typeof r === 'undefined') return r;
	}
	return r[p[i]];
}

function setPath(ref, path, value) {
	if (!ref) return;
	const l = path.length;
	let i = 0, n, o;
	for (; i < l - 1; i++) {
		n = path[i];
		o = ref[n];
		if (o && typeof o === 'object') {
			ref = o;
		} else if (typeof o === 'undefined' || o === null) {
			ref[n] = {};
			ref = ref[n];
		} else if (typeof o !== 'object') {
			console.error('setting deep path MAY NOT override primitives along the way');
			return;
		}
	}
	ref[path[i]] = value;
}

function callViewFunction(elem, func, args) {
	try {
		elem[func].apply(elem, args);
	} catch (e) {
		console.error(`failed to call '${func}' of '${elem}' with '${args}'`, e);
	}
}

function getRandomKey(length) {
	let result = '', i = length;
	const random = crypto.getRandomValues(new Uint8Array(length));
	while (i) {
		i--;
		result += randomKeySource.charAt(randomKeySourceLen * random[i] / 256);
	}
	return result;
}