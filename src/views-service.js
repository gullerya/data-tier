(() => {
	'use strict';

	const namespace = this || window;

	if (!namespace.DataTier) {
		throw new Error('DataTier framework was not properly initialized');
	}

	const ties = namespace.DataTier.ties,
		controllers = namespace.DataTier.controllers,
		views = {},
		nlvs = {};

	//	TODO: this is similar to setPath in ties-service - unify
	function getPath(ref, path) {
		let i;
		if (!ref) return;
		for (i = 0; i < path.length; i++) {
			if (path[i] in ref) ref = ref[path[i]];
			else return;
		}
		return ref;
	}

	function changeListener(event) {
		controllers.getApplicable(event.target).forEach(controller => {
			if (controller.name === 'tieValue') {
				let controllerParam = controller.parseParam(event.target.dataset[controller.name]),
					tie = ties.get(controllerParam.tieName);
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
		} else if (view.dataset) {
			Object.keys(view.dataset).forEach(key => {
				if (key.startsWith('tie')) {
					let controller = controllers.get(key);
					if (controller) {
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
					} else {
						//	collect potentially future controllers element and put them into some tracking storage
						if (!nlvs[key]) nlvs[key] = [];
						nlvs[key].push(view);
					}
				}
			});
		}
	}

	function update(view, controllerName) {
		let r, p, t, data;
		r = controllers.get(controllerName);
		p = r.parseParam(view.dataset[controllerName]);
		t = ties.get(p.tieName);
		if (t) {
			data = getPath(t.data, p.dataPath);
			r.dataToView(data, view);
		}
	}

	function collect(rootElement) {
		if (rootElement && (rootElement.nodeType === Node.DOCUMENT_NODE || rootElement.nodeType === Node.ELEMENT_NODE)) {
			let l;
			if (rootElement.nodeName === 'IFRAME') {
				l = Array.from(rootElement.contentDocument.getElementsByTagName('*'));
			} else {
				l = Array.from(rootElement.getElementsByTagName('*'));
			}
			l.push(rootElement);
			l.forEach(add);
		}
	}

	function discard(rootElement) {
		let l, param, pathViews, i;
		if (!rootElement || !rootElement.getElementsByTagName) return;
		l = Array.from(rootElement.getElementsByTagName('*'));
		l.push(rootElement);
		l.forEach(element => {
			controllers.getApplicable(element).forEach(controller => {
				param = controller.parseParam(element.dataset[controller.name]);
				pathViews = views[param.tieName][controller.name][param.dataPath.join('.')];
				i = pathViews.indexOf(element);
				if (i >= 0) {
					pathViews.splice(i, 1);
					delChangeListener(element);
				}
			});
		});
	}

	function move(view, controllerName, oldParam, newParam) {
		let controllerParam, pathViews, i = -1;

		controllerParam = controllers.get(controllerName).parseParam(oldParam);

		//	delete old path
		if (views[controllerParam.tieName] && views[controllerParam.tieName][controllerName]) {
			pathViews = views[controllerParam.tieName][controllerName][controllerParam.dataPath];
			if (pathViews) i = pathViews.indexOf(view);
			if (i >= 0) {
				pathViews.splice(i, 1);
			}
		}

		//	add new path
		controllerParam = controllers.get(controllerName).parseParam(newParam);
		if (!views[controllerParam.tieName]) views[controllerParam.tieName] = {};
		if (!views[controllerParam.tieName][controllerName]) views[controllerParam.tieName][controllerName] = {};
		if (!views[controllerParam.tieName][controllerName][controllerParam.dataPath]) views[controllerParam.tieName][controllerName][controllerParam.dataPath] = [];
		views[controllerParam.tieName][controllerName][controllerParam.dataPath].push(view);
		update(view, controllerName);
	}

	function processChanges(tieName, changes) {
		let tieViews = views[tieName], controller, controllerViews, changedPath;
		if (tieViews) {
			changes.forEach(change => {
				changedPath = change.path.join('.');
				Object.keys(tieViews).forEach(controllerName => {
					controllerViews = tieViews[controllerName];
					if (controllerViews) {
						controller = controllers.get(controllerName);
						Object.keys(controllerViews).forEach(viewedPath => {
							if (controller.isChangedPathRelevant(changedPath, viewedPath)) {
								controllerViews[viewedPath].forEach(view => {
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
			nlvs[controller.name].forEach(add);
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
			changes.forEach(change => {
				if (change.type === 'attributes') {
					let target = change.target, attributeName = change.attributeName;
					if (attributeName.indexOf('data-tie') === 0) {
						move(target, dataAttrToProp(attributeName), change.oldValue, target.getAttribute(attributeName));
					} else if (attributeName === 'src' && target.nodeName === 'IFRAME') {
						discard(target.contentDocument);
					}
				} else if (change.type === 'childList') {

					//	process added nodes
					Array.from(change.addedNodes).forEach(node => {
						if (node.nodeName === 'IFRAME') {
							if (node.contentDocument) {
								initDocumentObserver(node.contentDocument);
								collect(node.contentDocument);
							}
							node.addEventListener('load', function() {
								initDocumentObserver(this.contentDocument);
								collect(this.contentDocument);
							});
						} else {
							collect(node);
						}
					});

					//	process removed nodes
					Array.from(change.removedNodes).forEach(node => {
						if (node.nodeName === 'IFRAME') {
							discard(node.contentDocument);
						} else {
							discard(node);
						}
					});
				}
			});
		}

		let domObserver = new MutationObserver(processDomChanges);
		domObserver.observe(document, {
			childList: true,
			attributes: true,
			characterData: false,
			subtree: true,
			attributeOldValue: true,
			characterDataOldValue: false
		});
	}

	Reflect.defineProperty(namespace.DataTier, 'views', {
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

})();