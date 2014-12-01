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
		var status = 'idle', result, message, duration, beg, end, timeoutWatcher;

		function pass(msg) {
			if (!result) {
				clearInterval(timeoutWatcher);
				end = performance.now();
				status = 'idle';
				result = 'success';
				message = msg;
				duration = end - beg;
			}
		}
		function fail(msg) {
			if (!result) {
				clearInterval(timeoutWatcher);
				end = performance.now();
				status = 'idle';
				result = 'failure';
				message = msg;
				duration = end - beg;
			}
		}
		function dump() {
			var tmp = out.querySelector('#' + id);
			tmp.textContent = description + ' - ' + message + ' - ' + result;
		}

		Object.defineProperties(this, {
			status: { value: status },
			result: { value: result },
			message: { value: message },
			duration: { value: duration },
			run: {
				value: function () {
					timeoutWatcher = setTimeout(function () {
						fail('timeout');
					}, ttl);
					status = 'running';
					beg = performance.now();
					func(pass, fail);
				}
			}
		});
	}

	function TestSuite(description) {
		var id = suites.length + 1, cases = [], view, tmp;
		suites.push(this);
		view = document.createElement('div');
		view.id = 'testSuite_' + id;
		view.style.cssText = 'position:relative;width:100%;height:auto';
		tmp = document.createElement('div');
		tmp.textContent = 'Suite ' + id + ': ' + description;
		view.appendChile(tmp);
		out.appendChile(view);
		Object.defineProperties(this, {
			id: { get: function () { return id; } },
			createCase: {
				value: function (options, func) {
					if (typeof options === 'function') { func = options; } else if (typeof fund !== 'function') { throw new Error('test function must be a last of not more than two parameters'); }
					cases.push(new TestCase(
						'testCase_' + id + '_' + cases.length,
						options.description || 'test #' + (cases.length + 1),
						typeof options.async === 'boolean' ? options.async : true,
						typeof options.ttl === 'number' ? options.ttl : DEFAULT_TEST_TTL,
						func
					));
					tmp = document.createElement('div');
					tmp.id = 'testCase_' + id + '_' + cases.length;
					view.appendChild(tmp);
					return cases.slice(-1)[0];
				}
			}
		});
	}

	function buildOut() {
		var tmp;
		out = document.createElement('div');
		out.style.cssText = 'position:fixed;top:50px;bottom:50px;right:50px;width:800px;background-color:#777;opacity:.7;border:3px solid #555;border-top-left-radius:7px;border-top-right-radius:7px';
		document.body.appendChild(out);

		tmp = document.createElement('div');
		tmp.style.cssText = 'position:absolute;top:0px;left:0px;width:100%;height:40px;padding:5px;border-bottom:3px solid #fff;color:#fff;cursor:default;box-sizing:border-box';
		tmp.textContent = 'Just Test: justifiably simple testing util for JS (client)';
		out.appendChild(tmp);

		tmp = document.createElement('div');
		tmp.style.cssText = 'position:absolute;top:40px;bottom:0px;width:100%;overflow-x:hidden;overflow-y:scroll';
		out.appendChild(tmp);
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