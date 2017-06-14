(function(scope) {
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