import { Observable } from './object-observer.min.js';

const
	PARAM_LIST_SPLITTER = /\s*[,;]\s*/,
	PARAM_SPLITTER = /\s*=>\s*/,
	DEFAULT_TARGET = {
		A: 'href',
		ANIMATE: 'href',
		AREA: 'href',
		BASE: 'href',
		DISCARD: 'href',
		IMAGE: 'href',
		LINK: 'href',
		PATTERN: 'href',
		use: 'href',
		INPUT: 'value',
		SELECT: 'value',
		TEXTAREA: 'value',
		IFRAME: 'src',
		IMG: 'src',
		SOURCE: 'src'
	},
	DEFAULT_EVENTS_CHANGE = ['INPUT', 'SELECT', 'TEXTAREA'],
	randomKeySource = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
	randomKeySourceLen = randomKeySource.length;

export {
	ensureObservable,
	extractViewParams,
	getPath,
	setPath,
	callViewFunction,
	getRandomKey
}

class Parameter {
	constructor(tieKey, rawPath, path, targetProperty, changeEvent, isFunctional, fParams) {
		this.tieKey = tieKey;
		this.rawPath = rawPath;
		this.path = path;
		this.targetProperty = targetProperty;
		this.changeEvent = changeEvent;
		this.isFunctional = isFunctional;
		this.fParams = fParams;
		this.iClasses = null;
	}
}

function ensureObservable(o) {
	if (!o) {
		return Observable.from({});
	} else if (Observable.isObservable(o)) {
		return o;
	} else {
		return Observable.from(o);
	}
}

function extractViewParams(element) {
	const paramList = element.getAttribute('data-tie');
	if (paramList) {
		const parsed = parseParamList(paramList, element);
		return parsed.length ? parsed : null;
	} else {
		return null;
	}
}

function parseParamList(paramList, element) {
	const
		result = [],
		keysTest = {},
		rawParams = paramList.trim().split(PARAM_LIST_SPLITTER),
		l = rawParams.length;
	let i = 0, rawParam, fnext, parsedParam;
	for (; i < l; i++) {
		rawParam = rawParams[i];
		if (!rawParam) {
			continue;
		}
		if (fnext) {
			fnext += ',' + rawParam;
		}
		if (rawParam.indexOf('(') > 0) {
			fnext = rawParam;
			if (fnext.indexOf(')') < 0) {
				continue;
			}
		}
		try {
			if (fnext) {
				parsedParam = parseFunctionParam(fnext);
				fnext = null;
			} else {
				parsedParam = parsePropertyParam(rawParam, element);
			}
			if (parsedParam.targetProperty in keysTest) {
				console.error(`elements's property '${parsedParam.targetProperty}' tied more than once; all but first tie dismissed`);
			} else {
				result.push(parsedParam);
				keysTest[parsedParam.targetProperty] = true;
			}
		} catch (e) {
			console.error(`failed to parse one of a multi param parts (${rawParam}), skipping it`, e);
		}
	}
	return result;
}

function parseFunctionParam(rawParam) {
	const [targetFunction, args] = rawParam.split(/[()]/);
	const fParams = args.trim()
		.split(/\s*,\s*/)
		.map(parseFromPart);
	if (!fParams.length) {
		throw new Error(`functional tie parameter MUST have at least one tied argument, '${rawParam}' doesn't`);
	}

	return new Parameter(null, null, null, targetFunction, null, true, fParams);
}

/**
 * MVVM:		from [=> to [=> event]]
 * from:		tieKey:path
 * to:			property
 * event:		eventName
 * 
 * example 1:	tieKey:path.to.data => data => datachange
 * example 2:	tieKey:path.to.data => data
 * example 3:	tieKey:path.to.data
 * example 4:	tieKey
 */
function parsePropertyParam(rawParam, element) {
	let [
		fromPart,
		toPart,
		eventPart
	] = rawParam.split(PARAM_SPLITTER);
	const { tieKey, rawPath, path } = parseFromPart(fromPart);
	toPart = toPart ? toPart : getDefaultTargetProperty(element);
	eventPart = eventPart ? eventPart : getDefaultChangeEvent(element);

	const result = new Parameter(tieKey, rawPath, path, toPart, eventPart, false, null);

	//	TODO: this should be generalized better
	if (toPart === 'classList') {
		result.iClasses = Array.from(element.classList);
	}

	return result;
}

function parseFromPart(fromPart) {
	const [tieKey, rawPath = ''] = fromPart.split(':');
	if (!tieKey) {
		throw new Error(`tie key missing in tie parameter '${fromPart}'; expected example: "orders:0.address.apt => title"`);
	}
	const path = rawPath.split('.').filter(Boolean);
	return { tieKey, rawPath, path };
}

function getDefaultTargetProperty(element) {
	let result = DEFAULT_TARGET[element.nodeName];
	if (!result) {
		result = 'textContent';
	} else if (element.type === 'checkbox') {
		result = 'checked';
	}
	return result;
}

function getDefaultChangeEvent(element) {
	let result = null;
	if (DEFAULT_EVENTS_CHANGE.includes(element.nodeName)) {
		result = 'change';
	}
	return result;
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

function getRandomKey(keyLength) {
	let result = '', i = keyLength;
	const random = crypto.getRandomValues(new Uint8Array(keyLength));
	while (i--) {
		result += randomKeySource.charAt(randomKeySourceLen * random[i] / 256);
	}
	return result;
}