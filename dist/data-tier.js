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
			Object.assign(new target.constructor(), target);
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
				let poppedIndex, popResult, changes;
				poppedIndex = target.length - 1;
				popResult = Reflect.apply(target[key], target, arguments);
				if (popResult && typeof popResult === 'object') {
					popResult = proxiesToTargetsMap.get(popResult);
					targetsToObserved.get(popResult).revoke();
				}
				changes = [new DeleteChange(observed.path.concat(poppedIndex), popResult)];
				observable.notify(changes);
				return popResult;
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
				let shiftResult, changes, tmpObserved;
				shiftResult = Reflect.apply(target[key], target, arguments);
				if (shiftResult && typeof shiftResult === 'object') {
					shiftResult = proxiesToTargetsMap.get(shiftResult);
					targetsToObserved.get(shiftResult).revoke();
				}
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
				changes = [new DeleteChange(observed.path.concat(0), shiftResult)];
				observable.notify(changes);
				return shiftResult;
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
				for (let i = start, item; i < end; i++) {
					item = target[i];
					if (item && typeof item === 'object') {
						target[i] = new Observed(item, i, observed).proxy;
					}
					if (prev.hasOwnProperty(i)) {
						changes.push(new UpdateChange(observed.path.concat(i), target[i], prev[i] && typeof prev[i] === 'object' ? proxiesToTargetsMap.get(prev[i]) : prev[i]));
						if (prev[i] && typeof prev[i] === 'object') {
							targetsToObserved.get(proxiesToTargetsMap.get(prev[i])).revoke();
						}
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
					index, startIndex, removed, inserted, splLen, tarLen = target.length;

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
				for (let i = 0, l = spliceResult.length, item; i < l; i++) {
					item = spliceResult[i];
					if (removed && typeof removed === 'object') {
						item = proxiesToTargetsMap.get(removed);
						targetsToObserved.get(item).revoke();
					}
				}

				//	publish changes
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
			observed = targetsToObserved.get(target),
			observable = observedToObservable.get(observed.root);

		if (value && typeof value === 'object' && !isNonObservable(value)) {
			result = Reflect.set(target, key, new Observed(value, key, observed).proxy);
		} else {
			result = Reflect.set(target, key, value);
		}

		if (result) {
			if (proxiesToTargetsMap.has(oldValue)) {
				targetsToObserved.get(proxiesToTargetsMap.get(oldValue)).revoke();
				proxiesToTargetsMap.delete(oldValue);
			}

			if (observable.hasListeners) {
				let path = observed.path.concat(key),
					changes = [oldValuePresent ? new UpdateChange(path, value, oldValue) : new InsertChange(path, value)];
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
			observed = targetsToObserved.get(target),
			observable = observedToObservable.get(observed.root);

		result = Reflect.deleteProperty(target, key);

		if (result) {
			if (proxiesToTargetsMap.has(oldValue)) {
				targetsToObserved.get(proxiesToTargetsMap.get(oldValue)).revoke();
				proxiesToTargetsMap.delete(oldValue);
			}

			if (observable.hasListeners) {
				let path = observed.path.concat(key),
					changes = [new DeleteChange(path, oldValue)];
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

	function Observed(origin, ownKey, parent) {
		let targetClone, revokableProxy;

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
			revokableProxy = Proxy.revocable(targetClone, {
				set: proxiedSet,
				get: proxiedArrayGet,
				deleteProperty: proxiedDelete
			});
		} else {
			processObjectSubgraph(targetClone, this);
			revokableProxy = Proxy.revocable(targetClone, {
				set: proxiedSet,
				deleteProperty: proxiedDelete
			});
		}

		targetsToObserved.set(targetClone, this);
		proxiesToTargetsMap.set(revokableProxy.proxy, targetClone);
		Object.defineProperties(this, {
			revokable: {value: revokableProxy},
			proxy: {value: revokableProxy.proxy},
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
				result.push(pointer.ownKey);
				pointer = pointer.parent;
			}
			return result.reverse();
		}
	});
	Object.defineProperty(Observed.prototype, 'revoke', {
		value: function() {
			let proxy = this.proxy,
				keys = Object.keys(proxy);
			for (let i = 0, l = keys.length, key, item; i < l; i++) {
				key = keys[i];
				item = proxy[key];
				if (proxiesToTargetsMap.has(item)) {
					targetsToObserved.get(proxiesToTargetsMap.get(item)).revoke();
					proxiesToTargetsMap.get(proxy)[key] = proxiesToTargetsMap.get(item);
				}
			}
			this.revokable.revoke();
			//	TODO: ensure if there are any other cleanups to do here (probably remove observed?)
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
			if (isRevoked) { throw new TypeError('revoked Observable MAY NOT be unobserved amymore'); }
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
				console.log('revokation of Observable have an effect only once');
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
					console.error(e);
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
		processors = {};

	if (!namespace.DataTier) {
		throw new Error('data-tier framework was not properly initialized');
	}

	function DataProcessor(name, options) {
		Reflect.defineProperty(this, 'name', {value: name});
		Reflect.defineProperty(this, 'toView', {value: options.toView});
		Reflect.defineProperty(this, 'toData', {value: typeof options.toData === 'function' ? options.toData : defaultToData});
		Reflect.defineProperty(this, 'changeDOMEventType', {value: typeof options.changeDOMEventType === 'string' ? options.changeDOMEventType : null});
		Reflect.defineProperty(this, 'parseParam', {value: typeof options.parseParam === 'function' ? options.parseParam : defaultParseParam});
		Reflect.defineProperty(this, 'isChangedPathRelevant', {value: typeof options.isChangedPathRelevant === 'function' ? options.isChangedPathRelevant : defaultIsChangedPathRelevant});
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

	Reflect.defineProperty(DataProcessor.prototype, 'parseParam', {value: defaultParseParam});
	Reflect.defineProperty(DataProcessor.prototype, 'isChangedPathRelevant', {value: defaultIsChangedPathRelevant});

	function add(name, configuration) {
		if (typeof name !== 'string' || !name) {
			throw new Error('name MUST be a non-empty string');
		}
		if (processors[name]) {
			throw new Error('data processor "' + name + '" already exists; you may want to reconfigure the existing one');
		}
		if (typeof configuration !== 'object' || !configuration) {
			throw new Error('configuration MUST be a non-null object');
		}
		if (typeof configuration.toView !== 'function') {
			throw new Error('configuration MUST have a "toView" function defined');
		}

		processors[name] = new DataProcessor(name, configuration);
		namespace.DataTier.views.applyProcessor(processors[name]);
	}

	function get(name) {
		return processors[name];
	}

	function remove(name) {
		if (typeof name !== 'string' || !name) {
			throw new Error('controller name MUST be a non-empty string');
		}

		return delete processors[name];
	}

	function getApplicable(element) {
		let result = [];
		if (element && element.dataset) {
			Object.keys(element.dataset)
				.filter(key => key in processors)
				.map(key => processors[key])
				.forEach(processor => result.push(processor));
		}
		return result;
	}

	function defaultToData(event) {
		setPath(event.data, event.path, event.view.value);
	}

	function setPath(ref, path, value) {
		let i;
		if (!ref) return;
		for (i = 0; i < path.length - 1; i++) {
			ref = ref[path[i]] && typeof ref[path[i]] === 'object' ? ref[path[i]] : ref[path[i]] = {};
		}
		ref[path[i]] = value;
	}

	Reflect.defineProperty(namespace.DataTier, 'processors', {
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
		processors = namespace.DataTier.processors,
		views = {},
		nlvs = {};

	//	TODO: this is similar to setPath in processors-service - unify
	function getPath(ref, path) {
		if (!ref) return;
		for (let i = 0, pathLength = path.length; i < pathLength; i++) {
			if (path[i] in ref) ref = ref[path[i]];
			else return;
		}
		return ref;
	}

	function changeListener(event) {
		let target = event.target,
			relevantProcessors = processors.getApplicable(target),
			processor, processorParam, tie;
		for (let i = 0, l = relevantProcessors.length; i < l; i++) {
			processor = relevantProcessors[i];
			if (event.type === processor.changeDOMEventType) {
				processorParam = processor.parseParam(target.dataset[processor.name]);
				tie = ties.get(processorParam.tieName);
				if (!processorParam.dataPath) {
					console.error('path to data not available');
					return;
				}
				if (!tie) {
					console.error('tie "' + processorParam.tieName + '" not found');
					return;
				}

				processor.toData({data: tie.data, path: processorParam.dataPath, view: target});
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
		if (view.nodeName === 'IFRAME') {
			initDocumentObserver(view.contentDocument);
			view.addEventListener('load', function() {
				initDocumentObserver(this.contentDocument);
				collect(this.contentDocument);
			});
			collect(view.contentDocument);
		} else if (view.dataset) {
			let keys = Object.keys(view.dataset), key,
				processor, processorParam, pathString,
				tieViews, procViews, pathViews;
			for (let i = 0, l = keys.length; i < l, key = keys[i]; i++) {
				if (!key.startsWith('tie')) continue;
				processor = processors.get(key);
				if (processor) {
					processorParam = processor.parseParam(view.dataset[processor.name]);
					pathString = processorParam.dataPath.join('.');
					tieViews = views[processorParam.tieName] || (views[processorParam.tieName] = {});
					procViews = tieViews[processor.name] || (tieViews[processor.name] = {});
					pathViews = procViews[pathString] || (procViews[pathString] = []);

					if (pathViews.indexOf(view) < 0) {
						pathViews.push(view);
						update(view, processor.name);
						if (processor.changeDOMEventType) {
							addChangeListener(view, processor.changeDOMEventType);
						}
					}
				} else {
					//	collect potentially future processor's element and put them into some tracking storage
					if (!nlvs[key]) nlvs[key] = [];
					nlvs[key].push(view);
				}
			}
		}
	}

	function update(view, processorName) {
		let r, p, t, data;
		r = processors.get(processorName);
		p = r.parseParam(view.dataset[processorName]);
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
			for (let i = 0, l = list.length; i < l; i++) add(list[i]);
		}
	}

	function discard(rootElement) {
		if (rootElement && rootElement.getElementsByTagName) {
			let list = rootElement.getElementsByTagName('*'),
				element, tmpProcs, processor,
				param, pathViews, index;
			for (let i = 0, l = list.length; i <= l; i++) {
				element = i < l ? list[i] : rootElement;
				if (!element.dataset || !element.dataset.length) continue;
				tmpProcs = processors.getApplicable(element);
				for (let i1 = 0, l1 = tmpProcs.length; i1 < l1; i1++) {
					processor = tmpProcs[i1];
					param = processor.parseParam(element.dataset[processor.name]);
					pathViews = views[param.tieName][processor.name][param.dataPath.join('.')];
					index = pathViews.indexOf(element);
					if (index >= 0) {
						pathViews.splice(index, 1);
						if (processor.changeDOMEventType) {
							delChangeListener(element, processor.changeDOMEventType);
						}
					}
				}
			}
		}
	}

	function move(view, processorName, oldParam, newParam) {
		let processorParam, pathViews, i = -1;

		processorParam = processors.get(processorName).parseParam(oldParam);

		//	delete old path
		if (views[processorParam.tieName] && views[processorParam.tieName][processorName]) {
			pathViews = views[processorParam.tieName][processorName][processorParam.dataPath];
			if (pathViews) i = pathViews.indexOf(view);
			if (i >= 0) {
				pathViews.splice(i, 1);
			}
		}

		//	add new path
		processorParam = processors.get(processorName).parseParam(newParam);
		if (!views[processorParam.tieName]) views[processorParam.tieName] = {};
		if (!views[processorParam.tieName][processorName]) views[processorParam.tieName][processorName] = {};
		if (!views[processorParam.tieName][processorName][processorParam.dataPath]) views[processorParam.tieName][processorName][processorParam.dataPath] = [];
		views[processorParam.tieName][processorName][processorParam.dataPath].push(view);
		update(view, processorName);
	}

	function processChanges(tieName, changes) {
		let tieViews = views[tieName], change, changedPath,
			procNames, procName, processor, viewedPaths, viewedPath, procViews, pathViews,
			i, l, i1, l1, i2, l2, i3, l3;
		if (tieViews) {
			for (i = 0, l = changes.length; i < l; i++) {
				change = changes[i];
				changedPath = change.path.join('.');
				procNames = Object.keys(tieViews);
				for (i1 = 0, l1 = procNames.length; i1 < l1; i1++) {
					procName = procNames[i1];
					procViews = tieViews[procName];
					if (procViews) {
						processor = processors.get(procName);
						viewedPaths = Object.keys(procViews);
						for (i2 = 0, l2 = viewedPaths.length; i2 < l2; i2++) {
							viewedPath = viewedPaths[i2];
							if (processor.isChangedPathRelevant(changedPath, viewedPath)) {
								pathViews = procViews[viewedPath];
								for (i3 = 0, l3 = pathViews.length; i3 < l3; i3++) {
									update(pathViews[i3], procName);
								}
							}
						}
					}
				}
			}
		}
	}

	function applyProcessor(processor) {
		//	apply on a pending views
		if (nlvs[processor.name]) {
			nlvs[processor.name].forEach(add);
			delete nlvs[processor.name];
		}
	}

	function dataAttrToProp(v) {
		let i = 2, l = v.split('-'), r;
		r = l[1];
		while (i < l.length) r += l[i][0].toUpperCase() + l[i++].substr(1);
		return r;
	}

	let viewsToSkip = new Map();

	function initDocumentObserver(document) {
		function processDomChanges(changes) {
			let i1, i2, i3, l2, l3,
				change, changeType,
				added, removed, node;
			for (i1 = 0; i1 < changes.length; i1++) {
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
					for (i2 = 0, l2 = added.length; i2 < l2; i2++) {
						node = added[i2];
						if (node.nodeType !== Node.DOCUMENT_NODE && node.nodeType !== Node.ELEMENT_NODE) continue;
						if (viewsToSkip.has(node)) {
							viewsToSkip.delete(node);
							continue;
						}
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
					for (i3 = 0, l3 = removed.length; i3 < l3; i3++) {
						node = removed[i3];
						if (node.nodeType !== Node.DOCUMENT_NODE && node.nodeType !== Node.ELEMENT_NODE) continue;
						if (viewsToSkip.has(node)) {
							viewsToSkip.delete(node);
							continue;
						}
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
			get applyProcessor() { return applyProcessor; },
			get updateView() { return update;},
			get viewsToSkip() {return viewsToSkip;}
		}
	});

	initDocumentObserver(document);
	collect(document);
})();
﻿(() => {
	'use strict';

	const namespace = this || window,
		add = namespace.DataTier.processors.add;

	if (!namespace.DataTier) {
		throw new Error('data-tier framework was not properly initialized');
	}

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

	add('tieHRef', {
		toView: function(data, view) {
			view.href = typeof data !== 'undefined' && data !== null ? data : '';
		}
	});

	add('tieDateValue', {
		toView: function(data, view) {
			view.value = typeof data !== 'undefined' && data !== null ? data.toLocaleString() : '';
		}
	});

	add('tieDateText', {
		toView: function(data, view) {
			view.textContent = typeof data !== 'undefined' && data !== null ? data.toLocaleString() : '';
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
﻿(() => {
	'use strict';

	const namespace = this || window,
		add = namespace.DataTier.processors.add;

	if (!namespace.DataTier) {
		throw new Error('data-tier framework was not properly initialized');
	}



	add('tieList', {
		parseParam: function(ruleValue) {
			return this.constructor.prototype.parseParam(ruleValue.split(/\s*=>\s*/)[0]);
		},
		isChangedPathRelevant: function(changedPath, viewedPath) {
			let subPath = changedPath.replace(viewedPath, '').split('.');
			return this.constructor.prototype.isChangedPathRelevant(changedPath, viewedPath) ||
				subPath.length === 1 ||
				(subPath.length === 2 && subPath[0] === '');
		},
		toView: function(tiedValue, template) {
			if (!Array.isArray(tiedValue) || !template) return;

			let container = template.parentNode, nv, ruleData, itemId, d, df, lc;
			let desiredListLength = tiedValue.length,
				existingListLength;

			//	TODO: this check should be moved to earlier phase of processing, this requires enhancement of rule API in general
			if (template.nodeName !== 'TEMPLATE') {
				throw new Error('tieList may be defined on template elements only');
			}
			if (!template.dataset.tieListSourceAid) {
				template.dataset.tieListSourceAid = new Date().getTime();
			}

			//	shorten the DOM list if bigger than the new array
			let existingList = container.querySelectorAll('[data-tie-list-item-aid="' + template.dataset.tieListSourceAid + '"]');
			existingListLength = existingList.length;
			while (existingListLength > desiredListLength) container.removeChild(existingList[--existingListLength]);

			//	supplement the DOM list if lesser than the new array
			if (existingListLength < desiredListLength) {
				ruleData = template.dataset.tieList.trim().split(/\s+/);
				if (!ruleData || ruleData.length !== 3 || ruleData[1] !== '=>') {
					console.error('invalid parameter for "tieList" rule specified');
				} else {
					itemId = ruleData[2];
					d = template.ownerDocument;
					df = d.createDocumentFragment();
					let views, viewsLength, metaMap = [],
						c, keys, tmpPairs, i,
						i2, tmpMap, tmpMapLength, i3, tmpPair,
						prefix = ruleData[0] + '.';

					for (; existingListLength < desiredListLength; existingListLength++) {
						nv = d.importNode(template.content, true);
						views = nv.querySelectorAll('*');
						if (!viewsLength) viewsLength = views.length;
						if (!metaMap.length) {
							for (c = 0; c < viewsLength; c++) {
								keys = Object.keys(views[c].dataset);
								tmpPairs = [];
								for (i = 0; i < keys.length; i++) tmpPairs.push([keys[i], views[c].dataset[keys[i]]]);
								metaMap[c] = tmpPairs;
							}
						}
						for (i2 = 0; i2 < viewsLength, tmpMap = metaMap[i2]; i2++) {
							for (i3 = 0, tmpMapLength = tmpMap.length; i3 < tmpMapLength; i3++) {
								tmpPair = tmpMap[i3];
								if (tmpPair[1].startsWith(itemId)) {
									views[i2].dataset[tmpPair[0]] = tmpPair[1].replace(itemId, prefix + existingListLength);
								}
							}
						}
						df.appendChild(nv);
						lc = df.lastChild;
						while (lc.nodeType !== Node.ELEMENT_NODE && lc.previousSibling !== null) {
							lc = lc.previousSibling;
						}
						lc.dataset.tieListItemAid = template.dataset.tieListSourceAid;
					}
					container.appendChild(df);
				}
			}

			//	run update on elements
			let allBluePrintElements = template.content.querySelectorAll('*');
			let tieProcsMap = [], keys;
			for (let i = 0, l = allBluePrintElements.length; i < l; i++) {
				tieProcsMap[i] = Object.keys(allBluePrintElements[i].dataset);
			}

			let i1, l1, i2, l2, descendants;
			for (let i = 0, l = container.childNodes.length, child; i < l; i++) {
				child = container.childNodes[i];
				if (child !== template && (child.nodeType === Node.DOCUMENT_NODE || child.nodeType === Node.ELEMENT_NODE) && child.dataset.tieListItemAid) {
					descendants = Array.from(child.querySelectorAll('*'));
					descendants.unshift(child);
					for (i1 = 0, l1 = tieProcsMap.length; i1 < l1; i1++) {
						keys = tieProcsMap[i1];
						if (keys.length) {
							namespace.DataTier.views.viewsToSkip.set(descendants[i1], null);
							for (i2 = 0, l2 = keys.length; i2 < l2; i2++) {
								namespace.DataTier.views.updateView(descendants[i1], keys[i2]);
							}
						}
					}
				}
			}
		}
	});

})();
