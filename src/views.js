import { extractViewParams, getRandomKey, TARGET_TYPES } from './utils.js';

export class Views {
	constructor(dtInstance) {
		this.dti = dtInstance;
		this.views = {};
		this.scopes = {};
		this.unscoped = [];
	}

	obtainTieViews(tieKey) {
		let result = this.views[tieKey];
		if (!result) {
			result = { _pathsCache: [] };
			this.views[tieKey] = result;
		}
		return result;
	}

	deleteTieViews(tieKey) {
		delete this.views[tieKey];
	}

	addView(element, tieParams) {
		this._handleView(element, tieParams, true);
	}

	delView(element, tieParams) {
		this._handleView(element, tieParams, false);
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
				const viewParams = extractViewParams(unscoped);
				if (viewParams) {
					this.addView(unscoped, viewParams);
					this.unscoped.splice(this.unscoped.indexOf(unscoped), 1);
				}
			}
		}
	}

	delScope() {
		throw new Error('not implemented');
	}

	_handleView(element, tieParams, toAdd) {
		let tieParam, fParams, fp;
		let i = tieParams.length, l;
		while (i--) {
			tieParam = tieParams[i];
			if (tieParam.targetType === TARGET_TYPES.METHOD) {
				fParams = tieParam.fParams;
				l = fParams.length;
				while (l--) {
					fp = fParams[l];
					this[toAdd ? '_seekAndInsertView' : '_seekAndRemoveView'](fp, element);
				}
			} else {
				this[toAdd ? '_seekAndInsertView' : '_seekAndRemoveView'](tieParam, element);
			}
		}
		if (toAdd) {
			element[this.dti.paramsKey] = tieParams;
		} else {
			delete element[this.dti.paramsKey];
		}
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

	_lookupClosestScopeKey(element) {
		let tmp = element, result;
		do {
			result = tmp.getAttribute('data-tie-scope');
			if (result) {
				break;
			}
			tmp = tmp.parentNode;
			if (tmp.host) {
				tmp = tmp.host;
			}
		} while (tmp && tmp.nodeType !== Node.DOCUMENT_NODE);
		return result;
	}

	updateViewByModel(elem, param, value) {
		const targetType = param.targetType || TARGET_TYPES.PROPERTY;
		const targetKey = param.targetKey;
		try {
			switch (targetType) {
				case TARGET_TYPES.ATTRIBUTE:
					this._unsafeSetAttribute(elem, param, value, targetKey);
					break;
				case TARGET_TYPES.PROPERTY:
					this._unsafeSetProperty(elem, param, value, targetKey);
					break;
				default:
					throw new Error(`unsupported target type '${targetType}'`);
			}
		} catch (e) {
			console.error(`failed to set '${targetKey}' of '${elem}' to '${value}'`, e);
		}
	}

	_unsafeSetAttribute(view, _param, value, targetAttribute) {
		if (value === null || value === undefined) {
			view.removeAttribute(targetAttribute);
		} else {
			view.setAttribute(targetAttribute, String(value));
		}
	}

	_unsafeSetProperty(view, param, value, targetProperty) {
		if (targetProperty === 'textContent') {
			this._setTextContentProperty(view, value);
		} else if (targetProperty === 'value') {
			this._setValueProperty(view, value);
		} else if (targetProperty === 'href' && typeof view.href === 'object') {
			view.href.baseVal = value;
		} else if (targetProperty === 'scope') {
			//	TODO: this is the ONLY line that refers to a state
			this.dti.ties.update(view, value);
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
			view.className = classes.join(' ');
		} else {
			view[targetProperty] = value;
		}
	}

	_setTextContentProperty(view, value) {
		view.textContent = value === undefined || value === null ? '' : value;
	}

	_setValueProperty(view, value) {
		let v = value;
		if (value === undefined || value === null) {
			const viewName = view.nodeName;
			if (viewName === 'INPUT' || viewName === 'SELECT' || viewName === 'TEXTAREA') {
				v = '';
			}
		}
		view.value = v;
	}
}