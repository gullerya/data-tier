const
	PARAM_LIST_SPLITTER = /\s*[,;]\s*/,
	PARAM_SPLITTER = /\s*([=ae]>)\s*/,
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
	TARGET_TYPES = {
		ATTRIBUTE: 1,
		EVENT: 2,
		METHOD: 3,
		PROPERTY: 4
	},
	randomKeySource = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
	randomKeySourceLen = randomKeySource.length;

export {
	extractViewParams,
	getPath,
	setPath,
	callViewMethod,
	getRandomKey
};

export {
	DEFAULT_TARGET,
	DEFAULT_EVENTS_CHANGE,
	TARGET_TYPES
};

class Parameter {
	constructor(tieKey, rawPath, path, targetType, targetKey, changeEvent, fParams) {
		this.tieKey = tieKey;
		this.rawPath = rawPath;
		this.path = path;
		this.targetType = targetType;
		this.targetKey = targetKey;
		this.changeEvent = changeEvent;
		this.fParams = fParams;
		this.iClasses = null;
		Object.seal(this);
	}
}

function extractViewParams(element) {
	const paramList = element.getAttribute('data-tie');
	if (paramList) {
		return parseParamList(paramList, element);
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
				parsedParam = parseMethodParam(fnext);
				fnext = null;
			} else {
				parsedParam = parsePropertyParam(rawParam, element);
			}
			if (parsedParam.targetKey in keysTest) {
				console.error(`elements's property '${parsedParam.targetKey}' tied more than once; all but first tie dismissed`);
			} else {
				result.push(parsedParam);
				keysTest[parsedParam.targetKey] = true;
			}
		} catch (e) {
			console.error(`failed to parse one of a multi param parts (${rawParam}), skipping it`, e);
		}
	}
	return result.length ? result : null;
}

function parseMethodParam(rawParam) {
	const [targetMethod, args] = rawParam.split(/[()]/);
	const fParams = args.trim()
		.split(/\s*,\s*/)
		.map(parseFromPart);
	if (!fParams.length) {
		throw new Error(`method tie parameter MUST have at least one tied argument, '${rawParam}' doesn't`);
	}

	return new Parameter(null, null, null, TARGET_TYPES.METHOD, targetMethod, null, fParams);
}

/**
 * MVVM:		from [=> to [=> event]]
 * 
 * example 1:	tieKey:path.to.data => property => datachange
 * example 2:	tieKey:path.to.data a> attribute
 * example 3:	tieKey:path.to.data
 * example 4:	tieKey
 */
function parsePropertyParam(rawParam, element) {
	/* eslint-disable no-unused-vars */
	let [
		fromPart,
		targetTypeDirective,
		targetKey,
		_eventDirective,
		eventPart
	] = rawParam.split(PARAM_SPLITTER);

	const targetType = targetTypeDirective === 'a>' ? TARGET_TYPES.ATTRIBUTE
		: targetTypeDirective === 'e>' ? TARGET_TYPES.EVENT
			: TARGET_TYPES.PROPERTY;

	const { tieKey, rawPath, path } = parseFromPart(fromPart);
	targetKey = targetKey ? targetKey : getDefaultTargetProperty(element);
	eventPart = eventPart ? eventPart : getDefaultChangeEvent(element);

	const result = new Parameter(tieKey, rawPath, path, targetType, targetKey, eventPart, null);

	//	TODO: this should be generalized better
	if (targetKey === 'classList') {
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
	if (!ref) return ref;
	const p = path, l = p.length;
	if (!l) return ref;
	let r = ref, i = 0, n;
	for (; i < l; i++) {
		n = p[i];
		r = r[n];
		if (r === null || typeof r === 'undefined') return r;
	}
	return r;
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

function callViewMethod(elem, func, args) {
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