modules.exports = function(grunt){

	require('grunt-load-tasks')(grunt);

	grunt.initConfig({
		watch: {
			files: ['app.js']
		}
	})
}