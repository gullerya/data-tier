(() => {
	'use strict';

	(() => {
		let w = window, s = Symbol.for('data-tier');
		while (w.parent !== w) w = w.parent;
		if (w[s]) throw new Error('data-tier found to already being running within this application, cancelling current execution');
		else w[s] = true;
	})();

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
		Object.seal(this);
	}

	function getTie(name) {
		return ties[name];
	}

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

	Reflect.defineProperty(namespace, 'DataTier', {value: {}});
	Reflect.defineProperty(namespace.DataTier, 'ties', {
		value: {
			get get() {
				return getTie;
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
		throw new Error('data-tier framework was not properly initialized');
	}

	function DataProcessor(name, options) {
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

	Reflect.defineProperty(DataProcessor.prototype, 'parseParam', {value: defaultParseParam});
	Reflect.defineProperty(DataProcessor.prototype, 'isChangedPathRelevant', {value: defaultIsChangedPathRelevant});

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
				.forEach(processor => result.push(processor));
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
				changedPath = change.path ? change.path.join('.') : null;
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
			get applyProcessor() { return applyProcessor; },
			get updateView() { return update; }
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
		throw new Error('data-tier framework was not properly initialized');
	}

	add('tieValue', {
		toView: function(data, view) {
			if (view.type === 'checkbox') {
				view.checked = data;
			} else {
				view.value = typeof data !== 'undefined' && data !== null ? data : '';
			}
		},
		changeDOMEventType: 'change'
	});

	add('tieInput', {
		toView: function(data, view) {
			view.value = typeof data !== 'undefined' && data !== null ? data : '';
		},
		changeDOMEventType: 'input'
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

})();
﻿(() => {
	'use strict';

	const namespace = this || window,
		add = namespace.DataTier.processors.add,
		viewsService = namespace.DataTier.views;

	if (!namespace.DataTier) {
		throw new Error('data-tier framework was not properly initialized');
	}

	function signTemplate(template, sign) {
		let children = template.content.children;
		for (let i = 0, l = children.length; i < l; i++) {
			children[i].dataset.dtListItemAid = sign;
		}
	}

	function extractProcessorParameters(paramValue) {
		let procParam;
		if (paramValue) {
			procParam = paramValue.trim().split(/\s+/);
			if (!procParam || procParam.length !== 3 || procParam[1] !== '=>') {
				throw new Error('invalid parameter for "tieList" rule specified');
			}
		}
		return procParam;
	}

	function prepareOptimizationMap(template, itemId) {
		let result = {index: []},
			views = template.content.querySelectorAll('*'),
			i = views.length, view, keys, i1, key, value, relevantKeys;
		while (i--) {
			view = views[i];
			if (view.nodeType !== Node.DOCUMENT_NODE && view.nodeType !== Node.ELEMENT_NODE) continue;
			keys = Object.keys(view.dataset);
			i1 = keys.length;
			relevantKeys = [];
			while (i1--) {
				key = keys[i1];
				value = view.dataset[key];
				if (key.startsWith('tie') && value.startsWith(itemId))
					relevantKeys.push([key, value.replace(itemId, '')]);
			}
			if (relevantKeys.length) {
				result[i] = relevantKeys;
				result.index.push(i);
			}
		}
		return result;
	}

	function insertNewContent(container, template, processorParameters, from, to) {
		let result, optimizationMap, tmpContent, tmpTemplate, index = from, i, i1, tmp,
			prefix = processorParameters[0] + '.', optTmpIdx,
			views, view,
			pairs, key;
		tmpContent = template.content;
		optimizationMap = prepareOptimizationMap(template, processorParameters[2]);
		optTmpIdx = optimizationMap.index;

		for (; index < to; index++) {
			tmpTemplate = tmpContent.cloneNode(true);
			views = tmpTemplate.querySelectorAll('*');
			i = optTmpIdx.length;
			while (i--) {
				tmp = optTmpIdx[i];
				view = views[tmp];
				pairs = optimizationMap[tmp];
				i1 = pairs.length;
				while (i1--) {
					key = pairs[i1][0];
					view.dataset[key] = prefix + index + pairs[i1][1];
				}
			}
			index === from ? result = tmpTemplate : result.appendChild(tmpTemplate);
		}

		container.appendChild(result);
	}

	function updateExistingContent(template, container, required) {
		let allBluePrintElements = template.content.querySelectorAll('*'),
			tieProcsMap = [], i;
		i = allBluePrintElements.length;
		while (i--) {
			tieProcsMap[i] = Object.keys(allBluePrintElements[i].dataset).filter(key => key.startsWith('tie'));
		}

		let done = 0, i1, i2, child,
			descendants, descendant,
			keys;
		i = 0;
		while (done < required) {
			child = container.childNodes[i++];
			if (child !== template && (child.nodeType === Node.DOCUMENT_NODE || child.nodeType === Node.ELEMENT_NODE) && child.dataset.dtListItemAid) {
				descendants = child.querySelectorAll('*');
				i1 = tieProcsMap.length;
				while (i1--) {
					descendant = i1 ? descendants[i1 - 1] : child;
					keys = tieProcsMap[i1];
					i2 = keys.length;
					while (i2--) {
						viewsService.updateView(descendant, keys[i2]);
					}
				}
				done++;
			}
		}
	}

	add('tieList', {
		parseParam: function(ruleValue) {
			return this.constructor.prototype.parseParam(ruleValue.split(/\s*=>\s*/)[0]);
		},
		isChangedPathRelevant: function(changedPath, viewedPath) {
			if (!changedPath) return true;

			let subPath = changedPath.replace(viewedPath, '').split('.');
			return this.constructor.prototype.isChangedPathRelevant(changedPath, viewedPath) ||
				subPath.length === 1 ||
				(subPath.length === 2 && subPath[0] === '');
		},
		toView: function(tiedValue, template) {
			if (!Array.isArray(tiedValue) || !template) return;

			let container = template.parentNode, ruleData,
				templateItemAid,
				desiredListLength = tiedValue.length;

			if (template.nodeName !== 'TEMPLATE') {
				throw new Error('tieList may be defined on template elements only');
			}
			if (!template.content.childElementCount) {
				throw new Error('tieList\'s TEMPLATE MUST HAVE at least one child element');
			}

			templateItemAid = template.content.firstElementChild.dataset.dtListItemAid;
			if (!templateItemAid) {
				templateItemAid = new Date().getTime();
				signTemplate(template, templateItemAid);
			}

			//	adjust list elements size to the data length
			let existingList = container.querySelectorAll('[data-dt-list-item-aid="' + templateItemAid + '"]'),
				existingListLength = existingList.length;

			if (existingListLength > desiredListLength) {
				while (existingListLength > desiredListLength) container.removeChild(existingList[--existingListLength]);
			}

			//	run update on the whole list (in future attempt to get the change's content and optimize this one)
			updateExistingContent(template, container, existingListLength);

			if (existingListLength < desiredListLength) {
				ruleData = extractProcessorParameters(template.dataset.tieList);
				insertNewContent(container, template, ruleData, existingListLength, desiredListLength);
			}
		}
	});

})();
