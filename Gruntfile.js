const os = require('os'),
	concater = require('./tools/build-concat.js'),
	minifier = require('./tools/build-minify.js'),
	chromeDriver = require('./tools/chromium-driver.js');

module.exports = function(grunt) {
	grunt.initConfig({
		eslint: {
			options: {
				configFile: 'eslint.json'
			},
			src: ['src/**/*.js', 'Gruntfile.js']
		}
	});

	grunt.loadNpmTasks("gruntify-eslint");

	grunt.registerTask('build', 'Build', function() {
		process.stdout.write('**' + os.EOL);
		process.stdout.write('** BUILD' + os.EOL);
		process.stdout.write('**' + os.EOL);
		concater.execute();
		minifier.execute();
		process.stdout.write('** BUILD FINISHED' + os.EOL + os.EOL);
	});

	grunt.registerTask('test', 'Test', function() {
		let done = this.async();
		process.stdout.write('**' + os.EOL);
		process.stdout.write('** TEST' + os.EOL);
		process.stdout.write('**' + os.EOL);
		grunt.task.run('eslint');
		chromeDriver.obtainChrome(() => done());
	});

	grunt.registerTask('full-ci', 'Full CI Build cycle', function() {
		let done = this.async();
		grunt.task.run('build');
		grunt.task.run('test');
		done();
	});
};