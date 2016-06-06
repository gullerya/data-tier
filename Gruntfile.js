var fs = require('fs');

module.exports = function (grunt) {
    grunt.initConfig({
        jshint: {
            options: {
                globals: {
                    esversion: 6
                }
            },
            files: ['Gruntfile.js', 'src/**/*.js']
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

    grunt.registerTask('build', 'Customized build', function () {
        grunt.log.writeln('Copy to "bin"');
        fs.writeFileSync('dist/data-tier.js', fs.readFileSync('src/data-tier.js'));
        grunt.log.ok();

        grunt.task.run('uglify:build');
    });

    grunt.registerTask('full-ci', 'Full CI Build cycle', function () {
        grunt.task.run('build');
        //grunt.task.run('test');
    });
};