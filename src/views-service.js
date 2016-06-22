(function (scope) {
    'use strict';

    if (!scope.DataTier) { Reflect.defineProperty(scope, 'DataTier', { value: {} }); }

    var apis,
        vpn = '___vs___',
        vs = {},
        nlvs = {},
        vcnt = 0,
        rulesService;

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
                    rule = apis.rulesService.getRule(key, view);
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
        if (tmp) {
            Object.keys(tmp).forEach(function (key) {
                if (key === vpn) Array.prototype.push.apply(r, tmp[key]);
                else Array.prototype.push.apply(r, get(path + '.' + key));
            });
        }
        return r;
    }

    function update(view, ruleId) {
        var r, p, t, data;
        r = apis.rulesService.getRule(ruleId, view);
        p = r.resolvePath(view.dataset[ruleId]);
        t = apis.tiesService.obtain(p.shift());
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

    function ViewsService(internalAPIs) {
        apis = internalAPIs;
        Reflect.defineProperty(this, 'collect', { value: collect });
        Reflect.defineProperty(this, 'update', { value: update });
        Reflect.defineProperty(this, 'relocateByRule', { value: relocateByRule });
        Reflect.defineProperty(this, 'discard', { value: discard });
        Reflect.defineProperty(this, 'move', { value: move });
        Reflect.defineProperty(this, 'get', { value: get });
    }

    Reflect.defineProperty(scope.DataTier, 'ViewsService', { value: ViewsService });

})(this);