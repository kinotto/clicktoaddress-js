'use strict';
module.exports = function(grunt) {
	grunt.initConfig({
		concat: {
			js: {
				src: ['js/**/*.js'],
				dest: 'concat/concat.js',
			},
			css: {
				src: ['less/**/*.less'],
				dest: 'concat/concat.less',
			},
		},
		replace: {
			dist: {
				options: {
					patterns: [{
						json: require('./package.json')
					}]
				},
				files: [
					{expand: true, flatten: true, src: ['./concat/*.*'], dest: './concat/'}
				]
			}
		},
		less: {
			dist: {
				files: {
					'build/cc_c2a.min.css': [
						'concat/concat.less'
					]
				},
				options: {
					compress: true
				}
			}
		},
		uglify: {
			dist: {
				files: {
					'build/cc_c2a.min.js': [
						'concat/concat.js'
					]
				},
				options: {
					report: false,
					mangle: false,
					compress: false,
					beautify: false,
					preserveComments: 'some'
				}
			}
		},
		clean: {
			dist: [
				'build/cc_c2a.min.css',
				'build/cc_c2a.min.js',
				'concat/*'
			]
		}
	});

	// Load tasks
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-replace');

	// Register tasks
	grunt.registerTask('default', [
		'clean',
		'concat',
		'replace',
		'less',
		'uglify'
	]);
};
