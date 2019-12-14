import { Observable } from './object-observer.min.js';

const
	DEFAULT_TIE_TARGET_PROVIDER = 'defaultTieTarget',
	CHANGE_EVENT_NAME_PROVIDER = 'changeEventName',
	PARAM_SPLITTER = /\s*=>\s*/,
	MULTI_PARAMS_SPLITTER = /\s*[,;]\s*/;

export {
	ensureObservable,
	DEFAULT_TIE_TARGET_PROVIDER,
	getTargetProperty,
	extractViewParams,
	CHANGE_EVENT_NAME_PROVIDER,
	addChangeListener,
	delChangeListener,
	getPath,
	setPath
}

function ensureObservable(o) {
	let result;
	if (!o) {
		result = Observable.from({});
	} else if (!Observable.isObservable(o)) {
		result = Observable.from(o);
	}
	return result;
}

function getTargetProperty(element) {
	let result = element[DEFAULT_TIE_TARGET_PROVIDER];
	if (!result) {
		const eName = element.nodeName;
		if (eName === 'INPUT' && element.type === 'checkbox') {
			result = 'checked';
		} else if (eName === 'INPUT' || eName === 'SELECT' || eName === 'TEXTAREA') {
			result = 'value';
		} else if (eName === 'IMG' || eName === 'IFRAME' || eName === 'SOURCE') {
			result = 'src';
		} else {
			result = 'textContent';
		}
	}
	return result;
}

function extractViewParams(element) {
	let result = [], param;
	if (element && element.dataset && (param = element.dataset.tie)) {
		result = parseViewParams(param, element);
	}
	return result;
}

//	syntax example (first param is a shortcut to default): data-tie="orders:0.address.street, orders:0.address.apt => title"
function parseViewParams(multiParam, element) {
	const
		result = [],
		keysTest = {},
		rawParams = multiParam.split(MULTI_PARAMS_SPLITTER),
		l = rawParams.length;
	let i = 0, next, parsedParam;
	for (; i < l; i++) {
		next = rawParams[i];
		if (!next) {
			continue;
		}
		try {
			parsedParam = parseTieParam(next, element);
			if (parsedParam.targetProperty in keysTest) {
				console.error('elements\'s property "' + parsedParam.targetProperty + '" tied more than once; all but first ties dismissed');
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

//	syntax example: data-tie="orders:0.address.street => textContent"
function parseTieParam(rawParam, element) {
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
	return {
		tieKey: origin[0],
		rawPath: rawPath,
		path: rawPath.split('.').filter(node => node),
		targetProperty: parts[1]
	};
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
		if (element.nodeName === 'INPUT' ||
			element.nodeName === 'SELECT' ||
			element.nodeName === 'TEXTAREA') {
			changeEventName = 'change';
		}
	}
	return changeEventName;
}

function getPath(ref, path) {
	if (!ref) return null;
	const l = path.length;
	let i = 0, n;
	for (; i < l - 1; i++) {
		n = path[i];
		ref = ref[n];
		if (ref === null || ref === undefined) return null;
	}
	return ref[path[i]];
}

function setPath(ref, path, value) {
	if (!ref) return;
	const l = path.length;
	let i = 0, n;
	for (; i < l - 1; i++) {
		n = path[i];
		if (!ref[n] || typeof ref[n] !== 'object') {
			ref[n] = {};
		}
		ref = ref[n]
	}
	ref[path[i]] = value;
}