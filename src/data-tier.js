(function (options) {
	'use strict';

	var domObserver, ties = {}, views;

	if (typeof options !== 'object') { options = {}; }
	if (typeof options.namespace !== 'object') {
		if (typeof window.Utils !== 'object') Object.defineProperty(window, 'Utils', { value: {} });
		options.namespace = window.Utils;
	}

	function pathToNodes(value) {
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

	function publishData(data, path) {
		var vs;
		if (typeof data === 'object') {
			Object.keys(data).forEach(function (key) {
				publishData(data[key], path + '.' + key);
			});
		} else {
			vs = getPath(views, path);
			if (vs) {
				vs.forEach(function (view) {
					//	TODO: expand the visualization to many destinations
					view.textContent = data;
				});
			}
		}
	}

	function destroyDataObservers(data, namespace, observers) {
		var o;
		Object.keys(observers).forEach(function (key) {
			if (key.indexOf(namespace) === 0) {
				o = getPath(data, key.replace(namespace + '.', ''));
				Object.unobserve(o, observers[key]);
			}
		});
	}

	function setupDataObservers(data, namespace, observers) {
		var o;
		o = function (changes) {
			changes.forEach(function (change) {
				var ov = change.oldValue, nv = change.object[change.name], p = namespace + '.' + change.name;
				if (ov && typeof ov === 'object') {
					destroyDataObservers(ov, p, observers);
					console.log(observers.length)
				}
				if (nv && typeof nv === 'object') {
					setupDataObservers(nv, p, observers);
					console.log(observers.length)
				}
				nv && publishData(nv, p);
			});
		};
		observers[namespace] = o;
		Object.observe(data, o, ['add', 'update', 'delete']);
		Object.keys(data).forEach(function (key) {
			if (data[key] && typeof data[key] === 'object') setupDataObservers(data[key], namespace + '.' + key, observers);
		});
	}

	function collectViews(rootElement) {
		var i, n, b;
		b = performance.now();
		if (!views) {
			console.info('DT: Starting initial scan for a views...');
			views = {};
		} else {
			console.info('DT: Starting scan for a views...');
		}
		i = document.createNodeIterator(rootElement, NodeFilter.SHOW_DOCUMENT | NodeFilter.SHOW_DOCUMENT_FRAGMENT | NodeFilter.SHOW_ELEMENT);
		while (i.nextNode()) {
			n = i.referenceNode;
			if (!n.dataset) continue;
			Object.keys(n.dataset).forEach(function (key) {
				if (/^tie([A-Z]|$)/.test(key)) {
					if (!getPath(views, n.dataset[key])) setPath(views, n.dataset[key], []);
					getPath(views, n.dataset[key]).push(n);
				}
			});
		}
		console.info('DT: Scan finished in ' + (performance.now() - b).toFixed(3) + 'ms');
	}

	function Tie(options) {
		if (!options || typeof options !== 'object') throw new Error('options MUST be a non null object');
		if (!options.namespace || typeof options.namespace !== 'string') throw new Error('options.namespace MUST be a non empty string');
		if (/\W|[A-Z]/.test(options.namespace)) throw new Error('options.namespace MUST consist of alphanumeric non uppercase characters only');
		if (ties[options.namespace]) throw new Error('namespace "' + options.namespace + '" already exists');
		if (!options.data || typeof options.data !== 'object') throw new Error('options.data MUST be a non null object');

		var namespace = options.namespace,
			data = options.data,
			observers = {};

		ties[namespace] = this;
		setupDataObservers(data, namespace, observers);
		if (!views) collectViews(document);			//	TODO: rethink if this is the appropriate place (ALL of the views will be collected here)
		publishData(data, namespace);

		Object.defineProperties(this, {
			namespace: { get: function () { return namespace; } },
			data: { get: function () { return data; } },
			untie: {
				value: function () {
					console.info('to be implemented');
				}
			}
		});
	}

	(function initDomObserver() {
		function processDomChanges(changes) {
			if (!views) return;
			changes.forEach(function (change) {
				var path, i, l;
				if (change.type === 'attributes') {
					//path = change.target.getAttribute(FULL_PATH_ATTRIBUTE);
					//if (path) {
					//	publishToElement(getPath(root, path), change.target);
					//}
				} else if (change.type === 'childList') {
					if (change.addedNodes.length) {
						//	traverse all added nodes and add any relevant to ties
						for (i = 0, l = change.addedNodes.length; i < l; i++) {
							//	updateElementTree(change.addedNodes[i]);
						}
					}
					if (change.removedNodes.length) {
						//	traverse all deleted nodes and remove any relevant from ties
						for (i = 0, l = change.addedNodes.length; i < l; i++) {
							//	updateElementTree(change.addedNodes[i]);
						}
					}
				} else { console.info('unsupported DOM mutation type'); }
			});
		};

		domObserver = new MutationObserver(processDomChanges);
		domObserver.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeOldValue: true,
			characterData: false,
			characterDataOldValue: false
		});
	})();

	Object.defineProperty(options.namespace, 'DataTier', { value: {} });
	Object.defineProperties(options.namespace.DataTier, {
		tieData: {

			value: function (options) {
				return new Tie(options);
			}
		},
		getTie: {
			value: function (namespace) {
				return ties[namespace];
			}
		}
	});
})((typeof arguments === 'object' ? arguments[0] : undefined));