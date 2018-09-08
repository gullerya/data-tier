(() => {
	'use strict';

	const namespace = this || window,
		add = namespace.DataTier.controllers.add;

	//	deprecated
	add('tieDateValue', {
		toView: function(data, view) {
			view.value = typeof data !== 'undefined' && data !== null ? data.toLocaleString() : '';
		}
	});

	//	deprecated
	add('tieDateText', {
		toView: function(data, view) {
			view.textContent = typeof data !== 'undefined' && data !== null ? data.toLocaleString() : '';
		}
	});

	add('tieDatetimeText', new DateTimeTextController());

	add('tieDatetimeValue', new DateTimeValueController());

	function DateTimeTextController(visualizationProperty) {
		let visProp = visualizationProperty || 'textContent';

		this.format = 'dd/MM/yyyy hh:mm:ss';

		this.toView = function(data, view) {
			let formattedDate = data;
			if (!data) {
				formattedDate = '';
			} else if (data instanceof Date) {
				formattedDate = formatDate(data, this.format);
			} else {
				try {
					let tmpDate = new Date(data);
					if (tmpDate instanceof Date) {
						formattedDate = formatDate(tmpDate, this.format);
					}
				} catch (e) {
					console.error('failed to parse "' + data + '" as date', e);
				}
			}
			view[visProp] = formattedDate;
		};
	}

	function DateTimeValueController() {
		DateTimeTextController.call(this, 'value');

		this.toData = function(changeEvent) {
			console.warn('yet to be implemented, react on ' + changeEvent);
		};
	}

	DateTimeValueController.prototype = Object.create(DateTimeTextController.prototype);
	DateTimeValueController.prototype.constructor = DateTimeValueController;

	let supportedTokens = {
		d: function(date, len) { return date.getDate().toString().padStart(len, '0'); },
		M: function(date, len) { return (date.getMonth() + 1).toString().padStart(len, '0'); },
		y: function(date, len) {
			let tmpY = date.getFullYear().toString();
			if (tmpY.length > len) return tmpY.substr(tmpY.length - len);
			else return tmpY.padStart(len, '0');
		},
		h: function(date, len) { return date.getHours().toString().padStart(len, '0'); },
		m: function(date, len) { return date.getMinutes().toString().padStart(len, '0'); },
		s: function(date, len) { return date.getSeconds().toString().padStart(len, '0'); },
		f: function(date, len) { return date.getMilliseconds().toString().padStart(len, '0'); }
	};

	function formatDate(date, format) {
		let result = '';
		if (!format) {
			result = date.toLocaleString();
		} else {
			let char, cnt;
			for (let i = 0, l = format.length; i < l; i++) {
				char = format.charAt(i);
				if (supportedTokens[char]) {
					cnt = 1;
					while (i < l - 1 && format.charAt(i + 1) === char) {
						cnt++;
						i++;
					}
					result += supportedTokens[char](date, cnt);
				} else {
					result += char;
				}
			}
		}
		return result;
	}
})();