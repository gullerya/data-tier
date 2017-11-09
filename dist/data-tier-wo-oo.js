//	tie should provide it's own processors API
//	if tie has no requested processor - it should fall back to the global processors service
//	this API should be used internally for update as well as publicly available for maintenance/management
//	for the debugging purposes it should be possible to easily understand which processor actually handled the data

//	test cases:
//	- OOTB processors
//	- non-existing processors
//	- overriding global processors
//	- overriding global processors on tie level (global processor is still used for other ties)

(() => {
	'use strict';

	const namespace = this || window,
		ties = {};

	function Tie(name, observable, options) {
		let data, dataProcessors = {};

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
			set: function(input) {
				let oldData = data,
					newData = ensureObservable(input);
				if (data) data.revoke();
				data = newData;
				if (data) data.observe(observer);
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

	function create(name, input, options) {
		validateTieName(name);
		if (ties[name]) {
			throw new Error('existing tie (' + name + ') MAY NOT be re-created, use the tie\'s own APIs to reconfigure it');
		}
		return new Tie(name, ensureObservable(input), options);
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

	function ensureObservable(o) {
		if (typeof o === 'undefined' || o === null) {
			return o;
		} else if (typeof o !== 'object') {
			throw new Error(o + ' is not of type Observable and not an object');
		} else if (typeof o.observe === 'function' && typeof o.unobserve === 'function' && typeof o.revoke === 'function') {
			return o;
		} else if (!namespace.Observable) {
			throw new Error(o + ' is not of type Observable and no embedded Observable implementation found');
		} else if (typeof o.observe === 'function' || typeof o.unobserve === 'function' || typeof o.revoke === 'function') {
			throw new Error(o + ' is not of type Observable and can not be transformed into Observable (some of its functions already implemented?)');
		} else {
			return namespace.Observable.from(o);
		}
	}

	//	TODO: this is similar to getPath in views-service - unify
	function setPath(ref, path, value) {
		let i;
		if (!ref) return;
		for (i = 0; i < path.length - 1; i++) {
			ref = path[i] in ref ? ref[path[i]] : {};
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
﻿(() => {
	'use strict';

	const namespace = this || window,
		processors = {};

	if (!namespace.DataTier) {
		throw new Error('DataTier framework was not properly initialized');
	}

	function DataProcessor(name, options) {
		Reflect.defineProperty(this, 'name', {value: name});
		Reflect.defineProperty(this, 'toView', {value: options.toView});
		if (typeof options.toData === 'function') {
			Reflect.defineProperty(this, 'toData', {value: options.toData});
		}
		if (typeof options.parseParam === 'function') {
			Reflect.defineProperty(this, 'parseParam', {value: options.parseParam});
		}
		if (typeof options.isChangedPathRelevant === 'function') {
			Reflect.defineProperty(this, 'isChangedPathRelevant', {value: options.isChangedPathRelevant});
		}
	}

	DataProcessor.prototype.parseParam = function(param) {
		let tieName = '', dataPath = [];
		if (param) {
			dataPath = param.trim().split('.');
			tieName = dataPath.shift();
		}
		return {
			tieName: tieName,
			dataPath: dataPath
		};
	};
	DataProcessor.prototype.isChangedPathRelevant = function(changedPath, viewedPath) {
		return viewedPath.startsWith(changedPath);
	};

	function add(name, configuration) {
		if (typeof name !== 'string' || !name) {
			throw new Error('name MUST be a non-empty string');
		}
		if (processors[name]) {
			throw new Error('data processor "' + name + '" already exists; you may want to reconfigure the existing one');
		}
		if (typeof configuration !== 'object' || !configuration) {
			throw new Error('configuration MUST be a non-null object');
		}
		if (typeof configuration.toView !== 'function') {
			throw new Error('configuration MUST have a "toView" function defined');
		}

		processors[name] = new DataProcessor(name, configuration);
		namespace.DataTier.views.applyProcessor(processors[name]);
	}

	function get(name) {
		return processors[name];
	}

	function remove(name) {
		if (typeof name !== 'string' || !name) {
			throw new Error('controller name MUST be a non-empty string');
		}

		return delete processors[name];
	}

	function getApplicable(element) {
		let result = [];
		if (element && element.dataset) {
			Object.keys(element.dataset)
				.filter(key => key in processors)
				.map(key => processors[key])
				.forEach(result.push);
		}
		return result;
	}

	Reflect.defineProperty(namespace.DataTier, 'processors', {
		value: {
			get get() { return get; },
			get add() { return add; },
			get remove() { return remove; },
			get getApplicable() { return getApplicable; }
		}
	});

})();
﻿(() => {
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

				tie.viewToDataProcessor({data: tie.data, path: processorParam.dataPath, view: event.target});
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
﻿(() => {
	'use strict';

	const namespace = this || window,
		add = namespace.DataTier.processors.add;

	if (!namespace.DataTier) {
		throw new Error('DataTier framework was not properly initialized');
	}

	add('tieValue', {
		toView: function(data, view) {
			if (view.type === 'checkbox') {
				view.checked = data;
			} else {
				view.value = typeof data !== 'undefined' && data !== null ? data : '';
			}
		}
	});

	add('tieText', {
		toView: function(data, view) {
			view.textContent = typeof data !== 'undefined' && data !== null ? data : '';
		}
	});

	add('tiePlaceholder', {
		toView: function(data, view) {
			view.placeholder = typeof data !== 'undefined' && data !== null ? data : '';
		}
	});

	add('tieTooltip', {
		toView: function(data, view) {
			view.title = typeof data !== 'undefined' && data !== null ? data : '';
		}
	});

	add('tieSrc', {
		toView: function(data, view) {
			view.src = typeof data !== 'undefined' && data !== null ? data : '';
		}
	});

	add('tieHRef', {
		toView: function(data, view) {
			view.href = typeof data !== 'undefined' && data !== null ? data : '';
		}
	});

	add('tieDateValue', {
		toView: function(data, view) {
			view.value = typeof data !== 'undefined' && data !== null ? data.toLocaleString() : '';
		}
	});

	add('tieDateText', {
		toView: function(data, view) {
			view.textContent = typeof data !== 'undefined' && data !== null ? data.toLocaleString() : '';
		}
	});

	add('tieClasses', {
		isChangedPathRelevant: function(changedPath, viewedPath) {
			let subPath = changedPath.replace(viewedPath, '').split('.');
			return this.constructor.prototype.isChangedPathRelevant(changedPath, viewedPath) ||
				subPath.length === 1 ||
				(subPath.length === 2 && subPath[0] === '');
		},
		toView: function(data, view) {
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
		toView: function(tiedValue, template) {
			let container = template.parentNode, i, nv, ruleData, itemId, d, df, lc;

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
						Array.from(nv.querySelectorAll('*'))
							.forEach(view => {
								Object.keys(view.dataset)
									.forEach(key => {
										let value = view.dataset[key];
										if (value.startsWith(itemId)) {
											view.dataset[key] = value.replace(itemId, ruleData[0] + '.' + i);
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

})();
