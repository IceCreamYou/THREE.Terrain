module.exports = function(grunt) {
  var banner = '/**\n' +
               ' * THREE.Terrain.js <%= pkg.version %>-<%= grunt.template.today("ddmmyyyy") %>\n' +
               ' *\n' +
               ' * @author <%= pkg.author %>\n' +
               ' * @license <%= pkg.license %>\n' +
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
              'noise.js',
              'THREE.Terrain.js'
              ],
        dest: 'THREE.Terrain.noise.js',
        nonull: true
      }
    },
    uglify: {
      options: {
        banner: banner,
        compress: {
          dead_code: false,
          side_effects: false,
          unused: false
        },
        mangle: true,
        preserveComments: function(node, comment) {
          return (/^!/).test(comment.value);
        },
        report: 'min',
        sourceMap: true
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
        config: '.jscs.json'
      },
      main: [
               'index.js',
               'THREE.Terrain.js',
               'noise.js'
             ]
    },
    watch: {
      files: [
               'THREE.Terrain.js',
               'noise.js'
              ],
      tasks: ['concat', 'uglify']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks("grunt-jscs-checker");
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.registerTask('default', ['concat', 'uglify', 'jshint', 'jscs']);
};