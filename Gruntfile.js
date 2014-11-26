module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        cssmin: {
            minify: {
                options: {
                    banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
                },
                expand: false,
                src: ['public/css/style.css', 'public/css/normalize.css', 'public/css/component.css'],
                dest: 'public/css/index.min.css'
            },
        },

        uglify: {
            index : {
                options: {
                    banner: '/*! home.min.js <%= grunt.template.today("yyyy-mm-dd") %> */\n'
                },
                src: [
                    'public/js/TweenLite.min.js',
                    'public/js/rAF.js',
                    'public/js/classie.js',
                    'public/js/matrix.js',
                    'public/js/scroll.js',
                    'public/js/script.js'
                ],
                dest: 'public/js/home.min.js'
            }
        },

        exec: {
            deploy: {
                cmd: './deploy.sh'
            }
        },

        processhtml: {
            dist: {
                options: {
                    process: true
                },
                files: {
                    'public/index.html': ['public/index.html']
                }
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-processhtml');
    grunt.loadNpmTasks('grunt-exec');
    grunt.registerTask('default', ['cssmin', 'uglify', 'processhtml', 'exec']);
};