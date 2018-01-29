(() => {
	'use strict';

	const namespace = this || window;

	if (!namespace.DataTier) {
		throw new Error('data-tier framework was not properly initialized');
	}

	const ties = namespace.DataTier.ties,
		controllers = namespace.DataTier.controllers,
		views = {},
		nlvs = {};

	//	TODO: this is similar to setPath in controllers-service - unify
	function getPath(ref, path) {
		if (!ref) return;
		for (let i = 0, pathLength = path.length; i < pathLength; i++) {
			if (path[i] in ref) ref = ref[path[i]];
			else return;
		}
		return ref;
	}

	function changeListener(event) {
		let target = event.target,
			relevantControllers = controllers.getApplicable(target),
			controller, controllerParam, tie, i;
		i = relevantControllers.length;
		while (i--) {
			controller = relevantControllers[i];
			if (event.type === controller.changeDOMEventType) {
				controllerParam = controller.parseParam(target.dataset[controller.name]);
				tie = ties.get(controllerParam.tieName);
				if (!controllerParam.dataPath) {
					console.error('path to data not available');
					return;
				}
				if (!tie) {
					console.error('tie "' + controllerParam.tieName + '" not found');
					return;
				}

				controller.toData({data: tie.data, path: controllerParam.dataPath, view: target});
			}
		}
	}

	function addChangeListener(view, changeDOMEventType) {
		view.addEventListener(changeDOMEventType, changeListener);
	}

	function delChangeListener(view, changeDOMEventType) {
		view.removeEventListener(changeDOMEventType, changeListener);
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
			let keys = Object.keys(view.dataset), key,
				controller, controllerParam, pathString,
				tieViews, procViews, pathViews, i;
			i = keys.length;
			while (i--) {
				key = keys[i];
				if (!key.startsWith('tie')) continue;
				controller = controllers.get(key);
				if (controller) {
					controllerParam = controller.parseParam(view.dataset[controller.name]);
					pathString = controllerParam.dataPath.join('.');
					tieViews = views[controllerParam.tieName] || (views[controllerParam.tieName] = {});
					procViews = tieViews[controller.name] || (tieViews[controller.name] = {});
					pathViews = procViews[pathString] || (procViews[pathString] = []);

					if (pathViews.indexOf(view) < 0) {
						pathViews.push(view);
						update(view, controller.name);
						if (controller.changeDOMEventType) {
							addChangeListener(view, controller.changeDOMEventType);
						}
					}
				} else {
					//	collect potentially future controller's element and put them into some tracking storage
					if (!nlvs[key]) nlvs[key] = [];
					nlvs[key].push(view);
				}
			}
		}
	}

	function update(view, controllerName) {
		let r, p, t, data;
		r = controllers.get(controllerName);
		p = r.parseParam(view.dataset[controllerName]);
		t = ties.get(p.tieName);
		if (t) {
			data = getPath(t.data, p.dataPath);
			r.toView(data, view);
		}
	}

	function collect(rootElement) {
		if (rootElement && (rootElement.nodeType === Node.DOCUMENT_NODE || rootElement.nodeType === Node.ELEMENT_NODE)) {
			let list, i;
			if (rootElement.nodeName === 'IFRAME') {
				list = rootElement.contentDocument.getElementsByTagName('*');
			} else {
				list = rootElement.getElementsByTagName('*');
			}

			add(rootElement);
			i = list.length;
			while (i--) add(list[i]);
		}
	}

	function discard(rootElement) {
		if (rootElement && rootElement.getElementsByTagName) {
			let list = rootElement.getElementsByTagName('*'),
				element, tmpCtrls, controller, i, l, i1,
				param, pathViews, index;
			for (i = 0, l = list.length; i <= l; i++) {
				element = i < l ? list[i] : rootElement;
				if (!element.dataset || !element.dataset.length) continue;
				tmpCtrls = controllers.getApplicable(element);
				i1 = tmpCtrls.length;
				while (i1--) {
					controller = tmpCtrls[i1];
					param = controller.parseParam(element.dataset[controller.name]);
					pathViews = views[param.tieName][controller.name][param.dataPath.join('.')];
					index = pathViews.indexOf(element);
					if (index >= 0) {
						pathViews.splice(index, 1);
						if (controller.changeDOMEventType) {
							delChangeListener(element, controller.changeDOMEventType);
						}
					}
				}
			}
		}
	}

	function move(view, controllerName, oldParam, newParam) {
		let controller, controllerParam, pathViews, i = -1;

		controller = controllers.get(controllerName);
		if (!controller) return;
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
		let tieViews = views[tieName], change, changedPath,
			ctrlNames, ctrlName, controller, viewedPaths, viewedPath, ctrlViews, pathViews,
			i, i1, i2, i3;
		if (tieViews) {
			i = changes.length;
			while (i--) {
				change = changes[i];
				changedPath = change.path ? change.path.join('.') : null;
				ctrlNames = Object.keys(tieViews);
				i1 = ctrlNames.length;
				while (i1--) {
					ctrlName = ctrlNames[i1];
					ctrlViews = tieViews[ctrlName];
					if (ctrlViews) {
						controller = controllers.get(ctrlName);
						viewedPaths = Object.keys(ctrlViews);
						i2 = viewedPaths.length;
						while (i2--) {
							viewedPath = viewedPaths[i2];
							if (controller.isChangedPathRelevant(changedPath, viewedPath)) {
								pathViews = ctrlViews[viewedPath];
								i3 = pathViews.length;
								while (i3--) {
									update(pathViews[i3], ctrlName);
								}
							}
						}
					}
				}
			}
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
			let i1, i2, i3,
				change, changeType,
				added, removed, node;
			i1 = changes.length;
			while (i1--) {
				change = changes[i1];
				changeType = change.type;
				if (changeType === 'attributes') {
					let node = change.target,
						attributeName = change.attributeName;
					if (node.nodeType !== Node.DOCUMENT_NODE && node.nodeType !== Node.ELEMENT_NODE) continue;
					if (attributeName.indexOf('data-tie') === 0) {
						move(node, dataAttrToProp(attributeName), change.oldValue, node.getAttribute(attributeName));
					} else if (attributeName === 'src' && node.nodeName === 'IFRAME') {
						discard(node.contentDocument);
					}
				} else if (changeType === 'childList') {

					//	process added nodes
					added = change.addedNodes;
					i2 = added.length;
					while (i2--) {
						node = added[i2];
						if (node.nodeType !== Node.DOCUMENT_NODE && node.nodeType !== Node.ELEMENT_NODE) continue;
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
					}

					//	process removed nodes
					removed = change.removedNodes;
					i3 = removed.length;
					while (i3--) {
						node = removed[i3];
						if (node.nodeType !== Node.DOCUMENT_NODE && node.nodeType !== Node.ELEMENT_NODE) continue;
						if (node.nodeName === 'IFRAME') {
							discard(node.contentDocument);
						} else {
							discard(node);
						}
					}
				}
			}
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
			get processChanges() { return processChanges; },
			get applyController() { return applyController; },
			get updateView() { return update; }
		}
	});

	initDocumentObserver(document);
	collect(document);
})();