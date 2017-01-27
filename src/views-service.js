(function (scope) {
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