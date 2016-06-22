(function DataTier(scope) {
    'use strict';

    const apis = {},
        dataRoot = {};

    if (typeof scope.DataTier.TiesService !== 'function') { throw new Error('DataTier initialization failed: "TiesService" not found'); }
    if (typeof scope.DataTier.ViewsService !== 'function') { throw new Error('DataTier initialization failed: "ViewsService" not found'); }
    if (typeof scope.DataTier.RulesService !== 'function') { throw new Error('DataTier initialization failed: "RulesService" not found'); }

    Reflect.defineProperty(apis, 'tiesService', { value: new scope.DataTier.TiesService(apis) });
    Reflect.defineProperty(apis, 'viewsService', { value: new scope.DataTier.ViewsService(apis) });
    Reflect.defineProperty(apis, 'rulesService', { value: new scope.DataTier.RulesService(apis) });

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
                if (n.length) { r.push(n); }
                n = '';
            } else if (value[c] === '[') {
                if (b) throw new Error('bad path: "' + value + '", at: ' + c);
                if (n.length) { r.push(n); }
                n = '';
                b = true;
            } else if (value[c] === ']') {
                if (!b) throw new Error('bad path: "' + value + '", at: ' + c);
                if (n.length) { r.push(n); }
                n = '';
                b = false;
            } else {
                n += value[c];
            }
            c++;
        }
        if (n.length) { r.push(n); }
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

    var documentObserver = [];
    function initDocumentObserver(d) {
        function processDomChanges(changes) {
            changes.forEach(function (change) {
                var tp = change.type, tr = change.target, an = change.attributeName, i, l;
                if (tp === 'attributes' && an.indexOf('data-tie') === 0) {
                    apis.viewsService.move(tr, dataAttrToProp(an), change.oldValue, tr.getAttribute(an));
                } else if (tp === 'attributes' && an === 'src' && tr.nodeName === 'IFRAME') {
                    apis.viewsService.discard(tr.contentDocument);
                } else if (tp === 'childList') {
                    if (change.addedNodes.length) {
                        for (i = 0, l = change.addedNodes.length; i < l; i++) {
                            if (change.addedNodes[i].nodeName === 'IFRAME') {
                                if (change.addedNodes[i].contentDocument) {
                                    initDocumentObserver(change.addedNodes[i].contentDocument);
                                    apis.viewsService.collect(change.addedNodes[i].contentDocument);
                                }
                                change.addedNodes[i].addEventListener('load', function () {
                                    initDocumentObserver(this.contentDocument);
                                    apis.viewsService.collect(this.contentDocument);
                                });
                            } else {
                                apis.viewsService.collect(change.addedNodes[i]);
                            }
                        }
                    }
                    if (change.removedNodes.length) {
                        for (i = 0, l = change.removedNodes.length; i < l; i++) {
                            if (change.removedNodes[i].nodeName === 'IFRAME') {
                                apis.viewsService.discard(change.removedNodes[i].contentDocument);
                            } else {
                                apis.viewsService.discard(change.removedNodes[i]);
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

    apis.viewsService.collect(document);

    Reflect.defineProperty(scope.DataTier, 'getTie', { value: apis.tiesService.getTie });
    Reflect.defineProperty(scope.DataTier, 'createTie', { value: apis.tiesService.createTie });
    Reflect.defineProperty(scope.DataTier, 'removeTie', { value: apis.tiesService.removeTie });

    Reflect.defineProperty(scope.DataTier, 'Rule', { value: apis.rulesService.Rule });
    Reflect.defineProperty(scope.DataTier, 'addRule', { value: apis.rulesService.addRule });
    Reflect.defineProperty(scope.DataTier, 'getRule', { value: apis.rulesService.getRule });
    Reflect.defineProperty(scope.DataTier, 'removeRule', { value: apis.rulesService.removeRule });

})(this);