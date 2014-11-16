(function (options) {
	'use strict';

	var root = {}, observersMap = new WeakMap();

	if (typeof options !== 'object') { options = {}; }
	if (typeof options.namespace !== 'object') {
		if (typeof window.Modules !== 'object') Object.defineProperty(window, 'Modules', { value: {} });
		options.namespace = window.Modules;
	}

	function setPath(ref, path, value) {
		var list = path.split('.'), i = 0;
		for (; i < list.length - 1; i++) {
			if (typeof ref[list[i]] === 'object') ref = ref[list[i]];
			else if (!(list[i] in ref)) ref = (ref[list[i]] = {});
			else throw new Error('the path is unavailable');
		}
		ref[list[i - 1]] = value;
	}

	function getPath(ref, path) {
		var list = path.split('.'), i = 0;
		for (; i < list.length; i++) {
			if (list[i] in ref) ref = ref[list[i]];
			else return;
		}
		return ref;
	}

	function hasPath(ref, path) {
		var list = path.split('.'), i = 0;
		for (; i < list.length - 1; i++) {
			if (list[i] in ref) ref = ref[list[i]];
			else return false;
		}
		return list[i - 1] in ref;
	}

	function delPath(ref, path) {
		var list = path.split('.'), i = 0, value;
		for (; i < list.length - 1; i++) {
			if (list[i] in ref) ref = ref[list[i]];
			else return;
		}
		value = ref[list[i - 1]];
		delete ref[list[i - 1]];
		return value;
	}

	function rootObserver(changes) {
		changes.forEach(function (change) {
			if (change.type === 'add') {
				//	add observers and register them in the map
			} else if (change.type === 'update') {
				//	remove the observers from the old object and add new ones
			} else if (change.type === 'delete') {
				//	remove the observers
			}
		});
	}

	function bind(namespace, initialValue) {
		if (typeof namespace !== 'string' || /\./.test(namespace)) throw new Error('bad namespace parameter');
		if (hasPath(root, namespace)) throw new Error('the namespace already exist');
		if (typeof initialValue !== undefined && typeof initialValue !== 'object') throw new Error('initial value, if provided, MUST be an object');
		setPath(root, initialValue ? initialValue : null);
	}

	function unbind(namespace) {
		if (typeof namespace !== 'string' || /\./.test(namespace)) throw new Error('bad namespace parameter');
		if (!hasPath(root, namespace)) throw new Error('the namespace not exist');
		delPath(root, namespace);
	}

	Object.observe(root, rootObserver);
	Object.defineProperty(options.namespace, 'DataTier', { value: {} });
	Object.defineProperties(options.namespace.DataTier, {
		bind: { value: bind },
		unbind: { value: unbind }
	});
})((typeof arguments === 'object' ? arguments[0] : null));