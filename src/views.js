import { extractViewParams, getRandomKey } from './utils.js';

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
			if (!result) {
				tmp = tmp.parentNode;
				if (tmp.host) {
					tmp = tmp.host;
				}
			}
		} while (!result && tmp && tmp.nodeType !== Node.DOCUMENT_NODE);
		return result;
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