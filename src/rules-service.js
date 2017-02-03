(function (scope) {
	'use strict';

	var rules = {};

	function Rule(name, options) {
		Reflect.defineProperty(this, 'name', { value: name });
		Reflect.defineProperty(this, 'dataToView', { value: options.dataToView });
		if (typeof options.inputToData === 'function') { Reflect.defineProperty(this, 'inputToData', { value: options.inputToData }); }
		if (typeof options.parseParam === 'function') { Reflect.defineProperty(this, 'parseParam', { value: options.parseParam }); }
	}
	Rule.prototype.parseParam = function (ruleParam) {
		var dataPath, tieName;
		if (ruleParam) {
			dataPath = ruleParam.trim().split('.');
			tieName = dataPath.shift();
			return {
				tieName: tieName,
				dataPath: dataPath
			};
		} else {
			console.error('valid rule value MUST be a non-empty string, found: ' + ruleParam);
		}
	};

	function addRule(name, configuration) {
		if (typeof name !== 'string' || !name) {
			throw new Error('name MUST be a non-empty string');
		}
		if (rules[name]) {
			throw new Error('rule "' + name + '" already exists; you may want to reconfigure the existing rule');
		}
		if (typeof configuration !== 'object' || !configuration) {
			throw new Error('configuration MUST be a non-null object');
		}
		if (typeof configuration.dataToView !== 'function') {
			throw new Error('configuration MUST have a "dataToView" function defined');
		}

		rules[name] = new Rule(name, configuration);
		scope.DataTier.views.applyRule(rules[name]);
	}

	function getRule(name) {
		return rules[name];
	}

	function removeRule(name) {
		if (typeof name !== 'string' || !name) {
			throw new Error('rule name MUST be a non-empty string');
		}

		return delete rules[name];
	}

	function getApplicable(element) {
		var result = [];
		if (element && element.nodeType === Node.ELEMENT_NODE && element.dataset) {
			Reflect.ownKeys(element.dataset).forEach(function (key) {
				if (rules[key]) {
					result.push(rules[key]);
				}
			});
		}
		return result;
	}

	Reflect.defineProperty(scope.DataTier, 'rules', { value: {} });
	Reflect.defineProperty(scope.DataTier.rules, 'get', { value: getRule });
	Reflect.defineProperty(scope.DataTier.rules, 'add', { value: addRule });
	Reflect.defineProperty(scope.DataTier.rules, 'remove', { value: removeRule });

	Reflect.defineProperty(scope.DataTier.rules, 'getApplicable', { value: getApplicable });

})(this);