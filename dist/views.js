export class Views {
	constructor(dtInstance) {
		this.dti = dtInstance;
		this.views = {};
	}

	obtainTieViews(tieKey) {
		let tieViews = this.views[tieKey];
		if (!tieViews) {
			tieViews = { _pathsCache: [] };
			this.views[tieKey] = tieViews;
		}
		return tieViews;
	}

	deleteTieViews(tieKey) {
		delete this.views[tieKey];
	}

	addView(element, tieParams) {
		let tieParam, fParams, fp;
		let i = tieParams.length, l;
		while (i) {
			tieParam = tieParams[--i];
			if (tieParam.isFunctional) {
				fParams = tieParam.fParams;
				l = fParams.length;
				while (l) {
					fp = fParams[--l];
					this.seekAndInsertView(fp, element);
				}
			} else {
				this.seekAndInsertView(tieParam, element);
			}
		}
		element[this.dti.paramsKey] = tieParams;
	}

	delView(element, tieParams) {
		let tieParam, fParams, fp;
		let i = tieParams.length, l;
		while (i) {
			tieParam = tieParams[--i];
			if (tieParam.isFunctional) {
				fParams = tieParam.fParams;
				l = fParams.length;
				while (l) {
					fp = fParams[--l];
					this.seekAndRemoveView(fp, element);
				}
			} else {
				this.seekAndRemoveView(tieParam, element);
			}
		}
		delete element[this.dti.paramsKey];
	}

	seekAndInsertView(tieParam, element) {
		const tieKey = tieParam.tieKey;
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

	seekAndRemoveView(tieParam, element) {
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

	setViewProperty(elem, param, value) {
		const targetProperty = param.targetProperty;
		try {
			this._unsafeSetProperty(elem, param, value, targetProperty);
		} catch (e) {
			console.error(`failed to set '${targetProperty}' of '${elem}' to '${value}'`, e);
		}
	}

	_unsafeSetProperty(elem, param, value, targetProperty) {
		if (targetProperty === 'href' && typeof elem.href === 'object') {
			elem.href.baseVal = value;
		} else if (targetProperty === 'scope' && elem[this.dti.scopeRootKey]) {
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
}