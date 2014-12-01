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
		var status = 'idle', result, message, duration, beg, end, timeoutWatcher, runner, promise;

		function pass(msg) {
			if (!result) {
				clearInterval(timeoutWatcher);
				end = performance.now();
				status = 'done';
				result = 'success';
				message = msg;
				duration = end - beg;
				dump();
			}
		}
		function fail(msg) {
			if (!result) {
				clearInterval(timeoutWatcher);
				end = performance.now();
				status = 'done';
				result = 'failure';
				message = msg;
				duration = end - beg;
				dump();
			}
		}
		function dump() {
			var tmp = out.querySelector('#' + id);
			tmp.textContent = description + ' - ' + message + ' - ' + result + ' - ' + duration.toFixed(2) + 'ms';
		}
		function runner() {
			timeoutWatcher = setTimeout(function () {
				fail('timeout');
			}, ttl);
			status = 'running';
			beg = performance.now();
			promise = new Promise(func);
			promise.then(pass, fail);
			return promise;
		}

		Object.defineProperties(this, {
			status: { value: status },
			result: { value: result },
			message: { value: message },
			duration: { value: duration },
			run: { value: runner }
		});
	}

	function TestSuite(description) {
		var id = suites.length + 1, cases = [], status = 'idle', view, tmp;
		suites.push(this);
		view = document.createElement('div');
		view.id = 'testSuite_' + id;
		view.style.cssText = 'position:relative;width:100%;height:auto';
		tmp = document.createElement('div');
		tmp.style.cssText = 'color:#fff';
		tmp.textContent = 'Suite ' + id + ': ' + description;
		view.appendChild(tmp);
		out.appendChild(view);

		function runNext() {

		}

		Object.defineProperties(this, {
			id: { get: function () { return id; } },
			createCase: {
				value: function (options, func) {
					if (typeof options === 'function') { func = options; } else if (typeof func !== 'function') { throw new Error('test function must be a last of not more than two parameters'); }
					cases.push(new TestCase(
						'testCase_' + id + '_' + (cases.length + 1),
						options.description || 'test ' + (cases.length + 1),
						typeof options.async === 'boolean' ? options.async : true,
						typeof options.ttl === 'number' ? options.ttl : DEFAULT_TEST_TTL,
						func
					));
					tmp = document.createElement('div');
					tmp.id = 'testCase_' + id + '_' + cases.length;
					tmp.style.cssText = 'position:relative;margin-left:40px;color:#fff';
					view.appendChild(tmp);
					return cases.slice(-1)[0];
				}
			},
			run: {
				value: function () {
					for (var i = 0, l = cases.length; i < l; i++) {
						if (!cases[i].result && cases[i].status === 'idle') {
							cases[i].run().then(runNext, runNext);
							if (!cases[i].async) break;
						}
					}
				}
			}
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