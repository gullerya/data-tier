(function (scope) {
    'use strict';

    if (!scope.DataTier) { Reflect.defineProperty(scope, 'DataTier', { value: {} }); }

    function ViewObserver(options) {
        //  TODO: implement it here
    }

    Reflect.defineProperty(scope.DataTier, 'ViewObserver', { value: ViewObserver });

})(this);

