import { VIEW_PARAMS_KEY } from './utils.js';

export const
	namedViews = {},
	rootedViews = new WeakMap();

export {
	obtainTieViews,
	deleteTieViews,
	addView,
	delView
}

function obtainTieViews(tieKey) {
	let tieViews;
	if (typeof tieKey === 'string') {
		tieViews = namedViews[tieKey];
		if (!tieViews) {
			tieViews = {};
			namedViews[tieKey] = tieViews;
		}
	} else {
		tieViews = rootedViews.get(tieKey);
		if (!tieViews) {
			tieViews = {};
			rootedViews.set(tieKey, tieViews);
		}
	}
	return tieViews;
}

function deleteTieViews(tieKey) {
	if (typeof tieKey === 'string') {
		delete namedViews[tieKey];
	} else {
		rootedViews.delete(tieKey);
	}
}

function addView(element, tieParams) {
	let tieParam, fParams, fp;
	let i = tieParams.length, l;
	while (i) {
		tieParam = tieParams[--i];
		if (tieParam.isFunctional) {
			fParams = tieParam.fParams;
			l = fParams.length;
			while (l) {
				fp = fParams[--l];
				seekAndInsertView(fp, element);
			}
		} else {
			seekAndInsertView(tieParam, element);
		}
	}
	element[VIEW_PARAMS_KEY] = tieParams;
}

function seekAndInsertView(tieParam, element) {
	const tieKey = tieParam.tieKey;
	const rawPath = tieParam.rawPath;
	let tieViews;
	if (typeof tieKey === 'string') {
		tieViews = namedViews[tieKey];
		if (!tieViews) {
			tieViews = {};
			namedViews[tieKey] = tieViews;
		}
	} else {
		tieViews = rootedViews.get(tieKey);
		if (!tieViews) {
			tieViews = {};
			rootedViews.set(tieKey, tieViews);
		}
	}
	let pathViews = tieViews[rawPath];
	if (!pathViews) {
		pathViews = [];
		tieViews[rawPath] = pathViews;
	}
	if (pathViews.indexOf(element) < 0) {
		pathViews.push(element);
	}
}

function delView(element, tieParams) {
	let tieParam, fParams, fp;
	let i = tieParams.length, l;
	while (i) {
		tieParam = tieParams[--i];
		if (tieParam.isFunctional) {
			fParams = tieParam.fParams;
			l = fParams.length;
			while (l) {
				fp = fParams[--l];
				seekAndRemoveView(fp, element);
			}
		} else {
			seekAndRemoveView(tieParam, element);
		}
	}
	delete element[VIEW_PARAMS_KEY];
}

function seekAndRemoveView(tieParam, element) {
	const tieKey = tieParam.tieKey;
	const rawPath = tieParam.rawPath;
	let tieViews;
	if (typeof tieKey === 'string') {
		tieViews = namedViews[tieKey];
	} else {
		tieViews = rootedViews.get(tieKey);
	}
	const pathViews = tieViews[rawPath];
	const index = pathViews ? pathViews.indexOf(element) : -1;
	if (index >= 0) {
		pathViews.splice(index, 1);
	}
}