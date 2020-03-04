import {
	ensureObservable,
	getPath,
	callViewFunction,
	getRandomKey
} from './utils.js';

const
	tieNameValidator = /^[a-zA-Z0-9]+$/,
	reservedTieNames = ['scope'];

class Tie {
	constructor(key, model, ties) {
		this.key = key;
		this.model = ensureObservable(model);
		this.ties = ties;
		this.model.observe(changes => this.processDataChanges(changes));
	}

	processDataChanges(changes) {
		const
			tieViews = this.ties.dti.views.obtainTieViews(this.key),
			tiedPaths = tieViews._pathsCache,
			tiedPathsLength = tiedPaths.length;
		let i, l, change, changedObject, arrPath, apl, changedPath = '', pl, tiedPath, pathViews, pvl;
		let cplen, sst, lst, fullArrayUpdate, same, view, updateSet;

		if (!tiedPathsLength) return;

		for (i = 0, l = changes.length; i < l; i++) {
			change = changes[i];
			arrPath = change.path;
			apl = arrPath.length;

			if (arrPath.some(e => typeof e === 'symbol')) {
				continue;
			}

			fullArrayUpdate = false;
			changedObject = change.object;

			if (Array.isArray(changedObject) && (change.type === 'insert' || change.type === 'delete') && !isNaN(arrPath[arrPath.length - 1])) {
				changedPath = arrPath.slice(0, -1).join('.');
				fullArrayUpdate = true;
			} else {
				if (apl === 1) {
					changedPath = arrPath[0];
				} else if (!apl) {
				} else if (apl === 2) {
					changedPath = arrPath[0] + '.' + arrPath[1];
				} else {
					changedPath = arrPath.join('.');
				}
			}

			cplen = changedPath.length;
			pl = tiedPathsLength;
			updateSet = new Map();
			while (pl) {
				tiedPath = tiedPaths[--pl];
				if (cplen > tiedPath.length) {
					sst = tiedPath;
					lst = changedPath;
				} else {
					sst = changedPath;
					lst = tiedPath;
				}
				same = sst === lst && !fullArrayUpdate;
				if (lst.indexOf(sst) === 0) {
					pathViews = tieViews[tiedPath];
					pvl = pathViews.length;
					while (pvl) {
						view = pathViews[--pvl];
						let tmp = updateSet.get(view);
						if (!tmp) {
							tmp = {};
							updateSet.set(view, tmp);
						}
						tmp[tiedPath] = same;
					}
				}
			}
			this.updateViews(updateSet, change);
		}
	}

	updateViews(updateSet, change) {
		let viewParams, i;
		updateSet.forEach((paths, element) => {
			viewParams = element[this.ties.dti.paramsKey];
			i = viewParams.length;
			while (i) {
				const param = viewParams[--i];
				if (param.isFunctional) {
					if (param.fParams.some(fp => fp.tieKey === this.key && fp.rawPath in paths)) {
						let someData = false;
						const args = [];
						param.fParams.forEach(fp => {
							let arg;
							const tie = this.ties.get(fp.tieKey);
							if (tie) {
								arg = getPath(tie, fp.path);
								someData = true;
							}
							args.push(arg);
						});
						if (someData) {
							args.push([change]);
							callViewFunction(element, param.targetProperty, args);
						}
					}
				} else {
					if (param.tieKey !== this.key) {
						continue;
					}
					if (!(param.rawPath in paths)) {
						continue;
					}

					let newValue;
					if (change && typeof change.value !== 'undefined' && paths[param.rawPath]) {
						newValue = change.value;
					} else {
						newValue = getPath(this.model, param.path);
					}
					if (typeof newValue === 'undefined') {
						newValue = '';
					}
					this.ties.dti.views.setViewProperty(element, param, newValue);
				}
			}
		});
	}
}

export class Ties {
	constructor(dtInstance) {
		this.dti = dtInstance;
		this.ties = {};
	}

	get(key) {
		const k = typeof key === 'string' ? key : (key ? key[this.dti.scopeRootKey] : undefined);
		const t = this.ties[k];
		return t ? t.model : null;
	};

	create(key, model) {
		if (this.ties[key]) {
			throw new Error(`tie '${key}' already exists`);
		}
		if (model === null) {
			throw new Error('initial model, when provided, MUST NOT be null');
		}

		this.validateTieKey(key);

		let k = key;
		if (typeof k !== 'string') {
			k = key[this.dti.scopeRootKey];
			if (!k) {
				k = getRandomKey(16);
				key[this.dti.scopeRootKey] = k;
			}
		}

		const tieViews = this.dti.views.obtainTieViews(k);
		const tie = new Tie(k, model, this, tieViews);
		this.ties[k] = tie;
		tie.processDataChanges([{ path: [] }]);

		return tie.model;
	};

	update(key, model) {
		if (model && typeof model === 'object') {
			const k = typeof key === 'string' ? key : (key ? key[this.dti.scopeRootKey] : undefined);
			const tie = this.ties[k];
			if (tie) {
				if (tie.model !== model) {
					tie.model = model;
					tie.processDataChanges([{ path: [] }]);
				}
				return tie.model;
			} else {
				return this.create(k, model);
			}
		}
	}

	remove(tieToRemove) {
		let finalTieKeyToRemove = tieToRemove;
		if (typeof tieToRemove === 'object') {
			if (tieToRemove.nodeType === Node.ELEMENT_NODE) {
				finalTieKeyToRemove = tieToRemove[this.dti.scopeRootKey];
			} else {
				finalTieKeyToRemove = Object.keys(this.ties).find(key => this.ties[key].model === tieToRemove);
			}
		} else if (typeof tieToRemove !== 'string') {
			throw new Error(`invalid tieToRemove parameter ${tieToRemove}`);
		}

		const tie = this.ties[finalTieKeyToRemove];
		if (tie) {
			delete this.ties[finalTieKeyToRemove];
			this.dti.views.deleteTieViews(finalTieKeyToRemove);
		}
	};

	validateTieKey(key) {
		if (!key) {
			throw new Error(`invalid key '${key}'`);
		}
		if (typeof key === 'string') {
			if (!tieNameValidator.test(key)) {
				throw new Error(`tie key MUST match ${tieNameValidator}; '${key}' doesn't`);
			}
			if (reservedTieNames.indexOf(key) >= 0) {
				throw new Error(`tie key MUST NOT be one of those: ${reservedTieNames.join(', ')}`);
			}
		} else if (!key.nodeType || key.nodeType !== Node.ELEMENT_NODE) {
			throw new Error(`invalid key '${key}'`);
		}
	}
}