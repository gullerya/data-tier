/**
 * lifecycle of the DOM elements:
 * - scan upon: init | add | remove | attribute changed
 * - add | del as view
 * 
 * lifecycle as View of DT:
 * - when model change: update				- lookup by tie + path
 * - when change event - update model
 */

import { extractViewParams, getRandomKey } from './utils.js';

export class Views {
	constructor(dtInstance) {
		this.dti = dtInstance;
		this.views = {};
		this.scopes = {};
		this.unscoped = [];
	}

	obtainTieViews(tieKey) {
		return this.views[tieKey] || (this.views[tieKey] = { _pathsCache: [] });
	}

	deleteTieViews(tieKey) {
		delete this.views[tieKey];
	}

	addView(element) {
		const tieParams = extractViewParams(element);
		if (!tieParams) {
			return null;
		}

		let tieParam, fParams, fp;
		let i = tieParams.length, l;
		while (i--) {
			tieParam = tieParams[i];
			if (tieParam.isFunctional) {
				fParams = tieParam.fParams;
				l = fParams.length;
				while (l--) {
					fp = fParams[l];
					this._seekAndInsertView(fp, element);
				}
			} else {
				this._seekAndInsertView(tieParam, element);
			}
		}
		element[this.dti.paramsKey] = tieParams;
		return tieParams;
	}

	delView(element, tieParams) {
		let tieParam, fParams, fp;
		let i = tieParams.length, l;
		while (i--) {
			tieParam = tieParams[i];
			if (tieParam.isFunctional) {
				fParams = tieParam.fParams;
				l = fParams.length;
				while (l--) {
					fp = fParams[l];
					this._seekAndRemoveView(fp, element);
				}
			} else {
				this._seekAndRemoveView(tieParam, element);
			}
		}
		delete element[this.dti.paramsKey];
	}

	addScope(element) {
		let scopeKey = element.getAttribute('data-tie-scope');
		if (!scopeKey) {
			//	TODO: review this one
			element.setAttribute('data-tie-scope', getRandomKey(16));
			return;
		}
		if (scopeKey in this.scopes && this.scopes[scopeKey] !== element) {
			throw new Error(`scope key '${scopeKey} already claimed by another element`);
		}
		if (this.scopes[scopeKey] === element) {
			return;
		}
		this.scopes[scopeKey] = element;
		for (const unscoped of this.unscoped) {
			if (element.contains(unscoped)) {
				this.addView(unscoped);
				this.unscoped.splice(this.unscoped.indexOf(unscoped), 1);
			}
		}
	}

	delScope() {
		throw new Error('not implemented');
	}

	_seekAndInsertView(tieParam, element) {
		let tieKey = tieParam.tieKey;
		if (tieKey === 'scope') {
			tieKey = this._lookupClosestScopeKey(element);
			if (!tieKey) {
				this.unscoped.push(element);
				return;
			} else {
				tieParam.tieKey = tieKey;
			}
		}

		const rawPath = tieParam.rawPath;
		const tieViews = this.obtainTieViews(tieKey);
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

	_seekAndRemoveView(tieParam, element) {
		const tieKey = tieParam.tieKey;
		const rawPath = tieParam.rawPath;
		const tieViews = this.views[tieKey];
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

	//	TOOD: this function may become stateless, see remark below
	setViewProperty(elem, param, value) {
		const targetProperty = param.targetProperty;
		try {
			this._unsafeSetProperty(elem, param, value, targetProperty);
		} catch (e) {
			console.error(`failed to set '${targetProperty}' of '${elem}' to '${value}'`, e);
		}
	}

	//	TOOD: this function may become stateless, see remark below
	_unsafeSetProperty(elem, param, value, targetProperty) {
		if (targetProperty === 'href' && typeof elem.href === 'object') {
			elem.href.baseVal = value;
		} else if (targetProperty === 'scope') {
			//	TODO: this is the ONLY line that refers to a state
			this.dti.ties.update(elem, value);
		} else if (targetProperty === 'classList') {
			const classes = param.iClasses.slice(0);
			if (value) {
				if (Array.isArray(value) && value.length) {
					value.forEach(c => {
						if (classes.indexOf(c) < 0) {
							classes.push(c);
						}
					});
				} else if (typeof value === 'object') {
					Object.keys(value).forEach(c => {
						const i = classes.indexOf(c);
						if (value[c]) {
							if (i < 0) {
								classes.push(c);
							}
						} else if (i >= 0) {
							classes.splice(i, 1);
						}
					});
				} else if (typeof value === 'string') {
					if (classes.indexOf(value) < 0) {
						classes.push(value);
					}
				}
			}
			elem.className = classes.join(' ');
		} else {
			elem[targetProperty] = value;
		}
	}

	_lookupClosestScopeKey(element) {
		let tmp = element, result;
		do {
			result = tmp.getAttribute('data-tie-scope');
			if (!result) {
				tmp = tmp.parentNode;
				if (tmp.host) {
					tmp = tmp.host;
				}
			}
		} while (!result && tmp && tmp.nodeType !== Node.DOCUMENT_NODE);
		return result;
	}
}