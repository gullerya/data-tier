(() => {
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
			if (!Array.isArray(tiedValue) || !template) return;

			let container = template.parentNode, nv, ruleData, itemId, d, df, lc;
			let desiredListLength = tiedValue.length,
				existingListLength;

			//	TODO: this check should be moved to earlier phase of processing, this requires enhancement of rule API in general
			if (template.nodeName !== 'TEMPLATE') {
				throw new Error('tieList may be defined on template elements only');
			}
			if (!template.dataset.listSourceAid) {
				template.dataset.listSourceAid = new Date().getTime();
			}

			//	shorten the DOM list if bigger than the new array (from the end, so that array will still map to it relevantly)
			let existingList = container.querySelectorAll('[data-list-item-aid="' + template.dataset.listSourceAid + '"]');
			existingListLength = existingList.length;
			while (existingListLength > desiredListLength) container.removeChild(existingList[--existingListLength]);

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

					for (; existingListLength++ < desiredListLength;) {
						nv = d.importNode(template.content, true);
						views = nv.querySelectorAll('*');
						if (!viewsLength) viewsLength = views.length;
						if (!metaMap.length) {
							for (c = 0; c < viewsLength; c++) {
								keys = Object.keys(views[c].dataset);
								tmpPairs = [];
								for (i = 0; i < keys.length; i++) tmpPairs.push([keys[i], views[c].dataset[keys[i]]]);
								metaMap.push(tmpPairs);
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
						lc.dataset.listItemAid = template.dataset.listSourceAid;
					}
					container.appendChild(df);
				}
			}
		}
	});

})();