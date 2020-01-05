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
	};

export {
	ensureObservable,
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
}

class Parameter {
	constructor(tieKey, rawPath, path, targetProperty, isFunctional, fParams) {
		this.tieKey = tieKey;
		this.rawPath = rawPath;
		this.path = path;
		this.targetProperty = targetProperty;
		this.isFunctional = isFunctional;
		this.fParams = fParams;
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

function extractViewParams(element) {
	const rawParam = element.dataset.tie;
	if (rawParam) {
		return parseViewParams(rawParam, element);
	} else {
		return null;
	}
}

function parseViewParams(multiParam, element) {
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
				parsedParam = parseFunctionParam(fnext);
				fnext = null;
			} else {
				parsedParam = parsePropertyParam(next, element);
			}
			if (parsedParam.targetProperty in keysTest) {
				console.error('elements\'s property "' + parsedParam.targetProperty + '" tied more than once; all but first dismissed');
			} else {
				result.push(parsedParam);
				keysTest[parsedParam.targetProperty] = true;
			}
		} catch (e) {
			console.error('failed to parse one of a multi param parts (' + next + '), skipping it', e)
		}
	}
	return result;
}

function parseFunctionParam(rawParam) {
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
		throw new Error('functional tie parameter MUST have at least one tied argument');
	}

	return new Parameter(null, null, null, parts[0], true, fParams);
}

function parsePropertyParam(rawParam, element) {
	const parts = rawParam.split(PARAM_SPLITTER);

	//  add default 'to' property if needed
	if (parts.length === 1) {
		parts.push(getTargetProperty(element));
	}

	//  process 'from' part
	const origin = parts[0].split(':');
	if (!origin.length || origin.length > 2 || !origin[0]) {
		throw new Error('invalid tie value; found: "' + rawParam + '"; expected (example of multi param, one with default target): "orders:0.address.street, orders:0.address.apt => title"');
	}

	const rawPath = origin.length > 1 ? origin[1] : '';
	return new Parameter(origin[0], rawPath, rawPath.split('.').filter(node => node), parts[1], false, null);
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
	const l = path.length;
	if (!l) return ref;
	let i = 0, n;
	for (; i < l - 1; i++) {
		n = path[i];
		ref = ref[n];
		if (ref === null || ref === undefined) return ref;
	}
	return ref[path[i]];
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
		} else if (o === undefined || o === null) {
			ref[n] = {};
			ref = ref[n];
		} else if (typeof o !== 'object') {
			throw new Error('setting deep path MAY NOT override primitives along the way');
		}
	}
	ref[path[i]] = value;
}

function setViewProperty(e, p, v) {
	try {
		if (p === 'href' && typeof e.href === 'object') {
			e.href.baseVal = v;
		} else {
			e[p] = v;
		}
	} catch (e) {
		console.error(`failed to set '${p}' of '${e}' to '${v}'`);
	}
}

function callViewFunction(e, f, a) {
	try {
		e[f].apply(e, a);
	} catch (e) {
		console.error(`failed to call '${f}' of '${e}' with '${a}'`);
	}
}