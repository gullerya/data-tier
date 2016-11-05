//	this service is the only to work directly with DOM (in addition to the rules)
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