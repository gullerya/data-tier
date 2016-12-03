(function DataTier(scope) {
	'use strict';

	var config = {};

	if (typeof scope.DataTier !== 'object') { throw new Error('DataTier initialization failed: "DataTier" namespace not found'); }
	if (typeof scope.DataTier.TiesService !== 'function') { throw new Error('DataTier initialization failed: "TiesService" not found'); }
	if (typeof scope.DataTier.RulesService !== 'function') { throw new Error('DataTier initialization failed: "RulesService" not found'); }
	if (typeof scope.DataTier.ViewsService !== 'function') { throw new Error('DataTier initialization failed: "ViewsService" not found'); }

	Reflect.defineProperty(scope.DataTier, 'ties', { value: new scope.DataTier.TiesService(config) });
	Reflect.defineProperty(scope.DataTier, 'rules', { value: new scope.DataTier.RulesService(config) });

	new scope.DataTier.ViewsService(config);
	scope.DataTier.initVanillaRules(config);
	config.views.init();

})(this);