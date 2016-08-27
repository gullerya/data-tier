(function (scope) {
	'use strict';

	const ties = {};
	var api;

	if (!scope.DataTier) { Reflect.defineProperty(scope, 'DataTier', { value: {} }); }

	function Tie(name, observable, options) {
		var data;

		//function observer(changes) {
		//	changes.forEach(change => {
		//		let contextedPath = change.path.slice();
		//		contextedPath.unshift(name);

		//		//	transfer update to update service
		//		//	later use the specific data of the event to optimize update
		//		api.viewsService.update()


		//		let vs = api.viewsService.get(contextedPath), i, l, key, p;
		//		for (i = 0, l = vs.length; i < l; i++) {
		//			for (key in vs[i].dataset) {
		//				if (key.indexOf('tie') === 0) {
		//					p = api.rulesService.getRule(key).parseValue(vs[i]).dataPath;
		//					if (isPathStartsWith(contextedPath, p)) {
		//						//	TODO: use the knowledge of old value and new value here, rules like list may optimize for that
		//						//	TODO: yet, myst pass via the formatters/vizualizers of Rule/Tie
		//						api.viewsService.update(vs[i], key);
		//					}
		//				}
		//			}
		//		}
		//	});
		//}

		function setData(observable) {
			if (typeof observable !== 'object') {
				throw new Error('observable MUST be an object; it MAY be null');
			}
			if (observable !== null) {
				validateObservable(observable);
			}

			if (data) { data.unobserve(observer); }
			data = observable;
			if (data) {
				observable.observe(api.viewService.update);
			}
			//	update all paths, if data is null - will clear everything
		}

		function getData() { return data; }

		setData(observable);

		Reflect.defineProperty(this, 'name', { value: name });
		Reflect.defineProperty(this, 'data', { get: getData, set: setData });
	}

	function getTie(name) {
		validateTieName(name);
		return ties[name];
	}

	function createTie(name, observable, options) {
		validateTieName(name);
		if (ties[name]) {
			throw new Error('existing Tie MAY NOT be re-created, use the tie\'s own APIs to reconfigure it');
		}

		return (ties[name] = new Tie(name, observable, options));
	}

	function removeTie(name) {
		validateTieName(name);
		if (ties[name]) {
			//  TODO: dispose tie
			delete ties[name];
		}
	}

	function validateTieName(name) {
		if (!name || typeof name !== 'string') {
			throw new Error('name MUST be a non-empty string');
		}
		if (/\W/.test(name)) {
			throw new Error('name MUST consist of alphanumeric non uppercase characters only');
		}
	}

	function validateObservable(observable) {
		if (typeof observable !== 'object') {
			throw new Error('observable MUST be an object');
		}
		if (observable) {
			if (typeof observable.observe !== 'function' || typeof observable.unobserve !== 'function') {
				throw new Error('observable MUST have "observe" and "unobserve" functions defined');
			}
		}
	}

	//	TOBE reviewed
	function isPathStartsWith(p1, p2) {
		var i, l;
		p1 = api.utils.pathToNodes(p1);
		p2 = api.utils.pathToNodes(p2);
		l = Math.min(p1.length, p2.length);
		for (i = 0; i < l; i++) {
			if (p1[i] !== p2[i]) return false;
		}
		return true;
	}

	function TiesService(internalAPI) {
		api = internalAPI;
		Reflect.defineProperty(this, 'getTie', { value: getTie });
		Reflect.defineProperty(this, 'createTie', { value: createTie });
		Reflect.defineProperty(this, 'removeTie', { value: removeTie });
	}

	Reflect.defineProperty(scope.DataTier, 'TiesService', { value: TiesService });

})(this);