const os = require('os'),
	builder = require('./tools/builder.js'),
    chromeDriver = require('./tools/chromium-driver.js');

module.exports = function (grunt) {
	grunt.initConfig({
		eslint: {
			options: {
				configFile: 'eslint.json'
			},
			src: ['Gruntfile.js', 'src/**/*.js']
		},
		uglify: {
			build: {
				files: {
					'dist/data-tier.min.js': ['dist/data-tier.js'],
					'dist/data-tier-wo-oo.min.js': ['dist/data-tier-wo-oo.js']
				}
			}
		}
	});

	grunt.loadNpmTasks("gruntify-eslint");
	grunt.loadNpmTasks('grunt-contrib-uglify');

	grunt.registerTask('build', 'Build', function () {
		process.stdout.write('**' + os.EOL);
		process.stdout.write('** BUILD' + os.EOL);
		process.stdout.write('**' + os.EOL);

		builder.concatSources();
		grunt.task.run('uglify:build');

		process.stdout.write('** BUILD FINISHED' + os.EOL + os.EOL);
	});

	grunt.registerTask('test', 'Test', function () {
		var done = this.async();

		process.stdout.write('**' + os.EOL);
		process.stdout.write('** TEST' + os.EOL);
		process.stdout.write('**' + os.EOL);

		grunt.task.run('eslint');
		chromeDriver.obtainChrome(() => done());
	});

	grunt.registerTask('full-ci', 'Full CI Build cycle', function () {
		var done = this.async();

		grunt.task.run('build');
		grunt.task.run('test');
		done();
	});

};