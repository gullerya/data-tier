(() => {
	'use strict';

	const namespace = this || window,
		add = namespace.DataTier.processors.add,
		viewsService = namespace.DataTier.views;

	if (!namespace.DataTier) {
		throw new Error('data-tier framework was not properly initialized');
	}

	function signTemplate(template, sign) {
		let children = template.content.childNodes;
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

	function prepareNewItems(template, itemId, prefix, from, to) {
		let result, optimizationMap, tmpTemplate, index = from, i, i1, tmp,
			views, view,
			pairs, key;
		optimizationMap = prepareOptimizationMap(template, itemId);

		for (; index < to; index++) {
			tmpTemplate = template.content.cloneNode(true);
			views = tmpTemplate.querySelectorAll('*');
			i = optimizationMap.index.length;
			while (i--) {
				tmp = optimizationMap.index[i];
				view = views[tmp];
				pairs = optimizationMap[tmp];
				i1 = pairs.length;
				while (i1--) {
					key = pairs[i1][0];
					view.dataset[key] = prefix + index + pairs[i1][1];
					viewsService.updateView(view, key);
				}
			}
			index === from ? result = tmpTemplate : result.appendChild(tmpTemplate);
		}
		return result;
	}

	function updateListContent(template, container, required) {
		let allBluePrintElements = template.content.querySelectorAll('*'),
			tieProcsMap = [], keys, i;
		i = allBluePrintElements.length;
		while (i--) {
			tieProcsMap[i] = Object.keys(allBluePrintElements[i].dataset);
		}

		let done = 0, i1, i2, child, descendants;
		i = 0;
		while (done < required) {
			child = container.childNodes[i++];
			if (child !== template && (child.nodeType === Node.DOCUMENT_NODE || child.nodeType === Node.ELEMENT_NODE) && child.dataset.dtListItemAid) {
				descendants = Array.prototype.concat([child], Array.from(child.querySelectorAll('*')));
				i1 = tieProcsMap.length;
				while (i1--) {
					viewsService.viewsToSkip.set(descendants[i1], null);
					keys = tieProcsMap[i1];
					i2 = keys.length;
					while (i2--) {
						if (keys[i2].startsWith('tie')) {
							viewsService.updateView(descendants[i1], keys[i2]);
						}
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

			templateItemAid = template.content.firstChild.dataset.dtListItemAid;
			if (!templateItemAid) {
				templateItemAid = new Date().getTime();
				signTemplate(template, templateItemAid);
			}

			//	adjust list elements size to the data length
			let existingList = container.querySelectorAll('[data-dt-list-item-aid="' + templateItemAid + '"]'),
				existingListLength = existingList.length;
			if (existingListLength > desiredListLength) {
				while (existingListLength > desiredListLength) container.removeChild(existingList[--existingListLength]);
			} else if (existingListLength < desiredListLength) {
				ruleData = extractProcessorParameters(template.dataset.tieList);
				let newItemsDOM = prepareNewItems(template, ruleData[2], ruleData[0] + '.', existingListLength, desiredListLength);
				container.appendChild(newItemsDOM);
			}

			//	run update on the whole list (in future attempt to get the
			updateListContent(template, container, existingListLength);
		}
	});

})();