//	Example of the attributes: data-tie=user.name data-tie-color=user.color data-tie-title=l10n.buttons.tooltips.mainmenu.save
//
//	Phase A: API created for adding namespace/s, listener on DOM mutations to support late binding. Full data path support only. Explicit/implicit destination support, few OTB dests.
//	Phase B: API to support custom destinations including extensible/pluggable 'lifecycle'
//	Phase C: Support for partial paths - data-tie=...[0]...		data-tie=...name	data-tie=user...


(function (options) {
	'use strict';

	var domObserver, ties = {}, FULL_PATH_PROPERTY = 'source',
		//	deprecated
		FULL_PATH_ATTRIBUTE = 'data-path';

	if (typeof options !== 'object') { options = {}; }
	if (typeof options.namespace !== 'object') {
		if (typeof window.Utils !== 'object') Object.defineProperty(window, 'Utils', { value: {} });
		options.namespace = window.Utils;
	}

	function camelToDashes(value) {
		var r = '';
		if (!value) return r;
		for (var i = 0, l = value.length, cc, nc; i < l - 1; i++) {
			if (/[A-Z]/.test(value[i])) r += '-' + value[i].toLowerCase(); else r += value[i];
		}
		r += value[value.length - 1];
		return r;
	}

	function dashesToCamel(value) {
		var r = '';
		if (!value) return r;
		for (var i = 0, l = value.length, cc, nc; i < l - 1; i++) {
			if (value[i] === '-' && /[a-z]/.test(value[i + 1])) r += value[1 + i++].toUpperCase(); else r += value[i];
		}
		r += value[value.length - 1];
		return r;
	}

	function dataAttrToProp(value) { return dashesToCamel(value.replace('data-', '')); }

	function dataPropToAttr(value) { return 'data-' + camelToDashes(value); }

	function pathToNodes(value) {
		var r, re = /(\[[\w\.]+\])/g, m;
		//	first process brackets...
		while ((m = re.exec(value)) !== null) {

		}
		//	now process dots.
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

	function publishToElement(data, element) {
		var dest;
		if (element.dataset.dest && getPath(element, element.dataset.dest)) {
			dest = element.dataset.dest;
		} else {
			dest = 'textContent';
		}
		setPath(element, dest, data);
	}

	function publishData(data, path, rootElement) {
		var views = [], i, l;
		if (rootElement.nodeType !== Node.DOCUMENT_NODE &&
			rootElement.nodeType !== Node.DOCUMENT_FRAGMENT_NODE &&
			rootElement.nodeType !== Node.ELEMENT_NODE) {
			throw new Error('invalid root element');
		}
		if (typeof data === 'object') {
			Object.keys(data).forEach(function (key) {
				publishData(data[key], path + '.' + key, rootElement);
			});
		} else {
			rootElement.dataset && rootElement.dataset[FULL_PATH_PROPERTY] === path && views.push(rootElement);
			Array.prototype.push.apply(views, rootElement.querySelectorAll('*[' + FULL_PATH_ATTRIBUTE + '="' + path + '"]'));
			for (i = 0, l = views.length; i < l; i++) {
				publishToElement(data, views[i]);
			}
		}
	}

	//function updateElement(element) {
	//	var path = element.dataset[FULL_PATH_PROPERTY];
	//	if (path) {
	//		publishToElement(getPath(root, path), element);
	//	}
	//}

	function updateElementTree(element) {
		var list = [];
		if (element.nodeType === Node.DOCUMENT_NODE ||
			element.nodeType === Node.DOCUMENT_FRAGMENT_NODE ||
			element.nodeType === Node.ELEMENT_NODE) {
			(FULL_PATH_PROPERTY in element.dataset) && list.push(element);
			Array.prototype.push.apply(list, element.querySelectorAll('*[' + FULL_PATH_ATTRIBUTE + ']'));
			list.forEach(updateElement);
		}
	}

	function getObserver(namespace) {
		return function (changes) {
			changes.forEach(function (change) {
				//	TODO: now naive, but must handle any kind of changes: removal of values, removal of objects, addition of values, addition of objects
				publishData(change.object[change.name], namespace + '.' + change.name, document);
			});
		}
	}

	//	TODO: refactor since namespace becomes first letter upper cased
	function getViews(namespace, rootElement) {
		var views = [], f = {}, i;
		f.acceptNode = function (node) {
			var result = NodeFilter.FILTER_SKIP;
			Object.keys(node.dataset).some(function (key) {
				if (key.indexOf(FULL_PATH_PROPERTY + namespace) === 0) {
					result = NodeFilter.FILTER_ACCEPT;
					return true;
				}
			});
			return result;
		};
		i = document.createNodeIterator(rootElement, NodeFilter.SHOW_DOCUMENT | NodeFilter.SHOW_DOCUMENT_FRAGMENT | NodeFilter.SHOW_ELEMENT, f);
		while (i.nextNode()) views.push(i.referencedNode);
		return views;
	}

	function Tie(options) {
		if (!options || typeof options !== 'object') throw new Error('options MUST be a non null object');
		if (!options.namespace || typeof namespace !== 'string') throw new Error('options.namespace MUST be a non empty string');
		if (/\W|[A-Z]/.test(options.namespace)) throw new Error('options.namespace MUST consist of alphanumeric non uppercase characters only');
		if (ties[options.namespace]) throw new Error('namespace "' + options.namespace + '" already exists');
		if (!options.data || typeof options.data !== 'object') throw new Error('options.data MUST be a non null object');

		var namespace = options.namespace, data = options.data, viewSets = {};
		ties[namespace] = this;
		// TODO: traverse the data and bind the observers
		Object.defineProperties(this, {
			addViews: {
				value: function (domRoot) {
					var l = getViews(namespace, domRoot), path;
					l.forEach(function (v) {
						if (v.dataset[FULL_PATH_PROPERTY + namespace]) {
							path = v.dataset[namespace + FULL_PATH_PROPERTY];
						} else {
							console.info('TODO: add support for partial pathing');
							path = null;
						}
						if (path) {
							if (!viewSets[path]) viewSets[path] = [];
							viewSets[path].push(l[v]);
						}
					});
				}
			},
			removeViews: {
				value: function (domRoot) {
					var viewSet, i, l;
					Object.keys(viewSets).forEach(function (viewPath) {
						viewSet = viewSets[viewPath];
						for (i = 0, l = viewSet.length; i < l; i++) {
							if (domRoot.contains(viewSet[i])) {
								viewSet.splice(i, 1);
								i--;
							}
						}
					});
				}
			}
		});
		this.addViews(document);
	}


	//function bindNS(namespace, initialValue) {
	//	var observer;
	//	if (typeof namespace !== 'string' || /\./.test(namespace)) { throw new Error('bad namespace parameter'); }
	//	if (typeof root[namespace] !== 'undefined') { throw new Error('the namespace already bound, you can (re)set the value though'); }
	//	if (!initialValue || typeof initialValue !== 'object') { throw new Error('initial value MUST be a non-null object'); }
	//	root[namespace] = initialValue;
	//	(function iterate(ns, o) {
	//		observer = getObserver(ns);
	//		Object.observe(o, observer, ['add', 'update', 'delete']);
	//		observersMap.set(o, observer);
	//		Object.keys(o).forEach(function (key) {
	//			if (o[key] && typeof o[key] === 'object') {
	//				iterate(ns + '.' + key, o[key]);
	//			}
	//		});
	//	})(namespace, initialValue);
	//	console.info('"' + namespace + '" bound, total number of observers now is ' + observersMap.size);
	//	publishData(initialValue, namespace, document);
	//}

	//function tearNS(namespace) {
	//	if (typeof namespace !== 'string' || /\./.test(namespace)) throw new Error('bad namespace parameter');
	//	if (getPath(root, namespace) === 'undefined') throw new Error('the namespace not exist');
	//	(function iterate(ns, o) {
	//		Object.unobserve(o, observersMap.get(o));
	//		observersMap.delete(o);
	//		Object.keys(o).forEach(function (key) {
	//			if (o[key] && typeof o[key] === 'object') {
	//				iterate(ns + '.' + key, o[key]);
	//			}
	//		});
	//	})(namespace, root[namespace]);
	//	delete root[namespace];
	//	console.info('"' + namespace + '" torn, total number of observers now is ' + observersMap.size);
	//}

	(function initDomObserver() {
		function processDom(changes) {
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
							updateElementTree(change.addedNodes[i]);
						}
					}
					if (change.removedNodes.length) {
						//	traverse all deleted nodes and remove any relevant from ties
						for (i = 0, l = change.addedNodes.length; i < l; i++) {
							updateElementTree(change.addedNodes[i]);
						}
					}
				} else { console.info('unsupported DOM mutation type'); }
			});
		};

		domObserver = new MutationObserver(processDom);
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
		Tie: { value: Tie }
	});
})((typeof arguments === 'object' ? arguments[0] : undefined));