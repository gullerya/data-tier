(() => {
	'use strict';

	const namespace = this || window,
		controllers = {};

	if (!namespace.DataTier) {
		throw new Error('data-tier framework was not properly initialized');
	}

	function Controller(name, options) {
		Reflect.defineProperty(this, 'name', {value: name});
		Reflect.defineProperty(this, 'toView', {value: options.toView});
		Reflect.defineProperty(this, 'toData', {value: typeof options.toData === 'function' ? options.toData : defaultToData});
		Reflect.defineProperty(this, 'changeDOMEventType', {value: typeof options.changeDOMEventType === 'string' ? options.changeDOMEventType : null});
		Reflect.defineProperty(this, 'parseParam', {value: typeof options.parseParam === 'function' ? options.parseParam : defaultParseParam});
		Reflect.defineProperty(this, 'isChangedPathRelevant', {value: typeof options.isChangedPathRelevant === 'function' ? options.isChangedPathRelevant : defaultIsChangedPathRelevant});
	}

	function defaultParseParam(param) {
		let tieName = '', dataPath = [];
		if (param) {
			dataPath = param.trim().split('.');
			tieName = dataPath.shift();
		}
		return {
			tieName: tieName,
			dataPath: dataPath
		};
	}

	function defaultIsChangedPathRelevant(changedPath, viewedPath) {
		return viewedPath.startsWith(changedPath);
	}

	Reflect.defineProperty(Controller.prototype, 'parseParam', {value: defaultParseParam});
	Reflect.defineProperty(Controller.prototype, 'isChangedPathRelevant', {value: defaultIsChangedPathRelevant});

	function add(name, configuration) {
		if (typeof name !== 'string' || !name) {
			throw new Error('name MUST be a non-empty string');
		}
		if (controllers[name]) {
			throw new Error('data controller "' + name + '" already exists; you may want to reconfigure the existing one');
		}
		if (typeof configuration !== 'object' || !configuration) {
			throw new Error('configuration MUST be a non-null object');
		}
		if (typeof configuration.toView !== 'function') {
			throw new Error('configuration MUST have a "toView" function defined');
		}

		controllers[name] = new Controller(name, configuration);
		namespace.DataTier.views.applyController(controllers[name]);
	}

	function get(name) {
		return controllers[name];
	}

	function remove(name) {
		if (typeof name !== 'string' || !name) {
			throw new Error('controller name MUST be a non-empty string');
		}

		return delete controllers[name];
	}

	function getApplicable(element) {
		let result = [];
		if (element && element.dataset) {
			Object.keys(element.dataset)
				.filter(key => key in controllers)
				.map(key => controllers[key])
				.forEach(controller => result.push(controller));
		}
		return result;
	}

	function defaultToData(event) {
		setPath(event.data, event.path, event.view.value);
	}

	function setPath(ref, path, value) {
		let i;
		if (!ref) return;
		for (i = 0; i < path.length - 1; i++) {
			ref = ref[path[i]] && typeof ref[path[i]] === 'object' ? ref[path[i]] : ref[path[i]] = {};
		}
		ref[path[i]] = value;
	}

	Reflect.defineProperty(namespace.DataTier, 'controllers', {
		value: {
			get get() { return get; },
			get add() { return add; },
			get remove() { return remove; },
			get getApplicable() { return getApplicable; }
		}
	});
})();