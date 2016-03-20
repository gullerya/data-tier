function DataObserver() {
	'use strict';

	var proxiesMap = new WeakMap();

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
					result;

				result = Reflect.set(target, key, value);

				if (result) {
					if (typeof oldValue === 'object' && oldValue) {
						//	remove old proxy
					}
					if (typeof value === 'object' && value) {
						//	create new proxy
					}
					callback([key].join('.'), value, oldValue);
				}

				return result;
			},
			deleteProperty: function (target, key) {
				var oldValue = target[key],
					result;

				result = Reflect.deleteProperty(target, key);

				if (result) {
					if (typeof oldValue === 'object' && oldValue) {
						proxiesMap.get(oldValue).revoke();
						proxiesMap.delete(oldValue);
					}
					callback([key].join('.'), undefined, oldValue);
				}

				return result;
			}
		}).proxy;
	}

	Reflect.defineProperty(this, 'observe', { value: observe });
}