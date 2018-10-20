(() => {
	'use strict';

	const
		scope = this || window,
		INSERT = 'insert',
		UPDATE = 'update',
		DELETE = 'delete',
		REVERSE = 'reverse',
		SHUFFLE = 'shuffle',
		sysObsKey = Symbol('system-observer-key'),
		nonObservables = {
			Date: true,
			Blob: true,
			Number: true,
			String: true,
			Boolean: true,
			Error: true,
			SyntaxError: true,
			TypeError: true,
			URIError: true,
			Function: true,
			Promise: true,
			RegExp: true
		},
		observableDefinition = {
			revoke: {
				value: function() {
					this[sysObsKey].revoke();
				}
			},
			observe: {
				value: function(observer) {
					let systemObserver = this[sysObsKey],
						observers = systemObserver.observers;
					if (systemObserver.isRevoked) { throw new TypeError('revoked Observable MAY NOT be observed anymore'); }
					if (typeof observer !== 'function') { throw new Error('observer parameter MUST be a function'); }

					if (observers.indexOf(observer) < 0) {
						observers.push(observer);
					} else {
						console.info('observer may be bound to an observable only once');
					}
				}
			},
			unobserve: {
				value: function() {
					let systemObserver = this[sysObsKey],
						observers = systemObserver.observers,
						l, idx;
					if (systemObserver.isRevoked) { throw new TypeError('revoked Observable MAY NOT be unobserved anymore'); }
					l = arguments.length;
					if (l) {
						while (l--) {
							idx = observers.indexOf(arguments[l]);
							if (idx >= 0) observers.splice(idx, 1);
						}
					} else {
						observers.splice(0);
					}
				}
			}
		},
		prepareArray = function(origin, destination, observer) {
			let l = origin.length, item;
			destination[sysObsKey] = observer;
			while (l--) {
				item = origin[l];
				if (item && typeof item === 'object' && !nonObservables.hasOwnProperty(item.constructor.name)) {
					destination[l] = Array.isArray(item)
						? new ArrayObserver({target: item, ownKey: l, parent: observer}).proxy
						: new ObjectObserver({target: item, ownKey: l, parent: observer}).proxy;
				} else {
					destination[l] = item;
				}
			}
		},
		prepareObject = function(origin, destination, observer) {
			let keys = Object.keys(origin), l = keys.length, key, item;
			destination[sysObsKey] = observer;
			while (l--) {
				key = keys[l];
				item = origin[key];
				if (item && typeof item === 'object' && !nonObservables.hasOwnProperty(item.constructor.name)) {
					destination[key] = Array.isArray(item)
						? new ArrayObserver({target: item, ownKey: key, parent: observer}).proxy
						: new ObjectObserver({target: item, ownKey: key, parent: observer}).proxy;
				} else {
					destination[key] = item;
				}
			}
		},
		callObservers = function(observers, changes) {
			let l = observers.length;
			while (l--) {
				try {
					observers[l](changes);
				} catch (e) {
					console.error('failed to deliver changes to listener' + observers[l], e);
				}
			}
		},
		getAncestorInfo = function(self) {
			let tmp = [], result, l1 = 0, l2 = 0;
			while (self.parent) {
				tmp[l1++] = self.ownKey;
				self = self.parent;
			}
			result = new Array(l1);
			while (l1--) result[l2++] = tmp[l1];
			return {observers: self.observers, path: result};
		};

	class ArrayObserver {
		constructor(properties) {
			let origin = properties.target, clone = new Array(origin.length);
			if (properties.parent === null) {
				this.isRevoked = false;
				this.observers = [];
				Object.defineProperties(clone, observableDefinition);
			} else {
				this.parent = properties.parent;
				this.ownKey = properties.ownKey;
			}
			prepareArray(origin, clone, this);
			this.revokable = Proxy.revocable(clone, this);
			this.proxy = this.revokable.proxy;
			this.target = clone;
		}

		//	returns an unobserved graph (effectively this is an opposite of an ArrayObserver constructor logic)
		revoke() {
			//	revoke native proxy
			this.revokable.revoke();

			//	roll back observed array to an unobserved one
			let target = this.target, l = target.length, item;
			while (l--) {
				item = target[l];
				if (item && typeof item === 'object') {
					let tmpObserved = item[sysObsKey];
					if (tmpObserved) {
						target[l] = tmpObserved.revoke();
					}
				}
			}
			return target;
		}

		get(target, key) {
			const proxiedArrayMethods = {
				pop: function proxiedPop(target, observed) {
					let poppedIndex, popResult;
					poppedIndex = target.length - 1;
					popResult = target.pop();
					if (popResult && typeof popResult === 'object') {
						let tmpObserved = popResult[sysObsKey];
						if (tmpObserved) {
							popResult = tmpObserved.revoke();
						}
					}

					//	publish changes
					let ad = getAncestorInfo(observed);
					if (ad.observers.length) {
						ad.path.push(poppedIndex);
						callObservers(ad.observers, [{type: DELETE, path: ad.path, oldValue: popResult}]);
					}
					return popResult;
				},
				push: function proxiedPush(target, observed) {
					let i, l = arguments.length - 2, item, pushContent = new Array(l), pushResult, changes,
						initialLength, ad = getAncestorInfo(observed);
					initialLength = target.length;

					for (i = 0; i < l; i++) {
						item = arguments[i + 2];
						if (item && typeof item === 'object' && !nonObservables.hasOwnProperty(item.constructor.name)) {
							item = Array.isArray(item)
								? new ArrayObserver({target: item, ownKey: initialLength + i, parent: observed}).proxy
								: new ObjectObserver({target: item, ownKey: initialLength + i, parent: observed}).proxy;
						}
						pushContent[i] = item;
					}
					pushResult = Reflect.apply(target.push, target, pushContent);

					//	publish changes
					if (ad.observers.length) {
						changes = [];
						for (i = initialLength, l = target.length; i < l; i++) {
							let path = ad.path.slice(0);
							path.push(i);
							changes[i - initialLength] = {type: INSERT, path: path, value: target[i]};
						}
						callObservers(ad.observers, changes);
					}
					return pushResult;
				},
				shift: function proxiedShift(target, observed) {
					let shiftResult, i, l, item, ad, changes;

					shiftResult = target.shift();
					if (shiftResult && typeof shiftResult === 'object') {
						let tmpObserved = shiftResult[sysObsKey];
						if (tmpObserved) {
							shiftResult = tmpObserved.revoke();
						}
					}

					//	update indices of the remaining items
					for (i = 0, l = target.length; i < l; i++) {
						item = target[i];
						if (item && typeof item === 'object') {
							let tmpObserved = item[sysObsKey];
							if (tmpObserved) {
								tmpObserved.ownKey = i;
							}
						}
					}

					//	publish changes
					ad = getAncestorInfo(observed);
					if (ad.observers.length) {
						ad.path.push(0);
						changes = [{type: DELETE, path: ad.path, oldValue: shiftResult}];
						callObservers(ad.observers, changes);
					}
					return shiftResult;
				},
				unshift: function proxiedUnshift(target, observed) {
					let unshiftContent, unshiftResult, ad, changes;
					unshiftContent = Array.from(arguments);
					unshiftContent.splice(0, 2);
					unshiftContent.forEach((item, index) => {
						if (item && typeof item === 'object' && !nonObservables.hasOwnProperty(item.constructor.name)) {
							unshiftContent[index] = Array.isArray(item)
								? new ArrayObserver({target: item, ownKey: index, parent: observed}).proxy
								: new ObjectObserver({target: item, ownKey: index, parent: observed}).proxy;
						}
					});
					unshiftResult = Reflect.apply(target.unshift, target, unshiftContent);
					for (let i = 0, l = target.length, item; i < l; i++) {
						item = target[i];
						if (item && typeof item === 'object') {
							let tmpObserved = item[sysObsKey];
							if (tmpObserved) {
								tmpObserved.ownKey = i;
							}
						}
					}

					//	publish changes
					ad = getAncestorInfo(observed);
					if (ad.observers.length) {
						let l = unshiftContent.length, path;
						changes = new Array(l);
						for (let i = 0; i < l; i++) {
							path = ad.path.slice(0);
							path.push(i);
							changes[i] = {type: INSERT, path: path, value: target[i]};
						}
						callObservers(ad.observers, changes);
					}
					return unshiftResult;
				},
				reverse: function proxiedReverse(target, observed) {
					let i, l, item, ad, changes;
					target.reverse();
					for (i = 0, l = target.length; i < l; i++) {
						item = target[i];
						if (item && typeof item === 'object') {
							let tmpObserved = item[sysObsKey];
							if (tmpObserved) {
								tmpObserved.ownKey = i;
							}
						}
					}

					//	publish changes
					ad = getAncestorInfo(observed);
					if (ad.observers.length) {
						changes = [{type: REVERSE, path: ad.path}];
						callObservers(ad.observers, changes);
					}
					return observed.proxy;
				},
				sort: function proxiedSort(target, observed, comparator) {
					let i, l, item, ad, changes;
					target.sort(comparator);
					for (i = 0, l = target.length; i < l; i++) {
						item = target[i];
						if (item && typeof item === 'object') {
							let tmpObserved = item[sysObsKey];
							if (tmpObserved) {
								tmpObserved.ownKey = i;
							}
						}
					}

					//	publish changes
					ad = getAncestorInfo(observed);
					if (ad.observers.length) {
						changes = [{type: SHUFFLE, path: ad.path}];
						callObservers(ad.observers, changes);
					}
					return observed.proxy;
				},
				fill: function proxiedFill(target, observed) {
					let ad = getAncestorInfo(observed), normArgs, argLen,
						start, end, changes = [], prev, tarLen = target.length, path;
					normArgs = Array.from(arguments);
					normArgs.splice(0, 2);
					argLen = normArgs.length;
					start = argLen < 2 ? 0 : (normArgs[1] < 0 ? tarLen + normArgs[1] : normArgs[1]);
					end = argLen < 3 ? tarLen : (normArgs[2] < 0 ? tarLen + normArgs[2] : normArgs[2]);
					prev = target.slice(0);
					Reflect.apply(target.fill, target, normArgs);

					for (let i = start, item, tmpTarget; i < end; i++) {
						item = target[i];
						if (item && typeof item === 'object' && !nonObservables.hasOwnProperty(item.constructor.name)) {
							target[i] = Array.isArray(item)
								? new ArrayObserver({target: item, ownKey: i, parent: observed}).proxy
								: new ObjectObserver({target: item, ownKey: i, parent: observed}).proxy;
						}
						if (prev.hasOwnProperty(i)) {
							tmpTarget = prev[i];
							if (tmpTarget && typeof tmpTarget === 'object') {
								let tmpObserved = tmpTarget[sysObsKey];
								if (tmpObserved) {
									tmpTarget = tmpObserved.revoke();
								}
							}

							path = ad.path.slice(0);
							path.push(i);
							changes.push({type: UPDATE, path: path, value: target[i], oldValue: tmpTarget});
						} else {
							path = ad.path.slice(0);
							path.push(i);
							changes.push({type: INSERT, path: path, value: target[i]});
						}
					}

					//	publish changes
					if (ad.observers.length) {
						callObservers(ad.observers, changes);
					}
					return observed.proxy;
				},
				splice: function proxiedSplice(target, observed) {
					let ad = getAncestorInfo(observed),
						spliceContent, spliceResult, changes = [], tmpObserved,
						startIndex, removed, inserted, splLen, tarLen = target.length;

					spliceContent = Array.from(arguments);
					spliceContent.splice(0, 2);
					splLen = spliceContent.length;

					//	observify the newcomers
					for (let i = 2, item; i < splLen; i++) {
						item = spliceContent[i];
						if (item && typeof item === 'object' && !nonObservables.hasOwnProperty(item.constructor.name)) {
							spliceContent[i] = Array.isArray(item)
								? new ArrayObserver({target: item, ownKey: i, parent: observed}).proxy
								: new ObjectObserver({target: item, ownKey: i, parent: observed}).proxy;
						}
					}

					//	calculate pointers
					startIndex = splLen === 0 ? 0 : (spliceContent[0] < 0 ? tarLen + spliceContent[0] : spliceContent[0]);
					removed = splLen < 2 ? tarLen - startIndex : spliceContent[1];
					inserted = Math.max(splLen - 2, 0);
					spliceResult = Reflect.apply(target.splice, target, spliceContent);
					tarLen = target.length;

					//	reindex the paths
					for (let i = 0, item; i < tarLen; i++) {
						item = target[i];
						if (item && typeof item === 'object') {
							tmpObserved = item[sysObsKey];
							if (tmpObserved) {
								tmpObserved.ownKey = i;
							}
						}
					}

					//	revoke removed Observed
					let i, l, item;
					for (i = 0, l = spliceResult.length; i < l; i++) {
						item = spliceResult[i];
						if (item && typeof item === 'object') {
							tmpObserved = item[sysObsKey];
							if (tmpObserved) {
								spliceResult[i] = tmpObserved.revoke();
							}
						}
					}

					//	publish changes
					if (ad.observers.length) {
						let index, path;
						for (index = 0; index < removed; index++) {
							path = ad.path.slice(0);
							path.push(startIndex + index);
							if (index < inserted) {
								changes.push({
									type: UPDATE,
									path: path,
									value: target[startIndex + index],
									oldValue: spliceResult[index]
								});
							} else {
								changes.push({type: DELETE, path: path, oldValue: spliceResult[index]});
							}
						}
						for (; index < inserted; index++) {
							path = ad.path.slice(0);
							path.push(startIndex + index);
							changes.push({type: INSERT, path: path, value: target[startIndex + index]});
						}
						callObservers(ad.observers, changes);
					}
					return spliceResult;
				}
			};
			if (proxiedArrayMethods.hasOwnProperty(key)) {
				return proxiedArrayMethods[key].bind(undefined, target, this);
			} else {
				return target[key];
			}
		}

		set(target, key, value) {
			let oldValue = target[key], ad, changes;

			if (value && typeof value === 'object' && !nonObservables.hasOwnProperty(value.constructor.name)) {
				target[key] = Array.isArray(value)
					? new ArrayObserver({target: value, ownKey: key, parent: this}).proxy
					: new ObjectObserver({target: value, ownKey: key, parent: this}).proxy;
			} else {
				target[key] = value;
			}

			if (oldValue && typeof oldValue === 'object') {
				let tmpObserved = oldValue[sysObsKey];
				if (tmpObserved) {
					oldValue = tmpObserved.revoke();
				}
			}

			//	publish changes
			ad = getAncestorInfo(this);
			if (ad.observers.length) {
				ad.path.push(key);
				changes = typeof oldValue === 'undefined'
					? [{type: INSERT, path: ad.path, value: value}]
					: [{type: UPDATE, path: ad.path, value: value, oldValue: oldValue}];
				callObservers(ad.observers, changes);
			}
			return true;
		}

		deleteProperty(target, key) {
			let oldValue = target[key], ad, changes;

			if (delete target[key]) {
				if (oldValue && typeof oldValue === 'object') {
					let tmpObserved = oldValue[sysObsKey];
					if (tmpObserved) {
						oldValue = tmpObserved.revoke();
					}
				}

				//	publish changes
				ad = getAncestorInfo(this);
				if (ad.observers.length) {
					ad.path.push(key);
					changes = [{type: DELETE, path: ad.path, oldValue: oldValue}];
					callObservers(ad.observers, changes);
				}
				return true;
			} else {
				return false;
			}
		}
	}

	class ObjectObserver {
		constructor(properties) {
			let origin = properties.target, clone = {};
			if (properties.parent === null) {
				this.isRevoked = false;
				this.observers = [];
				Object.defineProperties(clone, observableDefinition);
			} else {
				this.parent = properties.parent;
				this.ownKey = properties.ownKey;
			}
			prepareObject(origin, clone, this);
			this.revokable = Proxy.revocable(clone, this);
			this.proxy = this.revokable.proxy;
			this.target = clone;
		}

		//	returns an unobserved graph (effectively this is an opposite of an ObjectObserver constructor logic)
		revoke() {
			//	revoke native proxy
			this.revokable.revoke();

			//	roll back observed graph to an unobserved one
			let target = this.target, keys = Object.keys(target), l = keys.length, key, item;
			while (l--) {
				key = keys[l];
				item = target[key];
				if (item && typeof item === 'object') {
					let tmpObserved = item[sysObsKey];
					if (tmpObserved) {
						target[key] = tmpObserved.revoke();
					}
				}
			}
			return target;
		}

		set(target, key, value) {
			let oldValue = target[key], ad, changes;

			if (value && typeof value === 'object' && !nonObservables.hasOwnProperty(value.constructor.name)) {
				target[key] = Array.isArray(value)
					? new ArrayObserver({target: value, ownKey: key, parent: this}).proxy
					: new ObjectObserver({target: value, ownKey: key, parent: this}).proxy;
			} else {
				target[key] = value;
			}

			if (oldValue && typeof oldValue === 'object') {
				let tmpObserved = oldValue[sysObsKey];
				if (tmpObserved) {
					oldValue = tmpObserved.revoke();
				}
			}

			//	publish changes
			ad = getAncestorInfo(this);
			if (ad.observers.length) {
				ad.path.push(key);
				changes = typeof oldValue === 'undefined'
					? [{type: INSERT, path: ad.path, value: value}]
					: [{type: UPDATE, path: ad.path, value: value, oldValue: oldValue}];
				callObservers(ad.observers, changes);
			}
			return true;
		}

		deleteProperty(target, key) {
			let oldValue = target[key], ad, changes;

			if (delete target[key]) {
				if (oldValue && typeof oldValue === 'object') {
					let tmpObserved = oldValue[sysObsKey];
					if (tmpObserved) {
						oldValue = tmpObserved.revoke();
					}
				}

				//	publish changes
				ad = getAncestorInfo(this);
				if (ad.observers.length) {
					ad.path.push(key);
					changes = [{type: DELETE, path: ad.path, oldValue: oldValue}];
					callObservers(ad.observers, changes);
				}
				return true;
			} else {
				return false;
			}
		}
	}

	class Observable {
		constructor() {
			throw new Error('Observable MAY NOT be created via constructor, see "Observable.from" API');
		}

		static from(target) {
			if (target && typeof target === 'object' && !nonObservables.hasOwnProperty(target.constructor.name) && !('observe' in target) && !('unobserve' in target) && !('revoke' in target)) {
				let observed = Array.isArray(target)
					? new ArrayObserver({target: target, ownKey: null, parent: null})
					: new ObjectObserver({target: target, ownKey: null, parent: null});
				return observed.proxy;
			} else {
				if (!target || typeof target !== 'object') {
					throw new Error('observable MAY ONLY be created from non-null object only');
				} else if ('observe' in target || 'unobserve' in target || 'revoke' in target) {
					throw new Error('target object MUST NOT have nor own neither inherited properties from the following list: "observe", "unobserve", "revoke"');
				} else if (nonObservables.hasOwnProperty(target.constructor.name)) {
					throw new Error(target + ' found to be one of non-observable object types: ' + nonObservables);
				}
			}
		}

		static isObservable(input) {
			return typeof input === 'object' && input !== null &&
				typeof input.revoke === 'function' &&
				typeof input.observe === 'function' &&
				typeof input.unobserve === 'function';
		}
	}

	Object.freeze(Observable);
	Object.defineProperty(scope, 'Observable', {value: Observable});
})();
(() => {
	'use strict';

	console.warn('The usage of DataTier as a script is deprecated in favor of ES6-style module, see the relevant info on library\'s NPM/GitHib pages');

	(() => {
		let w = window, s = Symbol.for('data-tier');
		while (w.parent !== w) w = w.parent;
		if (w[s]) throw new Error('data-tier found to already being running within this application, cancelling current execution');
		else w[s] = true;
	})();

	const namespace = this || window,
		ties = {};

	function Tie(name, observable, options) {
		let data;

		function observer(changes) {
			namespace.DataTier.views.processChanges(name, changes);
		}

		if (options && typeof options === 'object') {
			//	TODO: process options
		}
		Reflect.defineProperty(this, 'name', {value: name});
		Reflect.defineProperty(this, 'data', {
			get: function() {
				return data;
			},
			set: function(input) {
				if (input !== data) {
					let oldData = data;
					data = ensureObservable(input);
					if (data) data.observe(observer);
					namespace.DataTier.views.processChanges(name, [{
						path: []
					}]);
					if (oldData) oldData.revoke();
				}
			}
		});

		ties[name] = this;
		this.data = observable;
		Object.seal(this);
	}

	function getTie(name) {
		return ties[name];
	}

	function create(name, input, options) {
		validateTieName(name);
		if (ties[name]) {
			throw new Error('existing tie (' + name + ') MAY NOT be re-created, use the tie\'s own APIs to reconfigure it');
		}
		return new Tie(name, ensureObservable(input), options);
	}

	function remove(name) {
		if (name && ties[name]) {
			ties[name].observable.revoke();
			delete ties[name];
		}
	}

	function validateTieName(name) {
		if (!name || typeof name !== 'string') {
			throw new Error('tie name MUST be a non-empty string');
		}
		if (/\W/.test(name)) {
			throw new Error('tie name MUST consist of alphanumerics or underlines ([a-zA-Z0-9_]) ONLY');
		}
	}

	function ensureObservable(o) {
		if (typeof o === 'undefined' || o === null) {
			return o;
		} else if (typeof o !== 'object') {
			throw new Error(o + ' is not of type Observable and not an object');
		} else if (typeof o.observe === 'function' && typeof o.unobserve === 'function' && typeof o.revoke === 'function') {
			return o;
		} else if (!namespace.Observable) {
			throw new Error(o + ' is not of type Observable and no embedded Observable implementation found');
		} else if (typeof o.observe === 'function' || typeof o.unobserve === 'function' || typeof o.revoke === 'function') {
			throw new Error(o + ' is not of type Observable and can not be transformed into Observable (some of its functions already implemented?)');
		} else {
			return namespace.Observable.from(o);
		}
	}

	Reflect.defineProperty(namespace, 'DataTier', {value: {}});
	Reflect.defineProperty(namespace.DataTier, 'ties', {
		value: {
			get get() {
				return getTie;
			},
			get create() {
				return create;
			},
			get remove() {
				return remove
			}
		}
	});
})();
(() => {
	'use strict';

	const namespace = this || window,
		controllers = {};

	function Controller(name, options) {
		Reflect.defineProperty(this, 'name', {value: name});
		Object.assign(this, options);
	}

	Controller.prototype.toData = defaultToData;
	Controller.prototype.parseParam = defaultParseParam;
	Controller.prototype.isChangedPathRelevant = defaultIsChangedPathRelevant;

	Reflect.defineProperty(Controller.prototype, 'parseParam', {value: defaultParseParam});
	Reflect.defineProperty(Controller.prototype, 'isChangedPathRelevant', {value: defaultIsChangedPathRelevant});

	function add(name, configuration) {
		if (typeof name !== 'string' || !name) {
			throw new Error('name MUST be a non-empty string');
		}
		if (controllers[name]) {
			throw new Error('data controller "' + name + '" already exists; you may want to reconfigure the existing one');
		}
		if (typeof configuration !== 'object' || !configuration) {
			throw new Error('configuration MUST be a non-null object');
		}
		if (typeof configuration.toView !== 'function') {
			throw new Error('configuration MUST have a "toView" function defined');
		}

		controllers[name] = new Controller(name, configuration);
		namespace.DataTier.views.applyController(controllers[name]);
	}

	function get(name) {
		return controllers[name];
	}

	function remove(name) {
		if (typeof name !== 'string' || !name) {
			throw new Error('controller name MUST be a non-empty string');
		}

		return delete controllers[name];
	}

	function getApplicable(element) {
		let result = [];
		if (element && element.dataset) {
			Object.keys(element.dataset)
				.filter(key => key in controllers)
				.map(key => controllers[key])
				.forEach(controller => result.push(controller));
		}
		return result;
	}

	function defaultToData(event) {
		setPath(event.data, event.path, event.view.value);
	}

	function defaultParseParam(param) {
		let tieName = '', dataPath = [];
		if (param) {
			dataPath = param.trim().split('.');
			tieName = dataPath.shift();
		}
		return {
			tieName: tieName,
			dataPath: dataPath
		};
	}

	function defaultIsChangedPathRelevant(changedPath, viewedPath) {
		return viewedPath.indexOf(changedPath) === 0;
	}

	function setPath(ref, path, value) {
		let i;
		if (!ref) return;
		for (i = 0; i < path.length - 1; i++) {
			ref = ref[path[i]] && typeof ref[path[i]] === 'object' ? ref[path[i]] : ref[path[i]] = {};
		}
		ref[path[i]] = value;
	}

	Reflect.defineProperty(namespace.DataTier, 'controllers', {
		value: {
			get get() { return get; },
			get add() { return add; },
			get remove() { return remove; },
			get getApplicable() { return getApplicable; }
		}
	});
})();
(() => {
	'use strict';

	const namespace = this || window;

	if (!namespace.DataTier) {
		throw new Error('data-tier framework was not properly initialized');
	}

	const ties = namespace.DataTier.ties,
		controllers = namespace.DataTier.controllers,
		views = {},
		nlvs = {};

	//	TODO: this is similar to setPath in controllers-service - unify
	function getPath(ref, path) {
		if (!ref) return;
		for (let i = 0, l = path.length, n; i < l; i++) {
			n = path[i];
			if (ref && ref.hasOwnProperty(n)) ref = ref[n];
			else return;
		}
		return ref;
	}

	function changeListener(event) {
		let target = event.target,
			relevantControllers = controllers.getApplicable(target),
			controller, controllerParam, tie, i;
		i = relevantControllers.length;
		while (i--) {
			controller = relevantControllers[i];
			if (event.type === controller.changeDOMEventType) {
				controllerParam = controller.parseParam(target.dataset[controller.name]);
				tie = ties.get(controllerParam.tieName);
				if (!controllerParam.dataPath) {
					console.error('path to data not available');
					return;
				}
				if (!tie) {
					console.error('tie "' + controllerParam.tieName + '" not found');
					return;
				}

				controller.toData({data: tie.data, path: controllerParam.dataPath, view: target});
			}
		}
	}

	function addChangeListener(view, changeDOMEventType) {
		view.addEventListener(changeDOMEventType, changeListener);
	}

	function delChangeListener(view, changeDOMEventType) {
		view.removeEventListener(changeDOMEventType, changeListener);
	}

	function add(elements) {
		if (!elements.length) elements = [elements];
		for (let i = 0, l = elements.length; i < l; i++) {
			let element = elements[i];
			if (element.nodeName === 'IFRAME') {
				initDocumentObserver(element.contentDocument);
				element.addEventListener('load', function() {
					initDocumentObserver(this.contentDocument);
					collect(this.contentDocument);
				});
				collect(element.contentDocument);
			} else if (Node.ELEMENT_NODE === element.nodeType) {
				if (element.localName.indexOf('-') < 0 && !element.hasAttribute('is')) {
					processAddedElement(element);
				} else {
					customElements.whenDefined(element.getAttribute('is') || element.localName).then(() => processAddedElement(element));
				}
			}
		}
	}

	function processAddedElement(element) {
		let ds = element.dataset, keys = Object.keys(ds), l = keys.length;
		while (l--) {
			let key = keys[l];
			if (key.indexOf('tie') !== 0) continue;

			let controller = controllers.get(key);
			if (controller) {
				let controllerParam = controller.parseParam(ds[controller.name]),
					pathString = controllerParam.dataPath.join('.');

				let tieViews = views[controllerParam.tieName] || (views[controllerParam.tieName] = {}),
					ctrlViews = tieViews[controller.name] || (tieViews[controller.name] = {}),
					pathViews = ctrlViews[pathString] || (ctrlViews[pathString] = []);

				if (pathViews.indexOf(element) < 0) {
					pathViews.push(element);
					update(element, controller.name);
					if (controller.changeDOMEventType) {
						addChangeListener(element, controller.changeDOMEventType);
					}
				}
			} else {
				//	collect potentially future controller's element and put them into some tracking storage
				if (!nlvs[key]) nlvs[key] = [];
				nlvs[key].push(element);
			}
		}
	}

	function update(view, controllerName) {
		let r, p, t, data;
		r = controllers.get(controllerName);
		p = r.parseParam(view.dataset[controllerName]);
		t = ties.get(p.tieName);
		if (t) {
			data = getPath(t.data, p.dataPath);
			r.toView(data, view);
		}
	}

	function collect(rootElement) {
		if (rootElement && (rootElement.nodeType === Node.DOCUMENT_NODE || rootElement.nodeType === Node.ELEMENT_NODE)) {
			let list;
			if (rootElement.nodeName === 'IFRAME') {
				list = rootElement.contentDocument.getElementsByTagName('*');
			} else {
				list = rootElement.getElementsByTagName('*');
			}

			add(rootElement);
			add(list);
		}
	}

	function discard(rootElement) {
		if (rootElement && rootElement.getElementsByTagName) {
			let list = rootElement.getElementsByTagName('*'),
				element, tmpCtrls, controller, i, l, i1,
				param, pathViews, index;
			for (i = 0, l = list.length; i <= l; i++) {
				element = i < l ? list[i] : rootElement;
				if (!element.dataset || !Object.keys(element.dataset).length) continue;
				tmpCtrls = controllers.getApplicable(element);
				i1 = tmpCtrls.length;
				while (i1--) {
					controller = tmpCtrls[i1];
					param = controller.parseParam(element.dataset[controller.name]);
					pathViews = views[param.tieName][controller.name][param.dataPath.join('.')];
					index = pathViews.indexOf(element);
					if (index >= 0) {
						pathViews.splice(index, 1);
						if (controller.changeDOMEventType) {
							delChangeListener(element, controller.changeDOMEventType);
						}
					}
				}
			}
		}
	}

	function move(view, controllerName, oldParam, newParam) {
		let controller;

		controller = controllers.get(controllerName);
		if (!controller) return;

		if (oldParam) {
			let controllerParam = controllers.get(controllerName).parseParam(oldParam);
			if (views[controllerParam.tieName] && views[controllerParam.tieName][controllerName]) {
				let pathViews = views[controllerParam.tieName][controllerName][controllerParam.dataPath], i = -1;
				if (pathViews) i = pathViews.indexOf(view);
				if (i >= 0) {
					pathViews.splice(i, 1);
				}
			}
		}

		if (newParam) {
			let controllerParam = controllers.get(controllerName).parseParam(newParam);
			if (!views[controllerParam.tieName]) views[controllerParam.tieName] = {};
			if (!views[controllerParam.tieName][controllerName]) views[controllerParam.tieName][controllerName] = {};
			if (!views[controllerParam.tieName][controllerName][controllerParam.dataPath]) views[controllerParam.tieName][controllerName][controllerParam.dataPath] = [];
			views[controllerParam.tieName][controllerName][controllerParam.dataPath].push(view);
			update(view, controllerName);
		}
	}

	function processChanges(tieName, changes) {
		let tieViews = views[tieName], change, changedPath,
			ctrlNames, ctrlName, controller, viewedPaths, viewedPath, ctrlViews, pathViews,
			i, i1, i2, i3;
		if (tieViews) {
			i = changes.length;
			while (i--) {
				change = changes[i];
				changedPath = change.path ? change.path.join('.') : null;
				ctrlNames = Object.keys(tieViews);
				i1 = ctrlNames.length;
				while (i1--) {
					ctrlName = ctrlNames[i1];
					ctrlViews = tieViews[ctrlName];
					if (ctrlViews) {
						controller = controllers.get(ctrlName);
						viewedPaths = Object.keys(ctrlViews);
						i2 = viewedPaths.length;
						while (i2--) {
							viewedPath = viewedPaths[i2];
							if (controller.isChangedPathRelevant(changedPath, viewedPath)) {
								pathViews = ctrlViews[viewedPath];
								i3 = pathViews.length;
								while (i3--) {
									update(pathViews[i3], ctrlName);
								}
							}
						}
					}
				}
			}
		}
	}

	function applyController(controller) {
		//	apply on a pending views
		if (nlvs[controller.name]) {
			nlvs[controller.name].forEach(add);
			delete nlvs[controller.name];
		}
	}

	function dataAttrToProp(v) {
		let i = 2, l = v.split('-'), r;
		r = l[1];
		while (i < l.length) r += l[i][0].toUpperCase() + l[i++].substr(1);
		return r;
	}

	function initDocumentObserver(document) {
		function processDomChanges(changes) {
			let i1, i2, i3,
				change, changeType,
				added, removed, node;
			i1 = changes.length;
			while (i1--) {
				change = changes[i1];
				changeType = change.type;
				if (changeType === 'attributes') {
					let node = change.target,
						attributeName = change.attributeName;
					if (node.nodeType !== Node.DOCUMENT_NODE && node.nodeType !== Node.ELEMENT_NODE) continue;
					if (attributeName.indexOf('data-tie') === 0) {
						move(node, dataAttrToProp(attributeName), change.oldValue, node.getAttribute(attributeName));
					} else if (attributeName === 'src' && node.nodeName === 'IFRAME') {
						discard(node.contentDocument);
					}
				} else if (changeType === 'childList') {
					//	process added nodes
					added = change.addedNodes;
					i2 = added.length;
					while (i2--) {
						node = added[i2];
						if (node.nodeType !== Node.DOCUMENT_NODE && node.nodeType !== Node.ELEMENT_NODE) continue;
						if (node.nodeName === 'IFRAME') {
							if (node.contentDocument) {
								initDocumentObserver(node.contentDocument);
								collect(node.contentDocument);
							}
							node.addEventListener('load', function() {
								initDocumentObserver(this.contentDocument);
								collect(this.contentDocument);
							});
						} else {
							collect(node);
						}
					}

					//	process removed nodes
					removed = change.removedNodes;
					i3 = removed.length;
					while (i3--) {
						node = removed[i3];
						if (node.nodeType !== Node.DOCUMENT_NODE && node.nodeType !== Node.ELEMENT_NODE) continue;
						if (node.nodeName === 'IFRAME') {
							discard(node.contentDocument);
						} else {
							discard(node);
						}
					}
				}
			}
		}

		let domObserver = new MutationObserver(processDomChanges);
		domObserver.observe(document, {
			childList: true,
			attributes: true,
			characterData: false,
			subtree: true,
			attributeOldValue: true,
			characterDataOldValue: false
		});
	}

	Reflect.defineProperty(namespace.DataTier, 'views', {
		value: {
			get processChanges() { return processChanges; },
			get applyController() { return applyController; },
			get updateView() { return update; }
		}
	});

	initDocumentObserver(document);
	collect(document);
})();
(() => {
	'use strict';

	const namespace = this || window,
		add = namespace.DataTier.controllers.add;

	add('tieProperty', {
		parseParam: function(param) {
			return this.constructor.prototype.parseParam(
				param ? param.split('=>').shift().trim() : null
			);
		},
		toView: (data, view) => {
			let propertyName = view.dataset.tieProperty.split('=>').pop().trim();
			view[propertyName] = data;
		}
	});

	add('tieValue', {
		toView: function(data, view) {
			if (view.type === 'checkbox') {
				view.checked = data;
			} else {
				view.value = typeof data !== 'undefined' && data !== null ? data : '';
			}
		},
		changeDOMEventType: 'change'
	});

	add('tieInput', {
		toView: function(data, view) {
			view.value = typeof data !== 'undefined' && data !== null ? data : '';
		},
		changeDOMEventType: 'input'
	});

	add('tieText', {
		toView: function(data, view) {
			view.textContent = typeof data !== 'undefined' && data !== null ? data : '';
		}
	});

	add('tiePlaceholder', {
		toView: function(data, view) {
			view.placeholder = typeof data !== 'undefined' && data !== null ? data : '';
		}
	});

	add('tieTooltip', {
		toView: function(data, view) {
			view.title = typeof data !== 'undefined' && data !== null ? data : '';
		}
	});

	add('tieSrc', {
		toView: function(data, view) {
			view.src = typeof data !== 'undefined' && data !== null ? data : '';
		}
	});

	add('tieHref', {
		toView: function(data, view) {
			view.href = typeof data !== 'undefined' && data !== null ? data : '';
		}
	});

	add('tieClasses', {
		isChangedPathRelevant: function(changedPath, viewedPath) {
			let subPath = changedPath.replace(viewedPath, '').split('.');
			return this.constructor.prototype.isChangedPathRelevant(changedPath, viewedPath) ||
				subPath.length === 1 ||
				(subPath.length === 2 && subPath[0] === '');
		},
		toView: function(data, view) {
			if (data && typeof data === 'object') {
				Object.keys(data).forEach(function(key) {
					if (data[key]) {
						view.classList.add(key);
					} else {
						view.classList.remove(key);
					}
				});
			}
		}
	});
})();
(() => {
	'use strict';

	const namespace = this || window,
		add = namespace.DataTier.controllers.add;

	//	deprecated
	add('tieDateValue', {
		toView: function(data, view) {
			view.value = typeof data !== 'undefined' && data !== null ? data.toLocaleString() : '';
		}
	});

	//	deprecated
	add('tieDateText', {
		toView: function(data, view) {
			view.textContent = typeof data !== 'undefined' && data !== null ? data.toLocaleString() : '';
		}
	});

	add('tieDatetimeText', new DateTimeTextController());

	add('tieDatetimeValue', new DateTimeValueController());

	function DateTimeTextController(visualizationProperty) {
		let visProp = visualizationProperty || 'textContent';

		this.format = 'dd/MM/yyyy hh:mm:ss';

		this.toView = function(data, view) {
			let formattedDate = data;
			if (!data) {
				formattedDate = '';
			} else if (data instanceof Date) {
				formattedDate = formatDate(data, this.format);
			} else {
				try {
					let tmpDate = new Date(data);
					if (tmpDate instanceof Date) {
						formattedDate = formatDate(tmpDate, this.format);
					}
				} catch (e) {
					console.error('failed to parse "' + data + '" as date', e);
				}
			}
			view[visProp] = formattedDate;
		};
	}

	function DateTimeValueController() {
		DateTimeTextController.call(this, 'value');

		this.toData = function(changeEvent) {
			console.warn('yet to be implemented, react on ' + changeEvent);
		};
	}

	DateTimeValueController.prototype = Object.create(DateTimeTextController.prototype);
	DateTimeValueController.prototype.constructor = DateTimeValueController;

	let supportedTokens = {
		d: function(date, len) { return date.getDate().toString().padStart(len, '0'); },
		M: function(date, len) { return (date.getMonth() + 1).toString().padStart(len, '0'); },
		y: function(date, len) {
			let tmpY = date.getFullYear().toString();
			if (tmpY.length > len) return tmpY.substr(tmpY.length - len);
			else return tmpY.padStart(len, '0');
		},
		h: function(date, len) { return date.getHours().toString().padStart(len, '0'); },
		m: function(date, len) { return date.getMinutes().toString().padStart(len, '0'); },
		s: function(date, len) { return date.getSeconds().toString().padStart(len, '0'); },
		f: function(date, len) { return date.getMilliseconds().toString().padStart(len, '0'); }
	};

	function formatDate(date, format) {
		let result = '';
		if (!format) {
			result = date.toLocaleString();
		} else {
			let char, cnt;
			for (let i = 0, l = format.length; i < l; i++) {
				char = format.charAt(i);
				if (supportedTokens[char]) {
					cnt = 1;
					while (i < l - 1 && format.charAt(i + 1) === char) {
						cnt++;
						i++;
					}
					result += supportedTokens[char](date, cnt);
				} else {
					result += char;
				}
			}
		}
		return result;
	}
})();
(() => {
	'use strict';

	const namespace = this || window,
		add = namespace.DataTier.controllers.add,
		viewsService = namespace.DataTier.views;

	function extractControllerParameters(paramValue) {
		let procParam;
		if (paramValue) {
			procParam = paramValue.trim().split(/\s+/);
			if (!procParam || procParam.length !== 3 || procParam[1] !== '=>') {
				throw new Error('invalid parameter for "tieList" rule specified');
			}
		}
		return procParam;
	}

	function prepareOptimizationMap(template, itemId) {
		let result = {index: []},
			views = template.content.querySelectorAll('*'),
			i = views.length, view, keys, i1, key, value, relevantKeys;
		while (i--) {
			view = views[i];
			if (view.nodeType !== Node.DOCUMENT_NODE && view.nodeType !== Node.ELEMENT_NODE) continue;
			keys = Object.keys(view.dataset);
			i1 = keys.length;
			relevantKeys = [];
			while (i1--) {
				key = keys[i1];
				value = view.dataset[key];
				if (key.startsWith('tie') && value.startsWith(itemId)) {
					relevantKeys.push([key, value.replace(itemId, '')]);
				}
			}
			if (relevantKeys.length) {
				result[i] = relevantKeys;
				result.index.push(i);
			}
		}
		return result;
	}

	function insertNewContent(container, template, controllerParameters, from, to) {
		let result = null, optimizationMap, tmpContent, tmpTemplate, index = from, i, i1, tmp,
			prefix = controllerParameters[0] + '.', optTmpIdx,
			views, view,
			pairs, key;
		tmpContent = template.content;
		optimizationMap = prepareOptimizationMap(template, controllerParameters[2]);
		optTmpIdx = optimizationMap.index;

		for (; index < to; index++) {
			tmpTemplate = tmpContent.cloneNode(true);
			views = tmpTemplate.querySelectorAll('*');
			i = optTmpIdx.length;
			while (i--) {
				tmp = optTmpIdx[i];
				view = views[tmp];
				pairs = optimizationMap[tmp];
				i1 = pairs.length;
				while (i1--) {
					key = pairs[i1][0];
					view.dataset[key] = prefix + index + pairs[i1][1];
				}
			}
			index === from ? result = tmpTemplate : result.appendChild(tmpTemplate);
		}

		container.appendChild(result);
	}

	function updateExistingContent(template, container, required) {
		let allBluePrintElements = template.content.querySelectorAll('*'),
			tieProcsMap = [], i;
		i = allBluePrintElements.length;
		while (i--) {
			tieProcsMap[i] = Object.keys(allBluePrintElements[i].dataset).filter(key => key.startsWith('tie'));
		}

		let done = 0, i1, i2, child,
			descendants, descendant,
			keys;
		i = 0;
		while (done < required) {
			child = container.childNodes[i++];
			if (child !== template && (child.nodeType === Node.DOCUMENT_NODE || child.nodeType === Node.ELEMENT_NODE) && child.dataset.dtListItemAid) {
				descendants = child.querySelectorAll('*');
				i1 = tieProcsMap.length;
				while (i1--) {
					descendant = i1 ? descendants[i1 - 1] : child;
					keys = tieProcsMap[i1];
					i2 = keys.length;
					while (i2--) {
						viewsService.updateView(descendant, keys[i2]);
					}
				}
				done++;
			}
		}
	}

	add('tieList', {
		parseParam: function(ruleValue) {
			return this.constructor.prototype.parseParam(ruleValue.split(/\s*=>\s*/)[0]);
		},
		isChangedPathRelevant: function(changedPath, viewedPath) {
			if (!changedPath) return true;

			let subPath = changedPath.replace(viewedPath, '').split('.');
			return this.constructor.prototype.isChangedPathRelevant(changedPath, viewedPath) ||
				subPath.length === 1 ||
				(subPath.length === 2 && subPath[0] === '');
		},
		toView: function(tiedValue, template) {
			if (!Array.isArray(tiedValue) || !template) return;

			let container = template.parentNode, ruleData,
				fceDataSet,
				templateItemAid,
				desiredListLength = tiedValue.length;

			if (template.nodeName !== 'TEMPLATE') {
				throw new Error('tieList may be defined on template elements only');
			}
			if (template.content.childElementCount !== 1) {
				throw new Error('tieList\'s TEMPLATE element MUST HAVE exactly one direct child element');
			}

			fceDataSet = template.content.firstElementChild.dataset;
			templateItemAid = fceDataSet.dtListItemAid;
			if (!templateItemAid) {
				templateItemAid = new Date().getTime();
				fceDataSet.dtListItemAid = templateItemAid;
			}

			//	adjust list elements size to the data length
			let existingList = container.querySelectorAll('[data-dt-list-item-aid="' + templateItemAid + '"]'),
				existingListLength = existingList.length;

			if (existingListLength > desiredListLength) {
				while (existingListLength > desiredListLength) container.removeChild(existingList[--existingListLength]);
			}

			//	run update on the whole list (in future attempt to get the change's content and optimize this one)
			updateExistingContent(template, container, existingListLength);

			if (existingListLength < desiredListLength) {
				ruleData = extractControllerParameters(template.dataset.tieList);
				insertNewContent(container, template, ruleData, existingListLength, desiredListLength);
			}
		}
	});
})();
