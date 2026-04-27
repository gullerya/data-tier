const config = {
	environments: [
		{
			browser: {
				type: 'chromium',
				executors: {
					type: 'iframe'
				}
			},
			tests: {
				ttl: 32000,
				maxFail: 0,
				maxSkip: 5,
				include: [
					'./tests/*'
				],
				exclude: [
					'**/configs/**',
					'**/iframes/**',
					'**/browser-host-objects.js',
					'**/*-performance-*.js'
				]
			},
			coverage: {
				include: [
					'./dist/**/*.js'
				],
				exclude: [
					'**/*.min.js'
				],
				reports: [{ type: 'lcov' }]
			}
		}
	]
};

export default config;
