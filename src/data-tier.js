(function DataTier(scope) {
	'use strict';

	var config = {};

	if (typeof scope.DataTier !== 'object') { throw new Error('DataTier initialization faile: "DataTier" namespace not found'); }
	if (typeof scope.DataTier.TiesService !== 'function') { throw new Error('DataTier initialization failed: "TiesService" not found'); }
	if (typeof scope.DataTier.ViewsService !== 'function') { throw new Error('DataTier initialization failed: "ViewsService" not found'); }
	if (typeof scope.DataTier.RulesService !== 'function') { throw new Error('DataTier initialization failed: "RulesService" not found'); }

	Reflect.defineProperty(scope.DataTier, 'ties', { value: new scope.DataTier.TiesService(config) });
	Reflect.defineProperty(scope.DataTier, 'views', { value: new scope.DataTier.ViewsService(config) });
	Reflect.defineProperty(scope.DataTier, 'rules', { value: new scope.DataTier.RulesService(config) });

	function dataAttrToProp(v) {
		var i = 2, l = v.split('-'), r;
		r = l[1];
		while (i < l.length) r += l[i][0].toUpperCase() + l[i++].substr(1);
		return r;
	}

	//function setPath(ref, path, value) {
	//	var list = pathToNodes(path), i;
	//	for (i = 0; i < list.length - 1; i++) {
	//		if (typeof ref[list[i]] === 'object') ref = ref[list[i]];
	//		else if (!(list[i] in ref)) ref = (ref[list[i]] = {});
	//		else throw new Error('the path is unavailable');
	//	}
	//	ref[list[i]] = value;
	//}

	//function getPath(ref, path) {
	//	var list, i;
	//	if (!ref) return;
	//	list = pathToNodes(path);
	//	for (i = 0; i < list.length; i++) {
	//		ref = ref[list[i]];
	//		if (!ref) return;
	//	}
	//	return ref;
	//}

	//function cutPath(ref, path) {
	//	var list = pathToNodes(path), i = 0, value;
	//	for (; i < list.length - 1; i++) {
	//		if (list[i] in ref) ref = ref[list[i]];
	//		else return;
	//	}
	//	value = ref[list[i - 1]];
	//	delete ref[list[i - 1]];
	//	return value;
	//}

	//	TODO: move this to the views service
	function initDocumentObserver(d) {
		function processDomChanges(changes) {
			changes.forEach(function (change) {
				var tp = change.type, tr = change.target, an = change.attributeName, i, l;
				if (tp === 'attributes' && an.indexOf('data-tie') === 0) {
					config.views.move(tr, dataAttrToProp(an), change.oldValue, tr.getAttribute(an));
				} else if (tp === 'attributes' && an === 'src' && tr.nodeName === 'IFRAME') {
					config.views.discard(tr.contentDocument);
				} else if (tp === 'childList') {
					if (change.addedNodes.length) {
						for (i = 0, l = change.addedNodes.length; i < l; i++) {
							if (change.addedNodes[i].nodeName === 'IFRAME') {
								if (change.addedNodes[i].contentDocument) {
									initDocumentObserver(change.addedNodes[i].contentDocument);
									config.views.collect(change.addedNodes[i].contentDocument);
								}
								change.addedNodes[i].addEventListener('load', function () {
									initDocumentObserver(this.contentDocument);
									config.views.collect(this.contentDocument);
								});
							} else {
								config.views.collect(change.addedNodes[i]);
							}
						}
					}
					if (change.removedNodes.length) {
						for (i = 0, l = change.removedNodes.length; i < l; i++) {
							if (change.removedNodes[i].nodeName === 'IFRAME') {
								config.views.discard(change.removedNodes[i].contentDocument);
							} else {
								config.views.discard(change.removedNodes[i]);
							}
						}
					}
				}
			});
		}

		var domObserver = new MutationObserver(processDomChanges);
		domObserver.observe(d, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeOldValue: true,
			characterData: false,
			characterDataOldValue: false
		});
	}
	initDocumentObserver(document);

	scope.DataTier.initVanillaRules(config);

	config.views.collect(document);

})(this);