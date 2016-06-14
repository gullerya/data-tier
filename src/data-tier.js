(function DataTier(scope) {
    'use strict';

    var api,
		dataRoot,
		tiesService,
		viewsService,
		rulesService;

    if (!scope.DataTier) { Reflect.defineProperty(scope, 'DataTier', { value: {} }); }
    if (typeof scope.DataTier.ViewObserver !== 'function') { throw new Error('DataTier initialization failed: "ViewObserver" not found'); }
    if (typeof scope.DataTier.RulesService !== 'function') { throw new Error('DataTier initialization failed: "RulesService" not found'); }

    function dataAttrToProp(v) {
        var i = 2, l = v.split('-'), r;
        r = l[1];
        while (i < l.length) r += l[i][0].toUpperCase() + l[i++].substr(1);
        return r;
    }

    function pathToNodes(value) {
        if (Array.isArray(value)) return value;

        var c = 0, b = false, n = '', r = [];
        while (c < value.length) {
            if (value[c] === '.') {
                n.length && r.push(n);
                n = '';
            } else if (value[c] === '[') {
                if (b) throw new Error('bad path: "' + value + '", at: ' + c);
                n.length && r.push(n);
                n = '';
                b = true;
            } else if (value[c] === ']') {
                if (!b) throw new Error('bad path: "' + value + '", at: ' + c);
                n.length && r.push(n);
                n = '';
                b = false;
            } else {
                n += value[c];
            }
            c++;
        }
        n.length && r.push(n);
        return r;
    }

    function setPath(ref, path, value) {
        var list = pathToNodes(path), i;
        for (i = 0; i < list.length - 1; i++) {
            if (typeof ref[list[i]] === 'object') ref = ref[list[i]];
            else if (!(list[i] in ref)) ref = (ref[list[i]] = {});
            else throw new Error('the path is unavailable');
        }
        ref[list[i]] = value;
    }

    function getPath(ref, path) {
        var list, i;
        if (!ref) return;
        list = pathToNodes(path);
        for (i = 0; i < list.length; i++) {
            ref = ref[list[i]];
            if (!ref) return;
        }
        return ref;
    }

    function cutPath(ref, path) {
        var list = pathToNodes(path), i = 0, value;
        for (; i < list.length - 1; i++) {
            if (list[i] in ref) ref = ref[list[i]];
            else return;
        }
        value = ref[list[i - 1]];
        delete ref[list[i - 1]];
        return value;
    }

    function isPathStartsWith(p1, p2) {
        var i, l;
        p1 = pathToNodes(p1);
        p2 = pathToNodes(p2);
        l = Math.min(p1.length, p2.length);
        for (i = 0; i < l; i++) {
            if (p1[i] !== p2[i]) return false;
        }
        return true;
    }

    function changeListener(ev) {
        var view = ev.target, p, tn, t;

        if (view.dataset.tieValue) {
            p = view.dataset.tieValue;
        } else {
            p = view.dataset.tie;
        }
        //	TODO: the following condition is not always error state, need to decide regarding the cardinality of the value suppliers
        if (!p) { console.error('path to data not available'); return; }
        p = pathToNodes(p);
        if (!p) { console.error('path to data is invalid'); return; }
        tn = p.shift();
        t = tiesService.obtain(tn);
        if (!t) { console.error('tie "' + tn + '" not found'); return; }

        t.viewToDataProcessor({ data: t.data, path: p, view: view });
    }

    function addChangeListener(v) {
        var ow = v.ownerDocument.defaultView;
        if (v instanceof ow.HTMLInputElement || v instanceof ow.HTMLSelectElement) {
            v.addEventListener('change', changeListener);
        }
    }

    function delChangeListener(v) {
        v.removeEventListener('change', changeListener);
    }

    rulesService = new scope.DataTier.RulesService();

    //dataRoot = Observable.from({}, function (changes) {
    //    changes.forEach(function (change) {
    //        var vs = viewsService.get(change.path), i, l, key, p;
    //        for (i = 0, l = vs.length; i < l; i++) {
    //            for (key in vs[i].dataset) {
    //                if (key.indexOf('tie') === 0) {
    //                    p = rulesService.get(key, vs[i]).resolvePath(vs[i].dataset[key]);
    //                    if (isPathStartsWith(change.path, p)) {
    //                        //	TODO: use the knowledge of old value and new value here
    //                        //	TODO: yet, myst pass via the formatters/vizualizers of Rule/Tie
    //                        viewsService.update(vs[i], key);
    //                    }
    //                }
    //            }
    //        }
    //    });
    //});

    tiesService = new (function TiesManager() {
        var ts = {};

        function dfltVTDProcessor(input) {
            setPath(input.data, input.path, input.view.value);
        }

        function Tie(namespace) {
            var vtdProc;

            Object.defineProperties(this, {
                namespace: { get: function () { return namespace; } },
                setModel: {
                    value: function (model) {
                        if (typeof model !== 'object') {
                            throw new TypeError('model MUST be an object');
                        }
                        dataRoot[namespace] = model;
                        return dataRoot[namespace];
                    }
                },
                getObservedModel: { value: function () { return dataRoot[namespace]; } },
                viewToDataProcessor: {
                    get: function () { return typeof vtdProc === 'function' ? vtdProc : dfltVTDProcessor; },
                    set: function (v) { if (typeof v === 'function') vtdProc = v; }
                }
            });
        }

        function obtain(namespace) {
            if (!namespace || typeof namespace !== 'string') throw new Error('namespace (first param) MUST be a non empty string');
            if (/\W/.test(namespace)) throw new Error('namespace (first param) MUST consist of alphanumeric non uppercase characters only');
            if (!ts[namespace]) {
                ts[namespace] = new Tie(namespace);
            }

            return ts[namespace];
        }

        function remove(namespace) {
            if (ts[namespace]) {
                delete ts[namespace];
            }
        }

        Object.defineProperties(this, {
            obtain: { value: obtain },
            remove: { value: remove }
        });

        Object.seal(this);
    })();

    viewsService = new (function ViewsService() {
        var vpn = '___vs___', vs = {}, nlvs = {}, vcnt = 0;

        function add(view) {
            var key, path, va, rule;
            if (view.nodeName === 'IFRAME') {
                initDocumentObserver(view.contentDocument);
                view.addEventListener('load', function () {
                    initDocumentObserver(this.contentDocument);
                    collect(this.contentDocument);
                });
                collect(view.contentDocument);
            } else {
                for (key in view.dataset) {
                    if (key.indexOf('tie') === 0) {
                        rule = rulesService.get(key, view);
                        if (rule) {
                            path = rule.resolvePath(view.dataset[key]);
                            path.push(vpn);
                            va = getPath(vs, path);
                            if (!va) setPath(vs, path, (va = []));
                            if (va.indexOf(view) < 0) {
                                va.push(view);
                                path.pop();
                                update(view, key);
                                addChangeListener(view);
                                vcnt++;
                            }
                        } else {
                            if (!nlvs[key]) nlvs[key] = [];
                            nlvs[key].push(view);
                        }
                    }
                }
            }

        }

        function get(path) {
            var p = pathToNodes(path), r = [], tmp, key;
            tmp = getPath(vs, p);
            tmp && Object.keys(tmp).forEach(function (key) {
                if (key === vpn) Array.prototype.push.apply(r, tmp[key]);
                else Array.prototype.push.apply(r, get(path + '.' + key));
            });
            return r;
        }

        function update(view, ruleId) {
            var r, p, t, data;
            r = rulesService.get(ruleId, view);
            p = r.resolvePath(view.dataset[ruleId]);
            t = tiesService.obtain(p.shift());
            if (t && r) {
                data = getPath(t.getObservedModel(), p);
                r.dataToView(view, { data: data });
            }
        }

        function collect(rootElement) {
            var l;
            if (rootElement &&
				rootElement.nodeType &&
				(rootElement.nodeType === Element.DOCUMENT_NODE || rootElement.nodeType === Element.ELEMENT_NODE)) {
                l = rootElement.nodeName === 'IFRAME' ?
					l = Array.prototype.slice.call(rootElement.contentDocument.getElementsByTagName('*'), 0) :
					l = Array.prototype.slice.call(rootElement.getElementsByTagName('*'), 0);
                l.push(rootElement);
                l.forEach(add);
                console.info('collected views, current total: ' + vcnt);
            }
        }

        function relocateByRule(rule) {
            if (nlvs[rule.id]) {
                nlvs[rule.id].forEach(add);
            }
            console.info('relocated views, current total: ' + vcnt);
        }

        function discard(rootElement) {
            var l, e, key, rule, path, va, i;
            if (!rootElement || !rootElement.getElementsByTagName) return;
            l = Array.prototype.slice.call(rootElement.getElementsByTagName('*'), 0);
            l.push(rootElement);
            l.forEach(function (e) {
                for (key in e.dataset) {
                    i = -1;
                    if (key.indexOf('tie') === 0) {
                        rule = rulesService.get(key, e);
                        path = rule.resolvePath(e.dataset[key]);
                        path.push(vpn);
                        va = getPath(vs, path);
                        i = va && va.indexOf(e);
                        if (i >= 0) {
                            va.splice(i, 1);
                            delChangeListener(e);
                            vcnt--;
                        }
                    }
                }
            });
            console.info('discarded views, current total: ' + vcnt);
        }

        function move(view, ruleId, oldPath, newPath) {
            var pathViews, i = -1, opn, npn;

            //	delete old path
            if (oldPath) {
                opn = pathToNodes(oldPath);
                opn.push(vpn);
                pathViews = getPath(vs, opn);
                if (pathViews) i = pathViews.indexOf(view);
                if (i >= 0) pathViews.splice(i, 1);
            }

            //	add new path
            npn = pathToNodes(newPath);
            npn.push(vpn);
            if (!getPath(vs, npn)) setPath(vs, npn, []);
            getPath(vs, npn).push(view);
            npn.pop();
            update(view, ruleId);
        }

        Object.defineProperties(this, {
            collect: { value: collect },
            update: { value: update },
            relocateByRule: { value: relocateByRule },
            discard: { value: discard },
            move: { value: move },
            get: { value: get }
        });

        Object.seal(this);
    })();

    var documentObserver = [];
    function initDocumentObserver(d) {
        function processDomChanges(changes) {
            changes.forEach(function (change) {
                var tp = change.type, tr = change.target, an = change.attributeName, i, l;
                if (tp === 'attributes' && an.indexOf('data-tie') === 0) {
                    viewsService.move(tr, dataAttrToProp(an), change.oldValue, tr.getAttribute(an));
                } else if (tp === 'attributes' && an === 'src' && tr.nodeName === 'IFRAME') {
                    viewsService.discard(tr.contentDocument);
                } else if (tp === 'childList') {
                    if (change.addedNodes.length) {
                        for (i = 0, l = change.addedNodes.length; i < l; i++) {
                            if (change.addedNodes[i].nodeName === 'IFRAME') {
                                if (change.addedNodes[i].contentDocument) {
                                    initDocumentObserver(change.addedNodes[i].contentDocument);
                                    viewsService.collect(change.addedNodes[i].contentDocument);
                                }
                                change.addedNodes[i].addEventListener('load', function () {
                                    initDocumentObserver(this.contentDocument);
                                    viewsService.collect(this.contentDocument);
                                });
                            } else {
                                viewsService.collect(change.addedNodes[i]);
                            }
                        }
                    }
                    if (change.removedNodes.length) {
                        for (i = 0, l = change.removedNodes.length; i < l; i++) {
                            if (change.removedNodes[i].nodeName === 'IFRAME') {
                                viewsService.discard(change.removedNodes[i].contentDocument);
                            } else {
                                viewsService.discard(change.removedNodes[i]);
                            }
                        }
                    }
                }
            });
        }

        var domObserver = new MutationObserver(processDomChanges);
        domObserver.observe(d, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeOldValue: true,
            characterData: false,
            characterDataOldValue: false
        });
        documentObserver.push(domObserver);
    }
    initDocumentObserver(document);

    viewsService.collect(document);

    function dispose() {
        documentObserver.forEach(function (o) { o.disconnect(); });
        viewsService.discard(document);

        tiesService = null;
        rulesService = null;
        viewsService = null;
    }

    api = {};
    Reflect.defineProperty(api, '', {

    });
    //Object.defineProperties(window[MODULES_NAMESPACE][MODULE_NAME], {
    //    dispose: { value: dispose },
    //    Ties: { value: tiesService },
    //    Rules: { value: rulesService },
    //    Utils: {
    //        value: {
    //            get setPath() { return setPath; },
    //            get getPath() { return getPath; },
    //            get cutPath() { return cutPath; }
    //        }
    //    }
    //});
})(this);