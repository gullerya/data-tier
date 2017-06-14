(function (scope) {
	'use strict';

	const ties = {};

	function Tie(name, observable, options) {
		let data;

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

				let oldData = data;
				data = observable;
				if (data) {
					data.observe(observer);
				}
				scope.DataTier.views.processChanges(name, [{ type: 'update', value: data, oldValue: oldData, path: [] }]);
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

	Reflect.defineProperty(scope, 'DataTier', { value: {} });
	Reflect.defineProperty(scope.DataTier, 'ties', { value: {} });
	Reflect.defineProperty(scope.DataTier.ties, 'get', { value: function (name) { return ties[name]; } });
	Reflect.defineProperty(scope.DataTier.ties, 'create', { value: create });
	Reflect.defineProperty(scope.DataTier.ties, 'remove', { value: remove });

})(this);
﻿(function(scope) {
	'use strict';

	const controllers = {};

	function Controller(name, options) {
		Reflect.defineProperty(this, 'name', {value: name});
		Reflect.defineProperty(this, 'dataToView', {value: options.dataToView});
		if (typeof options.inputToData === 'function') {
			Reflect.defineProperty(this, 'inputToData', {value: options.inputToData});
		}
		if (typeof options.parseParam === 'function') {
			Reflect.defineProperty(this, 'parseParam', {value: options.parseParam});
		}
		if (typeof options.isChangedPathRelevant === 'function') {
			Reflect.defineProperty(this, 'isChangedPathRelevant', {value: options.isChangedPathRelevant});
		}
	}

	Controller.prototype.parseParam = function(controllerParam) {
		let tieName = '', dataPath = [];
		if (controllerParam) {
			dataPath = controllerParam.trim().split('.');
			tieName = dataPath.shift();
		}
		return {
			tieName: tieName,
			dataPath: dataPath
		};
	};
	Controller.prototype.isChangedPathRelevant = function(changedPath, viewedPath) {
		return viewedPath.indexOf(changedPath) === 0;
	};

	function addController(name, configuration) {
		if (typeof name !== 'string' || !name) {
			throw new Error('name MUST be a non-empty string');
		}
		if (controllers[name]) {
			throw new Error('controller "' + name + '" already exists; you may want to reconfigure the existing controller');
		}
		if (typeof configuration !== 'object' || !configuration) {
			throw new Error('configuration MUST be a non-null object');
		}
		if (typeof configuration.dataToView !== 'function') {
			throw new Error('configuration MUST have a "dataToView" function defined');
		}

		controllers[name] = new Controller(name, configuration);
		scope.DataTier.views.applyController(controllers[name]);
	}

	function getController(name) {
		return controllers[name];
	}

	function removeController(name) {
		if (typeof name !== 'string' || !name) {
			throw new Error('controller name MUST be a non-empty string');
		}

		return delete controllers[name];
	}

	function getApplicable(element) {
		let result = [];
		if (element && element.nodeType === Node.ELEMENT_NODE && element.dataset) {
			Object.keys(element.dataset).forEach(function(key) {
				if (controllers[key]) {
					result.push(controllers[key]);
				}
			});
		}
		return result;
	}

	Reflect.defineProperty(scope.DataTier, 'controllers', {
		value: {
			get get() {
				return getController;
			},
			get add() {
				return addController;
			},
			get remove() {
				return removeController;
			},
			get getApplicable() {
				return getApplicable;
			}
		}
	});

})(this);
﻿(function(scope) {
	'use strict';

	const views = {},
		nlvs = {};

	//	TODO: this is similar to setPath in ties-service - unify
	function getPath(ref, path) {
		let i;
		if (!ref) return;
		for (i = 0; i < path.length; i++) {
			ref = ref[path[i]];
			if (!ref) return;
		}
		return ref;
	}

	function changeListener(event) {
		scope.DataTier.controllers.getApplicable(event.target).forEach(function(controller) {
			if (controller.name === 'tieValue') {
				let controllerParam = controller.parseParam(event.target.dataset[controller.name]),
					tie = scope.DataTier.ties.get(controllerParam.tieName);
				if (!controllerParam.dataPath) {
					console.error('path to data not available');
					return;
				}
				if (!tie) {
					console.error('tie "' + controllerParam.tieName + '" not found');
					return;
				}

				tie.viewToDataProcessor({data: tie.data, path: controllerParam.dataPath, view: event.target});
			}
		});
	}

	function addChangeListener(view) {
		if (view.nodeName === 'INPUT' || view.nodeName === 'SELECT') {
			view.addEventListener('change', changeListener);
		}
	}

	function delChangeListener(v) {
		v.removeEventListener('change', changeListener);
	}

	function add(view) {
		if (view.nodeName === 'IFRAME') {
			initDocumentObserver(view.contentDocument);
			view.addEventListener('load', function() {
				initDocumentObserver(this.contentDocument);
				collect(this.contentDocument);
			});
			collect(view.contentDocument);
		} else {
			scope.DataTier.controllers.getApplicable(view).forEach(function(controller) {
				let controllerParam = controller.parseParam(view.dataset[controller.name]),
					pathString = controllerParam.dataPath.join('.'),
					tieViews,
					controllerViews,
					pathViews;

				//	get tie views partition
				if (!views[controllerParam.tieName]) {
					views[controllerParam.tieName] = {};
				}
				tieViews = views[controllerParam.tieName];

				//	get controller views partition (in tie)
				if (!tieViews[controller.name]) {
					tieViews[controller.name] = {};
				}
				controllerViews = tieViews[controller.name];

				//	get path views in this context
				if (!controllerViews[pathString]) {
					controllerViews[pathString] = [];
				}
				pathViews = controllerViews[pathString];

				if (pathViews.indexOf(view) < 0) {
					pathViews.push(view);
					update(view, controller.name);
					addChangeListener(view);
				}
			});

			//	collect potentially future controllers element and put them into some tracking storage
			if (view.dataset) {
				Object.keys(view.dataset).forEach(function(key) {
					if (key.indexOf('tie') === 0 && !scope.DataTier.controllers.get(key)) {
						if (!nlvs[key]) nlvs[key] = [];
						nlvs[key].push(view);
					}
				});
			}
		}
	}

	function update(view, controllerName) {
		let r, p, t, data;
		r = scope.DataTier.controllers.get(controllerName);
		p = r.parseParam(view.dataset[controllerName]);
		t = scope.DataTier.ties.get(p.tieName);
		if (t) {
			data = getPath(t.data, p.dataPath);
			r.dataToView(data, view);
		}
	}

	function collect(rootElement) {
		let l;
		if (rootElement &&
			rootElement.nodeType &&
			(rootElement.nodeType === Node.DOCUMENT_NODE || rootElement.nodeType === Node.ELEMENT_NODE)) {
			l = rootElement.nodeName === 'IFRAME' ? l = Array.from(rootElement.contentDocument.getElementsByTagName('*')) : l = Array.from(rootElement.getElementsByTagName('*'));
			l.push(rootElement);
			l.forEach(add);
		}
	}

	function discard(rootElement) {
		let l, param, pathViews, i;
		if (!rootElement || !rootElement.getElementsByTagName) return;
		l = Array.from(rootElement.getElementsByTagName('*'));
		l.push(rootElement);
		l.forEach(function(e) {
			scope.DataTier.controllers.getApplicable(e).forEach(function(controller) {
				param = controller.parseParam(e.dataset[controller.name]);
				pathViews = views[param.tieName][controller.name][param.dataPath.join('.')];
				i = pathViews.indexOf(e);
				if (i >= 0) {
					pathViews.splice(i, 1);
					delChangeListener(e);
				}
			});
		});
	}

	function move(view, controllerName, oldParam, newParam) {
		let controllerParam, pathViews, i = -1;

		controllerParam = scope.DataTier.controllers.get(controllerName).parseParam(oldParam);

		//	delete old path
		if (views[controllerParam.tieName] && views[controllerParam.tieName][controllerName]) {
			pathViews = views[controllerParam.tieName][controllerName][controllerParam.dataPath];
			if (pathViews) i = pathViews.indexOf(view);
			if (i >= 0) {
				pathViews.splice(i, 1);
			}
		}

		//	add new path
		controllerParam = scope.DataTier.controllers.get(controllerName).parseParam(newParam);
		if (!views[controllerParam.tieName]) views[controllerParam.tieName] = {};
		if (!views[controllerParam.tieName][controllerName]) views[controllerParam.tieName][controllerName] = {};
		if (!views[controllerParam.tieName][controllerName][controllerParam.dataPath]) views[controllerParam.tieName][controllerName][controllerParam.dataPath] = [];
		views[controllerParam.tieName][controllerName][controllerParam.dataPath].push(view);
		update(view, controllerName);
	}

	function processChanges(tieName, changes) {
		let tieViews = views[tieName], controller, controllerViews, changedPath;
		if (tieViews) {
			changes.forEach(function(change) {
				changedPath = change.path.join('.');
				Object.keys(tieViews).forEach(function(controllerName) {
					controllerViews = tieViews[controllerName];
					if (controllerViews) {
						controller = scope.DataTier.controllers.get(controllerName);
						Object.keys(controllerViews).forEach(function(viewedPath) {
							if (controller.isChangedPathRelevant(changedPath, viewedPath)) {
								controllerViews[viewedPath].forEach(function(view) {
									update(view, controllerName);
								});
							}
						});
					}
				});
			});
		}
	}

	function applyController(controller) {
		//	apply on a pending views
		if (nlvs[controller.name]) {
			nlvs[controller.name].forEach(function(view) {
				add(view);
			});
			delete nlvs[controller.name];
		}
	}

	function dataAttrToProp(v) {
		let i = 2, l = v.split('-'), r;
		r = l[1];
		while (i < l.length) r += l[i][0].toUpperCase() + l[i++].substr(1);
		return r;
	}

	function initDocumentObserver(document) {
		function processDomChanges(changes) {
			changes.forEach(function(change) {
				let tr = change.target, an = change.attributeName;
				if (change.type === 'attributes' && an.indexOf('data-tie') === 0) {
					move(tr, dataAttrToProp(an), change.oldValue, tr.getAttribute(an));
				} else if (change.type === 'attributes' && an === 'src' && tr.nodeName === 'IFRAME') {
					discard(tr.contentDocument);
				} else if (change.type === 'childList') {

					//	process added nodes
					Array.from(change.addedNodes).forEach(function(addedNode) {
						if (addedNode.nodeName === 'IFRAME') {
							if (addedNode.contentDocument) {
								initDocumentObserver(addedNode.contentDocument);
								collect(addedNode.contentDocument);
							}
							addedNode.addEventListener('load', function() {
								initDocumentObserver(this.contentDocument);
								collect(this.contentDocument);
							});
						} else {
							collect(addedNode);
						}
					});

					//	process removed nodes
					Array.from(change.removedNodes).forEach(function(removedNode) {
						if (removedNode.nodeName === 'IFRAME') {
							discard(removedNode.contentDocument);
						} else {
							discard(removedNode);
						}
					});
				}
			});
		}

		let domObserver = new MutationObserver(processDomChanges);
		domObserver.observe(document, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeOldValue: true,
			characterData: false,
			characterDataOldValue: false
		});
	}

	Reflect.defineProperty(scope.DataTier, 'views', {
		value: {
			get processChanges() {
				return processChanges;
			},
			get applyController() {
				return applyController;
			}
		}
	});

	initDocumentObserver(document);
	collect(document);

})(this);
﻿(function(scope) {
	'use strict';

	const add = scope.DataTier.controllers.add;

	add('tieValue', {
		dataToView: function(data, view) {
			if (view.type === 'checkbox') {
				view.checked = data;
			} else {
				view.value = data ? data : '';
			}
		}
	});

	add('tieText', {
		dataToView: function(data, view) {
			view.textContent = data ? data.toString() : '';
		}
	});

	add('tiePlaceholder', {
		dataToView: function(data, view) {
			view.placeholder = data ? data : '';
		}
	});

	add('tieTooltip', {
		dataToView: function(data, view) {
			view.title = data ? data : '';
		}
	});

	add('tieSrc', {
		dataToView: function(data, view) {
			view.src = data ? data : '';
		}
	});

	add('tieHRef', {
		dataToView: function(data, view) {
			view.href = data ? data : '';
		}
	});

	add('tieDateValue', {
		dataToView: function(data, view) {
			view.value = data ? data.toLocaleString() : '';
		}
	});

	add('tieDateText', {
		dataToView: function(data, view) {
			view.textContent = data ? data.toLocaleString() : '';
		}
	});

	add('tieClasses', {
		isChangedPathRelevant: function(changedPath, viewedPath) {
			let subPath = changedPath.replace(viewedPath, '').split('.');
			return this.constructor.prototype.isChangedPathRelevant(changedPath, viewedPath) ||
				subPath.length === 1 ||
				(subPath.length === 2 && subPath[0] === '');
		},
		dataToView: function(data, view) {
			if (data && typeof data === 'object') {
				Object.keys(data).forEach(function(key) {
					if (data[key]) {
						view.classList.add(key);
					} else {
						view.classList.remove(key);
					}
				});
			}
		}
	});

	add('tieList', {
		parseParam: function(ruleValue) {
			return this.constructor.prototype.parseParam(ruleValue.split(/\s*=>\s*/)[0]);
		},
		isChangedPathRelevant: function(changedPath, viewedPath) {
			let subPath = changedPath.replace(viewedPath, '').split('.');
			return this.constructor.prototype.isChangedPathRelevant(changedPath, viewedPath) ||
				subPath.length === 1 ||
				(subPath.length === 2 && subPath[0] === '');
		},
		dataToView: function(tiedValue, template) {
			let container = template.parentNode, i, nv, ruleData, itemId, vs, d, df, lc;

			function shortenListTo(cnt, aid) {
				let a = Array.from(container.querySelectorAll('[data-list-item-aid="' + aid + '"]'));
				while (a.length > cnt) {
					container.removeChild(a.pop());
				}
				return a.length;
			}

			//	TODO: this check should be moved to earlier phase of processing, this requires enhancement of rule API in general
			if (template.nodeName !== 'TEMPLATE') {
				throw new Error('tieList may be defined on template elements only');
			}
			if (!template.dataset.listSourceAid) {
				template.dataset.listSourceAid = new Date().getTime();
			}
			i = shortenListTo(tiedValue ? tiedValue.length : 0, template.dataset.listSourceAid);
			if (tiedValue && i < tiedValue.length) {
				ruleData = template.dataset.tieList.trim().split(/\s+/);
				if (!ruleData || ruleData.length !== 3 || ruleData[1] !== '=>') {
					console.error('invalid parameter for "tieList" rule specified');
				} else {
					itemId = ruleData[2];
					d = template.ownerDocument;
					df = d.createDocumentFragment();
					for (; i < tiedValue.length; i++) {
						nv = d.importNode(template.content, true);
						vs = Array.prototype.slice.call(nv.querySelectorAll('*'), 0);
						vs.forEach(function(view) {
							Object.keys(view.dataset).forEach(function(key) {
								if (view.dataset[key].indexOf(itemId) === 0) {
									view.dataset[key] = view.dataset[key].replace(itemId, ruleData[0] + '.' + i);
								}
							});
						});
						df.appendChild(nv);
						lc = df.lastChild;
						while (lc.nodeType !== Node.ELEMENT_NODE && lc.previousSibling !== null) {
							lc = lc.previousSibling;
						}
						lc.dataset.listItemAid = template.dataset.listSourceAid;
					}
					container.appendChild(df);
				}
			}
		}
	});

})(this);
