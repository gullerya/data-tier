(() => {
	'use strict';

	const namespace = this || window,
		add = namespace.DataTier.processors.add;

	if (!namespace.DataTier) {
		throw new Error('data-tier framework was not properly initialized');
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

			let container = template.parentNode, nv, ruleData, itemId, d, df, lc;
			let desiredListLength = tiedValue.length,
				existingListLength;

			//	TODO: this check should be moved to earlier phase of processing, this requires enhancement of rule API in general
			if (template.nodeName !== 'TEMPLATE') {
				throw new Error('tieList may be defined on template elements only');
			}
			if (!template.dataset.tieListSourceAid) {
				template.dataset.tieListSourceAid = new Date().getTime();
			}

			//	shorten the DOM list if bigger than the new array
			let existingList = container.querySelectorAll('[data-tie-list-item-aid="' + template.dataset.tieListSourceAid + '"]');
			existingListLength = existingList.length;
			while (existingListLength > desiredListLength) container.removeChild(existingList[--existingListLength]);

			//	supplement the DOM list if lesser than the new array
			if (existingListLength < desiredListLength) {
				ruleData = template.dataset.tieList.trim().split(/\s+/);
				if (!ruleData || ruleData.length !== 3 || ruleData[1] !== '=>') {
					console.error('invalid parameter for "tieList" rule specified');
				} else {
					itemId = ruleData[2];
					d = template.ownerDocument;
					df = d.createDocumentFragment();
					let views, viewsLength, metaMap = [],
						c, keys, tmpPairs, i,
						i2, tmpMap, tmpMapLength, i3, tmpPair,
						prefix = ruleData[0] + '.';

					for (; existingListLength < desiredListLength; existingListLength++) {
						nv = d.importNode(template.content, true);
						views = nv.querySelectorAll('*');
						if (!viewsLength) viewsLength = views.length;
						if (!metaMap.length) {
							for (c = 0; c < viewsLength; c++) {
								keys = Object.keys(views[c].dataset);
								tmpPairs = [];
								for (i = 0; i < keys.length; i++) tmpPairs.push([keys[i], views[c].dataset[keys[i]]]);
								metaMap[c] = tmpPairs;
							}
						}
						for (i2 = 0; i2 < viewsLength, tmpMap = metaMap[i2]; i2++) {
							for (i3 = 0, tmpMapLength = tmpMap.length; i3 < tmpMapLength; i3++) {
								tmpPair = tmpMap[i3];
								if (tmpPair[1].startsWith(itemId)) {
									views[i2].dataset[tmpPair[0]] = tmpPair[1].replace(itemId, prefix + existingListLength);
								}
							}
						}
						df.appendChild(nv);
						lc = df.lastChild;
						while (lc.nodeType !== Node.ELEMENT_NODE && lc.previousSibling !== null) {
							lc = lc.previousSibling;
						}
						lc.dataset.tieListItemAid = template.dataset.tieListSourceAid;
					}
					container.appendChild(df);
				}
			}

			//	run update on elements
			let allBluePrintElements = template.content.querySelectorAll('*');
			let tieProcsMap = [], keys;
			for (let i = 0, l = allBluePrintElements.length; i < l; i++) {
				tieProcsMap[i] = Object.keys(allBluePrintElements[i].dataset);
			}

			let i1, l1, i2, l2, descendants;
			for (let i = 0, l = container.childNodes.length, child; i < l; i++) {
				child = container.childNodes[i];
				if (child !== template && (child.nodeType === Node.DOCUMENT_NODE || child.nodeType === Node.ELEMENT_NODE) && child.dataset.tieListItemAid) {
					descendants = Array.from(child.querySelectorAll('*'));
					descendants.unshift(child);
					for (i1 = 0, l1 = tieProcsMap.length; i1 < l1; i1++) {
						keys = tieProcsMap[i1];
						if (keys.length) {
							namespace.DataTier.views.viewsToSkip.set(descendants[i1], null);
							for (i2 = 0, l2 = keys.length; i2 < l2; i2++) {
								namespace.DataTier.views.updateView(descendants[i1], keys[i2]);
							}
						}
					}
				}
			}
		}
	});

})();