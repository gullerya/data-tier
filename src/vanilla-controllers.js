(() => {
	'use strict';

	const namespace = this || window,
		add = namespace.DataTier.controllers.add;

	if (!namespace.DataTier) {
		throw new Error('DataTier framework was not properly initialized');
	}

	add('tieValue', {
		dataToView: function(data, view) {
			if (view.type === 'checkbox') {
				view.checked = data;
			} else {
				view.value = data ? data : '';
			}
		}
	});

	add('tieText', {
		dataToView: function(data, view) {
			view.textContent = data ? data : '';
		}
	});

	add('tiePlaceholder', {
		dataToView: function(data, view) {
			view.placeholder = data ? data : '';
		}
	});

	add('tieTooltip', {
		dataToView: function(data, view) {
			view.title = data ? data : '';
		}
	});

	add('tieSrc', {
		dataToView: function(data, view) {
			view.src = data ? data : '';
		}
	});

	add('tieHRef', {
		dataToView: function(data, view) {
			view.href = data ? data : '';
		}
	});

	add('tieDateValue', {
		dataToView: function(data, view) {
			view.value = data ? data.toLocaleString() : '';
		}
	});

	add('tieDateText', {
		dataToView: function(data, view) {
			view.textContent = data ? data.toLocaleString() : '';
		}
	});

	add('tieClasses', {
		isChangedPathRelevant: function(changedPath, viewedPath) {
			let subPath = changedPath.replace(viewedPath, '').split('.');
			return this.constructor.prototype.isChangedPathRelevant(changedPath, viewedPath) ||
				subPath.length === 1 ||
				(subPath.length === 2 && subPath[0] === '');
		},
		dataToView: function(data, view) {
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
		dataToView: function(tiedValue, template) {
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