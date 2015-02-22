//	Below is the final wanted example
//	<div data-tie="users...">
//		<div data-tie="users..[0]">
//			<span data-tie-value="users..name"></span>
//			<span data-tie-color="users..active"></span>
//			<span data-tie-bdate="users[0].birthday"></span>
//		</div>
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
		info: {
			value: function (m) {
				console.info('DT: ' + m);
			},
		},
		warn: {
			value: function (m) {
				console.warn('DT: ' + m);
			}
		},
		error: {
			value: function (m) {
				console.error('DT: ' + m);
			}
		}
	});

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
		var list = pathToNodes(path), i = 0;
		for (; i < list.length; i++) {
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

	function isEqualPaths(p1, p2) {
		var i, l;
		p1 = pathToNodes(p1);
		p2 = pathToNodes(p2);
		if (p1.length !== p2.length) return false;
		for (i = 0, l = p1.length; i < l; i++) {
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
		//	if there is dataset.tieValue || there is dataset.tie and it's value tie - set listener
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

	function collectViews(rootElement) {
		var l, v, b, p, va;

		if (!rootElement.getElementsByTagName) return;
		if (!views) {
			console.info('DT: Starting initial scan for a views...');
			views = {};
			b = performance.now();
		}
		l = Array.prototype.splice.call(rootElement.getElementsByTagName('*'), 0);
		l.push(rootElement);
		l.forEach(function (v) {
			if (v.dataset) {
				Object.keys(v.dataset).forEach(function (k) {
					if (k.indexOf('tie') === 0) {
						p = resolvePath(v, v.dataset[k]);
						va = getPath(views, p);
						if (!va) setPath(views, p, (va = []));
						if (va.indexOf(v) < 0) {
							va.push(v);
							updateView(v, k, p);
							addChangeListener(v);
						}
					}
				});
			}
		});
		b && console.info('DT: Initial scan finished in ' + (performance.now() - b).toFixed(3) + 'ms');
	}

	function discardViews(rootElement) {
		var l, v, p, va, i;
		if (!rootElement.getElementsByTagName) return;
		l = Array.prototype.splice.call(rootElement.getElementsByTagName('*'), 0);
		l.push(rootElement);
		l.forEach(function (v) {
			if (v.dataset) {
				Object.keys(v.dataset).forEach(function (k) {
					i = -1;
					if (k.indexOf('tie') === 0) {
						p = resolvePath(v, v.dataset[k]);
						va = getPath(views, p);
						i = va && va.indexOf(v);
						if (i >= 0) {
							va.splice(i, 1);
							removeEventListener(v);
						}
					}
				});
			}
		});
	}

	function repathView(view, dataKey, oldPath, newPath) {
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

	function publishDataChange(data, path) {
		var vs, p;
		if (typeof data === 'object') {
			Object.keys(data).forEach(function (key) {
				publishDataChange(data[key], path + '.' + key);
			});
		} else {
			vs = getPath(views, path);
			if (vs) {
				vs.forEach(function (v) {
					Object.keys(v.dataset).forEach(function (k) {
						if (k.indexOf('tie') === 0) {
							p = resolvePath(v, v.dataset[k]);
							if (isEqualPaths(p, path)) {
								updateView(v, k, p);
							}
						}
					});
				});
			}
		}
	}

	function destroyDataObservers(data, namespace) {
		var o;
		Object.keys(observers).forEach(function (key) {
			if (key.indexOf(namespace) === 0) {
				o = getPath(data, key.replace(namespace + '.', ''));
				Object.unobserve(o, observers[key]);
			}
		});
	}

	function setupDataObservers(data, namespace) {
		var o;
		o = function (changes) {
			changes.forEach(function (change) {
				var ov = change.oldValue, nv = change.object[change.name], p = namespace + '.' + change.name;
				if (ov && typeof ov === 'object') {
					destroyDataObservers(ov, p);
					console.log(Object.keys(observers).length)
				}
				if (nv && typeof nv === 'object') {
					setupDataObservers(nv, p);
					console.log(Object.keys(observers).length)
				}
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

	function Tie(namespace, data) {
		var rules = new RulesSet();
		Object.defineProperties(this, {
			namespace: { get: function () { return namespace; } },
			data: { get: function () { return data; } },
			addRule: { value: rules.add },
			getRule: { value: rules.get },
			delRule: { value: rules.del }
		});
		ties[namespace] = this;
		dataRoot[namespace] = data;
	}

	setupDataObservers(dataRoot, '');

	collectViews(document);

	function initDomObserver(d) {
		function processDomChanges(changes) {
			if (!views) return;
			changes.forEach(function (change) {
				var an, op, np, i, l;
				if (change.type === 'attributes' && (an = change.attributeName).indexOf('data-tie') == 0) {
					op = change.oldValue;
					np = change.target.getAttribute(an);
					repathView(change.target, dataAttrToProp(change.attributeName), op, np);
				} else if (change.type === 'attributes' && change.attributeName === 'src' && change.target.nodeName === 'IFRAME') {
					discardViews(change.target.contentDocument);
				} else if (change.type === 'childList') {
					if (change.addedNodes.length) {
						for (i = 0, l = change.addedNodes.length; i < l; i++) {
							if (change.addedNodes[i].nodeName === 'IFRAME') {
								initDomObserver(change.addedNodes[i].contentDocument);
								collectViews(change.addedNodes[i].contentDocument);
								change.addedNodes[i].addEventListener('load', function () {
									initDomObserver(this.contentDocument);		//	TODO: check if you need this function, probably once set it will be working regardless reload
									collectViews(this.contentDocument);
								});
							} else {
								collectViews(change.addedNodes[i]);
							}
						}
					}
					if (change.removedNodes.length) {
						for (i = 0, l = change.removedNodes.length; i < l; i++) {
							if (change.removedNodes[i].nodeName === 'IFRAME') {
								discardViews(change.removedNodes[i].contentDocument);
							} else {
								discardViews(change.removedNodes[i]);
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
				if (!data || typeof data !== 'object') throw new Error('data (second param) MUST be a non null object');
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