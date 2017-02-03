(function (scope) {
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

	add('tieSrc', {
		dataToView: function (data, view) {
			view.src = data ? data : '';
		}
	});

	add('tieHRef', {
		dataToView: function (data, view) {
			view.href = data ? data : '';
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
						vs = Array.prototype.slice.call(nv.querySelectorAll('*'), 0);
						vs.forEach(function (view) {
							Object.keys(view.dataset).forEach(function (key) {
								if (view.dataset[key].indexOf(itemId) === 0) {
									view.dataset[key] = view.dataset[key].replace(itemId + ':', ruleData[0] + ':' + i + '.');
								}
							});
						});
						df.appendChild(nv);
						df.lastChild.dataset.listItemAid = template.dataset.listSourceAid;
					}
					container.appendChild(df);
				}
			}
		}
	});

})(this);