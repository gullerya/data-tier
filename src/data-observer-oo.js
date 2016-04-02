(function () {
	'use strict';

	var observersMap = new WeakMap();

	function h(path, change, callback) {
		var ov = change.oldValue,
			nv = change.object[change.name],
			p = (path ? path + '.' : '') + change.name;
		if (ov && typeof ov === 'object') { unobserve(ov); }
		if (nv && typeof nv === 'object') { observe(nv, p, callback); }
		callback(p, nv, ov);
	}

	function s(path, change, callback) {
		var ov,
			nv,
			p = (path ? path + '.' : ''), i;
		for (i = 0; i < change.removed.length; i++) {
			ov = change.removed[i];
			if (ov && typeof ov === 'object') { unobserve(ov); }
			callback(p, null, null);
		}
		for (i = 0; i < change.addedCount; i++) {
			nv = change.object[i + change.index];
			if (nv && typeof nv === 'object') { observe(nv, p + (i + change.index)); }
			callback(p, nv, null);
		}
		callback(p, change.object, change.oldValue);
	};

	function getChangesObserver(path, callback) {
		return function observer(changes) {
			changes.forEach(function (change) {
				if (change.type === 'splice') {
					s(path, change, callback);
				} else {
					h(path, change, callback);
				}
			});
		}
	}

	function unobserve(data) {
		if (data && typeof data === 'object') {
			Reflect.ownKeys(data).forEach(function (key) {
				unobserve(data[key]);
			});
			if (observersMap.has(data)) {
				if (Array.isArray(data)) Array.unobserve(data, observersMap.get(data));
				else Object.unobserve(data, observersMap.get(data));
				observersMap.delete(data);
			}
		}
	}

	//	TODO: clone the original object in order to be consistent with other implementations
	function observe(target, path, callback) {
		var observer;
		if (target && typeof target === 'object') {
			observer = getChangesObserver(path, callback);
			if (Array.isArray(target)) {
				Array.observe(target, observer, ['add', 'update', 'delete', 'splice']);
			} else {
				Object.observe(target, observer, ['add', 'update', 'delete']);
			}
			observersMap.set(target, observer);
			Reflect.ownKeys(target).forEach(function (key) {
				if (target[key] && typeof target[key] === 'object') {
					observe(target[key], path ? [path, key].join('.') : key, callback);
				}
			});
		}
		return target;
	}

	function DataObserver() {
		function getObserved(target, callback) {
			if (typeof target !== 'object' || !target) { throw new Error('target MUST be a non-empty object'); }
			if (typeof callback !== 'function') { throw new Error('callback MUST be a function'); }
			return observe(target, null, callback);
		}

		Reflect.defineProperty(this, 'getObserved', { value: getObserved });
		Reflect.defineProperty(this, 'details', {
			value: {
				description: 'Object.observe driven data observer implementation'
			}
		});
	}

	Reflect.defineProperty(this || window, 'DataObserver', { value: DataObserver });
})();