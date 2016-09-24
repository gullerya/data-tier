(function DataTier(scope) {
	'use strict';

	const api = {},
		utils = {};
        //dataRoot = {};

	if (typeof scope.DataTier.TiesService !== 'function') { throw new Error('DataTier initialization failed: "TiesService" not found'); }
	if (typeof scope.DataTier.ViewsService !== 'function') { throw new Error('DataTier initialization failed: "ViewsService" not found'); }
	if (typeof scope.DataTier.RulesService !== 'function') { throw new Error('DataTier initialization failed: "RulesService" not found'); }

	Reflect.defineProperty(api, 'utils', { value: utils });
	Reflect.defineProperty(api, 'tiesService', { value: new scope.DataTier.TiesService(api) });
	Reflect.defineProperty(api, 'viewsService', { value: new scope.DataTier.ViewsService(api) });
	Reflect.defineProperty(api, 'rulesService', { value: new scope.DataTier.RulesService(api) });

	function dataAttrToProp(v) {
		var i = 2, l = v.split('-'), r;
		r = l[1];
		while (i < l.length) r += l[i][0].toUpperCase() + l[i++].substr(1);
		return r;
	}

	function pathToNodes(value) {
		if (Array.isArray(value)) return value;

		var c = 0, b = false, n = '', r = [];
		while (c < value.length) {
			if (value[c] === '.') {
				if (n.length) { r.push(n); }
				n = '';
			} else if (value[c] === '[') {
				if (b) throw new Error('bad path: "' + value + '", at: ' + c);
				if (n.length) { r.push(n); }
				n = '';
				b = true;
			} else if (value[c] === ']') {
				if (!b) throw new Error('bad path: "' + value + '", at: ' + c);
				if (n.length) { r.push(n); }
				n = '';
				b = false;
			} else {
				n += value[c];
			}
			c++;
		}
		if (n.length) { r.push(n); }
		return r;
	}

	//	TODO: normalize this
	utils.pathToNodes = pathToNodes;

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
	var documentObserver = [];
	function initDocumentObserver(d) {
		function processDomChanges(changes) {
			changes.forEach(function (change) {
				var tp = change.type, tr = change.target, an = change.attributeName, i, l;
				if (tp === 'attributes' && an.indexOf('data-tie') === 0) {
					api.viewsService.move(tr, dataAttrToProp(an), change.oldValue, tr.getAttribute(an));
				} else if (tp === 'attributes' && an === 'src' && tr.nodeName === 'IFRAME') {
					api.viewsService.discard(tr.contentDocument);
				} else if (tp === 'childList') {
					if (change.addedNodes.length) {
						for (i = 0, l = change.addedNodes.length; i < l; i++) {
							if (change.addedNodes[i].nodeName === 'IFRAME') {
								if (change.addedNodes[i].contentDocument) {
									initDocumentObserver(change.addedNodes[i].contentDocument);
									api.viewsService.collect(change.addedNodes[i].contentDocument);
								}
								change.addedNodes[i].addEventListener('load', function () {
									initDocumentObserver(this.contentDocument);
									api.viewsService.collect(this.contentDocument);
								});
							} else {
								api.viewsService.collect(change.addedNodes[i]);
							}
						}
					}
					if (change.removedNodes.length) {
						for (i = 0, l = change.removedNodes.length; i < l; i++) {
							if (change.removedNodes[i].nodeName === 'IFRAME') {
								api.viewsService.discard(change.removedNodes[i].contentDocument);
							} else {
								api.viewsService.discard(change.removedNodes[i]);
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
		documentObserver.push(domObserver);
	}
	initDocumentObserver(document);

	api.viewsService.collect(document);

	Reflect.defineProperty(scope.DataTier, 'getTie', { value: api.tiesService.getTie });
	Reflect.defineProperty(scope.DataTier, 'createTie', { value: api.tiesService.createTie });
	Reflect.defineProperty(scope.DataTier, 'removeTie', { value: api.tiesService.removeTie });

	Reflect.defineProperty(scope.DataTier, 'Rule', { value: api.rulesService.Rule });
	Reflect.defineProperty(scope.DataTier, 'addRule', { value: api.rulesService.addRule });
	Reflect.defineProperty(scope.DataTier, 'getRule', { value: api.rulesService.getRule });
	Reflect.defineProperty(scope.DataTier, 'removeRule', { value: api.rulesService.removeRule });

})(this);