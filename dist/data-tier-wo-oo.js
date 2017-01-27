(function (scope) {
	'use strict';

	var ties = {};

	function Tie(name, observable, options) {
		var data;

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

				var oldData = data;
				data = observable;
				if (data) {
					data.observe(observer);
				}
				scope.DataTier.views.processChanges(name, [{ type: 'update', value: data, oldValue: oldData, path: [] }]);
			}
		});

		this.data = observable;
	}

	function create(name, observable, options) {
		validateTieName(name);
		validateObservable(observable);
		if (ties[name]) {
			throw new Error('existing tie (' + name + ') MAY NOT be re-created, use the tie\'s own APIs to reconfigure it');
		}

		return (ties[name] = new Tie(name, observable, options));
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

	Reflect.defineProperty(scope, 'DataTier', { value: {} });
	Reflect.defineProperty(scope.DataTier, 'ties', { value: {} });
	Reflect.defineProperty(scope.DataTier.ties, 'get', { value: function (name) { return ties[name]; } });
	Reflect.defineProperty(scope.DataTier.ties, 'create', { value: create });
	Reflect.defineProperty(scope.DataTier.ties, 'remove', { value: remove });

})(this);
﻿(function (scope) {
	'use strict';

	var rules = {};

	function Rule(name, options) {
		Reflect.defineProperty(this, 'name', { value: name });
		Reflect.defineProperty(this, 'dataToView', { value: options.dataToView });
		if (typeof options.inputToData === 'function') { Reflect.defineProperty(this, 'inputToData', { value: options.inputToData }); }
		if (typeof options.parseParam === 'function') { Reflect.defineProperty(this, 'parseParam', { value: options.parseParam }); }
	}
	Rule.prototype.parseParam = function (ruleParam) {
		var dataPath, tieName;
		if (ruleParam) {
			dataPath = ruleParam.split('.');
			tieName = dataPath[0].split(':')[0];
			if (dataPath[0] === tieName) {
				dataPath = [];
			} else {
				dataPath[0] = dataPath[0].replace(tieName + ':', '');
			}
			return {
				tieName: tieName,
				dataPath: dataPath
			};
		} else {
			console.error('valid rule value MUST be a non-empty string, found: ' + ruleParam);
		}
	};

	function addRule(name, configuration) {
		if (typeof name !== 'string' || !name) {
			throw new Error('name MUST be a non-empty string');
		}
		if (rules[name]) {
			throw new Error('rule "' + name + '" already exists; you may want to reconfigure the existing rule');
		}
		if (typeof configuration !== 'object' || !configuration) {
			throw new Error('configuration MUST be a non-null object');
		}
		if (typeof configuration.dataToView !== 'function') {
			throw new Error('configuration MUST have a "dataToView" function defined');
		}

		rules[name] = new Rule(name, configuration);
		scope.DataTier.views.applyRule(rules[name]);
	}

	function getRule(name) {
		return rules[name];
	}

	function removeRule(name) {
		if (typeof name !== 'string' || !name) {
			throw new Error('rule name MUST be a non-empty string');
		}

		return delete rules[name];
	}

	function getApplicable(element) {
		var result = [];
		if (element && element.nodeType === Node.ELEMENT_NODE) {
			Reflect.ownKeys(element.dataset).forEach(function (key) {
				if (rules[key]) {
					result.push(rules[key]);
				}
			});
		}
		return result;
	}

	Reflect.defineProperty(scope.DataTier, 'rules', { value: {} });
	Reflect.defineProperty(scope.DataTier.rules, 'get', { value: getRule });
	Reflect.defineProperty(scope.DataTier.rules, 'add', { value: addRule });
	Reflect.defineProperty(scope.DataTier.rules, 'remove', { value: removeRule });

	Reflect.defineProperty(scope.DataTier.rules, 'getApplicable', { value: getApplicable });

})(this);
﻿(function (scope) {
	'use strict';

	var views = {},
        nlvs = {};

	function getPath(ref, path) {
		var i;
		if (!ref) return;
		for (i = 0; i < path.length; i++) {
			ref = ref[path[i]];
			if (!ref) return;
		}
		return ref;
	}

	function changeListener(event) {
		scope.DataTier.rules.getApplicable(event.target).forEach(function (rule) {
			if (rule.name === 'tieValue') {
				var ruleParam = rule.parseParam(event.target.dataset[rule.name]),
					tie = scope.DataTier.ties.get(ruleParam.tieName);
				if (!ruleParam.dataPath) { console.error('path to data not available'); return; }
				if (!tie) { console.error('tie "' + ruleParam.tieName + '" not found'); return; }

				tie.viewToDataProcessor({ data: tie.data, path: ruleParam.dataPath, view: event.target });
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
			view.addEventListener('load', function () {
				initDocumentObserver(this.contentDocument);
				collect(this.contentDocument);
			});
			collect(view.contentDocument);
		} else {
			scope.DataTier.rules.getApplicable(view).forEach(function (rule) {
				var ruleParam = rule.parseParam(view.dataset[rule.name]),
					pathString = ruleParam.dataPath.join('.'),
					tieViews,
					ruleViews,
					pathViews;

				//	get tie views partition
				if (!views[ruleParam.tieName]) {
					views[ruleParam.tieName] = {};
				}
				tieViews = views[ruleParam.tieName];

				//	get rule views partition (in tie)
				if (!tieViews[rule.name]) {
					tieViews[rule.name] = {};
				}
				ruleViews = tieViews[rule.name];

				//	get path views in this context
				if (!ruleViews[pathString]) {
					ruleViews[pathString] = [];
				}
				pathViews = ruleViews[pathString];

				if (pathViews.indexOf(view) < 0) {
					pathViews.push(view);
					update(view, rule.name);
					addChangeListener(view);
				}
			});

			//	collect potentially future rules element and put them into some tracking storage
			for (var key in view.dataset) {
				if (key.indexOf('tie') === 0 && !scope.DataTier.rules.get(key)) {
					console.warn('non-registerd rule "' + key + '" used, it may still be defined later in code and post-tied');
					if (!nlvs[key]) nlvs[key] = [];
					nlvs[key].push(view);
				}
			}
		}
	}

	function update(view, ruleName) {
		var r, p, t, data;
		r = scope.DataTier.rules.get(ruleName);
		p = r.parseParam(view.dataset[ruleName]);
		t = scope.DataTier.ties.get(p.tieName);
		if (t) {
			data = getPath(t.data, p.dataPath);
			r.dataToView(data, view);
		}
	}

	function collect(rootElement) {
		var l;
		if (rootElement &&
            rootElement.nodeType &&
            (rootElement.nodeType === Node.DOCUMENT_NODE || rootElement.nodeType === Node.ELEMENT_NODE)) {
			l = rootElement.nodeName === 'IFRAME' ?
                l = Array.from(rootElement.contentDocument.getElementsByTagName('*')) :
                l = Array.from(rootElement.getElementsByTagName('*'));
			l.push(rootElement);
			l.forEach(add);
		}
	}

	function discard(rootElement) {
		var l, param, pathViews, i;
		if (!rootElement || !rootElement.getElementsByTagName) return;
		l = Array.from(rootElement.getElementsByTagName('*'));
		l.push(rootElement);
		l.forEach(function (e) {
			scope.DataTier.rules.getApplicable(e).forEach(function (rule) {
				param = rule.parseParam(e.dataset[rule.name]);
				pathViews = views[param.tieName][rule.name][param.dataPath.join('.')];
				i = pathViews.indexOf(e);
				if (i >= 0) {
					pathViews.splice(i, 1);
					delChangeListener(e);
				}
			});
		});
	}

	function move(view, ruleName, oldParam, newParam) {
		var ruleParam, pathViews, i = -1;

		ruleParam = scope.DataTier.rules.get(ruleName).parseParam(oldParam);

		//	delete old path
		if (views[ruleParam.tieName] && views[ruleParam.tieName][ruleName]) {
			pathViews = views[ruleParam.tieName][ruleName][ruleParam.dataPath];
			if (pathViews) i = pathViews.indexOf(view);
			if (i >= 0) {
				pathViews.splice(i, 1);
			}
		}

		//	add new path
		ruleParam = scope.DataTier.rules.get(ruleName).parseParam(newParam);
		if (!views[ruleParam.tieName]) views[ruleParam.tieName] = {};
		if (!views[ruleParam.tieName][ruleName]) views[ruleParam.tieName][ruleName] = {};
		if (!views[ruleParam.tieName][ruleName][ruleParam.dataPath]) views[ruleParam.tieName][ruleName][ruleParam.dataPath] = [];
		views[ruleParam.tieName][ruleName][ruleParam.dataPath].push(view);
		update(view, ruleName);
	}

	function processChanges(tieName, changes) {
		var tieViews = views[tieName], ruleViews, pathString;
		if (tieViews) {
			changes.forEach(function (change) {
				pathString = change.path.join('.');
				Object.keys(tieViews).forEach(function (ruleName) {
					ruleViews = tieViews[ruleName];
					if (ruleViews) {
						Object.keys(ruleViews).forEach(function (path) {
							if (path.indexOf(pathString) === 0 || path === '') {
								ruleViews[path].forEach(function (view) {
									update(view, ruleName);
								});
							}
						});
					}
				});
			});
		} else {
			console.debug('views of tie "' + tieName + '" are not defined');
		}
	}

	function applyRule(rule) {
		//	apply on a pending views
		if (nlvs[rule.name]) {
			nlvs[rule.name].forEach(function (view) {
				add(view);
			});
			delete nlvs[rule.name];
		}
	}

	function dataAttrToProp(v) {
		var i = 2, l = v.split('-'), r;
		r = l[1];
		while (i < l.length) r += l[i][0].toUpperCase() + l[i++].substr(1);
		return r;
	}

	function initDocumentObserver(document) {
		function processDomChanges(changes) {
			changes.forEach(function (change) {
				var tr = change.target, an = change.attributeName;
				if (change.type === 'attributes' && an.indexOf('data-tie') === 0) {
					move(tr, dataAttrToProp(an), change.oldValue, tr.getAttribute(an));
				} else if (change.type === 'attributes' && an === 'src' && tr.nodeName === 'IFRAME') {
					discard(tr.contentDocument);
				} else if (change.type === 'childList') {

					//	process added nodes
					Array.from(change.addedNodes).forEach(function (addedNode) {
						if (addedNode.nodeName === 'IFRAME') {
							if (addedNode.contentDocument) {
								initDocumentObserver(addedNode.contentDocument);
								collect(addedNode.contentDocument);
							}
							addedNode.addEventListener('load', function () {
								initDocumentObserver(this.contentDocument);
								collect(this.contentDocument);
							});
						} else {
							collect(addedNode);
						}
					});

					//	process removed nodes
					Array.from(change.removedNodes).forEach(function (removedNode) {
						if (removedNode.nodeName === 'IFRAME') {
							discard(removedNode.contentDocument);
						} else {
							discard(removedNode);
						}
					});
				}
			});
		}

		var domObserver = new MutationObserver(processDomChanges);
		domObserver.observe(document, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeOldValue: true,
			characterData: false,
			characterDataOldValue: false
		});
	}

	Reflect.defineProperty(scope.DataTier, 'views', { value: {} });
	Reflect.defineProperty(scope.DataTier.views, 'processChanges', { value: processChanges });
	Reflect.defineProperty(scope.DataTier.views, 'applyRule', { value: applyRule });

	initDocumentObserver(document);
	collect(document);

})(this);
﻿(function (scope) {
	'use strict';

	var add = scope.DataTier.rules.add;

	add('tieValue', {
		dataToView: function (data, view) {
			view.value = data ? data : '';
		}
	});

	add('tieText', {
		dataToView: function (data, view) {
			view.textContent = data ? data.toString() : '';
		}
	});

	add('tiePlaceholder', {
		dataToView: function (data, view) {
			view.placeholder = data ? data : '';
		}
	});

	add('tieTooltip', {
		dataToView: function (data, view) {
			view.title = data ? data : '';
		}
	});

	add('tieImage', {
		dataToView: function (data, view) {
			view.src = data ? data : '';
		}
	});

	add('tieDateValue', {
		dataToView: function (data, view) {
			view.value = data ? data.toLocaleString() : '';
		}
	});

	add('tieDateText', {
		dataToView: function (data, view) {
			view.textContent = data ? data.toLocaleString() : '';
		}
	});

	add('tieList', {
		parseParam: function (ruleValue) {
			return this.constructor.prototype.parseParam(ruleValue.split(/\s*=>\s*/)[0]);
		},
		dataToView: function (tiedValue, template) {
			var container = template.parentNode, i, nv, ruleData, itemId, vs, d, df;

			function shortenListTo(cnt, aid) {
				var a = Array.from(container.querySelectorAll('[data-list-item-aid="' + aid + '"]'));
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
						vs = nv.querySelectorAll('*');
						vs.forEach(function (view) {
							Object.keys(view.dataset).forEach(function (key) {
								if (view.dataset[key].indexOf(itemId) === 0) {
									view.dataset[key] = view.dataset[key].replace(itemId + ':', ruleData[0] + ':' + i + '.');
								}
							});
						});
						df.appendChild(nv);
						df.lastElementChild.dataset.listItemAid = template.dataset.listSourceAid;
					}
					container.appendChild(df);
				}
			}
		}
	});

})(this);
