(function ViewObserver(scope) {
    'use strict';

    if (!scope.DataTier) { Reflect.defineProperty(scope, 'DataTier', { value: {} }); }

    function constructor(options) {
        //  TODO: implement it here
    }

    Reflect.defineProperty(scope.DataTier, 'ViewObserver', { value: constructor });

})(this);

