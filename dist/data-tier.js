(function (scope) {
    'use strict';

    var api,
        proxiesToTargetsMap = new WeakMap();

    function copyShallow(target) {
        var result;
        if (Array.isArray(target)) {
            result = target.slice();
        } else {
            result = Object.assign({}, target);
        }
        return result;
    }

    function processArraySubgraph(subGraph, observableData, basePath) {
        var path, copy;
        subGraph.forEach(function (element, index) {
            if (element && typeof element === 'object') {
                path = basePath.concat(index);
                copy = copyShallow(element);
                subGraph[index] = proxify(copy, observableData, path);
            }
        });
    }

    function processObjectSubgraph(subGraph, observableData, basePath) {
        var path, copy;
        Reflect.ownKeys(subGraph).forEach(function (key) {
            if (subGraph[key] && typeof subGraph[key] === 'object') {
                path = basePath.concat(key);
                copy = copyShallow(subGraph[key]);
                subGraph[key] = proxify(copy, observableData, path);
            }
        });
    }

    function proxify(target, observableData, basePath) {
        var proxy;

        function proxiedArrayGet(target, key) {
            var result;
            if (key === 'pop') {
                result = function proxiedPop() {
                    var poppedIndex, popResult, changes;
                    poppedIndex = target.length - 1;
                    observableData.preventCallbacks = true;
                    popResult = Reflect.apply(target[key], target, arguments);
                    observableData.preventCallbacks = false;
                    changes = [new DeleteChange(basePath.concat(poppedIndex), popResult)];
                    publishChanges(observableData.callbacks, changes);
                    return popResult;
                };
            } else if (key === 'push') {
                result = function proxiedPush() {
                    var pushResult, changes = [];
                    observableData.preventCallbacks = true;
                    pushResult = Reflect.apply(target[key], target, arguments);
                    processArraySubgraph(target, observableData, basePath);
                    observableData.preventCallbacks = false;
                    for (var i = arguments.length; i > 0; i--) {
                        changes.push(new InsertChange(basePath.concat(pushResult - i), target[pushResult - i]));
                    }
                    publishChanges(observableData.callbacks, changes);
                    return pushResult;
                };
            } else if (key === 'shift') {
                result = function proxiedShift() {
                    var shiftResult, changes;
                    observableData.preventCallbacks = true;
                    shiftResult = Reflect.apply(target[key], target, arguments);
                    processArraySubgraph(target, observableData, basePath);
                    observableData.preventCallbacks = false;
                    changes = [new DeleteChange(basePath.concat(0), shiftResult)];
                    publishChanges(observableData.callbacks, changes);
                    return shiftResult;
                };
            } else if (key === 'unshift') {
                result = function proxiedUnshift() {
                    var unshiftResult, unshiftContent = [], changes = [];
                    Array.from(arguments).forEach(function (arg, index) {
                        var pArg;
                        if (arg && typeof arg === 'object') {
                            pArg = proxify(arg, observableData, basePath.concat(index));
                        } else {
                            pArg = arg;
                        }
                        unshiftContent.push(pArg);
                    });
                    unshiftContent.forEach(function (pe, index) {
                        changes.push(new InsertChange(basePath.concat(index), pe));
                    });
                    unshiftResult = Reflect.apply(target[key], target, unshiftContent);
                    processArraySubgraph(target, observableData, basePath);
                    publishChanges(observableData.callbacks, changes);
                    return unshiftResult;
                };
            } else if (key === 'reverse') {
                result = function proxiedReverse() {
                    var reverseResult, changes = [];
                    observableData.preventCallbacks = true;
                    reverseResult = Reflect.apply(target[key], target, arguments);
                    processArraySubgraph(target, observableData, basePath);
                    observableData.preventCallbacks = false;
                    changes.push(new ReverseChange());
                    publishChanges(observableData.callbacks, changes);
                    return reverseResult;
                };
            } else if (key === 'sort') {
                result = function proxiedSort() {
                    var sortResult, changes = [];
                    observableData.preventCallbacks = true;
                    sortResult = Reflect.apply(target[key], target, arguments);
                    processArraySubgraph(target, observableData, basePath);
                    observableData.preventCallbacks = false;
                    changes.push(new ShuffleChange());
                    publishChanges(observableData.callbacks, changes);
                    return sortResult;
                };
            } else if (key === 'fill') {
                result = function proxiedFill() {
                    var fillResult, start, end, changes = [], prev;
                    start = arguments.length < 2 ? 0 : (arguments[1] < 0 ? target.length + arguments[1] : arguments[1]);
                    end = arguments.length < 3 ? target.length : (arguments[2] < 0 ? target.length + arguments[2] : arguments[2]);
                    prev = target.slice(start, end);
                    observableData.preventCallbacks = true;
                    fillResult = Reflect.apply(target[key], target, arguments);
                    processArraySubgraph(target, observableData, basePath);
                    observableData.preventCallbacks = false;
                    for (var i = start; i < end; i++) {
                        if (target.hasOwnProperty(i - start)) {
                            changes.push(new UpdateChange(basePath.concat(i), target[i], prev[i - start]));
                        } else {
                            changes.push(new InsertChange(basePath.concat(i), target[i]));
                        }
                    }
                    publishChanges(observableData.callbacks, changes);
                    return fillResult;
                };
            } else if (key === 'splice') {
                result = function proxiedSplice() {
                    var changes = [],
                        index,
                        startIndex,
                        removed,
                        inserted,
                        spliceResult;
                    observableData.preventCallbacks = true;
                    startIndex = arguments.length === 0 ? 0 : (arguments[0] < 0 ? target.length + arguments[0] : arguments[0]);
                    removed = arguments.length < 2 ? (target.length - startIndex) : arguments[1];
                    inserted = Math.max(arguments.length - 2, 0);
                    spliceResult = Reflect.apply(target[key], target, arguments);
                    processArraySubgraph(target, observableData, basePath);
                    observableData.preventCallbacks = false;
                    for (index = 0; index < removed; index++) {
                        if (index < inserted) {
                            changes.push(new UpdateChange(basePath.concat(startIndex + index), target[startIndex + index], spliceResult[index]));
                        } else {
                            changes.push(new DeleteChange(basePath.concat(startIndex + index), spliceResult[index]));
                        }
                    }
                    for (; index < inserted; index++) {
                        changes.push(new InsertChange(basePath.concat(startIndex + index), target[startIndex + index]));
                    }

                    publishChanges(observableData.callbacks, changes);
                    return spliceResult;
                };
            } else {
                result = Reflect.get(target, key);
            }
            return result;
        }

        function proxiedSet(target, key, value) {
            var oldValuePresent = target.hasOwnProperty(key),
				oldValue = target[key],
				result,
				changes = Array.isArray(observableData.eventsCollector) ? observableData.eventsCollector : [],
				path;

            result = Reflect.set(target, key, value);
            if (observableData.callbacks.length && result && value !== oldValue) {
                path = basePath.concat(key);

                if (typeof oldValue === 'object' && oldValue) {
                    if (proxiesToTargetsMap.has(oldValue)) {
                        proxiesToTargetsMap.delete(oldValue);
                    }
                }
                if (typeof value === 'object' && value) {
                    target[key] = proxify(value, observableData, path);
                }
                if (oldValuePresent) {
                    changes.push(new UpdateChange(path, value, oldValue));
                } else {
                    changes.push(new InsertChange(path, value));
                }
                if (!observableData.preventCallbacks) {
                    publishChanges(observableData.callbacks, changes);
                }
            }
            return result;
        }

        function proxiedDelete(target, key) {
            var oldValue = target[key],
				result,
				changes = Array.isArray(observableData.eventsCollector) ? observableData.eventsCollector : [],
				path;

            result = Reflect.deleteProperty(target, key);
            if (observableData.callbacks.length && result) {
                if (typeof oldValue === 'object' && oldValue) {
                    if (proxiesToTargetsMap.has(oldValue)) {
                        proxiesToTargetsMap.delete(oldValue);
                    }
                }
                path = basePath.concat(key);
                changes.push(new DeleteChange(path, oldValue));
                if (!observableData.preventCallbacks) {
                    publishChanges(observableData.callbacks, changes);
                }
            }
            return result;
        }

        if (proxiesToTargetsMap.has(target)) {
            var tmp = target;
            target = proxiesToTargetsMap.get(target);
            proxiesToTargetsMap.delete(tmp);
        }
        if (Array.isArray(target)) {
            processArraySubgraph(target, observableData, basePath);
            proxy = new Proxy(target, {
                get: proxiedArrayGet,
                set: proxiedSet,
                deleteProperty: proxiedDelete
            });
        } else {
            processObjectSubgraph(target, observableData, basePath);
            proxy = new Proxy(target, {
                set: proxiedSet,
                deleteProperty: proxiedDelete
            });
        }
        proxiesToTargetsMap.set(proxy, target);

        return proxy;
    }

    function ObservableData(target) {
        var proxy,
			callbacks = [],
            eventsCollector,
            preventCallbacks = false;

        function observe(callback) {
            if (typeof callback !== 'function') { throw new Error('callback parameter MUST be a function'); }

            if (callbacks.indexOf(callback) < 0) {
                callbacks.push(callback);
            } else {
                console.info('observer callback may be bound only once for an observable');
            }
        }

        function unobserve() {
            if (arguments.length) {
                Array.from(arguments).forEach(function (argument) {
                    var i = callbacks.indexOf(argument);
                    if (i) {
                        callbacks.splice(i, 1);
                    }
                });
            } else {
                callbacks.splice(0, callbacks.length);
            }
        }

        proxy = proxify(copyShallow(target), this, []);
        Reflect.defineProperty(proxy, 'observe', { value: observe });
        Reflect.defineProperty(proxy, 'unobserve', { value: unobserve });

        Reflect.defineProperty(this, 'callbacks', { get: function () { return callbacks.slice(); } });
        Reflect.defineProperty(this, 'eventsCollector', { value: eventsCollector, writable: true });
        Reflect.defineProperty(this, 'preventCallbacks', { value: preventCallbacks, writable: true });
        Reflect.defineProperty(this, 'proxy', { value: proxy });
    }

    function InsertChange(path, value) {
        Reflect.defineProperty(this, 'type', { value: 'insert' });
        Reflect.defineProperty(this, 'path', { value: path });
        Reflect.defineProperty(this, 'value', { value: value });
    }
    function UpdateChange(path, value, oldValue) {
        Reflect.defineProperty(this, 'type', { value: 'update' });
        Reflect.defineProperty(this, 'path', { value: path });
        Reflect.defineProperty(this, 'value', { value: value });
        Reflect.defineProperty(this, 'oldValue', { value: oldValue });
    }
    function DeleteChange(path, oldValue) {
        Reflect.defineProperty(this, 'type', { value: 'delete' });
        Reflect.defineProperty(this, 'path', { value: path });
        Reflect.defineProperty(this, 'oldValue', { value: oldValue });
    }
    function ReverseChange() {
        Reflect.defineProperty(this, 'type', { value: 'reverse' });
    }
    function ShuffleChange() {
        Reflect.defineProperty(this, 'type', { value: 'shuffle' });
    }

    function publishChanges(callbacks, changes) {
        for (var i = 0; i < callbacks.length; i++) {
            try {
                callbacks[i](changes);
            } catch (e) {
                console.error(e);
            }
        }
    }

    api = {};

    Reflect.defineProperty(api, 'from', {
        value: function (target) {
            if (!target || typeof target !== 'object') {
                throw new Error('observable MAY ONLY be created from non-null object only');
            } else if ('observe' in target || 'unobserve' in target) {
                throw new Error('target object MUST NOT have not own nor inherited properties "observe" and/or "unobserve"');
            }
            var observableData = new ObservableData(target);
            return observableData.proxy;
        }
    });

    Reflect.defineProperty(scope, 'Observable', { value: api });
})(this);
﻿(function (scope) {
	'use strict';

	const ties = {};
	var api;

	if (!scope.DataTier) { Reflect.defineProperty(scope, 'DataTier', { value: {} }); }

	function Tie(name, observable, options) {
		var data;

		//function observer(changes) {
		//	changes.forEach(change => {
		//		let contextedPath = change.path.slice();
		//		contextedPath.unshift(name);

		//		//	transfer update to update service
		//		//	later use the specific data of the event to optimize update
		//		api.viewsService.update()


		//		let vs = api.viewsService.get(contextedPath), i, l, key, p;
		//		for (i = 0, l = vs.length; i < l; i++) {
		//			for (key in vs[i].dataset) {
		//				if (key.indexOf('tie') === 0) {
		//					p = api.rulesService.getRule(key).parseValue(vs[i]).dataPath;
		//					if (isPathStartsWith(contextedPath, p)) {
		//						//	TODO: use the knowledge of old value and new value here, rules like list may optimize for that
		//						//	TODO: yet, myst pass via the formatters/vizualizers of Rule/Tie
		//						api.viewsService.update(vs[i], key);
		//					}
		//				}
		//			}
		//		}
		//	});
		//}

		function setData(observable) {
			if (typeof observable !== 'object') {
				throw new Error('observable MUST be an object; it MAY be null');
			}
			if (observable !== null) {
				validateObservable(observable);
			}

			if (data) { data.unobserve(observer); }
			data = observable;
			if (data) {
				observable.observe(api.viewService.update);
			}
			//	update all paths, if data is null - will clear everything
		}

		function getData() { return data; }

		setData(observable);

		Reflect.defineProperty(this, 'name', { value: name });
		Reflect.defineProperty(this, 'data', { get: getData, set: setData });
	}

	function getTie(name) {
		validateTieName(name);
		return ties[name];
	}

	function createTie(name, observable, options) {
		validateTieName(name);
		if (ties[name]) {
			throw new Error('existing Tie MAY NOT be re-created, use the tie\'s own APIs to reconfigure it');
		}

		return (ties[name] = new Tie(name, observable, options));
	}

	function removeTie(name) {
		validateTieName(name);
		if (ties[name]) {
			//  TODO: dispose tie
			delete ties[name];
		}
	}

	function validateTieName(name) {
		if (!name || typeof name !== 'string') {
			throw new Error('name MUST be a non-empty string');
		}
		if (/\W/.test(name)) {
			throw new Error('name MUST consist of alphanumeric non uppercase characters only');
		}
	}

	function validateObservable(observable) {
		if (typeof observable !== 'object') {
			throw new Error('observable MUST be an object');
		}
		if (observable) {
			if (typeof observable.observe !== 'function' || typeof observable.unobserve !== 'function') {
				throw new Error('observable MUST have "observe" and "unobserve" functions defined');
			}
		}
	}

	//	TOBE reviewed
	function isPathStartsWith(p1, p2) {
		var i, l;
		p1 = api.utils.pathToNodes(p1);
		p2 = api.utils.pathToNodes(p2);
		l = Math.min(p1.length, p2.length);
		for (i = 0; i < l; i++) {
			if (p1[i] !== p2[i]) return false;
		}
		return true;
	}

	function TiesService(internalAPI) {
		api = internalAPI;
		Reflect.defineProperty(this, 'getTie', { value: getTie });
		Reflect.defineProperty(this, 'createTie', { value: createTie });
		Reflect.defineProperty(this, 'removeTie', { value: removeTie });
	}

	Reflect.defineProperty(scope.DataTier, 'TiesService', { value: TiesService });

})(this);
﻿(function (scope) {
	'use strict';

	if (!scope.DataTier) { Reflect.defineProperty(scope, 'DataTier', { value: {} }); }

	var api,
        vpn = '___vs___',
        vs = {},
        nlvs = {},
        vcnt = 0,
        rulesService;

	function pathToNodes(value) {
		if (Array.isArray(value)) return value;

		var c = 0, b = false, n = '', r = [];
		while (c < value.length) {
			if (value[c] === '.') {
				if (n.length) { r.push(n); }
				n = '';
			} else if (value[c] === '[') {
				if (b) throw new Error('bad path: "' + value + '", at: ' + c);
				if (n.length) { r.push(n); }
				n = '';
				b = true;
			} else if (value[c] === ']') {
				if (!b) throw new Error('bad path: "' + value + '", at: ' + c);
				if (n.length) { r.push(n); }
				n = '';
				b = false;
			} else {
				n += value[c];
			}
			c++;
		}
		if (n.length) { r.push(n); }
		return r;
	}

	function setPath(ref, path, value) {
		var list = pathToNodes(path), i;
		for (i = 0; i < list.length - 1; i++) {
			if (typeof ref[list[i]] === 'object') ref = ref[list[i]];
			else if (!(list[i] in ref)) ref = (ref[list[i]] = {});
			else throw new Error('the path is unavailable');
		}
		ref[list[i]] = value;
	}

	function getPath(ref, path) {
		var list, i;
		if (!ref) return;
		list = pathToNodes(path);
		for (i = 0; i < list.length; i++) {
			ref = ref[list[i]];
			if (!ref) return;
		}
		return ref;
	}

	function changeListener(ev) {
		var view = ev.target, p, tn, t;

		if (view.dataset.tieValue) {
			p = view.dataset.tieValue;
		} else {
			p = view.dataset.tie;
		}
		//	TODO: the following condition is not always error state, need to decide regarding the cardinality of the value suppliers
		if (!p) { console.error('path to data not available'); return; }
		p = pathToNodes(p);
		if (!p) { console.error('path to data is invalid'); return; }
		tn = p.shift();
		t = tiesService.obtain(tn);
		if (!t) { console.error('tie "' + tn + '" not found'); return; }

		t.viewToDataProcessor({ data: t.data, path: p, view: view });
	}

	function addChangeListener(v) {
		var ow = v.ownerDocument.defaultView;
		if (v instanceof ow.HTMLInputElement || v instanceof ow.HTMLSelectElement) {
			v.addEventListener('change', changeListener);
		}
	}

	function delChangeListener(v) {
		v.removeEventListener('change', changeListener);
	}

	function add(view) {
		var key, path, va, rule;
		if (view.nodeName === 'IFRAME') {
			initDocumentObserver(view.contentDocument);
			view.addEventListener('load', function () {
				initDocumentObserver(this.contentDocument);
				collect(this.contentDocument);
			});
			collect(view.contentDocument);
		} else {
			api.rulesService.getApplicableRules(view).forEach(function (rule) {
				var path = rule.parseValue(view).dataPath;

				path.push(vpn);
				va = getPath(vs, path);
				if (!va) setPath(vs, path, (va = []));
				if (va.indexOf(view) < 0) {
					va.push(view);
					path.pop();
					update(view, rule.name);
					addChangeListener(view);
					vcnt++;
				}
			});
			//	collect potentially future rules element and put them to some tracking storage

			//for (key in view.dataset) {
			//	if (key.indexOf('tie') === 0) {
			//		rule = api.rulesService.getRule(key, view);
			//		if (rule) {
			//			path = rule.resolvePath(view.dataset[key]);
			//			path.push(vpn);
			//			va = getPath(vs, path);
			//			if (!va) setPath(vs, path, (va = []));
			//			if (va.indexOf(view) < 0) {
			//				va.push(view);
			//				path.pop();
			//				update(view, key);
			//				addChangeListener(view);
			//				vcnt++;
			//			}
			//		} else {
			//			if (!nlvs[key]) nlvs[key] = [];
			//			nlvs[key].push(view);
			//		}
			//	}
			//}
		}
	}

	function get(path) {
		var p = pathToNodes(path), r = [], tmp, key;
		tmp = getPath(vs, p);
		if (tmp) {
			Object.keys(tmp).forEach(function (key) {
				if (key === vpn) Array.prototype.push.apply(r, tmp[key]);
				else Array.prototype.push.apply(r, get(path + '.' + key));
			});
		}
		return r;
	}

	function update(view, ruleName) {
		var r, p, t, data;
		r = api.rulesService.getRule(ruleName);
		p = r.parseValue(view).dataPath;
		t = api.tiesService.getTie(p.shift());
		if (t && r) {
			data = getPath(t.data, p);
			r.dataToView(data, view);
		}
	}

	function collect(rootElement) {
		var l;
		if (rootElement &&
            rootElement.nodeType &&
            (rootElement.nodeType === Element.DOCUMENT_NODE || rootElement.nodeType === Element.ELEMENT_NODE)) {
			l = rootElement.nodeName === 'IFRAME' ?
                l = Array.prototype.slice.call(rootElement.contentDocument.getElementsByTagName('*'), 0) :
                l = Array.prototype.slice.call(rootElement.getElementsByTagName('*'), 0);
			l.push(rootElement);
			l.forEach(add);
			console.info('collected views, current total: ' + vcnt);
		}
	}

	function relocateByRule(rule) {
		if (nlvs[rule.id]) {
			nlvs[rule.id].forEach(add);
		}
		console.info('relocated views, current total: ' + vcnt);
	}

	function discard(rootElement) {
		var l, e, key, rule, path, va, i;
		if (!rootElement || !rootElement.getElementsByTagName) return;
		l = Array.prototype.slice.call(rootElement.getElementsByTagName('*'), 0);
		l.push(rootElement);
		l.forEach(function (e) {
			for (key in e.dataset) {
				i = -1;
				if (key.indexOf('tie') === 0) {
					rule = api.rulesService.getRule(key);
					path = rule.parseValue(e).dataPath;
					path.push(vpn);
					va = getPath(vs, path);
					i = va && va.indexOf(e);
					if (i >= 0) {
						va.splice(i, 1);
						delChangeListener(e);
						vcnt--;
					}
				}
			}
		});
		console.info('discarded views, current total: ' + vcnt);
	}

	function move(view, ruleId, oldPath, newPath) {
		var pathViews, i = -1, opn, npn;

		//	delete old path
		if (oldPath) {
			opn = pathToNodes(oldPath);
			opn.push(vpn);
			pathViews = getPath(vs, opn);
			if (pathViews) i = pathViews.indexOf(view);
			if (i >= 0) pathViews.splice(i, 1);
		}

		//	add new path
		npn = pathToNodes(newPath);
		npn.push(vpn);
		if (!getPath(vs, npn)) setPath(vs, npn, []);
		getPath(vs, npn).push(view);
		npn.pop();
		update(view, ruleId);
	}

	function ViewsService(internalAPIs) {
		api = internalAPIs;
		Reflect.defineProperty(this, 'collect', { value: collect });
		Reflect.defineProperty(this, 'update', { value: update });
		Reflect.defineProperty(this, 'relocateByRule', { value: relocateByRule });
		Reflect.defineProperty(this, 'discard', { value: discard });
		Reflect.defineProperty(this, 'move', { value: move });
		Reflect.defineProperty(this, 'get', { value: get });
	}

	Reflect.defineProperty(scope.DataTier, 'ViewsService', { value: ViewsService });

})(this);
﻿(function (scope) {
	'use strict';

	const rules = {};
	var api;

	if (!scope.DataTier) { Reflect.defineProperty(scope, 'DataTier', { value: {} }); }

	function Rule(name, options) {
		var vpr, dtv, itd;

		if (typeof name !== 'string' || !name) {
			throw new Error('name MUST be a non-empty string');
		}
		if (rules[name]) {
			throw new Error('rule "' + name + '" already exists; you may want to reconfigure the existing rule');
		}
		if (typeof options !== 'object' || !options) {
			throw new Error('options MUST be a non-null object');
		}
		if (typeof options.dataToView !== 'function') {
			throw new Error('options MUST have a "dataToView" function defined');
		}

		//if (typeof setup === 'string') {
		//    dtv = function (e, s) {
		//        var d;
		//        if (s) {
		//            d = s.data;
		//            d = typeof d === 'undefined' || d === null ? '' : d;
		//            setPath(e, setup, d);
		//        }
		//    };
		//    itd = function () { throw new Error('not yet implemented'); };
		//} else if (typeof setup === 'function') {
		//    dtv = setup;
		//    itd = function () { throw new Error('no "inputToData" functionality defined in this rule'); };
		//} else if (typeof setup === 'object') {
		//    dtv = setup.dataToView;
		//    itd = setup.inputToData;
		//}

		Reflect.defineProperty(this, 'name', { value: name });
		Reflect.defineProperty(this, 'dataToView', { value: options.dataToView });
		if (typeof options.inputToData === 'function') { Reflect.defineProperty(this, 'inputToData', { value: options.inputToData }); }
		if (typeof options.parseValue === 'function') { Reflect.defineProperty(this, 'parseValue', { value: options.parseValue }); }
	}
	Rule.prototype.parseValue = function (element) {
		if (element && element.nodeType === Node.ELEMENT_NODE) {
			var ruleValue = element.dataset[this.name];
			return {
				dataPath: api.utils.pathToNodes(ruleValue.split(' ')[0])
			};
		} else {
			console.error('valid DOM Element expected, received: ' + element);
		}
	};

	function addRule(rule) {
		if (!rule || !(rule instanceof Rule)) {
			throw new Error('rule MUST be an object of type Rule');
		}

		rules[rule.name] = rule;
	}

	function getRule(name) {
		if (rules[name]) {
			return rules[name];
		} else {
			console.error('rule "' + name + '" is not defined');
		}
	}

	function removeRule(name) {
		if (typeof name !== 'string' || !name) {
			throw new Error('rule name MUST be a non-empty string');
		}

		return delete rules[name];
	}

	function getApplicableRules(element) {
		var result = [];
		if (element && element.nodeType === Node.ELEMENT_NODE) {
			Reflect.ownKeys(element.dataset).forEach(function (key) {
				if (rules[key]) {
					result.push(rules[key]);
				}
			});
		}
		return result;
	}

	//Object.defineProperties(this, {
	//    add: {
	//        value: function (id, setup) {
	//            if (!id || !setup) throw new Error('bad parameters; f(string, string|function) expected');
	//            if (id.indexOf('tie') !== 0) throw new Error('rule id MUST begin with "tie"');
	//            if (id in rules) throw new Error('rule with id "' + id + '" already exists');
	//            rules[id] = new Rule(id, setup);
	//            viewsService.relocateByRule(rules[id]);
	//            return rules[id];
	//        }
	//    },
	//    get: {
	//        value: function (id, e) {
	//            var r, p;
	//            if (id.indexOf('tie') !== 0) {
	//                console.error('invalid tie id supplied');
	//            } else if (id in rules) {
	//                r = rules[id];
	//            } else {
	//                if (id === 'tie') {
	//                    p = e.ownerDocument.defaultView;
	//                    if (!e || !e.nodeName) throw new Error('rule "' + id + '" not found, therefore valid DOM element MUST be supplied to grasp the default rule');
	//                    if (e instanceof p.HTMLInputElement ||
	//                        e instanceof p.HTMLSelectElement) return rules.tieValue;
	//                    else if (e instanceof p.HTMLImageElement) return rules.tieImage;
	//                    else return rules.tieText;
	//                }
	//            }
	//            return r;
	//        }
	//    },
	//    del: {
	//        value: function (id) {
	//            return delete rules[id];
	//        }
	//    }
	//});

	function RulesService(internalAPI) {
		api = internalAPI;
		Reflect.defineProperty(this, 'Rule', { value: Rule });
		Reflect.defineProperty(this, 'addRule', { value: addRule });
		Reflect.defineProperty(this, 'getRule', { value: getRule });
		Reflect.defineProperty(this, 'removeRule', { value: removeRule });
		Reflect.defineProperty(this, 'getApplicableRules', { value: getApplicableRules });
	}

	Reflect.defineProperty(scope.DataTier, 'RulesService', { value: RulesService });

})(this);
(function DataTier(scope) {
	'use strict';

	const api = {},
		utils = {},
        dataRoot = {};

	if (typeof scope.DataTier.TiesService !== 'function') { throw new Error('DataTier initialization failed: "TiesService" not found'); }
	if (typeof scope.DataTier.ViewsService !== 'function') { throw new Error('DataTier initialization failed: "ViewsService" not found'); }
	if (typeof scope.DataTier.RulesService !== 'function') { throw new Error('DataTier initialization failed: "RulesService" not found'); }

	Reflect.defineProperty(api, 'utils', { value: utils });
	Reflect.defineProperty(api, 'tiesService', { value: new scope.DataTier.TiesService(api) });
	Reflect.defineProperty(api, 'viewsService', { value: new scope.DataTier.ViewsService(api) });
	Reflect.defineProperty(api, 'rulesService', { value: new scope.DataTier.RulesService(api) });

	function dataAttrToProp(v) {
		var i = 2, l = v.split('-'), r;
		r = l[1];
		while (i < l.length) r += l[i][0].toUpperCase() + l[i++].substr(1);
		return r;
	}

	function pathToNodes(value) {
		if (Array.isArray(value)) return value;

		var c = 0, b = false, n = '', r = [];
		while (c < value.length) {
			if (value[c] === '.') {
				if (n.length) { r.push(n); }
				n = '';
			} else if (value[c] === '[') {
				if (b) throw new Error('bad path: "' + value + '", at: ' + c);
				if (n.length) { r.push(n); }
				n = '';
				b = true;
			} else if (value[c] === ']') {
				if (!b) throw new Error('bad path: "' + value + '", at: ' + c);
				if (n.length) { r.push(n); }
				n = '';
				b = false;
			} else {
				n += value[c];
			}
			c++;
		}
		if (n.length) { r.push(n); }
		return r;
	}

	//	TODO: normalize this
	utils.pathToNodes = pathToNodes;

	function setPath(ref, path, value) {
		var list = pathToNodes(path), i;
		for (i = 0; i < list.length - 1; i++) {
			if (typeof ref[list[i]] === 'object') ref = ref[list[i]];
			else if (!(list[i] in ref)) ref = (ref[list[i]] = {});
			else throw new Error('the path is unavailable');
		}
		ref[list[i]] = value;
	}

	function getPath(ref, path) {
		var list, i;
		if (!ref) return;
		list = pathToNodes(path);
		for (i = 0; i < list.length; i++) {
			ref = ref[list[i]];
			if (!ref) return;
		}
		return ref;
	}

	function cutPath(ref, path) {
		var list = pathToNodes(path), i = 0, value;
		for (; i < list.length - 1; i++) {
			if (list[i] in ref) ref = ref[list[i]];
			else return;
		}
		value = ref[list[i - 1]];
		delete ref[list[i - 1]];
		return value;
	}

	//	TODO: move this to the views service
	var documentObserver = [];
	function initDocumentObserver(d) {
		function processDomChanges(changes) {
			changes.forEach(function (change) {
				var tp = change.type, tr = change.target, an = change.attributeName, i, l;
				if (tp === 'attributes' && an.indexOf('data-tie') === 0) {
					api.viewsService.move(tr, dataAttrToProp(an), change.oldValue, tr.getAttribute(an));
				} else if (tp === 'attributes' && an === 'src' && tr.nodeName === 'IFRAME') {
					api.viewsService.discard(tr.contentDocument);
				} else if (tp === 'childList') {
					if (change.addedNodes.length) {
						for (i = 0, l = change.addedNodes.length; i < l; i++) {
							if (change.addedNodes[i].nodeName === 'IFRAME') {
								if (change.addedNodes[i].contentDocument) {
									initDocumentObserver(change.addedNodes[i].contentDocument);
									api.viewsService.collect(change.addedNodes[i].contentDocument);
								}
								change.addedNodes[i].addEventListener('load', function () {
									initDocumentObserver(this.contentDocument);
									api.viewsService.collect(this.contentDocument);
								});
							} else {
								api.viewsService.collect(change.addedNodes[i]);
							}
						}
					}
					if (change.removedNodes.length) {
						for (i = 0, l = change.removedNodes.length; i < l; i++) {
							if (change.removedNodes[i].nodeName === 'IFRAME') {
								api.viewsService.discard(change.removedNodes[i].contentDocument);
							} else {
								api.viewsService.discard(change.removedNodes[i]);
							}
						}
					}
				}
			});
		}

		var domObserver = new MutationObserver(processDomChanges);
		domObserver.observe(d, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeOldValue: true,
			characterData: false,
			characterDataOldValue: false
		});
		documentObserver.push(domObserver);
	}
	initDocumentObserver(document);

	api.viewsService.collect(document);

	Reflect.defineProperty(scope.DataTier, 'getTie', { value: api.tiesService.getTie });
	Reflect.defineProperty(scope.DataTier, 'createTie', { value: api.tiesService.createTie });
	Reflect.defineProperty(scope.DataTier, 'removeTie', { value: api.tiesService.removeTie });

	Reflect.defineProperty(scope.DataTier, 'Rule', { value: api.rulesService.Rule });
	Reflect.defineProperty(scope.DataTier, 'addRule', { value: api.rulesService.addRule });
	Reflect.defineProperty(scope.DataTier, 'getRule', { value: api.rulesService.getRule });
	Reflect.defineProperty(scope.DataTier, 'removeRule', { value: api.rulesService.removeRule });

})(this);
﻿(function (scope) {
	'use strict';

	const dataTier = scope.DataTier;

	if (typeof dataTier !== 'object' || !dataTier) {
		throw new Error('Vanilla rules appliance failed: DataTier library not found');
	}

	dataTier.addRule(new dataTier.Rule('tie', {
		dataToView: function (data, view) {
			var dfltValueElements = ['INPUT', 'TEXTAREA', 'SELECT', 'OPTION', 'PROGRESS', 'METER'];
			if (view && view.nodeType === Node.ELEMENT_NODE) {
				if (dfltValueElements.indexOf(view.tagName) >= 0) {
					view.value = data;
				} else {
					view.textContent = data;
				}
			} else {
				console.error('valid element expected, found: ' + view);
			}
		}
	}));

	dataTier.addRule(new dataTier.Rule('tieValue', {
		dataToView: function (data, view) {
			view.value = data;
		}
	}));

	dataTier.addRule(new dataTier.Rule('tieText', {
		dataToView: function (data, view) {
			view.textContent = data;
		}
	}));

	dataTier.addRule(new dataTier.Rule('tiePlaceholder', {
		dataToView: function (data, view) {
			view.placeholder = data;
		}
	}));

	dataTier.addRule(new dataTier.Rule('tieTooltip', {
		dataToView: function (data, view) {
			view.title = data;
		}
	}));

	dataTier.addRule(new dataTier.Rule('tieImage', {
		dataToView: function (data, view) {
			view.src = data;
		}
	}));

	dataTier.addRule(new dataTier.Rule('tieDateValue', {
		dataToView: function (data, view) {
			view.value = data.toLocaleString();
		}
	}));

	dataTier.addRule(new dataTier.Rule('tieDateText', {
		dataToView: function (data, view) {
			view.textContent = data.toLocaleString();
		}
	}));

	dataTier.addRule(new dataTier.Rule('tieList', {
		parseValue: function (element) {
			if (element && element.nodeType === Node.ELEMENT_NODE) {
				var ruleValue = element.dataset.tieList;
				return {
					dataPath: apis.utils.pathToNodes(ruleValue.split(' ')[0])
				};
			} else {
				console.error('valid DOM Element expected, received: ' + element);
			}
		},
		dataToView: function (tiedValue, template) {
			var container = template.parentNode, i, nv, ruleData, itemId, rulePath, vs, d, df;

			function shortenListTo(cnt, aid) {
				var a = Array.from(container.querySelectorAll('[data-list-item-aid="' + aid + '"]'));
				while (a.length > cnt) {
					container.removeChild(a.pop());
				}
				return a.length;
			}

			//	TODO: this check should be moved to earlier phase of processing, this requires enhancement of rule API in general
			if (template.nodeName !== 'TEMPLATE') {
				throw new Error('tieList may be defined on template elements only');
			}
			if (!template.dataset.listSourceAid) {
				template.dataset.listSourceAid = new Date().getTime();
			}
			i = shortenListTo(tiedValue.data ? tiedValue.data.length : 0, template.dataset.listSourceAid);
			if (tiedValue.data && i < tiedValue.data.length) {
				ruleData = template.dataset.tieList.trim().split(/\s+/);
				if (!ruleData || ruleData.length !== 3 || ruleData[1] !== '=>') {
					logger.error('invalid parameter for TieList rule specified');
				} else {
					rulePath = ruleData[0];
					itemId = ruleData[2];
					d = template.ownerDocument;
					df = d.createDocumentFragment();
					for (; i < tiedValue.data.length; i++) {
						nv = d.importNode(template.content, true);
						vs = Array.prototype.slice.call(nv.querySelectorAll('*'), 0);
						vs.forEach(function (view) {
							Object.keys(view.dataset).forEach(function (key) {
								if (view.dataset[key].indexOf(itemId + '.') === 0) {
									view.dataset[key] = view.dataset[key].replace(itemId, rulePath + '[' + i + ']');
									viewsService.update(view, key);
								}
							});
						});
						df.appendChild(nv);
						df.lastElementChild.dataset.listItemAid = template.dataset.listSourceAid;
					}
					container.appendChild(df);
				}
			}
		}
	}));

})(this);
