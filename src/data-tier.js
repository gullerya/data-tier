//	Meta code for usage:
//	
//	DataTier.bind('currentUser', user)							at this point i expect that the following will happen:
//																	1)	all of the DOM elements having 'data-path: DataTier.currentUser....' would get updated with the values (recursively scan 'user')
//																	2)	listeners would be bound for any change within the 'user' or it's descendants that will immediatelly update the relevant DOM
//																	3)	listeners would be bound to the DOM elements to track the 'changed' event to immediatelly update the DataTier band
//																	4)	would be added proper handling for adding/removal in DOM and adding/removal in DataTier
//	DataTier.tear('currentUser')
//																at this point the following should be done:
//																	1)	release all of the related listeners
//																	2)	remove all the references to the 'currentUser....' recursively


'use strict';

(function (options) {

	var root = {};

	if (typeof options !== 'object') { options = {}; }
	if (typeof options.namespace !== 'object') {
		if (typeof window.Utils !== 'object') Object.defineProperty(window, 'Utils', { value: {} });
		options.namespace = window.Utils;
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

	function publish(data, path) {
		var views, view, dest, i, l;
		if (typeof data === 'object') {
			if (!data) { throw new Error('data MUST a primitive value or non-null object'); } else {
				Object.keys(data).forEach(function (key) {
					publish(data[key], path + '.' + key);
				});
			}
		} else {
			views = document.querySelectorAll('*[data-dt-path="' + path + '"]');
			for (i = 0, l = views.length; i < l; i++) {
				view = views[i];
				if (view.dataset.dest && getPath(view, view.dataset.dest)) {
					dest = view.dataset.dest;
				} else {
					dest = 'textContent';
				}
				setPath(view, dest, data);
			}
		}
	}

	function getObserver(path) {
		var r = function (changes) {
			changes.forEach(function (change) {
				publish(change.object[change.name], path + '.' + change.name);
			});
		}
		return r;
	}

	function rootObserver(changes) {
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
				publish(root[change.name], change.name);
			} else if (change.type === 'update') {
				console.log(change);
				//	remove the observers from the old object and add new ones
			} else if (change.type === 'delete') {
				console.log(change);
				//	remove the observers
			}
		});
	}

	function bind(namespace, initialValue) {
		if (typeof namespace !== 'string' || /\./.test(namespace)) { throw new Error('bad namespace parameter'); }
		if (typeof getPath(root, namespace) !== 'undefined') { throw new Error('the namespace already exist'); }
		if (typeof initialValue !== undefined && typeof initialValue !== 'object') { throw new Error('initial value, if provided, MUST be an object'); }
		setPath(root, namespace, initialValue || null);
	}

	function tear(namespace) {
		if (typeof namespace !== 'string' || /\./.test(namespace)) throw new Error('bad namespace parameter');
		if (getPath(root, namespace) === 'undefined') throw new Error('the namespace not exist');
		delPath(root, namespace);
	}

	Object.observe(root, rootObserver);
	Object.defineProperty(options.namespace, 'DataTier', { value: {} });
	Object.defineProperties(options.namespace.DataTier, {
		bind: { value: bind },
		tear: { value: tear }
	});
})((typeof arguments === 'object' ? arguments[0] : undefined));