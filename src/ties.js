import {
	VIEW_PARAMS_KEY,
	ensureObservable,
	getPath,
	setViewProperty,
	callViewFunction
} from './utils.js';
import { obtainTieViews, deleteTieViews } from './views.js';

const
	namedTies = {},
	rootedTies = new WeakMap(),
	tieNameValidator = /^[a-zA-Z0-9]+$/,
	reservedTieNames = ['root'];

let ties;

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
	constructor() {
		ties = this;
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

		const tieViews = obtainTieViews(key);
		const tie = new Tie(key, model, tieViews);
		if (typeof key === 'string') {
			namedTies[key] = tie;
		} else {
			rootedTies.set(key, tie);
		}
		tie.processDataChanges([{ path: [] }]);

		return tie.model;
	};

	remove(tieToRemove) {
		let tie;
		let finalTieKeyToRemove;
		if (typeof tieToRemove === 'object' && tieToRemove.nodeType === Node.ELEMENT_NODE) {
			finalTieKeyToRemove = tieToRemove;
			tie = rootedTies.get(finalTieKeyToRemove);
			rootedTies.delete(finalTieKeyToRemove);
		} else if (typeof tieToRemove === 'string' || typeof tieToRemove === 'object') {
			if (typeof tieToRemove === 'object') {
				finalTieKeyToRemove = Object.keys(namedTies).find(key => namedTies[key].model === tieToRemove);
			} else {
				finalTieKeyToRemove = tieToRemove;
			}
			tie = namedTies[finalTieKeyToRemove];
			delete namedTies[finalTieKeyToRemove];
		} else {
			throw new Error('tie to remove MUST either be a valid tie key or tie self');
		}
		deleteTieViews(finalTieKeyToRemove);

		if (tie) {
			if (tie.model && tie.ownModel) {
				tie.model.revoke();
			}
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