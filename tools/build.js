var os = require('os'),
    fs = require('fs'),
    path = require('path');

module.exports = function build(grunt) {
    grunt.log.writeln('Con-copying the sources to distribuition...');
    fs.writeFileSync(path.join('dist','data-tier.js'), fs.readFileSync(path.join('node_modules','object-observer','dist','object-observer.js')));
    fs.appendFileSync(path.join('dist','data-tier.js'), os.EOL);
    fs.appendFileSync(path.join('dist','data-tier.js'), fs.readFileSync(path.join('src','data-tier.js')));
    grunt.log.ok();
};

