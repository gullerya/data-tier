(function (scope) {
	'use strict';

	var internals, ties = {};

	if (!scope.DataTier) { Reflect.defineProperty(scope, 'DataTier', { value: {} }); }

	function Tie(name, observable, options) {
		var data;

		function observer(changes) {
			internals.views.processChanges(name, changes);
		}

		if (options && typeof options === 'object') {
			//	TODO: process options
		}

		Reflect.defineProperty(this, 'name', { value: name });
		Reflect.defineProperty(this, 'data', {
			get: function () { return data; },
			set: function (observable) {
				validateObservable(observable)
				if (data) {
					data.revoke();
				}

				data = observable;
				data.observe(observer);
			}
		});

		this.data = observable;
	}

	function create(name, observable, options) {
		validateTieName(name);
		validateObservable(observable);
		if (ties[name]) {
			throw new Error('existing tie (' + name + ') MAY NOT be re-created, use the tie\'s own APIs to reconfigure it');
		}

		return (ties[name] = new Tie(name, observable, options));
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

	function validateObservable(observable) {
		if (!observable ||
				typeof observable !== 'object' ||
				typeof observable.observe !== 'function' ||
				typeof observable.unobserve !== 'function' ||
				typeof observable.revoke !== 'function') {
			throw new Error(observable + ' is not a valid Observable');
		}
	}

	//function isPathStartsWith(p1, p2) {
	//	var i, l;
	//	l = Math.min(p1.length, p2.length);
	//	for (i = 0; i < l; i++) {
	//		if (p1[i] !== p2[i]) return false;
	//	}
	//	return true;
	//}

	//function observer(changes) {
	//	changes.forEach(function (change) {
	//		var path = change.path.slice();

	//		//	retrieve all views from this path and below
	//		//	update all views accordingly to the new value
	//		//	transfer update to update service
	//		//	later use the specific data of the event to optimize update
	//		api.viewsService.update()

	//		var vs = api.viewsService.get(path), i, l, key, p;
	//		for (i = 0, l = vs.length; i < l; i++) {
	//			for (key in vs[i].dataset) {
	//				if (key.indexOf('tie') === 0) {
	//					p = api.rulesService.getRule(key).parseValue(vs[i]).dataPath;
	//					if (isPathStartsWith(path, p)) {
	//						//	TODO: use the knowledge of old value and new value here, rules like list may optimize for that
	//						//	TODO: yet, myst pass via the formatters/vizualizers of Rule/Tie
	//						api.viewsService.update(vs[i], key);
	//					}
	//				}
	//			}
	//		}
	//	});
	//}

	function TiesService(config) {
		internals = config;
		Reflect.defineProperty(this, 'get', { value: function (name) { return ties[name]; } });
		Reflect.defineProperty(this, 'create', { value: create });
		Reflect.defineProperty(this, 'remove', { value: remove });
	}

	Reflect.defineProperty(scope.DataTier, 'TiesService', { value: TiesService });

})(this);
﻿(function (scope) {
	'use strict';

	var internals, rules = {};

	if (!scope.DataTier) { Reflect.defineProperty(scope, 'DataTier', { value: {} }); }

	function Rule(name, options) {
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
			var ruleValue = element.dataset[this.name], dataPath, tieName;
			if (ruleValue) {
				dataPath = ruleValue.split('.');
				tieName = dataPath[0].split(':')[0];
				dataPath[0] = dataPath[0].replace(tieName + ':', '');
				return {
					tieName: tieName,
					dataPath: dataPath
				};
			} else {
				console.error('valid rule value MUST be non-empty string, found: ' + ruleValue);
			}
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

	function getApplicable(element) {
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

	function RulesService(config) {
		internals = config;
		internals.rules = {};
		Reflect.defineProperty(this, 'Rule', { value: Rule });
		Reflect.defineProperty(this, 'get', { value: getRule });
		Reflect.defineProperty(this, 'add', { value: addRule });
		Reflect.defineProperty(this, 'remove', { value: removeRule });
		Reflect.defineProperty(internals.rules, 'getApplicable', { value: getApplicable });
	}

	Reflect.defineProperty(scope.DataTier, 'RulesService', { value: RulesService });

})(this);
﻿(function (scope) {
	'use strict';

	function init(config) {
		var Rule = scope.DataTier.rules.Rule,
			add = scope.DataTier.rules.add

		add(new Rule('tie', {
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

		add(new Rule('tieValue', {
			dataToView: function (data, view) {
				view.value = data;
			}
		}));

		add(new Rule('tieText', {
			dataToView: function (data, view) {
				view.textContent = data;
			}
		}));

		add(new Rule('tiePlaceholder', {
			dataToView: function (data, view) {
				view.placeholder = data;
			}
		}));

		add(new Rule('tieTooltip', {
			dataToView: function (data, view) {
				view.title = data;
			}
		}));

		add(new Rule('tieImage', {
			dataToView: function (data, view) {
				view.src = data;
			}
		}));

		add(new Rule('tieDateValue', {
			dataToView: function (data, view) {
				view.value = data.toLocaleString();
			}
		}));

		add(new Rule('tieDateText', {
			dataToView: function (data, view) {
				view.textContent = data.toLocaleString();
			}
		}));

		add(new Rule('tieList', {
			parseValue: function (element) {
				if (element && element.nodeType === Node.ELEMENT_NODE) {
					return Rule.prototype.parseValue(element.dataset[this.name]);
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
						console.error('invalid parameter for TieList rule specified');
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
										config.views.update(view, key);
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
	}

	Reflect.defineProperty(scope.DataTier, 'initVanillaRules', { value: init });

})(this);
﻿//	this service is the only to work directly with DOM (in addition to the rules)
//	this service will hold, watch, maintain all of the elements detected as views
//	this service will provide means to collect, update views
//	views map: {} of keys, where key is tie ID and value is another {}
//	another {} is where key is a path and the value is {}: 

(function (scope) {
	'use strict';

	if (!scope.DataTier) { Reflect.defineProperty(scope, 'DataTier', { value: {} }); }

	var internals,
        vpn = '___vs___',
        vs = {},
        nlvs = {},
        vcnt = 0;

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
		t = internals.ties.obtain(tn);
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
			internals.rules.getApplicable(view).forEach(function (rule) {
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
		r = scope.DataTier.rules.get(ruleName);
		p = r.parseValue(view).dataPath;
		t = scope.DataTier.ties.get(p.shift());
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
		var l, key, rule, path, va, i;
		if (!rootElement || !rootElement.getElementsByTagName) return;
		l = Array.prototype.slice.call(rootElement.getElementsByTagName('*'), 0);
		l.push(rootElement);
		l.forEach(function (e) {
			for (key in e.dataset) {
				i = -1;
				if (key.indexOf('tie') === 0) {
					rule = scope.DataTier.rules.get(key);
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

	function processChanges(tieName, changes) {
		console.log(tieName, changes);
		changes.forEach(function (change) {
			//	get all relevant views by path and below
			//	update all from the new value
		});
	}

	function ViewsService(config) {
		internals = config;
		internals.views = {};
		Reflect.defineProperty(internals.views, 'collect', { value: collect });
		Reflect.defineProperty(internals.views, 'processChanges', { value: processChanges });
		Reflect.defineProperty(internals.views, 'relocateByRule', { value: relocateByRule });
		Reflect.defineProperty(internals.views, 'discard', { value: discard });
		Reflect.defineProperty(internals.views, 'move', { value: move });
		Reflect.defineProperty(internals.views, 'get', { value: get });
	}

	Reflect.defineProperty(scope.DataTier, 'ViewsService', { value: ViewsService });

})(this);
(function DataTier(scope) {
	'use strict';

	var config = {};

	if (typeof scope.DataTier !== 'object') { throw new Error('DataTier initialization faile: "DataTier" namespace not found'); }
	if (typeof scope.DataTier.TiesService !== 'function') { throw new Error('DataTier initialization failed: "TiesService" not found'); }
	if (typeof scope.DataTier.ViewsService !== 'function') { throw new Error('DataTier initialization failed: "ViewsService" not found'); }
	if (typeof scope.DataTier.RulesService !== 'function') { throw new Error('DataTier initialization failed: "RulesService" not found'); }

	Reflect.defineProperty(scope.DataTier, 'ties', { value: new scope.DataTier.TiesService(config) });
	Reflect.defineProperty(scope.DataTier, 'views', { value: new scope.DataTier.ViewsService(config) });
	Reflect.defineProperty(scope.DataTier, 'rules', { value: new scope.DataTier.RulesService(config) });

	function dataAttrToProp(v) {
		var i = 2, l = v.split('-'), r;
		r = l[1];
		while (i < l.length) r += l[i][0].toUpperCase() + l[i++].substr(1);
		return r;
	}

	//function setPath(ref, path, value) {
	//	var list = pathToNodes(path), i;
	//	for (i = 0; i < list.length - 1; i++) {
	//		if (typeof ref[list[i]] === 'object') ref = ref[list[i]];
	//		else if (!(list[i] in ref)) ref = (ref[list[i]] = {});
	//		else throw new Error('the path is unavailable');
	//	}
	//	ref[list[i]] = value;
	//}

	//function getPath(ref, path) {
	//	var list, i;
	//	if (!ref) return;
	//	list = pathToNodes(path);
	//	for (i = 0; i < list.length; i++) {
	//		ref = ref[list[i]];
	//		if (!ref) return;
	//	}
	//	return ref;
	//}

	//function cutPath(ref, path) {
	//	var list = pathToNodes(path), i = 0, value;
	//	for (; i < list.length - 1; i++) {
	//		if (list[i] in ref) ref = ref[list[i]];
	//		else return;
	//	}
	//	value = ref[list[i - 1]];
	//	delete ref[list[i - 1]];
	//	return value;
	//}

	//	TODO: move this to the views service
	function initDocumentObserver(d) {
		function processDomChanges(changes) {
			changes.forEach(function (change) {
				var tp = change.type, tr = change.target, an = change.attributeName, i, l;
				if (tp === 'attributes' && an.indexOf('data-tie') === 0) {
					config.views.move(tr, dataAttrToProp(an), change.oldValue, tr.getAttribute(an));
				} else if (tp === 'attributes' && an === 'src' && tr.nodeName === 'IFRAME') {
					config.views.discard(tr.contentDocument);
				} else if (tp === 'childList') {
					if (change.addedNodes.length) {
						for (i = 0, l = change.addedNodes.length; i < l; i++) {
							if (change.addedNodes[i].nodeName === 'IFRAME') {
								if (change.addedNodes[i].contentDocument) {
									initDocumentObserver(change.addedNodes[i].contentDocument);
									config.views.collect(change.addedNodes[i].contentDocument);
								}
								change.addedNodes[i].addEventListener('load', function () {
									initDocumentObserver(this.contentDocument);
									config.views.collect(this.contentDocument);
								});
							} else {
								config.views.collect(change.addedNodes[i]);
							}
						}
					}
					if (change.removedNodes.length) {
						for (i = 0, l = change.removedNodes.length; i < l; i++) {
							if (change.removedNodes[i].nodeName === 'IFRAME') {
								config.views.discard(change.removedNodes[i].contentDocument);
							} else {
								config.views.discard(change.removedNodes[i]);
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
	}
	initDocumentObserver(document);

	scope.DataTier.initVanillaRules(config);

	config.views.collect(document);

})(this);
