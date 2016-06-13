(function (scope) {
    'use strict';

    if (!scope.DataTier) { Reflect.defineProperty(scope, 'DataTier', { value: {} }); }

    function RulesService() {
        var rules = {};

        function dfltResolvePath(tieValue) { return pathToNodes(tieValue); }

        function Rule(id, setup) {
            var vpr, dtv, itd;

            if (typeof setup === 'string') {
                vpr = dfltResolvePath;
                dtv = function (e, s) {
                    var d;
                    if (s) {
                        d = s.data;
                        d = typeof d === 'undefined' || d === null ? '' : d;
                        setPath(e, setup, d);
                    }
                };
                itd = function () { throw new Error('not yet implemented'); };
            } else if (typeof setup === 'function') {
                vpr = dfltResolvePath;
                dtv = setup;
                itd = function () { throw new Error('no "inputToData" functionality defined in this rule'); };
            } else if (typeof setup === 'object') {
                vpr = setup.resolvePath || dfltResolvePath;
                dtv = setup.dataToView;
                itd = setup.inputToData;
            }
            Object.defineProperties(this, {
                id: { value: id },
                resolvePath: { value: vpr },
                dataToView: { value: dtv, writable: true },
                inputToData: { value: itd }
            });
        }

        Object.defineProperties(this, {
            add: {
                value: function (id, setup) {
                    if (!id || !setup) throw new Error('bad parameters; f(string, string|function) expected');
                    if (id.indexOf('tie') !== 0) throw new Error('rule id MUST begin with "tie"');
                    if (id in rules) throw new Error('rule with id "' + id + '" already exists');
                    rules[id] = new Rule(id, setup);
                    viewsService.relocateByRule(rules[id]);
                    return rules[id];
                }
            },
            get: {
                value: function (id, e) {
                    var r, p;
                    if (id.indexOf('tie') !== 0) {
                        console.error('invalid tie id supplied');
                    } else if (id in rules) {
                        r = rules[id];
                    } else {
                        if (id === 'tie') {
                            p = e.ownerDocument.defaultView;
                            if (!e || !e.nodeName) throw new Error('rule "' + id + '" not found, therefore valid DOM element MUST be supplied to grasp the default rule');
                            if (e instanceof p.HTMLInputElement ||
								e instanceof p.HTMLSelectElement) return rules.tieValue;
                            else if (e instanceof p.HTMLImageElement) return rules.tieImage;
                            else return rules.tieText;
                        }
                    }
                    return r;
                }
            },
            del: {
                value: function (id) {
                    return delete rules[id];
                }
            }
        });

        Object.seal(this);
    }

    Reflect.defineProperty(scope.DataTier, 'RulesService', { value: RulesService });

})(this);