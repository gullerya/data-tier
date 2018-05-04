(() => {
	'use strict';

	const scope = this || window,
		proxiesToTargetsMap = new Map(),
		targetsToObserved = new Map(),
		observedToObservable = new Map(),
		nonObservables = ['Date', 'Blob', 'Number', 'String', 'Boolean', 'Error', 'SyntaxError', 'TypeError', 'URIError', 'Function', 'Promise', 'RegExp'];

	function copyShallow(target) {
		return Array.isArray(target) ?
			target.slice() :
			Object.assign({}, target);
	}

	function isNonObservable(target) {
		return nonObservables.indexOf(target.constructor.name) >= 0;
	}

	function proxiedArrayGet(target, key) {
		let result,
			observed = targetsToObserved.get(target),
			observable = observedToObservable.get(observed.root);
		if (key === 'pop') {
			result = function proxiedPop() {
				let poppedIndex, popResult, tmpTarget, changes;
				poppedIndex = target.length - 1;
				popResult = Reflect.apply(target[key], target, arguments);
				tmpTarget = proxiesToTargetsMap.get(popResult);
				if (tmpTarget) {
					targetsToObserved.get(tmpTarget).revoke();
				}
				changes = [new DeleteChange(observed.path.concat(poppedIndex), tmpTarget || popResult)];
				observable.notify(changes);
				return tmpTarget || popResult;
			};
		} else if (key === 'push') {
			result = function proxiedPush() {
				let pushContent, pushResult, changes = [], startingLength;
				pushContent = Array.from(arguments);
				startingLength = target.length;
				for (let i = 0, l = pushContent.length, item; i < l; i++) {
					item = pushContent[i];
					if (item && typeof item === 'object') {
						pushContent[i] = new Observed(item, startingLength + i, observed).proxy;
					}
					changes.push(new InsertChange(observed.path.concat(startingLength + i), item));
				}
				pushResult = Reflect.apply(target[key], target, pushContent);
				observable.notify(changes);
				return pushResult;
			};
		} else if (key === 'shift') {
			result = function proxiedShift() {
				let shiftResult, changes, tmpTarget;
				shiftResult = Reflect.apply(target[key], target, arguments);
				tmpTarget = proxiesToTargetsMap.get(shiftResult);
				if (tmpTarget) {
					targetsToObserved.get(tmpTarget).revoke();
				}

				//	update indices of the remaining items
				for (let i = 0, l = target.length, item, tmpObserved; i < l; i++) {
					item = target[i];
					if (item && typeof item === 'object') {
						tmpObserved = targetsToObserved.get(proxiesToTargetsMap.get(item));
						if (tmpObserved) {
							tmpObserved.ownKey = i;
						} else {
							console.error('unexpectedly failed to resolve proxy -> target -> observed');
						}
					}
				}
				changes = [new DeleteChange(observed.path.concat(0), tmpTarget || shiftResult)];
				observable.notify(changes);
				return tmpTarget || shiftResult;
			};
		} else if (key === 'unshift') {
			result = function proxiedUnshift() {
				let unshiftContent, unshiftResult, changes = [], tmpObserved;
				unshiftContent = Array.from(arguments);
				unshiftContent.forEach(function(item, index) {
					if (item && typeof item === 'object') {
						unshiftContent[index] = new Observed(item, index, observed).proxy;
					}
				});
				unshiftResult = Reflect.apply(target[key], target, unshiftContent);
				for (let i = 0, l = target.length, item; i < l; i++) {
					item = target[i];
					if (item && typeof item === 'object') {
						tmpObserved = targetsToObserved.get(proxiesToTargetsMap.get(item));
						if (tmpObserved) {
							tmpObserved.ownKey = i;
						} else {
							console.error('failed to resolve proxy -> target -> observed');
						}
					}
				}
				for (let i = 0, l = unshiftContent.length; i < l; i++) {
					changes.push(new InsertChange(observed.path.concat(i), target[i]));
				}
				observable.notify(changes);
				return unshiftResult;
			};
		} else if (key === 'reverse') {
			result = function proxiedReverse() {
				let changes, tmpObserved;
				Reflect.apply(target[key], target, arguments);
				for (let i = 0, l = target.length, item; i < l; i++) {
					item = target[i];
					if (item && typeof item === 'object') {
						tmpObserved = targetsToObserved.get(proxiesToTargetsMap.get(item));
						if (tmpObserved) {
							tmpObserved.ownKey = i;
						} else {
							console.error('failed to resolve proxy -> target -> observed');
						}
					}
				}
				changes = [new ReverseChange()];
				observable.notify(changes);
				return this;
			};
		} else if (key === 'sort') {
			result = function proxiedSort() {
				let changes, tmpObserved;
				Reflect.apply(target[key], target, arguments);
				for (let i = 0, l = target.length, item; i < l; i++) {
					item = target[i];
					if (item && typeof item === 'object') {
						tmpObserved = targetsToObserved.get(proxiesToTargetsMap.get(item));
						if (tmpObserved) {
							tmpObserved.ownKey = i;
						} else {
							console.error('failed to resolve proxy -> target -> observed');
						}
					}
				}
				changes = [new ShuffleChange()];
				observable.notify(changes);
				return this;
			};
		} else if (key === 'fill') {
			result = function proxiedFill() {
				let start, end, changes = [], prev, argLen = arguments.length, tarLen = target.length;
				start = argLen < 2 ? 0 : (arguments[1] < 0 ? tarLen + arguments[1] : arguments[1]);
				end = argLen < 3 ? tarLen : (arguments[2] < 0 ? tarLen + arguments[2] : arguments[2]);
				prev = target.slice();
				Reflect.apply(target[key], target, arguments);
				for (let i = start, item, tmpTarget; i < end; i++) {
					item = target[i];
					if (item && typeof item === 'object') {
						target[i] = new Observed(item, i, observed).proxy;
					}
					if (prev.hasOwnProperty(i)) {
						tmpTarget = proxiesToTargetsMap.get(prev[i]);
						if (tmpTarget) {
							targetsToObserved.get(tmpTarget).revoke();
						}

						changes.push(new UpdateChange(observed.path.concat(i), target[i], tmpTarget || prev[i]));
					} else {
						changes.push(new InsertChange(observed.path.concat(i), target[i]));
					}
				}
				observable.notify(changes);
				return this;
			};
		} else if (key === 'splice') {
			result = function proxiedSplice() {
				let spliceContent, spliceResult, changes = [], tmpObserved,
					startIndex, removed, inserted, splLen, tarLen = target.length;

				spliceContent = Array.from(arguments);
				splLen = spliceContent.length;

				//	observify the newcomers
				for (let i = 0, item; i < splLen; i++) {
					item = spliceContent[i];
					if (i > 1 && item && typeof item === 'object') {
						spliceContent[i] = new Observed(item, i, observed).proxy;
					}
				}

				//	calculate pointers
				startIndex = splLen === 0 ? 0 : (spliceContent[0] < 0 ? tarLen + spliceContent[0] : spliceContent[0]);
				removed = splLen < 2 ? tarLen - startIndex : spliceContent[1];
				inserted = Math.max(splLen - 2, 0);
				spliceResult = Reflect.apply(target[key], target, spliceContent);

				//	reindex the paths
				for (let i = 0, item; i < tarLen; i++) {
					item = target[i];
					if (item && typeof item === 'object') {
						tmpObserved = targetsToObserved.get(proxiesToTargetsMap.get(item));
						if (tmpObserved) {
							tmpObserved.ownKey = i;
						} else {
							console.error('failed to resolve proxy -> target -> observed');
						}
					}
				}

				//	revoke removed Observed
				for (let i = 0, l = spliceResult.length, item, tmpTarget; i < l; i++) {
					item = spliceResult[i];
					tmpTarget = proxiesToTargetsMap.get(item);
					if (tmpTarget) {
						targetsToObserved.get(tmpTarget).revoke();
						spliceResult[i] = tmpTarget;
					}
				}

				//	publish changes
				let index;
				for (index = 0; index < removed; index++) {
					if (index < inserted) {
						changes.push(new UpdateChange(observed.path.concat(startIndex + index), target[startIndex + index], spliceResult[index]));
					} else {
						changes.push(new DeleteChange(observed.path.concat(startIndex + index), spliceResult[index]));
					}
				}
				for (; index < inserted; index++) {
					changes.push(new InsertChange(observed.path.concat(startIndex + index), target[startIndex + index]));
				}
				observable.notify(changes);

				return spliceResult;
			};
		} else {
			result = Reflect.get(target, key);
		}
		return result;
	}

	function proxiedSet(target, key, value) {
		let oldValuePresent = target.hasOwnProperty(key),
			oldValue = target[key],
			result,
			oldTarget,
			observed = targetsToObserved.get(target),
			observable = observedToObservable.get(observed.root);

		if (value && typeof value === 'object' && !isNonObservable(value)) {
			result = Reflect.set(target, key, new Observed(value, key, observed).proxy);
		} else {
			result = Reflect.set(target, key, value);
		}

		if (result) {
			oldTarget = proxiesToTargetsMap.get(oldValue);
			if (oldTarget) {
				targetsToObserved.get(oldTarget).revoke();
			}

			if (observable.hasListeners) {
				let path = observed.path.concat(key),
					changes = [oldValuePresent ? new UpdateChange(path, value, oldTarget || oldValue) : new InsertChange(path, value)];
				if (!observed.preventCallbacks) {
					observable.notify(changes);
				}
			}
		}
		return result;
	}

	function proxiedDelete(target, key) {
		let oldValue = target[key],
			result,
			oldTarget,
			observed = targetsToObserved.get(target),
			observable = observedToObservable.get(observed.root);

		result = Reflect.deleteProperty(target, key);

		if (result) {
			oldTarget = proxiesToTargetsMap.get(oldValue);
			if (oldTarget) {
				targetsToObserved.get(oldTarget).revoke();
			}

			if (observable.hasListeners) {
				let path = observed.path.concat(key),
					changes = [new DeleteChange(path, oldTarget || oldValue)];
				if (!observed.preventCallbacks) {
					observable.notify(changes);
				}
			}
		}
		return result;
	}

	function processArraySubgraph(graph, parentObserved) {
		for (let i = 0, l = graph.length, item; i < l; i++) {
			item = graph[i];
			if (item && typeof item === 'object' && !isNonObservable(item)) {
				graph[i] = new Observed(item, i, parentObserved).proxy;
			}
		}
	}

	function processObjectSubgraph(graph, parentObserved) {
		let keys = Object.keys(graph);
		for (let i = 0, l = keys.length, key, item; i < l; i++) {
			key = keys[i];
			item = graph[key];
			if (item && typeof item === 'object' && !isNonObservable(item)) {
				graph[key] = new Observed(item, key, parentObserved).proxy;
			}
		}
	}

	//	CLASSES

	function Observed(origin, ownKey, parent) {
		let targetClone, revokable, proxy;

		if (!origin || typeof origin !== 'object') {
			throw new Error('Observed MUST be created from a non null object origin');
		}
		if (parent && (typeof ownKey === 'undefined' || ownKey === null)) {
			throw new Error('any non-root (parent-less) Observed MUST have an own path; now parent is ' + parent + '; key is ' + ownKey);
		}
		if (parent && !(parent instanceof Observed)) {
			throw new Error('parent, when supplied, MUST be an instance of Observed');
		}

		targetClone = copyShallow(origin);

		if (Array.isArray(targetClone)) {
			processArraySubgraph(targetClone, this);
			revokable = Proxy.revocable(targetClone, {
				set: proxiedSet,
				get: proxiedArrayGet,
				deleteProperty: proxiedDelete
			});
		} else {
			processObjectSubgraph(targetClone, this);
			revokable = Proxy.revocable(targetClone, {
				set: proxiedSet,
				deleteProperty: proxiedDelete
			});
		}
		proxy = revokable.proxy;

		targetsToObserved.set(targetClone, this);
		proxiesToTargetsMap.set(proxy, targetClone);
		Object.defineProperties(this, {
			revokable: {value: revokable},
			proxy: {value: proxy},
			parent: {value: parent},
			ownKey: {value: ownKey, writable: true}
		});
	}

	Object.defineProperty(Observed.prototype, 'root', {
		get: function() {
			let result = this;
			while (result.parent) {
				result = result.parent;
			}
			return result;
		}
	});
	Object.defineProperty(Observed.prototype, 'path', {
		get: function() {
			let result = [], pointer = this;
			while (typeof pointer.ownKey !== 'undefined') {
				result.unshift(pointer.ownKey);
				pointer = pointer.parent;
			}
			return result;
		}
	});
	Object.defineProperty(Observed.prototype, 'revoke', {
		value: function() {
			let target = proxiesToTargetsMap.get(this.proxy),
				keys = Object.keys(target);

			//	revoke native proxy
			this.revokable.revoke();

			//	roll back observed graph to unobserved one
			for (let i = 0, l = keys.length, key, tmpTarget; i < l; i++) {
				key = keys[i];
				tmpTarget = proxiesToTargetsMap.get(target[key]);
				if (tmpTarget) {
					target[key] = targetsToObserved.get(tmpTarget).revoke();
				}
			}

			//	clean revoked Observed from the maps
			proxiesToTargetsMap.delete(this.proxy);
			targetsToObserved.delete(target);

			//	return an unobserved graph (effectively this is an opposite of an Observed constructor logic)
			return target;
		}
	});

	function Observable(observed) {
		let isRevoked = false, callbacks = [];

		function observe(callback) {
			if (isRevoked) { throw new TypeError('revoked Observable MAY NOT be observed anymore'); }
			if (typeof callback !== 'function') { throw new Error('observer (callback) parameter MUST be a function'); }

			if (callbacks.indexOf(callback) < 0) {
				callbacks.push(callback);
			} else {
				console.info('observer (callback) may be bound to an observable only once');
			}
		}

		function unobserve() {
			if (isRevoked) { throw new TypeError('revoked Observable MAY NOT be unobserved anymore'); }
			if (arguments.length) {
				for (let i = 0, l = arguments.length, idx; i < l; i++) {
					idx = callbacks.indexOf(arguments[i]);
					if (idx >= 0) callbacks.splice(idx, 1);
				}
			} else {
				callbacks.splice(0, callbacks.length);
			}
		}

		function revoke() {
			if (!isRevoked) {
				isRevoked = true;
				observed.revoke();
			} else {
				console.log('revoking of Observable effective only once');
			}
		}

		function hasListeners() {
			return callbacks.length > 0;
		}

		function notify(changes) {
			for (let i = 0, l = callbacks.length, callback; i < l; i++) {
				callback = callbacks[i];
				try {
					callback(changes);
				} catch (e) {
					console.error('one/some of the observing callbacks failed with ', e);
				}
			}
		}

		Object.defineProperties(observed.proxy, {
			observe: {value: observe},
			unobserve: {value: unobserve},
			revoke: {value: revoke}
		});

		Object.defineProperties(this, {
			hasListeners: {value: hasListeners},
			notify: {value: notify}
		});
	}

	function InsertChange(path, value) {
		Object.defineProperties(this, {
			type: {value: 'insert'},
			path: {value: path},
			value: {value: value}
		});
	}

	function UpdateChange(path, value, oldValue) {
		Object.defineProperties(this, {
			type: {value: 'update'},
			path: {value: path},
			value: {value: value},
			oldValue: {value: oldValue}
		});
	}

	function DeleteChange(path, oldValue) {
		Object.defineProperties(this, {
			type: {value: 'delete'},
			path: {value: path},
			oldValue: {value: oldValue}
		});
	}

	function ReverseChange() {
		Object.defineProperties(this, {
			type: {value: 'reverse'}
		});
	}

	function ShuffleChange() {
		Object.defineProperties(this, {
			type: {value: 'shuffle'}
		});
	}

	Object.defineProperty(Observable, 'from', {
		value: function(target) {
			if (!target || typeof target !== 'object') {
				throw new Error('observable MAY ONLY be created from non-null object only');
			} else if ('observe' in target || 'unobserve' in target || 'revoke' in target) {
				throw new Error('target object MUST NOT have nor own neither inherited properties from the following list: "observe", "unobserve", "revoke"');
			} else if (isNonObservable(target)) {
				throw new Error(target + ' found to be one of non-observable object types: ' + nonObservables);
			}
			let observed = new Observed(target),
				observable = new Observable(observed);
			observedToObservable.set(observed, observable);
			return observed.proxy;
		}
	});

	Object.defineProperty(scope, 'Observable', {value: Observable});
})();
﻿(() => {
	'use strict';

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
				let oldData = data,
					newData = ensureObservable(input);
				if (data) data.revoke();
				data = newData;
				if (data) data.observe(observer);
				namespace.DataTier.views.processChanges(name, [{
					type: 'update',
					value: data,
					oldValue: oldData,
					path: []
				}]);
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
﻿(() => {
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
		return viewedPath.startsWith(changedPath);
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
﻿(() => {
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
		for (let i = 0, pathLength = path.length; i < pathLength; i++) {
			if (ref && path[i] in ref) ref = ref[path[i]];
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

	function add(view) {
		let localCustomElementName;
		if (view.nodeName === 'IFRAME') {
			initDocumentObserver(view.contentDocument);
			view.addEventListener('load', function() {
				initDocumentObserver(this.contentDocument);
				collect(this.contentDocument);
			});
			collect(view.contentDocument);
		} else if (Node.ELEMENT_NODE === view.nodeType && (localCustomElementName = getLocalNameIfCustomElement(view))) {
			customElements.whenDefined(localCustomElementName).then(() => processAddedView(view));
		} else if (view.dataset) {
			processAddedView(view);
		}
	}

	function getLocalNameIfCustomElement(view) {
		let result;
		if (view.localName.includes('-')) {
			result = view.localName;
		} else if (!(result = view.getAttribute('is')) || !result.includes('-')) {
			result = null;
		}
		return result;
	}

	function processAddedView(view) {
		let keys = Object.keys(view.dataset), key,
			controller, controllerParam, pathString,
			tieViews, procViews, pathViews, i;
		i = keys.length;
		while (i--) {
			key = keys[i];
			if (!key.startsWith('tie')) continue;
			controller = controllers.get(key);
			if (controller) {
				controllerParam = controller.parseParam(view.dataset[controller.name]);
				pathString = controllerParam.dataPath.join('.');
				tieViews = views[controllerParam.tieName] || (views[controllerParam.tieName] = {});
				procViews = tieViews[controller.name] || (tieViews[controller.name] = {});
				pathViews = procViews[pathString] || (procViews[pathString] = []);

				if (pathViews.indexOf(view) < 0) {
					pathViews.push(view);
					update(view, controller.name);
					if (controller.changeDOMEventType) {
						addChangeListener(view, controller.changeDOMEventType);
					}
				}
			} else {
				//	collect potentially future controller's element and put them into some tracking storage
				if (!nlvs[key]) nlvs[key] = [];
				nlvs[key].push(view);
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
			let list, i;
			if (rootElement.nodeName === 'IFRAME') {
				list = rootElement.contentDocument.getElementsByTagName('*');
			} else {
				list = rootElement.getElementsByTagName('*');
			}

			add(rootElement);
			i = list.length;
			while (i--) add(list[i]);
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
﻿(() => {
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
﻿(() => {
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
				if (key.startsWith('tie') && value.startsWith(itemId))
					relevantKeys.push([key, value.replace(itemId, '')]);
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
