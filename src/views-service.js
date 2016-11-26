//	this service is the only to work directly with DOM (in addition to the rules)
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