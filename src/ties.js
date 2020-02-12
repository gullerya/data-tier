import {
	ensureObservable,
	getPath,
	setViewProperty,
	callViewFunction
} from './utils.js';

const
	namedTies = {},
	rootedTies = new WeakMap(),
	tieNameValidator = /^[a-zA-Z0-9]+$/;

let VIEW_PARAMS_KEY,
	ties,
	views,
	rootedViews;

class Tie {
	constructor(key, model, views) {
		this.key = key;
		this.model = ensureObservable(model);
		this.views = views;
		this.ownModel = this.model !== model;
		this.model.observe(changes => this.processDataChanges(changes));
	}

	processDataChanges(changes) {
		const
			tieKey = this.key,
			tieViews = this.views,
			tiedPaths = Object.keys(tieViews),
			fullUpdatesMap = {};
		let i, l, change, changedObject, arrPath, changedPath = '', pl, tiedPath, pathViews, pvl;

		if (!tiedPaths.length) return;

		for (i = 0, l = changes.length; i < l; i++) {
			change = changes[i];
			changedObject = change.object;
			arrPath = change.path;

			if (Array.isArray(changedObject) &&
				(change.type === 'insert' || change.type === 'delete') &&
				!isNaN(arrPath[arrPath.length - 1])) {
				changedPath = arrPath.slice(0, -1).join('.');
				if (fullUpdatesMap[changedPath] === changedObject) {
					continue;
				} else {
					fullUpdatesMap[changedPath] = changedObject;
					change = null;
				}
			} else {
				const apl = arrPath.length;
				if (apl > 1) {
					for (let k = 0; k < apl - 1; k++) {
						changedPath += arrPath[k] + '.';
					}
					changedPath += arrPath[apl - 1];
				} else if (apl === 1) {
					changedPath = arrPath[0];
				}
			}

			pl = tiedPaths.length;
			while (pl) {
				tiedPath = tiedPaths[--pl];
				if (tiedPath.indexOf(changedPath) === 0 || changedPath.indexOf(tiedPath) === 0) {
					pathViews = tieViews[tiedPath];
					pvl = pathViews.length;
					while (pvl) {
						this.updateView(pathViews[--pvl], changedPath, change, tieKey);
					}
				}
			}
		}
	}

	updateView(element, changedPath, change, tieKey) {
		const viewParams = element[VIEW_PARAMS_KEY];
		let i = viewParams.length;
		while (i) {
			const param = viewParams[--i];
			if (param.isFunctional) {
				if (param.fParams.some(fp => fp.tieKey === tieKey && fp.rawPath.indexOf(changedPath) === 0)) {
					let someData = false;
					const args = [];
					param.fParams.forEach(fp => {
						let arg;
						const tie = ties.get(fp.tieKey);
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
				if (param.tieKey !== tieKey) {
					continue;
				}
				if (param.rawPath.indexOf(changedPath) !== 0 && changedPath.indexOf(param.rawPath) !== 0) {
					continue;
				}

				let newValue;
				if (!change || typeof change.value === 'undefined' || changedPath !== param.rawPath) {
					newValue = getPath(this.model, param.path);
				} else if (change) {
					newValue = change.value;
				}
				if (typeof newValue === 'undefined') {
					newValue = '';
				}
				setViewProperty(element, param, newValue);
			}
		}
	}
}

export class Ties {
	constructor(viewParamsKey, nViews, rViews) {
		VIEW_PARAMS_KEY = viewParamsKey;
		ties = this;
		views = nViews;
		rootedViews = rViews;
	}

	get(key) {
		let t;
		if (typeof key === 'string') {
			t = namedTies[key];
		} else {
			t = rootedTies.get(key);
		}
		return t ? t.model : undefined;
	};

	create(key, model) {
		if (namedTies[key]) {
			throw new Error(`tie '${key}' already exists`);
		}
		this.validateTieKey(key);

		if (model === null) {
			throw new Error('initial model, when provided, MUST NOT be null');
		}

		let t;
		if (typeof key === 'string') {
			if (!(key in views)) views[key] = {};
			t = new Tie(key, model, views[key]);
			namedTies[key] = t;
		} else {
			if (!rootedViews.has(key)) rootedViews.set(key, {});
			t = new Tie(key, model, rootedViews.get(key));
			rootedTies.set(key, t);
		}
		t.processDataChanges([{ path: [] }]);

		return t.model;
	};

	remove(tieToRemove) {
		let tieNameToRemove;
		if (typeof tieToRemove === 'object') {
			tieNameToRemove = Object.keys(namedTies).find(key => namedTies[key].model === tieToRemove);
		} else if (typeof tieToRemove === 'string') {
			tieNameToRemove = tieToRemove;
		} else {
			throw new Error('tie to remove MUST either be a valid tie key or tie self');
		}

		delete views[tieNameToRemove];
		//	TODO: handle rooted views too
		const tie = namedTies[tieNameToRemove];
		if (tie) {
			if (tie.model && tie.ownModel) {
				tie.model.revoke();
			}
			delete namedTies[tieNameToRemove];
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
		} else if (!key.nodeType || key.nodeType !== Node.ELEMENT_NODE) {
			throw new Error(`invalid key '${key}'`);
		}
	}
}