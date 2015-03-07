//	Below is the final wanted example
//	<div data-tie="users...">
//		<div data-tie="users..[0]">
//			<span data-tie-value="users..name"></span>
//			<span data-tie-color="users..active"></span>
//			<span data-tie-bdate="users[0].birthday"></span>
//		</div>
//	</div>
//
//	Repeaters API
//
//	<div id="container" data-tie-array-container="each in users">
//		<template>
//			<span data-tie="..name"></span>
//		</template>
//	</div>
//
//	TODO: when binding data check that the corresponding views are not pointing on properties of type 'object', but primitives only
//	TODO: as the above, but do provide listing handling for the arrays (create DOM from template)
//
(function (options) {
	'use strict';

	var domObserver, dataRoot = {}, observers = {}, ties = {}, views, log = {};

	if (typeof options !== 'object') { options = {}; }
	if (typeof options.namespace !== 'object') {
		if (typeof window.Utils !== 'object') Object.defineProperty(window, 'Utils', { value: {} });
		options.namespace = window.Utils;
	}

	Object.defineProperties(log, {
		info: { value: function (m) { console.info('DT: ' + m); }, },
		warn: { value: function (m) { console.warn('DT: ' + m); } },
		error: { value: function (m) { console.error('DT: ' + m); } }
	});

	function ObserversManager() {
		Object.defineProperties(this, {

		});
	}
	observers = new ObserversManager();

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
				n.length && r.push(n);
				n = '';
			} else if (value[c] === '[') {
				if (b) throw new Error('bad path: "' + value + '", at: ' + c);
				n.length && r.push(n);
				n = '';
				b = true;
			} else if (value[c] === ']') {
				if (!b) throw new Error('bad path: "' + value + '", at: ' + c);
				n.length && r.push(n);
				n = '';
				b = false;
			} else {
				n += value[c];
			}
			c++;
		}
		n.length && r.push(n);
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
		list = pathToNodes(path)
		for (i = 0; i < list.length; i++) {
			if (list[i] in ref) ref = ref[list[i]];
			else return;
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

	function isPathStartsWith(p1, p2) {
		var i, l;
		p1 = pathToNodes(p1);
		p2 = pathToNodes(p2);
		l = Math.min(p1.length, p2.length);
		for (i = 0; i < l; i++) {
			if (p1[i] !== p2[i]) return false;
		}
		return true;
	}

	function resolvePath(e, p) {
		//	TODO: add support for composite paths, means also API notice of partial part being processed
		return pathToNodes(p);
	}

	function changeListener(ev) {
		var v = ev.target, p, t;

		if (v.dataset.tieValue) {
			p = v.dataset.tieValue;
		} else {
			p = v.dataset.tie;
		}
		if (p) {
			p = resolvePath(v, p);
			t = ties[p.shift()];
			setPath(t.data, p, v.value);
		}
	}

	function addChangeListener(v) {
		v.addEventListener('change', changeListener);
	}

	function delChangeListener(v) {
		v.removeEventListener('change', changeListener);
	}

	function updateView(view, rule, path) {
		var ns = path.shift(), t = ties[ns], r, data;
		if (t) {
			r = t.getRule(rule, view);
			data = getPath(t.data, path);
			r.apply(view, data);
		}
	}

	function publishDataChange(data, path) {
		var vs = views.get(path), i, l, key, p;
		for (i = 0, l = vs.length; i < l; i++) {
			for (key in vs[i].dataset) {
				if (key.indexOf('tie') === 0) {
					p = resolvePath(vs[i], vs[i].dataset[key]);
					if (isPathStartsWith(path, p)) {
						updateView(vs[i], key, p);
					}
				}
			}
		}
	}

	function destroyDataObservers(data, namespace) {
		var o;
		Object.keys(observers).forEach(function (key) {
			if (key !== '') {
				if (key === namespace) o = data;
				else if (key.indexOf(namespace) === 0) o = getPath(data, key.replace(namespace + '.', ''));
				else o = null;
				if (o) {
					Object.unobserve(o, observers[key]);
					delete observers[key];
				}
			}
		});
	}

	function setupDataObservers(data, namespace) {
		var o;
		o = function (changes) {
			changes.forEach(function (change) {
				var ov = change.oldValue,
					nv = change.object[change.name],
					p = (namespace ? namespace + '.' : '') + change.name;
				if (ov && typeof ov === 'object') { destroyDataObservers(ov, p); }
				if (nv && typeof nv === 'object') { setupDataObservers(nv, p); }
				typeof nv !== 'undefined' && publishDataChange(nv, p);
			});
		};
		observers[namespace] = o;
		Object.observe(data, o, ['add', 'update', 'delete']);
		Object.keys(data).forEach(function (key) {
			if (data[key] && typeof data[key] === 'object') setupDataObservers(data[key], namespace + '.' + key);
		});
	}

	function Rule(id, setup) {
		var p, a;
		if (typeof setup === 'function') { a = setup; } else {
			p = pathToNodes(setup);
			a = function (v, d) { setPath(v, p, d); };
		}
		Object.defineProperties(this, {
			apply: { value: a }
		});
	}

	function RulesSet() {
		var s = this;
		Object.defineProperties(s, {
			add: {
				value: function (id, setup) {
					if (!id || !setup) throw new Error('bad parameters; f(string, string|function) expected');
					if (id.indexOf('tie') !== 0) throw new Error('rule id MUST begin with "tie"');
					if (s.hasOwnProperty(id) && s[id] instanceof Rule) throw new Error('rule with id "' + id + '" already exists');
					if (s.hasOwnProperty(id)) throw new Error('"' + id + '" is a reserved property');
					return s[id] = new Rule(id, setup);
				}
			},
			get: {
				value: function (id, e) {
					var r = s[id];
					if (!r) {
						if (!e) throw new Error('rule "' + id + '" not found, supply DOM element to get the default view');
						if (e.nodeName === 'INPUT' || e.nodeName === 'SELECT') return s['tieValue'];
						else if (e.nodeName === 'IMAGE') return s['tieImage'];
						else return s['tieText'];
					}
					return r;
				}
			},
			del: { value: function (id) { return delete s[id]; } }
		});
	}
	RulesSet.prototype = new RulesSet();
	RulesSet.prototype.add('tieValue', 'value');
	RulesSet.prototype.add('tieText', 'textContent');
	RulesSet.prototype.add('tiePlaceholder', 'placeholder');
	RulesSet.prototype.add('tieTooltip', 'title');
	RulesSet.prototype.add('tieImage', 'scr');

	function ViewsManager() {
		var vpn = '___vs___', vs = {};

		function add(view) {
			var key, path, va;
			for (key in view.dataset) {
				if (key.indexOf('tie') !== 0) continue;
				path = resolvePath(view, view.dataset[key]);
				path.push(vpn);
				va = getPath(vs, path);
				if (!va) setPath(vs, path, (va = []));
				if (va.indexOf(view) < 0) {
					va.push(view);
					path.pop();
					updateView(view, key, path);
					addChangeListener(view);
				}
			}
		}

		function get(path) {
			var p = pathToNodes(path), r = arguments[1] ? arguments[1] : [], tmp, key;
			tmp = getPath(vs, p);
			if (tmp) {
				for (key in tmp) {
					if (key === vpn) Array.prototype.push.apply(r, tmp[key]);
					else Array.prototype.push.apply(r, get(path + '.' + key, r));
				}
			}
			return r;
		}

		function collect(rootElement) {
			var l;
			if (!rootElement.getElementsByTagName) return;
			l = Array.prototype.splice.call(rootElement.getElementsByTagName('*'), 0);
			l.push(rootElement);
			l.forEach(add);
		}

		function discard(rootElement) {
			var l, e, key, path, va, i;
			if (!rootElement.getElementsByTagName) return;
			l = Array.prototype.splice.call(rootElement.getElementsByTagName('*'), 0);
			l.push(rootElement);
			l.forEach(function (e) {
				for (key in e.dataset) {
					i = -1;
					if (key.indexOf('tie') === 0) {
						path = resolvePath(e, e.dataset[key]);
						path.push(vpn);
						va = getPath(vs, path);
						i = va && va.indexOf(e);
						if (i >= 0) {
							va.splice(i, 1);
							removeEventListener(e);
						}
					}
				};
			});
		}

		function move(view, dataKey, oldPath, newPath) {
			var pathViews, i = -1, npn;

			//	delete old path
			if (oldPath) {
				pathViews = getPath(views, oldPath);
				if (pathViews) i = pathViews.indexOf(view);
				if (i >= 0) pathViews.splice(i, 1);
			}

			//	add new path
			npn = pathToNodes(newPath);
			if (!getPath(views, npn)) setPath(views, npn, []);
			getPath(views, npn).push(view);
			updateView(view, dataKey, npn)
		}

		Object.defineProperties(this, {
			collect: { value: collect },
			discard: { value: discard },
			move: { value: move },
			get: { value: get }
		});
	}
	views = new ViewsManager();
	views.collect(document);

	function Tie(namespace, data) {
		var rules = new RulesSet();
		Object.defineProperties(this, {
			namespace: { get: function () { return namespace; } },
			data: {
				get: function () { return dataRoot[namespace]; },
				set: function (value) { if (typeof value === 'object') dataRoot[namespace] = value; }
			},
			addRule: { value: rules.add },
			getRule: { value: rules.get },
			delRule: { value: rules.del }
		});
		ties[namespace] = this;
		dataRoot[namespace] = data;
	}

	setupDataObservers(dataRoot, '');

	function initDomObserver(d) {
		function processDomChanges(changes) {
			changes.forEach(function (change) {
				var tp = change.type, tr = change.target, an = change.attributeName, i, l;
				if (tp === 'attributes' && an.indexOf('data-tie') == 0) {
					views.move(tr, dataAttrToProp(an), change.oldValue, tr.getAttribute(an));
				} else if (tp === 'attributes' && an === 'src' && tr.nodeName === 'IFRAME') {
					views.discard(tr.contentDocument);
				} else if (tp === 'childList') {
					if (change.addedNodes.length) {
						for (i = 0, l = change.addedNodes.length; i < l; i++) {
							if (change.addedNodes[i].nodeName === 'IFRAME') {
								initDomObserver(change.addedNodes[i].contentDocument);
								views.collect(change.addedNodes[i].contentDocument);
								change.addedNodes[i].addEventListener('load', function () {
									initDomObserver(this.contentDocument);
									views.collect(this.contentDocument);
								});
							} else {
								views.collect(change.addedNodes[i]);
							}
						}
					}
					if (change.removedNodes.length) {
						for (i = 0, l = change.removedNodes.length; i < l; i++) {
							if (change.removedNodes[i].nodeName === 'IFRAME') {
								views.discard(change.removedNodes[i].contentDocument);
							} else {
								views.discard(change.removedNodes[i]);
							}
						}
					}
				}
			});
		};

		domObserver = new MutationObserver(processDomChanges);
		domObserver.observe(d, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeOldValue: true,
			characterData: false,
			characterDataOldValue: false
		});
	};
	initDomObserver(document);

	Object.defineProperty(options.namespace, 'DataTier', { value: {} });
	Object.defineProperties(options.namespace.DataTier, {
		tieData: {
			value: function (namespace, data) {
				if (!namespace || typeof namespace !== 'string') throw new Error('namespace (first param) MUST be a non empty string');
				if (/\W/.test(namespace)) throw new Error('namespace (first param) MUST consist of alphanumeric non uppercase characters only');
				if (ties[namespace]) throw new Error('namespace "' + namespace + '" already exists');
				if (data && typeof data !== 'object') throw new Error('data (second param) MUST be a non null object');
				if (!data) data = null;
				return new Tie(namespace, data);
			}
		},
		getTie: {
			value: function (namespace) {
				return ties[namespace];
			}
		},
		untie: { value: function () { console.error('to be implemented'); } },
	});
})((typeof arguments === 'object' ? arguments[0] : undefined));