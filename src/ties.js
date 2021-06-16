import { Observable } from './object-observer.min.js';
import { TARGET_TYPES, getPath, callViewMethod, getRandomKey } from './utils.js';

export {
	Observable
};

const
	tieNameValidator = /^[a-zA-Z0-9]+$/,
	reservedTieNames = ['scope'];

class Tie {
	constructor(key, model, ties) {
		this.key = key;
		this.ties = ties;
		this.model = model;
	}

	set model(model) {
		const [postModel, isObservable] = ensureObservable(model);
		this._model = postModel;
		if (isObservable) {
			this._model.observe(changes => this.processDataChanges(changes));
		}
	}

	get model() {
		return this._model;
	}

	processDataChanges(changes) {
		const
			tieViews = this.ties._dti.views.obtainTieViews(this.key),
			tiedPaths = tieViews._pathsCache,
			tiedPathsLength = tiedPaths.length;

		if (!tiedPathsLength) {
			return;
		}

		let change, changedObject, arrPath, apl, changedPath = '', pl, tiedPath, pathViews, pvl;
		let cplen, sst, lst, fullArrayUpdate, same, view;

		for (let i = 0, l = changes.length; i < l; i++) {
			change = changes[i];
			arrPath = change.path;
			apl = arrPath.length;

			//	TODO: optimize this check
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
					//	no-op
				} else if (apl === 2) {
					changedPath = arrPath[0] + '.' + arrPath[1];
				} else {
					changedPath = arrPath.join('.');
				}
			}

			cplen = changedPath.length;
			pl = tiedPathsLength;
			while (pl--) {
				tiedPath = tiedPaths[pl];
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
					while (pvl--) {
						view = pathViews[pvl];
						this.updateView(view, tiedPath, same, change);
					}
				}
			}
		}
	}

	updateView(element, tiedPath, useChangeValue, change) {
		const viewParams = element[this.ties._dti.paramsKey];
		let i = viewParams.length;
		while (i--) {
			const param = viewParams[i];
			if (param.targetType === TARGET_TYPES.METHOD) {
				if (param.fParams.some(fp => fp.tieKey === this.key && fp.rawPath === tiedPath)) {
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
						callViewMethod(element, param.targetKey, args);
					}
				}
			} else {
				if (param.tieKey !== this.key || param.rawPath !== tiedPath) {
					continue;
				}

				let newValue;
				if (change.value !== undefined && useChangeValue) {
					newValue = change.value;
				} else {
					newValue = getPath(this._model, param.path);
				}
				this.ties._dti.views.updateViewByModel(element, param, newValue, change.oldValue);
			}
		}
	}
}

export class Ties {
	constructor(dataTierInstance) {
		this._dti = dataTierInstance;
		this._ties = {};
	}

	get(key) {
		const k = typeof key === 'string'
			? key
			: (key && key.getAttribute ? key.getAttribute('data-tie-scope') : null);
		const t = this._ties[k];
		return t ? t.model : undefined;
	}

	create(key, model) {
		let k;
		if (typeof key === 'string') {
			k = key;
		} else if (key && key.nodeType === Node.ELEMENT_NODE) {
			k = key.getAttribute('data-tie-scope');
			if (!k) {
				k = getRandomKey(16);
				key.setAttribute('data-tie-scope', k);
			} else {
				console.log('inspect this');
			}
		}

		Ties.validateTieKey(k);
		if (this._ties[k]) {
			throw new Error(`tie '${k}' already exists`);
		}
		if (key.nodeType) {
			this._dti.views.addScope(key);
		}

		const tie = new Tie(k, model, this);
		this._ties[k] = tie;
		tie.processDataChanges([{ path: [] }]);

		return tie.model;
	}

	update(key, model) {
		if (model === undefined) {
			throw new Error(`illegal model '${model}'`);
		}

		const k = typeof key === 'string'
			? key
			: (key && key.getAttribute ? key.getAttribute('data-tie-scope') : null);
		const tie = this._ties[k];
		if (tie) {
			if (tie.model !== model) {
				tie.model = model;
				tie.processDataChanges([{ path: [] }]);
			}
			return tie.model;
		} else {
			return this.create(key, model);
		}
	}

	remove(tieToRemove) {
		let finalTieKeyToRemove = tieToRemove;
		if (typeof tieToRemove === 'object') {
			if (tieToRemove.nodeType === Node.ELEMENT_NODE) {
				finalTieKeyToRemove = tieToRemove.getAttribute('data-tie-scope');
			} else {
				finalTieKeyToRemove = Object.keys(this._ties).find(key => this._ties[key].model === tieToRemove);
			}
		} else if (typeof tieToRemove !== 'string') {
			throw new Error(`invalid tieToRemove parameter ${tieToRemove}`);
		}

		const tie = this._ties[finalTieKeyToRemove];
		if (tie) {
			delete this._ties[finalTieKeyToRemove];
			this._dti.views.deleteTieViews(finalTieKeyToRemove);
		}
	}

	static validateTieKey(key) {
		if (!key || typeof key !== 'string') {
			throw new Error(`invalid key '${key}'`);
		}
		if (!tieNameValidator.test(key)) {
			throw new Error(`tie key MUST match ${tieNameValidator}; '${key}' doesn't`);
		}
		if (reservedTieNames.indexOf(key) >= 0) {
			throw new Error(`tie key MUST NOT be one of those: ${reservedTieNames.join(', ')}`);
		}
	}
}

function ensureObservable(o = {}) {
	if (Observable.isObservable(o)) {
		return [o, true];
	} else if (o && typeof o === 'object') {
		return [Observable.from(o), true];
	} else {
		return [o, false];
	}
}