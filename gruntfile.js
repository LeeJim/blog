module.exports = function(grunt) {

	require('load-grunt-tasks')(grunt);

	var config = {
		'version': '1.0.0',
		'port': 2016,
		'to' : 'dist/',
		'from' : 'src/'
	}

	grunt.initConfig({

		clean: {
			common: {
				src:[config.to + '{css,img,js}/*']
			}
		},

		copy:{
			script: {
				files:[{
					expand: true,
					cwd: config.from + 'js',
					src: '{,*/}*.js',
					dest: config.to + 'js',
					ext: '.js'
				}]
			},
			image: {
				files:[{
					expand:true,
					cwd: config.from + 'img',
					src:'**',
					dest: config.to + 'img',
				}]
			}
		},

		less: {
			dist: {
				files:[{
					expand:true,
					cwd: config.from + 'less',
					src:'{,*/}*.less',
					dest: config.to + 'css',
					ext:'.css'
				}]
			}
		},

		connect: {
			options: {
				port: config.port,
				livereload: 43998
			},
	    server: {
	      options: {
	        open:true,
	        hostname: '*',
	        base: config.to
	      }
	    }
		},

		express: {
			dev: {
				options: {
					script: 'app.js'
				}
			}
		},

		watch: {
			style: {
				files: [ config.from + 'less/{,*/}*.less'],
				tasks: ['newer:less:dist']
			},
			script: {
				files: [ config.from + 'js/{,*/}*.js'],
				tasks: ['newer:copy:script']
			},
			copyImage: {
				files: [ config.from + 'img/**'],
				tasks: ['copy:image']
			}
			// ,
			// livereload: {
   //      options: {
   //        livereload: '<%= connect.options.livereload %>'
   //      },
   //      files:[config.to + '{,*/}*']
   //    }
		}
	});

	grunt.registerTask('default', ['clean', 'copy', 'less', 'express', 'watch']);

}