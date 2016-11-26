(function (scope) {
	'use strict';

	function init(internals) {
		var Rule = scope.DataTier.rules.Rule,
			add = scope.DataTier.rules.add

		add(new Rule('tieValue', {
			dataToView: function (data, view) {
				view.value = data;
			}
		}));

		add(new Rule('tieText', {
			dataToView: function (data, view) {
				view.textContent = data;
			}
		}));

		add(new Rule('tiePlaceholder', {
			dataToView: function (data, view) {
				view.placeholder = data;
			}
		}));

		add(new Rule('tieTooltip', {
			dataToView: function (data, view) {
				view.title = data;
			}
		}));

		add(new Rule('tieImage', {
			dataToView: function (data, view) {
				view.src = data;
			}
		}));

		add(new Rule('tieDateValue', {
			dataToView: function (data, view) {
				view.value = data.toLocaleString();
			}
		}));

		add(new Rule('tieDateText', {
			dataToView: function (data, view) {
				view.textContent = data.toLocaleString();
			}
		}));

		add(new Rule('tieList', {
			parseParam: function (ruleValue) {
				return Rule.prototype.parseParam(ruleValue.split(/\s*=>\s*/)[0]);
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
				i = shortenListTo(tiedValue.data ? tiedValue.data.length : 0, template.dataset.listSourceAid);
				if (tiedValue.data && i < tiedValue.data.length) {
					ruleData = template.dataset.tieList.trim().split(/\s+/);
					if (!ruleData || ruleData.length !== 3 || ruleData[1] !== '=>') {
						console.error('invalid parameter for "tieList" rule specified');
					} else {
						itemId = ruleData[2];
						d = template.ownerDocument;
						df = d.createDocumentFragment();
						for (; i < tiedValue.data.length; i++) {
							nv = d.importNode(template.content, true);
							vs = Array.prototype.slice.call(nv.querySelectorAll('*'), 0);
							vs.forEach(function (view) {
								Object.keys(view.dataset).forEach(function (key) {
									if (view.dataset[key].indexOf(itemId + '.') === 0) {
										view.dataset[key] = view.dataset[key].replace(itemId, ruleData[0] + '.' + i);
										internals.views.update(view, key);
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
	}

	Reflect.defineProperty(scope.DataTier, 'initVanillaRules', { value: init });

})(this);