(() => {
	'use strict';

	const namespace = this || window,
		ties = {};

	function Tie(name, observable, options) {
		let data;

		function observer(changes) {
			namespace.DataTier.views.processChanges(name, changes);
		}

		if (options && typeof options === 'object') {
			//	TODO: process options
		}
		Reflect.defineProperty(this, 'name', {value: name});
		Reflect.defineProperty(this, 'data', {
			get: function() {
				return data;
			},
			set: function(observable) {
				if (observable) {
					validateObservable(observable);
					if (data) {
						data.revoke();
					}
				}

				let oldData = data;
				data = observable;
				if (data) {
					data.observe(observer);
				}
				namespace.DataTier.views.processChanges(name, [{
					type: 'update',
					value: data,
					oldValue: oldData,
					path: []
				}]);
			}
		});

		ties[name] = this;
		this.data = observable;
	}

	Tie.prototype.viewToDataProcessor = function vanillaViewToDataProcessor(event) {
		setPath(event.data, event.path, event.view.value);
	};

	function create(name, observable, options) {
		validateTieName(name);
		if (observable) {
			validateObservable(observable);
		}
		if (ties[name]) {
			throw new Error('existing tie (' + name + ') MAY NOT be re-created, use the tie\'s own APIs to reconfigure it');
		}

		return new Tie(name, observable, options);
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

	//	TODO: this is similar to getPath in views-service - unify
	function setPath(ref, path, value) {
		let i;
		if (!ref) return;
		for (i = 0; i < path.length - 1; i++) {
			ref = ref[path[i]] || {};
		}
		ref[path[i]] = value;
	}

	Reflect.defineProperty(namespace, 'DataTier', {value: {}});
	Reflect.defineProperty(namespace.DataTier, 'ties', {
		value: {
			get get() {
				return function(name) {
					return ties[name]
				};
			},
			get create() {
				return create;
			},
			get remove() {
				return remove
			}
		}
	});

})();