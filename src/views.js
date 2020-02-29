import { VIEW_PARAMS_KEY } from './utils.js';

const views = {};

export {
	obtainTieViews,
	deleteTieViews,
	addView,
	delView
}

function obtainTieViews(tieKey) {
	let tieViews = views[tieKey];
	if (!tieViews) {
		tieViews = { _pathsCache: [] };
		views[tieKey] = tieViews;
	}
	return tieViews;
}

function deleteTieViews(tieKey) {
	delete views[tieKey];
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
	const tieViews = obtainTieViews(tieKey);
	let pathViews = tieViews[rawPath];
	if (!pathViews) {
		pathViews = [];
		tieViews[rawPath] = pathViews;
		tieViews._pathsCache.push(rawPath);
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
	const tieViews = views[tieKey];
	if (tieViews) {
		const pathViews = tieViews[rawPath];
		if (pathViews) {
			const index = pathViews.indexOf(element);
			if (index >= 0) {
				pathViews.splice(index, 1);
			}
		}
	}
}