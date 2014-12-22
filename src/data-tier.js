(function (options) {
	'use strict';

	var root = {}, domObserver,
		PATH_ATTRIBUTE = 'data-dt-path',
		PATH_PROPERTY = 'dtPath';

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

	function setPath(ref, path, value) {
		var list = path.split('.'), i;
		for (i = 0; i < list.length - 1; i++) {
			if (typeof ref[list[i]] === 'object') ref = ref[list[i]];
			else if (!(list[i] in ref)) ref = (ref[list[i]] = {});
			else throw new Error('the path is unavailable');
		}
		ref[list[i]] = value;
	}

	function getPath(ref, path) {
		var list = path.split('.'), i = 0;
		for (; i < list.length; i++) {
			if (list[i] in ref) ref = ref[list[i]];
			else return;
		}
		return ref;
	}

	function cutPath(ref, path) {
		var list = path.split('.'), i = 0, value;
		for (; i < list.length - 1; i++) {
			if (list[i] in ref) ref = ref[list[i]];
			else return;
		}
		value = ref[list[i - 1]];
		delete ref[list[i - 1]];
		return value;
	}

	function bind(namespace, initialValue) {
		if (typeof namespace !== 'string' || /\./.test(namespace)) { throw new Error('bad namespace parameter'); }
		if (typeof getPath(root, namespace) !== 'undefined') { throw new Error('the namespace already exist'); }
		if (typeof initialValue !== undefined && typeof initialValue !== 'object') { throw new Error('initial value, if provided, MUST be an object'); }
		setPath(root, namespace, initialValue || null);
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

	function publishToTree(data, path, rootElement) {
		var views = [], i, l;
		if (rootElement.nodeType !== Node.DOCUMENT_NODE &&
			rootElement.nodeType !== Node.DOCUMENT_FRAGMENT_NODE &&
			rootElement.nodeType !== Node.ELEMENT_NODE) {
			throw new Error('invalid root element');
		}
		if (typeof data === 'object') {
			if (!data) { throw new Error('data MUST a primitive value or non-null object'); } else {
				Object.keys(data).forEach(function (key) {
					publishToTree(data[key], path + '.' + key, rootElement);
				});
			}
		} else {
			rootElement.dataset && rootElement.dataset[PATH_PROPERTY] === path && views.push(rootElement);
			Array.prototype.push.apply(views, rootElement.querySelectorAll('*[' + PATH_ATTRIBUTE + '="' + path + '"]'));
			for (i = 0, l = views.length; i < l; i++) {
				publishToElement(data, views[i]);
			}
		}
	}

	//	TODO: add error handling
	function updateElement(element) {
		var path = element.dataset[PATH_PROPERTY];
		if (path) {
			publishToElement(getPath(root, path), element);
		}
	}

	function updateElementTree(element) {
		var list = [];
		if (element.nodeType === Node.DOCUMENT_NODE ||
			element.nodeType === Node.DOCUMENT_FRAGMENT_NODE ||
			element.nodeType === Node.ELEMENT_NODE) {
			(PATH_PROPERTY in element.dataset) && list.push(element);
			Array.prototype.push.apply(list, element.querySelectorAll('*[' + PATH_ATTRIBUTE + ']'));
			list.forEach(updateElement);
		}
	}

	function tear(namespace) {
		if (typeof namespace !== 'string' || /\./.test(namespace)) throw new Error('bad namespace parameter');
		if (getPath(root, namespace) === 'undefined') throw new Error('the namespace not exist');
		cutPath(root, namespace);
	}

	function getObserver(path) {
		var r = function (changes) {
			changes.forEach(function (change) {
				publishToTree(change.object[change.name], path + '.' + change.name, document);
			});
		}
		return r;
	}

	function initDataObserver() {
		function processData(changes) {
			var observer;
			//	TODO: validate that on the root namespace there are only objects
			//	TODO: add deep object observers
			//	TODO: add publishing on the first set
			changes.forEach(function (change) {
				if (change.type === 'add') {
					if (typeof root[change.name] !== 'object') {
						throw new Error('on an object may be tracked');
					}
					observer = getObserver(change.name);
					Object.observe(root[change.name], observer);
					publishToTree(root[change.name], change.name, document);
				} else if (change.type === 'update') {
					console.log(change);
					//	remove the observers from the old object and add new ones
				} else if (change.type === 'delete') {
					console.log(change);
					//	remove the observers
				}
			});
		}
		Object.observe(root, processData);
	}

	function initDomObserver() {
		function processDom(changes) {
			changes.forEach(function (change) {
				var path, i, l;
				if (change.type === 'attributes') {
					path = change.target.getAttribute(PATH_ATTRIBUTE);
					if (path) {
						publishToElement(getPath(root, path), change.target);
					}
				} else if (change.type === 'childList' && change.addedNodes.length) {
					for (i = 0, l = change.addedNodes.length; i < l; i++) {
						updateElementTree(change.addedNodes[i]);
					}
				} else { throw new Error('unsupported DOM mutation type'); }
			});
		};

		domObserver = new MutationObserver(processDom);
		domObserver.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: [PATH_ATTRIBUTE],
			attributeOldValue: true,
			characterData: false,
			characterDataOldValue: false
		});
	}

	initDataObserver();
	initDomObserver();
	Object.defineProperty(options.namespace, 'DataTier', { value: {} });
	Object.defineProperties(options.namespace.DataTier, {
		bind: { value: bind },
		tear: { value: tear },
		setPath: { value: setPath },
		getPath: { value: getPath },
		cutPath: { value: cutPath }
	});
})((typeof arguments === 'object' ? arguments[0] : undefined));