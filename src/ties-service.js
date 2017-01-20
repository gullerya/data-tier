(function (scope) {
	'use strict';

	var ties = {};

	function Tie(name, observable, options) {
		var data;

		function observer(changes) {
			scope.DataTier.views.processChanges(name, changes);
		}

		if (options && typeof options === 'object') {
			//	TODO: process options
		}

		Reflect.defineProperty(this, 'name', { value: name });
		Reflect.defineProperty(this, 'data', {
			get: function () { return data; },
			set: function (observable) {
				if (observable) {
					validateObservable(observable);
					if (data) {
						data.revoke();
					}
				}

				var oldData = data;
				data = observable;
				if (data) {
					data.observe(observer);
				}
				scope.DataTier.views.processChanges(name, [{ type: 'update', value: data, oldValue: oldData, path: [] }]);
			}
		});

		this.data = observable;
	}

	function create(name, observable, options) {
		validateTieName(name);
		validateObservable(observable);
		if (ties[name]) {
			throw new Error('existing tie (' + name + ') MAY NOT be re-created, use the tie\'s own APIs to reconfigure it');
		}

		return (ties[name] = new Tie(name, observable, options));
	}

	function remove(name) {
		if (name && ties[name]) {
			ties[name].observable.revoke();
			delete ties[name];
		}
	}

	function validateTieName(name) {
		if (!name || typeof name !== 'string') {
			throw new Error('tie name MUST be a non-empty string');
		}
		if (/\W/.test(name)) {
			throw new Error('tie name MUST consist of alphanumerics or underlines ([a-zA-Z0-9_]) ONLY');
		}
	}

	function validateObservable(observable) {
		if (!observable ||
				typeof observable !== 'object' ||
				typeof observable.observe !== 'function' ||
				typeof observable.unobserve !== 'function' ||
				typeof observable.revoke !== 'function') {
			throw new Error(observable + ' is not a valid Observable');
		}
	}

	//function isPathStartsWith(p1, p2) {
	//	var i, l;
	//	l = Math.min(p1.length, p2.length);
	//	for (i = 0; i < l; i++) {
	//		if (p1[i] !== p2[i]) return false;
	//	}
	//	return true;
	//}

	//function observer(changes) {
	//	changes.forEach(function (change) {
	//		var path = change.path.slice();

	//		//	retrieve all views from this path and below
	//		//	update all views accordingly to the new value
	//		//	transfer update to update service
	//		//	later use the specific data of the event to optimize update
	//		api.viewsService.update()

	//		var vs = api.viewsService.get(path), i, l, key, p;
	//		for (i = 0, l = vs.length; i < l; i++) {
	//			for (key in vs[i].dataset) {
	//				if (key.indexOf('tie') === 0) {
	//					p = api.rulesService.getRule(key).parseValue(vs[i]).dataPath;
	//					if (isPathStartsWith(path, p)) {
	//						//	TODO: use the knowledge of old value and new value here, rules like list may optimize for that
	//						//	TODO: yet, myst pass via the formatters/vizualizers of Rule/Tie
	//						api.viewsService.update(vs[i], key);
	//					}
	//				}
	//			}
	//		}
	//	});
	//}

	Reflect.defineProperty(scope, 'DataTier', { value: {} });
	Reflect.defineProperty(scope.DataTier, 'ties', { value: {} });
	Reflect.defineProperty(scope.DataTier.ties, 'get', { value: function (name) { return ties[name]; } });
	Reflect.defineProperty(scope.DataTier.ties, 'create', { value: create });
	Reflect.defineProperty(scope.DataTier.ties, 'remove', { value: remove });

})(this);