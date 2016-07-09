(function (scope) {
	'use strict';

	const rules = {};
	var api;

	if (!scope.DataTier) { Reflect.defineProperty(scope, 'DataTier', { value: {} }); }

	function Rule(name, options) {
		var vpr, dtv, itd;

		if (typeof name !== 'string' || !name) {
			throw new Error('name MUST be a non-empty string');
		}
		if (rules[name]) {
			throw new Error('rule "' + name + '" already exists; you may want to reconfigure the existing rule');
		}
		if (typeof options !== 'object' || !options) {
			throw new Error('options MUST be a non-null object');
		}
		if (typeof options.dataToView !== 'function') {
			throw new Error('options MUST have a "dataToView" function defined');
		}

		//if (typeof setup === 'string') {
		//    dtv = function (e, s) {
		//        var d;
		//        if (s) {
		//            d = s.data;
		//            d = typeof d === 'undefined' || d === null ? '' : d;
		//            setPath(e, setup, d);
		//        }
		//    };
		//    itd = function () { throw new Error('not yet implemented'); };
		//} else if (typeof setup === 'function') {
		//    dtv = setup;
		//    itd = function () { throw new Error('no "inputToData" functionality defined in this rule'); };
		//} else if (typeof setup === 'object') {
		//    dtv = setup.dataToView;
		//    itd = setup.inputToData;
		//}

		Reflect.defineProperty(this, 'name', { value: name });
		Reflect.defineProperty(this, 'dataToView', { value: options.dataToView });
		if (typeof options.inputToData === 'function') { Reflect.defineProperty(this, 'inputToData', { value: options.inputToData }); }
		if (typeof options.parseValue === 'function') { Reflect.defineProperty(this, 'parseValue', { value: options.parseValue }); }
	}
	Rule.prototype.parseValue = function (element) {
		if (element && element.nodeType === Node.ELEMENT_NODE) {
			let ruleValue = element.dataset[this.name];
			return {
				dataPath: api.utils.pathToNodes(ruleValue.split(' ')[0])
			};
		} else {
			console.error('valid DOM Element expected, received: ' + element);
		}
	};

	function addRule(rule) {
		if (!rule || !(rule instanceof Rule)) {
			throw new Error('rule MUST be an object of type Rule');
		}

		rules[rule.name] = rule;
	}

	function getRule(name) {
		if (rules[name]) {
			return rules[name];
		} else {
			console.error('rule "' + name + '" is not defined');
		}
	}

	function removeRule(name) {
		if (typeof name !== 'string' || !name) {
			throw new Error('rule name MUST be a non-empty string');
		}

		return delete rules[name];
	}

	function getApplicableRules(element) {
		let result = [];
		if (element && element.nodeType === Node.ELEMENT_NODE) {
			Reflect.ownKeys(element.dataset).forEach(key => {
				if (rules[key]) {
					result.push(rules[key]);
				}
			});
		}
		return result;
	}

	//Object.defineProperties(this, {
	//    add: {
	//        value: function (id, setup) {
	//            if (!id || !setup) throw new Error('bad parameters; f(string, string|function) expected');
	//            if (id.indexOf('tie') !== 0) throw new Error('rule id MUST begin with "tie"');
	//            if (id in rules) throw new Error('rule with id "' + id + '" already exists');
	//            rules[id] = new Rule(id, setup);
	//            viewsService.relocateByRule(rules[id]);
	//            return rules[id];
	//        }
	//    },
	//    get: {
	//        value: function (id, e) {
	//            var r, p;
	//            if (id.indexOf('tie') !== 0) {
	//                console.error('invalid tie id supplied');
	//            } else if (id in rules) {
	//                r = rules[id];
	//            } else {
	//                if (id === 'tie') {
	//                    p = e.ownerDocument.defaultView;
	//                    if (!e || !e.nodeName) throw new Error('rule "' + id + '" not found, therefore valid DOM element MUST be supplied to grasp the default rule');
	//                    if (e instanceof p.HTMLInputElement ||
	//                        e instanceof p.HTMLSelectElement) return rules.tieValue;
	//                    else if (e instanceof p.HTMLImageElement) return rules.tieImage;
	//                    else return rules.tieText;
	//                }
	//            }
	//            return r;
	//        }
	//    },
	//    del: {
	//        value: function (id) {
	//            return delete rules[id];
	//        }
	//    }
	//});

	function RulesService(internalAPI) {
		api = internalAPI;
		Reflect.defineProperty(this, 'Rule', { value: Rule });
		Reflect.defineProperty(this, 'addRule', { value: addRule });
		Reflect.defineProperty(this, 'getRule', { value: getRule });
		Reflect.defineProperty(this, 'removeRule', { value: removeRule });
		Reflect.defineProperty(this, 'getApplicableRules', { value: getApplicableRules });
	}

	Reflect.defineProperty(scope.DataTier, 'RulesService', { value: RulesService });

})(this);