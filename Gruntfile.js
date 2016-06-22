var builder = require('./tools/builder.js'),
    chromeDriver = require('./tools/chromium-driver.js');

module.exports = function (grunt) {
    grunt.initConfig({
        jshint: {
            options: {
                esversion: 6
            },
            files: ['Gruntfile.js', 'src/**/*.js', 'tools/**/*.js']
        },
        uglify: {
            build: {
                options: {
                    screwIE8: true
                },
                files: {
                    'dist/data-tier.min.js': ['dist/data-tier.js']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('test', ['jshint']);

    grunt.registerTask('build', 'Build', function () {
        builder.concatSources();
        grunt.task.run('uglify:build');
    });

    grunt.registerTask('full-ci', 'Full CI Build cycle', function () {
        var done = this.async();

        grunt.task.run('build');
        chromeDriver.obtainChrome(r => done());
        //grunt.task.run('test');
    });

};