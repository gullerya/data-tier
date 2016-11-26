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
		if (typeof options.parseParam === 'function') { Reflect.defineProperty(this, 'parseParam', { value: options.parseParam }); }
	}
	Rule.prototype.parseParam = function (ruleParam) {
		var dataPath, tieName;
		if (ruleParam) {
			dataPath = ruleParam.split('.');
			tieName = dataPath[0].split(':')[0];
			if (dataPath[0] === tieName) {
				dataPath = [];
			} else {
				dataPath[0] = dataPath[0].replace(tieName + ':', '');
			}
			return {
				tieName: tieName,
				dataPath: dataPath
			};
		} else {
			console.error('valid rule value MUST be a non-empty string, found: ' + ruleParam);
		}
	};

	function addRule(rule) {
		if (!rule || !(rule instanceof Rule)) {
			throw new Error('rule MUST be an object of type Rule');
		}

		rules[rule.name] = rule;
	}

	function getRule(name) {
		return rules[name];
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
	//    }
	//});

	function RulesService(config) {
		internals = config;
		internals.rules = {};

		//	public APIs
		Reflect.defineProperty(this, 'Rule', { value: Rule });
		Reflect.defineProperty(this, 'get', { value: getRule });
		Reflect.defineProperty(this, 'add', { value: addRule });
		Reflect.defineProperty(this, 'remove', { value: removeRule });

		//	internal APIs
		Reflect.defineProperty(internals.rules, 'getApplicable', { value: getApplicable });
	}

	Reflect.defineProperty(scope.DataTier, 'RulesService', { value: RulesService });

})(this);
﻿(function (scope) {
	'use strict';

	function init(internals) {
		var Rule = scope.DataTier.rules.Rule,
			add = scope.DataTier.rules.add

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
			parseParam: function (ruleValue) {
				return Rule.prototype.parseParam(ruleValue.split(/\s*=>\s*/)[0]);
			},
			dataToView: function (tiedValue, template) {
				var container = template.parentNode, i, nv, ruleData, itemId, vs, d, df;

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
						console.error('invalid parameter for "tieList" rule specified');
					} else {
						itemId = ruleData[2];
						d = template.ownerDocument;
						df = d.createDocumentFragment();
						for (; i < tiedValue.data.length; i++) {
							nv = d.importNode(template.content, true);
							vs = Array.prototype.slice.call(nv.querySelectorAll('*'), 0);
							vs.forEach(function (view) {
								Object.keys(view.dataset).forEach(function (key) {
									if (view.dataset[key].indexOf(itemId + '.') === 0) {
										view.dataset[key] = view.dataset[key].replace(itemId, ruleData[0] + '.' + i);
										internals.views.update(view, key);
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
		views = {},
        nlvs = {},
        vcnt = 0;

	//function setPath(ref, path, value) {
	//	var i;
	//	for (i = 0; i < path.length - 1; i++) {
	//		if (typeof ref[path[i]] === 'object') ref = ref[path[i]];
	//		else if (!(path[i] in ref)) ref = (ref[path[i]] = {});
	//		else throw new Error('the path is unavailable');
	//	}
	//	ref[path[i]] = value;
	//}

	function getPath(ref, path) {
		var i;
		if (!ref) return;
		for (i = 0; i < path.length; i++) {
			ref = ref[path[i]];
			if (!ref) return;
		}
		return ref;
	}

	function changeListener(event) {
		var t;

		internals.rules.getApplicable(event.target).forEach(function (rule) {
			if (rule.name === 'tieValue') {
				var ruleParam = rule.parseParam(event.target.dataset[rule.name]),
					tie = scope.DataTier.ties.get(ruleParam.tieName);
				if (!ruleParam.dataPath) { console.error('path to data not available'); return; }
				if (!tie) { console.error('tie "' + ruleParam.tieName + '" not found'); return; }

				tie.viewToDataProcessor({ data: tie.data, path: ruleParam.dataPath, view: event.target });
			}
		});
	}

	function addChangeListener(view) {
		if (view.nodeName === 'INPUT' || view.nodeName === 'SELECT') {
			view.addEventListener('change', changeListener);
		}
	}

	function delChangeListener(v) {
		v.removeEventListener('change', changeListener);
	}

	function add(view) {
		if (view.nodeName === 'IFRAME') {
			initDocumentObserver(view.contentDocument);
			view.addEventListener('load', function () {
				initDocumentObserver(this.contentDocument);
				collect(this.contentDocument);
			});
			collect(view.contentDocument);
		} else {
			internals.rules.getApplicable(view).forEach(function (rule) {
				var ruleParam = rule.parseParam(view.dataset[rule.name]),
					pathString = ruleParam.dataPath.join('.'),
					tieViews,
					ruleViews,
					pathViews;

				//	get tie views partition
				if (!views[ruleParam.tieName]) {
					views[ruleParam.tieName] = {};
				}
				tieViews = views[ruleParam.tieName];

				//	get rule views partition (in tie)
				if (!tieViews[rule.name]) {
					tieViews[rule.name] = {};
				}
				ruleViews = tieViews[rule.name];

				//	get path views in this context
				if (!ruleViews[pathString]) {
					ruleViews[pathString] = [];
				}
				pathViews = ruleViews[pathString];

				if (pathViews.indexOf(view) < 0) {
					pathViews.push(view);
					update(view, rule.name);
					addChangeListener(view);
					vcnt++;
				}
			});

			//	collect potentially future rules element and put them into some tracking storage
			for (var key in view.dataset) {
				if (key.indexOf('tie') === 0 && !scope.DataTier.rules.get(key)) {
					console.warn('non-registerd rule "' + key + '" used, it may still be defined later in code and post-tied');
					if (!nlvs[key]) nlvs[key] = [];
					nlvs[key].push(view);
				}
			}
		}
	}

	//function get(path) {
	//	var p = Array.isArray(p) ? p : p.split('.'), r = [], tmp, key;
	//	tmp = getPath(vs, p);
	//	if (tmp) {
	//		Object.keys(tmp).forEach(function (key) {
	//			if (key === vpn) Array.prototype.push.apply(r, tmp[key]);
	//			else Array.prototype.push.apply(r, get(path + '.' + key));
	//		});
	//	}
	//	return r;
	//}

	function update(view, ruleName) {
		var r, p, t, data;
		r = scope.DataTier.rules.get(ruleName);
		p = r.parseParam(view.dataset[ruleName]);
		t = scope.DataTier.ties.get(p.tieName);
		if (t) {
			data = getPath(t.data, p.dataPath);
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

	//function relocateByRule(rule) {
	//	if (nlvs[rule.id]) {
	//		nlvs[rule.id].forEach(add);
	//	}
	//	console.info('relocated views, current total: ' + vcnt);
	//}

	function discard(rootElement) {
		var l, param, pathViews, i;
		if (!rootElement || !rootElement.getElementsByTagName) return;
		l = Array.prototype.slice.call(rootElement.getElementsByTagName('*'), 0);
		l.push(rootElement);
		l.forEach(function (e) {
			internals.rules.getApplicable(e).forEach(function (rule) {
				param = rule.parseParam(e.dataset[rule.name]);
				pathViews = views[param.tieName][rule.name][param.dataPath.join('.')];
				i = pathViews.indexOf(e);
				if (i >= 0) {
					pathViews.splice(i, 1);
					delChangeListener(e);
					vcnt--;
				}
			});
		});
		console.info('discarded views, current total: ' + vcnt);
	}

	function move(view, ruleName, oldParam, newParam) {
		var ruleParam, pathViews, i = -1;

		ruleParam = scope.DataTier.rules.get(ruleName).parseParam(oldParam);

		//	delete old path
		if (views[ruleParam.tieName] && views[ruleParam.tieName][ruleName]) {
			pathViews = views[ruleParam.tieName][ruleName][ruleParam.dataPath];
			if (pathViews) i = pathViews.indexOf(view);
			if (i >= 0) {
				pathViews.splice(i, 1);
			}
		}

		//	add new path
		ruleParam = scope.DataTier.rules.get(ruleName).parseParam(newParam);
		if (!views[ruleParam.tieName]) views[ruleParam.tieName] = {};
		if (!views[ruleParam.tieName][ruleName]) views[ruleParam.tieName][ruleName] = {};
		if (!views[ruleParam.tieName][ruleName][ruleParam.dataPath]) views[ruleParam.tieName][ruleName][ruleParam.dataPath] = [];
		views[ruleParam.tieName][ruleName][ruleParam.dataPath].push(view);
		update(view, ruleName);
	}

	function processChanges(tieName, changes) {
		var tieViews = views[tieName], ruleViews, pathString;
		changes.forEach(function (change) {
			pathString = change.path.join('.');
			Object.keys(tieViews).forEach(function (ruleName) {
				ruleViews = tieViews[ruleName];
				if (ruleViews) {
					Object.keys(ruleViews).forEach(function (path) {
						if (path.indexOf(pathString) === 0) {
							ruleViews[path].forEach(function (view) {
								update(view, ruleName);
							});
						}
					});
				}
			});
		});
	}

	function dataAttrToProp(v) {
		var i = 2, l = v.split('-'), r;
		r = l[1];
		while (i < l.length) r += l[i][0].toUpperCase() + l[i++].substr(1);
		return r;
	}

	function initDocumentObserver(d) {
		function processDomChanges(changes) {
			changes.forEach(function (change) {
				var tp = change.type, tr = change.target, an = change.attributeName, i, l;
				if (tp === 'attributes' && an.indexOf('data-tie') === 0) {
					move(tr, dataAttrToProp(an), change.oldValue, tr.getAttribute(an));
				} else if (tp === 'attributes' && an === 'src' && tr.nodeName === 'IFRAME') {
					discard(tr.contentDocument);
				} else if (tp === 'childList') {
					if (change.addedNodes.length) {
						for (i = 0, l = change.addedNodes.length; i < l; i++) {
							if (change.addedNodes[i].nodeName === 'IFRAME') {
								if (change.addedNodes[i].contentDocument) {
									initDocumentObserver(change.addedNodes[i].contentDocument);
									collect(change.addedNodes[i].contentDocument);
								}
								change.addedNodes[i].addEventListener('load', function () {
									initDocumentObserver(this.contentDocument);
									collect(this.contentDocument);
								});
							} else {
								collect(change.addedNodes[i]);
							}
						}
					}
					if (change.removedNodes.length) {
						for (i = 0, l = change.removedNodes.length; i < l; i++) {
							if (change.removedNodes[i].nodeName === 'IFRAME') {
								discard(change.removedNodes[i].contentDocument);
							} else {
								discard(change.removedNodes[i]);
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

	function init() {
		initDocumentObserver(document);
		collect(document);
	}

	function ViewsService(config) {
		internals = config;
		internals.views = {};

		//	internal APIs
		Reflect.defineProperty(internals.views, 'init', { value: init });
		Reflect.defineProperty(internals.views, 'processChanges', { value: processChanges });
		//Reflect.defineProperty(internals.views, 'relocateByRule', { value: relocateByRule });
		//Reflect.defineProperty(internals.views, 'discard', { value: discard });
		//Reflect.defineProperty(internals.views, 'move', { value: move });
		//Reflect.defineProperty(internals.views, 'get', { value: get });
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
	Reflect.defineProperty(scope.DataTier, 'rules', { value: new scope.DataTier.RulesService(config) });
	Reflect.defineProperty(scope.DataTier, 'views', { value: new scope.DataTier.ViewsService(config) });

	scope.DataTier.initVanillaRules(config);
	config.views.init();

})(this);
