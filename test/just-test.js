//	the syntax i'd like to have:
//		var suite = JustTest.createSuite('some id');
//		suite.createTest(function() {}, sync/async).run();

(function (options) {
	'use strict';

	var out, suites = [], DEFAULT_TEST_TTL = 5000;

	if (typeof options !== 'object') { options = {}; }
	if (typeof options.namespace !== 'object') {
		if (typeof window.Utils !== 'object') Object.defineProperty(window, 'Utils', { value: {} });
		options.namespace = window.Utils;
	}

	function TestCase(id, description, async, ttl, func) {
		var status = 'idle', result, message, duration, beg, end;

		function run() {
			var internalPromise, timeoutWatcher, tmp = out.querySelector('#' + id);
			tmp.textContent = description + ' is running...';
			status = 'running';
			beg = performance.now();
			function finalize(res, msg, settle) {
				timeoutWatcher && clearInterval(timeoutWatcher);
				end = performance.now();
				result = res;
				message = msg;
				duration = end - beg;
				status = 'done';
				tmp.textContent = description + ' - ' + message + ' - ' + result + ' - ' + duration.toFixed(2) + 'ms';
				settle();
			}
			internalPromise = new Promise(function (resolve, reject) {
				if (!async) {
					timeoutWatcher = setTimeout(function () {
						reject('timeout');
					}, ttl);
				}
				func(resolve, reject);
			});
			return new Promise(function (resolve) {
				internalPromise.then(function (msg) {
					finalize('success', msg, resolve);
				}, function (msg) {
					finalize('failure', msg, resolve);
				});
			});
		}

		Object.defineProperties(this, {
			status: { value: status },
			result: { value: result },
			message: { value: message },
			duration: { value: duration },
			async: { value: async },
			run: { value: run }
		});
	}

	function TestSuite(description) {
		var id = suites.length + 1, cases = [], status = 'idle', suitePromise, view, tmp;
		suites.push(this);

		view = document.createElement('div');
		view.id = 'testSuite_' + id;
		view.style.cssText = 'position:relative;width:100%;height:auto';

		tmp = document.createElement('div');
		tmp.className = 'suiteTitle';
		tmp.style.cssText = 'color:#fff';
		tmp.textContent = 'Suite ' + id + ': ' + description;
		view.appendChild(tmp);

		tmp = document.createElement('div');
		tmp.className = 'suiteSummary'
		tmp.style.cssText = 'position:absolute;right:0px;top:0px';
		view.querySelector('.suiteTitle').appendChild(tmp);

		out.appendChild(view);

		function createCase(options, executor) {
			if (typeof options === 'function') { executor = options; } else if (typeof executor !== 'function') { throw new Error('test function must be a last of not more than two parameters'); }
			cases.push(new TestCase(
				'testCase_' + id + '_' + (cases.length + 1),
				options.description || 'test ' + (cases.length + 1),
				typeof options.async === 'boolean' ? options.async : false,
				typeof options.ttl === 'number' ? options.ttl : DEFAULT_TEST_TTL,
				executor
			));
			tmp = document.createElement('div');
			tmp.id = 'testCase_' + id + '_' + cases.length;
			tmp.style.cssText = 'position:relative;margin-left:40px;color:#fff';
			view.appendChild(tmp);
			return cases.slice(-1)[0];
		}

		function run() {
			var asyncFlow = Promise.resolve();

			//	TODO: handle UI stuff
			view.querySelector('.suiteSummary').textContent = 'summary goes here';

			function finalize() {
				console.log('finished the suite');
			}

			suitePromise = new Promise(function (resolve, reject) {
				if (!cases.length) { throw new Error('empty suite can not be run'); }
				(function iterate(index) {
					var testCase;
					if (index === cases.length) {
						asyncFlow.then(resolve, reject);
					} else {
						testCase = cases[index++];
						if (testCase.async) {
							asyncFlow = Promise.all([asyncFlow, testCase.run()]);
							iterate(index);
						} else {
							testCase.run().then(function () {
								iterate(index);
							}, function () {
								iterate(index);
							});
						}
					}
				})(0);
			});
			suitePromise.then(finalize, finalize);
			return suitePromise;
		}

		Object.defineProperties(this, {
			id: { get: function () { return id; } },
			createCase: { value: createCase },
			run: { value: run }
		});
	}

	function buildOut() {
		var root, tmp;
		root = document.createElement('div');
		root.id = 'JustTestOut';
		root.style.cssText = 'position:fixed;top:50px;bottom:50px;right:50px;width:800px;background-color:#777;opacity:.8;border:3px solid #555;border-top-left-radius:7px;border-top-right-radius:7px';
		document.body.appendChild(root);

		tmp = document.createElement('div');
		tmp.style.cssText = 'position:absolute;top:0px;left:0px;width:100%;height:40px;font:28px Tahoma;border-bottom:3px solid #fff;color:#fff;cursor:default;box-sizing:border-box';
		tmp.textContent = 'Just Test: reasonably simple testing util for JS (client)';
		root.appendChild(tmp);

		out = document.createElement('div');
		out.style.cssText = 'position:absolute;top:40px;bottom:0px;width:100%;overflow-x:hidden;overflow-y:scroll';
		root.appendChild(out);
	}

	buildOut();
	Object.defineProperty(options.namespace, 'JustTest', { value: {} });
	Object.defineProperties(options.namespace.JustTest, {
		createSuite: {
			value: function (description) {
				suites.push(new TestSuite(description));
				return suites.slice(-1)[0];
			}
		}
	});
})((typeof arguments === 'object' ? arguments[0] : undefined));