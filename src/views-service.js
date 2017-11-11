(() => {
	'use strict';

	const namespace = this || window;

	if (!namespace.DataTier) {
		throw new Error('DataTier framework was not properly initialized');
	}

	const ties = namespace.DataTier.ties,
		processors = namespace.DataTier.processors,
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
		processors.getApplicable(event.target).forEach(processor => {
			if (processor.name === 'tieValue') {
				let processorParam = processor.parseParam(event.target.dataset[processor.name]),
					tie = ties.get(processorParam.tieName);
				if (!processorParam.dataPath) {
					console.error('path to data not available');
					return;
				}
				if (!tie) {
					console.error('tie "' + processorParam.tieName + '" not found');
					return;
				}

				processor.toData({data: tie.data, path: processorParam.dataPath, view: event.target});
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
			Object.keys(view.dataset)
				.filter(key => key.startsWith('tie'))
				.forEach(key => {
					let processor = processors.get(key);
					if (processor) {
						let processorParam = processor.parseParam(view.dataset[processor.name]),
							pathString = processorParam.dataPath.join('.'),
							tieViews,
							processorRelatedViews,
							pathViews;

						//	get tie views partition
						if (!views[processorParam.tieName]) {
							views[processorParam.tieName] = {};
						}
						tieViews = views[processorParam.tieName];

						//	get processor's views partition (in tie)
						if (!tieViews[processor.name]) {
							tieViews[processor.name] = {};
						}
						processorRelatedViews = tieViews[processor.name];

						//	get path views in this context
						if (!processorRelatedViews[pathString]) {
							processorRelatedViews[pathString] = [];
						}
						pathViews = processorRelatedViews[pathString];

						if (pathViews.indexOf(view) < 0) {
							pathViews.push(view);
							update(view, processor.name);
							addChangeListener(view);
						}
					} else {
						//	collect potentially future processor's element and put them into some tracking storage
						if (!nlvs[key]) nlvs[key] = [];
						nlvs[key].push(view);
					}
				});
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
			processors.getApplicable(element).forEach(processor => {
				param = processor.parseParam(element.dataset[processor.name]);
				pathViews = views[param.tieName][processor.name][param.dataPath.join('.')];
				i = pathViews.indexOf(element);
				if (i >= 0) {
					pathViews.splice(i, 1);
					delChangeListener(element);
				}
			});
		});
	}

	function move(view, processsorName, oldParam, newParam) {
		let processorParam, pathViews, i = -1;

		processorParam = processors.get(processsorName).parseParam(oldParam);

		//	delete old path
		if (views[processorParam.tieName] && views[processorParam.tieName][processsorName]) {
			pathViews = views[processorParam.tieName][processsorName][processorParam.dataPath];
			if (pathViews) i = pathViews.indexOf(view);
			if (i >= 0) {
				pathViews.splice(i, 1);
			}
		}

		//	add new path
		processorParam = processors.get(processsorName).parseParam(newParam);
		if (!views[processorParam.tieName]) views[processorParam.tieName] = {};
		if (!views[processorParam.tieName][processsorName]) views[processorParam.tieName][processsorName] = {};
		if (!views[processorParam.tieName][processsorName][processorParam.dataPath]) views[processorParam.tieName][processsorName][processorParam.dataPath] = [];
		views[processorParam.tieName][processsorName][processorParam.dataPath].push(view);
		update(view, processsorName);
	}

	function processChanges(tieName, changes) {
		let tieViews = views[tieName], processor, processorRelatedViews, changedPath;
		if (tieViews) {
			changes.forEach(change => {
				changedPath = change.path.join('.');
				Object.keys(tieViews).forEach(processorName => {
					processorRelatedViews = tieViews[processorName];
					if (processorRelatedViews) {
						processor = processors.get(processorName);
						Object.keys(processorRelatedViews).forEach(viewedPath => {
							if (processor.isChangedPathRelevant(changedPath, viewedPath)) {
								processorRelatedViews[viewedPath].forEach(view => {
									update(view, processorName);
								});
							}
						});
					}
				});
			});
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
			get processChanges() { return processChanges; },
			get applyProcessor() { return applyProcessor; }
		}
	});

	initDocumentObserver(document);
	collect(document);
})();