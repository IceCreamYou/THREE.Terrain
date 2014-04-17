module.exports = function(grunt) {
  var banner = '/**\n' +
               ' * THREE.Terrain.js <%= pkg.version %>-<%= grunt.template.today("ddmmyyyy") %>\n' +
               ' *\n' +
               ' * @author <%= pkg.author %>\n' +
               ' * @license <%= pkg.license %> License\n' +
               ' */\n';
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        banner: banner + "\n",
        separator: grunt.util.linefeed
      },
      target: {
        src: [
              'THREE.Terrain.js',
              'noise.js'
              ],
        dest: 'THREE.Terrain.noise.js',
        nonull: true
      }
    },
    uglify: {
      options: {
        banner: banner,
        sourceMap: true,
        compress: {
          side_effects: false,
          unused: false
        },
        mangle: true,
        report: 'min'
      },
      target: {
        files: {
          'THREE.Terrain.min.js': ['THREE.Terrain.js'],
          'THREE.Terrain.noise.min.js': ['THREE.Terrain.noise.js']
        }
      }
    },
    jshint: {
      options: {
        trailing: true
      },
      target: {
        src : [
               'index.js',
               'THREE.Terrain.js',
               'noise.js'
               ]
      }
    },
    jscs: {
      options: {
        config: ".jscs.json"
      },
      main: [
               'index.js',
               'THREE.Terrain.js',
               'noise.js'
             ]
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks("grunt-jscs-checker");
  grunt.registerTask('default', ['concat', 'uglify', 'jshint', 'jscs']);
};