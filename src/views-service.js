(() => {
	'use strict';

	const namespace = this || window;

	if (!namespace.DataTier) {
		throw new Error('data-tier framework was not properly initialized');
	}

	const ties = namespace.DataTier.ties,
		processors = namespace.DataTier.processors,
		views = {},
		nlvs = {};

	//	TODO: this is similar to setPath in processors-service - unify
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
			relevantProcessors = processors.getApplicable(target),
			processor, processorParam, tie, i;
		i = relevantProcessors.length;
		while (i--) {
			processor = relevantProcessors[i];
			if (event.type === processor.changeDOMEventType) {
				processorParam = processor.parseParam(target.dataset[processor.name]);
				tie = ties.get(processorParam.tieName);
				if (!processorParam.dataPath) {
					console.error('path to data not available');
					return;
				}
				if (!tie) {
					console.error('tie "' + processorParam.tieName + '" not found');
					return;
				}

				processor.toData({data: tie.data, path: processorParam.dataPath, view: target});
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
				processor, processorParam, pathString,
				tieViews, procViews, pathViews, i;
			i = keys.length;
			while (i--) {
				key = keys[i];
				if (!key.startsWith('tie')) continue;
				processor = processors.get(key);
				if (processor) {
					processorParam = processor.parseParam(view.dataset[processor.name]);
					pathString = processorParam.dataPath.join('.');
					tieViews = views[processorParam.tieName] || (views[processorParam.tieName] = {});
					procViews = tieViews[processor.name] || (tieViews[processor.name] = {});
					pathViews = procViews[pathString] || (procViews[pathString] = []);

					if (pathViews.indexOf(view) < 0) {
						pathViews.push(view);
						update(view, processor.name);
						if (processor.changeDOMEventType) {
							addChangeListener(view, processor.changeDOMEventType);
						}
					}
				} else {
					//	collect potentially future processor's element and put them into some tracking storage
					if (!nlvs[key]) nlvs[key] = [];
					nlvs[key].push(view);
				}
			}
		}
	}

	function update(view, processorName) {
		let r, p, t, data;
		r = processors.get(processorName);
		p = r.parseParam(view.dataset[processorName]);
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
				element, tmpProcs, processor, i, l, i1,
				param, pathViews, index;
			for (i = 0, l = list.length; i <= l; i++) {
				element = i < l ? list[i] : rootElement;
				if (!element.dataset || !element.dataset.length) continue;
				tmpProcs = processors.getApplicable(element);
				i1 = tmpProcs.length;
				while (i1--) {
					processor = tmpProcs[i1];
					param = processor.parseParam(element.dataset[processor.name]);
					pathViews = views[param.tieName][processor.name][param.dataPath.join('.')];
					index = pathViews.indexOf(element);
					if (index >= 0) {
						pathViews.splice(index, 1);
						if (processor.changeDOMEventType) {
							delChangeListener(element, processor.changeDOMEventType);
						}
					}
				}
			}
		}
	}

	function move(view, processorName, oldParam, newParam) {
		let processor, processorParam, pathViews, i = -1;

		processor = processors.get(processorName);
		if (!processor) return;
		processorParam = processors.get(processorName).parseParam(oldParam);

		//	delete old path
		if (views[processorParam.tieName] && views[processorParam.tieName][processorName]) {
			pathViews = views[processorParam.tieName][processorName][processorParam.dataPath];
			if (pathViews) i = pathViews.indexOf(view);
			if (i >= 0) {
				pathViews.splice(i, 1);
			}
		}

		//	add new path
		processorParam = processors.get(processorName).parseParam(newParam);
		if (!views[processorParam.tieName]) views[processorParam.tieName] = {};
		if (!views[processorParam.tieName][processorName]) views[processorParam.tieName][processorName] = {};
		if (!views[processorParam.tieName][processorName][processorParam.dataPath]) views[processorParam.tieName][processorName][processorParam.dataPath] = [];
		views[processorParam.tieName][processorName][processorParam.dataPath].push(view);
		update(view, processorName);
	}

	function processChanges(tieName, changes) {
		let tieViews = views[tieName], change, changedPath,
			procNames, procName, processor, viewedPaths, viewedPath, procViews, pathViews,
			i, i1, i2, i3;
		if (tieViews) {
			i = changes.length;
			while (i--) {
				change = changes[i];
				changedPath = change.path.join('.');
				procNames = Object.keys(tieViews);
				i1 = procNames.length;
				while (i1--) {
					procName = procNames[i1];
					procViews = tieViews[procName];
					if (procViews) {
						processor = processors.get(procName);
						viewedPaths = Object.keys(procViews);
						i2 = viewedPaths.length;
						while (i2--) {
							viewedPath = viewedPaths[i2];
							if (processor.isChangedPathRelevant(changedPath, viewedPath)) {
								pathViews = procViews[viewedPath];
								i3 = pathViews.length;
								while (i3--) {
									update(pathViews[i3], procName);
								}
							}
						}
					}
				}
			}
		}
	}

	function applyProcessor(processor) {
		//	apply on a pending views
		if (nlvs[processor.name]) {
			nlvs[processor.name].forEach(add);
			delete nlvs[processor.name];
		}
	}

	function dataAttrToProp(v) {
		let i = 2, l = v.split('-'), r;
		r = l[1];
		while (i < l.length) r += l[i][0].toUpperCase() + l[i++].substr(1);
		return r;
	}

	let viewsToSkip = new Map();

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
						if (viewsToSkip.has(node)) {
							viewsToSkip.delete(node);
							continue;
						}
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
						if (viewsToSkip.has(node)) {
							viewsToSkip.delete(node);
							continue;
						}
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
			get applyProcessor() { return applyProcessor; },
			get updateView() { return update;},
			get viewsToSkip() {return viewsToSkip;}
		}
	});

	initDocumentObserver(document);
	collect(document);
})();