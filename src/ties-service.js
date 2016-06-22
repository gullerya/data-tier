(function (scope) {
    'use strict';

    const ties = {};
    var apis;

    if (!scope.DataTier) { Reflect.defineProperty(scope, 'DataTier', { value: {} }); }

    function Tie(name, observable, options) {
        var data;

        function observer(changes) {
            changes.forEach(change => {
                let vs = apis.viewsService.get(change.path), i, l, key, p;
                for (i = 0, l = vs.length; i < l; i++) {
                    for (key in vs[i].dataset) {
                        if (key.indexOf('tie') === 0) {
                            p = apis.rulesService.get(key, vs[i]).resolvePath(vs[i].dataset[key]);
                            if (isPathStartsWith(change.path, p)) {
                                //	TODO: use the knowledge of old value and new value here
                                //	TODO: yet, myst pass via the formatters/vizualizers of Rule/Tie
                                apis.viewsService.update(vs[i], key);
                            }
                        }
                    }
                }
            });
        }

        function setData(observable) {
            validateObservable(observable);

            if (data) { data.unobserve(observer); }

            data = observable;
            observable.observe(observer);
        }

        function getData() { return data; }

        setData(observable);

        Reflect.defineProperty(this, 'name', { value: name });
        Reflect.defineProperty(this, 'data', { get: getData, set: setData });
    }

    function getTie(name) {
        validateTieName(name);
        return ties[name];
    }

    function createTie(name, observable, options) {
        validateTieName(name);
        if (ties[name]) {
            throw new Error('existing Tie MAY NOT be re-created, use the tie\'s own APIs to reconfigure it');
        }
        validateObservable(observable);

        return (ties[name] = new Tie(name, observable, options));
    }

    function removeTie(name) {
        validateTieName(name);
        if (ties[name]) {
            //  TODO: dispose tie
            delete ties[name];
        }
    }

    function validateTieName(name) {
        if (!name || typeof name !== 'string') {
            throw new Error('name MUST be a non-empty string');
        }
        if (/\W/.test(name)) {
            throw new Error('name MUST consist of alphanumeric non uppercase characters only');
        }
    }

    function validateObservable(observable) {
        if (!observable || typeof observable !== 'object') {
            throw new Error('observable MUST be a defined non-null object');
        }
        if (typeof observable.observe !== 'function' || typeof observable.unobserve !== 'function') {
            throw new Error('observable MUST have "observe" and "unobserve" functions defined');
        }
    }

    function TiesService(internalAPIs) {
        apis = internalAPIs;
        Reflect.defineProperty(this, 'getTie', { value: getTie });
        Reflect.defineProperty(this, 'createTie', { value: createTie });
        Reflect.defineProperty(this, 'removeTie', { value: removeTie });
    }

    Reflect.defineProperty(scope.DataTier, 'TiesService', { value: TiesService });

})(this);