(function (scope) {
	'use strict';

	const dataTier = scope.DataTier;

	if (typeof dataTier !== 'object' || !dataTier) {
		throw new Error('Vanilla rules appliance failed: DataTier library not found');
	}

	dataTier.addRule(new dataTier.Rule('tie', {
		dataToView: function (data, view) {
			let dfltValueElements = ['INPUT', 'TEXTAREA', 'SELECT', 'OPTION', 'PROGRESS', 'METER'];
			if (view && view.nodeType === Node.ELEMENT_NODE) {
				if (dfltValueElements.indexOf(view.tagName) >= 0) {
					view.value = data;
				} else {
					view.textContent = data;
				}
			} else {
				console.error('valid element expected, found: ' + view);
			}
		}
	}));

	dataTier.addRule(new dataTier.Rule('tieValue', {
		dataToView: function (data, view) {
			view.value = data;
		}
	}));

	dataTier.addRule(new dataTier.Rule('tieText', {
		dataToView: function (data, view) {
			view.textContent = data;
		}
	}));

	dataTier.addRule(new dataTier.Rule('tiePlaceholder', {
		dataToView: function (data, view) {
			view.placeholder = data;
		}
	}));

	dataTier.addRule(new dataTier.Rule('tieTooltip', {
		dataToView: function (data, view) {
			view.title = data;
		}
	}));

	dataTier.addRule(new dataTier.Rule('tieImage', {
		dataToView: function (data, view) {
			view.src = data;
		}
	}));

	dataTier.addRule(new dataTier.Rule('tieDateValue', {
		dataToView: function (data, view) {
			view.value = data.toLocaleString();
		}
	}));

	dataTier.addRule(new dataTier.Rule('tieDateText', {
		dataToView: function (data, view) {
			view.textContent = data.toLocaleString();
		}
	}));

	dataTier.addRule(new dataTier.Rule('tieList', {
		parseValue: function (element) {
			if (element && element.nodeType === Node.ELEMENT_NODE) {
				let ruleValue = element.dataset.tieList;
				return {
					dataPath: apis.utils.pathToNodes(ruleValue.split(' ')[0])
				};
			} else {
				console.error('valid DOM Element expected, received: ' + element);
			}
		},
		dataToView: function (tiedValue, template) {
			var container = template.parentNode, i, nv, ruleData, itemId, rulePath, vs, d, df;

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
			i = shortenListTo(tiedValue.data ? tiedValue.data.length : 0, template.dataset.listSourceAid);
			if (tiedValue.data && i < tiedValue.data.length) {
				ruleData = template.dataset.tieList.trim().split(/\s+/);
				if (!ruleData || ruleData.length !== 3 || ruleData[1] !== '=>') {
					logger.error('invalid parameter for TieList rule specified');
				} else {
					rulePath = ruleData[0];
					itemId = ruleData[2];
					d = template.ownerDocument;
					df = d.createDocumentFragment();
					for (; i < tiedValue.data.length; i++) {
						nv = d.importNode(template.content, true);
						vs = Array.prototype.slice.call(nv.querySelectorAll('*'), 0);
						vs.forEach(function (view) {
							Object.keys(view.dataset).forEach(function (key) {
								if (view.dataset[key].indexOf(itemId + '.') === 0) {
									view.dataset[key] = view.dataset[key].replace(itemId, rulePath + '[' + i + ']');
									viewsService.update(view, key);
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
	}));

})(this);