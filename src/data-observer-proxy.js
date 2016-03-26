function DataObserver() {
	'use strict';

	var pathsMap = new WeakMap();

	function observe(target, callback) {
		if (!target || typeof target !== 'object') {
			throw new Error('target MUST be a non-empty object');
		}
		if (typeof callback !== 'function') {
			throw new Error('callback parameter MUST be a function');
		}

		return Proxy.revocable(target, {
			set: function (target, key, value) {
				var oldValue = target[key],
					result,
					path;

				result = Reflect.set(target, key, value);
				path = pathsMap.has(target) ? [pathsMap.get(target), key].join('.') : key;
				if (result) {
					if (typeof oldValue === 'object' && oldValue) {
						//	remove old proxy
					}
					if (typeof value === 'object' && value) {
						pathsMap.set(value, path);
						Reflect.set(target, key, observe(value, callback));
					}
					callback(path, value, oldValue);
				}

				return result;
			},
			deleteProperty: function (target, key) {
				var oldValue = target[key],
					result,
					path;

				result = Reflect.deleteProperty(target, key);

				if (result) {
					if (typeof oldValue === 'object' && oldValue) {
						proxiesMap.get(oldValue).revoke();
						proxiesMap.delete(oldValue);
					}
					path = pathsMap.has(target) ? [pathsMap.get(target), key].join('.') : key;
					callback(path, undefined, oldValue);
				}

				return result;
			}
		}).proxy;
	}

	Reflect.defineProperty(this, 'observe', { value: observe });
	Reflect.defineProperty(this, 'details', {
		value: {
			description: 'Proxy driven data observer implementation'
		}
	});
}