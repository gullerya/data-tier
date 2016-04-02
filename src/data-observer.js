(function (scope) {
	'use strict';

	var pathsMap = new WeakMap();

	function flattenObject(graph) {
		let result = {};

		if (typeof graph !== 'object') { throw new Error('illegal graph argument, object expected'); }

		function iterate(graph, path) {
			var tmp, pVal;
			if (Array.isArray(graph)) {
				tmp = (path ? path : '') + '[';
				graph.forEach(function (itm, idx) {
					if (itm && typeof itm === 'object') {
						iterate(itm, [tmp, idx, ']'].join(''));
					} else {
						result[[tmp, idx, ']'].join('')] = itm;
					}
				});
			} else {
				tmp = (path ? path + '.' : '');
				Reflect.ownKeys(graph).forEach(function (pKey) {
					pVal = graph[pKey];
					if (pVal && typeof pVal === 'object') {
						iterate(pVal, tmp + pKey);
					} else {
						result[tmp + pKey] = pVal;
					}
				});
			}
		}
		if (graph) { iterate(graph); }

		return result;
	}

	function calculateGraphChange(oldGraph, newGraph) {
		var oldGraphFlat,
			newGraphFlat,
			result;

		oldGraphFlat = flattenObject(oldGraph);
		newGraphFlat = flattenObject(newGraph);
		//	generate list of changes

		return result;
	}

	function DataObserver() {

		function observe(target, callback) {
			if (!target || typeof target !== 'object') {
				throw new Error('target MUST be a non-empty object');
			}
			if (typeof callback !== 'function') {
				throw new Error('callback parameter MUST be a function');
			}

			return Proxy.revocable(target, {
				set: function proxiedSet(target, key, value) {
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
				deleteProperty: function proxiedDelete(target, key) {
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

		Reflect.defineProperty(this, 'getObserved', { value: observe });
		Reflect.defineProperty(this, 'details', {
			value: {
				description: 'Proxy driven data observer implementation'
			}
		});
	}

	Reflect.defineProperty(scope, 'DataObserver', { value: DataObserver });
	Reflect.defineProperty(scope, 'flatten', { value: flattenObject });
})(this);

