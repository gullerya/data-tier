(function (options) {
	'use strict';

	var domObserver, dataRoot = {}, observers, ties, views, rules, log = {};

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

	function changeListener(ev) {
		var v = ev.target, p, t;

		if (v.dataset.tieValue) {
			p = v.dataset.tieValue;
		} else {
			p = v.dataset.tie;
		}
		if (!p) { log.error('path to data not available'); return; }
		p = pathToNodes(p);
		if (!p) { log.error('path to data is invalid'); return; }
		t = ties.obtain(p.shift());
		if (!t) { log.error('tie not found'); return; }

		if (t.modelChangePreprocessor) {
			//	TODO: add timing out...
			t.modelChangePreprocessor({
				data: t.data,
				path: p,
				view: v
			})
				.then(function (result) {
					setPath(t.data, p, result.value);
				})
				.catch(function () {
					log.info('change was rejected');
				});
		} else {
			setPath(t.data, p, v.value);
		}
	}

	function addChangeListener(v) {
		v.addEventListener('change', changeListener);
	}

	function delChangeListener(v) {
		v.removeEventListener('change', changeListener);
	}

	//	TODO: decide if encapsulate into ViewsManager and expose as API
	function updateView(view, ruleId, path) {
		var ns, t, r, data;
		ns = path.shift();
		t = ties.obtain(ns);
		r = rules.get(ruleId, view);
		if (t && r) {
			data = getPath(t.data, path);
			r.dataToView(view, { data: data });
		}
	}

	function RulesManager() {
		var rs;

		function dfltResolvePath(tieValue) {
			return pathToNodes(tieValue);
		}

		function Rule(id, setup) {
			var vpr, dtv, itd;

			if (typeof setup === 'string') {
				vpr = dfltResolvePath;
				dtv = function (e, s) {
					var d;
					if (s) {
						d = s.data;
						d = typeof d === 'undefined' || d === null ? '' : d;
						setPath(e, setup, d);
					}
				};
				itd = function () { throw new Error('not yet implemented'); };
			} else if (typeof setup === 'function') {
				vpr = dfltResolvePath;
				dtv = setup;
				itd = function () { throw new Error('no "inputToData" functionality defined in this rule'); }
			} else if (typeof setup === 'object') {
				vpr = setup.resolvePath || dfltResolvePath;
				dtv = setup.dataToView;
				itd = setup.inputToData;
			}
			Object.defineProperties(this, {
				id: { value: id },
				resolvePath: { value: vpr },
				dataToView: { value: dtv },
				inputToData: { value: itd }
			});
		}

		function RulesSet() { }
		rs = new RulesSet();
		RulesSet.prototype.tieValue = new Rule('tieValue', 'value');
		RulesSet.prototype.tieText = new Rule('tieText', 'textContent');
		RulesSet.prototype.tiePlaceholder = new Rule('tiePlaceholder', 'placeholder');
		RulesSet.prototype.tieTooltip = new Rule('tieTooltip', 'title');
		RulesSet.prototype.tieImage = new Rule('tieImage', 'scr');
		RulesSet.prototype.tieList = new Rule('tieList', {
			resolvePath: function (tieValue) {
				var ruleData = tieValue.split(' ');
				return pathToNodes(ruleData[0]);
			},
			dataToView: function (view, tieValue) {
				var t = view.getElementsByTagName('template')[0], i, l, nv, ruleData, itemId, rulePath, vs, tmpDF;
				if (!tieValue.data) {
					while (view.childElementCount > 1) {
						view.removeChild(view.lastChild);
					}
				} else if (view.childElementCount - 1 < tieValue.data.length) {
					ruleData = view.dataset.tieList.trim().split(/\s+/);
					if (!ruleData || ruleData.length !== 3 || ruleData[1] !== '=>') {
						log.error('invalid parameter for TieList rule specified');
					} else {
						rulePath = ruleData[0];
						itemId = ruleData[2];
						tmpDF = document.createDocumentFragment();
						for (i = view.childElementCount - 1; i < tieValue.data.length; i++) {
							nv = t.content.cloneNode(true);
							vs = Array.prototype.splice.call(nv.querySelectorAll('*'), 0);
							vs.forEach(function (v) {
								Object.keys(v.dataset).forEach(function (key) {
									if (v.dataset[key].indexOf(itemId) === 0) {
										v.dataset[key] = v.dataset[key].replace(itemId, rulePath + '[' + i + ']');
									}
								});
							});
							tmpDF.appendChild(nv);
						}
					}
					view.appendChild(tmpDF);
				} else if (view.childElementCount - 1 > tieValue.data.length) {
					while (view.childElementCount - 1 > tieValue.data.length) {
						view.removeChild(view.lastChild);
					}
				}
			}
		});

		Object.defineProperties(this, {
			add: {
				value: function (id, setup) {
					if (!id || !setup) throw new Error('bad parameters; f(string, string|function) expected');
					if (id.indexOf('tie') !== 0) throw new Error('rule id MUST begin with "tie"');
					if (rs.hasOwnProperty(id)) throw new Error('rule with id "' + id + '" already exists');
					rs[id] = new Rule(id, setup);
					views.relocateByRule(rs[id]);
					return rs[id];
				}
			},
			get: {
				value: function (id, e) {
					var r = rs[id];
					if (!r && id === 'tie') {
						if (!e) throw new Error('rule "' + id + '" not found, supply DOM element to get the default view');
						if (e.nodeName === 'INPUT' || e.nodeName === 'SELECT') return rs['tieValue'];
						else if (e.nodeName === 'IMAGE') return rs['tieImage'];
						else return rs['tieText'];
					}
					return r;
				}
			},
			del: {
				value: function (id) {
					return delete rs[id];
				}
			}
		});
	};
	rules = new RulesManager();

	function ObserversManager() {
		var os = {};

		function publishDataChange(data, path) {
			var vs = views.get(path), i, l, key, p;
			for (i = 0, l = vs.length; i < l; i++) {
				for (key in vs[i].dataset) {
					if (key.indexOf('tie') === 0) {
						p = rules.get(key, vs[i]).resolvePath(vs[i].dataset[key]);
						if (isPathStartsWith(path, p)) {
							updateView(vs[i], key, p);
						}
					}
				}
			}
		}

		function h(change, ns) {
			var ov = change.oldValue,
				nv = change.object[change.name],
				p = (ns ? ns + '.' : '') + change.name;
			if (ov && typeof ov === 'object') { remove(ov, p); }
			if (nv && typeof nv === 'object') { create(nv, p); }
			publishDataChange(nv, p);
		}

		function s(change, ns) {
			var ov, nv, p = (ns ? ns + '.' : ''), i;
			for (i = 0; i < change.removed.length; i++) {
				ov = change.removed[i];
				if (ov && typeof ov === 'object') { remove(ov, p + (i + change.index)); }
				publishDataChange(null, p);
			}
			for (i = 0; i < change.addedCount; i++) {
				nv = change.object[i + change.index];
				if (nv && typeof nv === 'object') { create(nv, p + (i + change.index)); }
				publishDataChange(nv, p);
			}
			publishDataChange(change.object, p);
		};

		function create(data, namespace) {
			if (typeof data !== 'object') return;
			function oo(changes) {
				changes.forEach(function (change) { h(change, namespace); });
			}
			function ao(changes) {
				changes.forEach(function (change) {
					if (change.type === 'splice') s(change, namespace); else h(change, namespace);
				});
			}
			if (Array.isArray(data)) {
				Array.observe(data, ao, ['add', 'update', 'delete', 'splice']);
				os[namespace] = ao;
			} else {
				Object.observe(data, oo, ['add', 'update', 'delete']);
				os[namespace] = oo;
			}
			Object.keys(data).forEach(function (key) {
				if (data[key] && typeof data[key] === 'object') create(data[key], namespace + '.' + key);
			});
		}

		function remove(data, namespace) {
			var o;
			Object.keys(os).forEach(function (key) {
				if (key !== '') {
					if (key === namespace) o = data;
					else if (key.indexOf(namespace) === 0) o = getPath(data, key.replace(namespace + '.', ''));
					else o = null;
					if (o) {
						if (Array.isArray(o)) Array.unobserve(o, os[key]);
						else Object.unobserve(o, os[key]);
						delete os[key];
					}
				}
			});
		}

		create(dataRoot, '');
	}
	observers = new ObserversManager();

	function TiesManager() {
		var ts = {};

		function Tie(namespace, data) {
			var mChangePrep, vChangePrep;
			Object.defineProperties(this, {
				namespace: { get: function () { return namespace; } },
				data: {
					get: function () { return dataRoot[namespace]; },
					set: function (v) { if (typeof v === 'object') dataRoot[namespace] = v; }
				},
				modelChangePreprocessor: {
					get: function () { return mChangePrep; },
					set: function (v) { if (typeof v === 'function') mChangePrep = v; }
				},
				viewChangePreprocessor: {
					get: function () { return vChangePrep; },
					set: function (v) { if (typeof v === 'function') vChangePrep = v; }
				}
			});
			dataRoot[namespace] = data;
		}

		function create(namespace, data) {
			if (!namespace || typeof namespace !== 'string') throw new Error('namespace (first param) MUST be a non empty string');
			if (/\W/.test(namespace)) throw new Error('namespace (first param) MUST consist of alphanumeric non uppercase characters only');
			if (ts[namespace]) throw new Error('namespace "' + namespace + '" already exists');
			if (data && typeof data !== 'object') throw new Error('data (second param) MUST be a non null object');
			if (!data) data = null;
			return ts[namespace] = new Tie(namespace, data);
		}

		function remove(namespace) {
			console.error('to be implemented');
		}

		function obtain(namespace) {
			return ts[namespace];
		}

		Object.defineProperties(this, {
			create: { value: create },
			obtain: { value: obtain },
			remove: { value: remove }
		});
	}
	ties = new TiesManager();

	function ViewsManager() {
		var vpn = '___vs___', vs = {}, nlvs = {}, vcnt = 0;

		function add(view) {
			var key, path, va, rule;
			if (view.nodeName === 'IFRAME') {
				initDomObserver(view.contentDocument);
				view.addEventListener('load', function () {
					initDomObserver(this.contentDocument);
					collect(this.contentDocument);
				});
				collect(view.contentDocument);
			} else {
				for (key in view.dataset) {
					if (key.indexOf('tie') !== 0) continue;
					rule = rules.get(key, view);
					if (rule) {
						path = rule.resolvePath(view.dataset[key]);
						path.push(vpn);
						va = getPath(vs, path);
						if (!va) setPath(vs, path, (va = []));
						if (va.indexOf(view) < 0) {
							va.push(view);
							path.pop();
							updateView(view, key, path);
							addChangeListener(view);
							vcnt++;
						}
					} else {
						if (!nlvs.key) nlvs[key] = [];
						nlvs.push(view);
					}
				}
			}

		}

		function get(path) {
			var p = pathToNodes(path), r = [], tmp, key;
			tmp = getPath(vs, p);
			tmp && Object.keys(tmp).forEach(function (key) {
				if (key === vpn) Array.prototype.push.apply(r, tmp[key]);
				else Array.prototype.push.apply(r, get(path + '.' + key));
			});
			return r;
		}

		function collect(rootElement) {
			var l;
			if (!rootElement.getElementsByTagName) return;
			l = rootElement.nodeName === 'IFRAME' ?
				l = Array.prototype.splice.call(rootElement.contentDocument.getElementsByTagName('*'), 0) :
				l = Array.prototype.splice.call(rootElement.getElementsByTagName('*'), 0);
			l.push(rootElement);
			l.forEach(add);
			log.info('collected views, current total: ' + vcnt);
		}

		function relocateByRule(rule) {
			if (nlvs[rule.id]) {
				nlvs[rule.id].forEach(add);
			}
			log.info('relocated views, current total: ' + vcnt);
		}

		function discard(rootElement) {
			var l, e, key, path, va, i;
			if (!rootElement || !rootElement.getElementsByTagName) return;
			l = Array.prototype.splice.call(rootElement.getElementsByTagName('*'), 0);
			l.push(rootElement);
			l.forEach(function (e) {
				for (key in e.dataset) {
					i = -1;
					if (key.indexOf('tie') === 0) {
						path = pathToNodes(e.dataset[key]);
						path.push(vpn);
						va = getPath(vs, path);
						i = va && va.indexOf(e);
						if (i >= 0) {
							va.splice(i, 1);
							delChangeListener(e);
							vcnt--;
						}
					}
				};
			});
			log.info('discarded views, current total: ' + vcnt);
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
			relocateByRule: { value: relocateByRule },
			discard: { value: discard },
			move: { value: move },
			get: { value: get }
		});

		collect(document);
	}
	views = new ViewsManager();

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
		Rules: { value: rules },
		Ties: { value: ties }
	});
})((typeof arguments === 'object' ? arguments[0] : undefined));