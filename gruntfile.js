
module.exports = function(grunt) {

	require('load-grunt-tasks')(grunt);

	var config = {
		static: 'static',
		public: 'public'
	};

	grunt.initConfig({
		config: config,

		copy: {
			script: {
				files:[{
					expand:true,
					cwd:'./static/js/',
					src:'{,*/}*.js',
					dest:'./public/js/',
					ext:'.js'
				}]
			},
			bin: {
				files:[{
					expand:true,
					cwd:'./bower_components/',
					src:'**/*.js',
					dest:'./public/bin/',
					ext:'.js'
				}]
			}
		},

		clean: {
			dist: {
				src: ['<%= config.public %>/**/*']
			}
		},

		less: {
			dist: {
				files:[{
					expand:true,
					cwd:'./static/css/',
					src:'{,*/}*.less',
					dest:'./public/css/',
					ext:'.css'
				}]
			}
		},

		express: {
			dist: {
				options: {
					port:3000,
					script:'./app.js'
				}
			}
		},

		watch: {
			dist: {
				files: ['static/css/{,*/}*.less'],
				tasks: ['newer:less:dist']
			},
			script: {
				files: ['static/js/{,*/}*.js'],
				tasks: ['newer:copy:script']
			}
		}

	});

	grunt.registerTask('default', ['copy:bin', 'less', 'express', 'watch']);
}