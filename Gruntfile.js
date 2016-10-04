/// <binding />
var builder = require('./tools/builder.js'),
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
					'dist/data-tier.min.js': ['dist/data-tier.js']
				}
			}
		}
	});

	grunt.loadNpmTasks("gruntify-eslint");
	grunt.loadNpmTasks('grunt-contrib-uglify');

	grunt.registerTask('test', ['eslint']);

	grunt.registerTask('build', 'Build', function () {
		builder.concatSources();
		grunt.task.run('uglify:build');
	});

	grunt.registerTask('full-ci', 'Full CI Build cycle', function () {
		var done = this.async();

		grunt.task.run('build');
		chromeDriver.obtainChrome(() => done());
		//grunt.task.run('test');
	});

};