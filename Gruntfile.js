module.exports = function(grunt) {
  var banner = '/**\n' +
               ' * THREE.Terrain.js <%= pkg.version %>-<%= grunt.template.today("yyyymmdd") %>\n' +
               ' *\n' +
               ' * @author <%= pkg.author %>\n' +
               ' * @license <%= pkg.license %>\n' +
               ' */\n';
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        banner: banner + '\n',
        separator: grunt.util.linefeed,
      },
      target: {
        src: [
          'src/noise.js',
          'src/core.js',
          'src/images.js',
          'src/filters.js',
          'src/generators.js',
          'src/materials.js',
          'src/scatter.js',
          'src/influences.js',
        ],
        dest: 'build/THREE.Terrain.js',
        nonull: true,
      },
    },
    uglify: {
      options: {
        banner: banner,
        compress: {
          dead_code: false,
          side_effects: false,
          unused: false,
        },
        mangle: true,
        preserveComments: function(node, comment) {
          return (/^!/).test(comment.value);
        },
        report: 'min',
        sourceMap: true,
      },
      target: {
        files: {
          'build/THREE.Terrain.min.js': ['build/THREE.Terrain.js'],
        },
      },
    },
    jshint: {
      options: {
        trailing: true,
      },
      target: {
        src: [
          'demo/index.js',
          'src/noise.js',
          'src/core.js',
          'src/images.js',
          'src/filters.js',
          'src/gaussian.js',
          'src/weightedBoxBlurGaussian.js',
          'src/generators.js',
          'src/materials.js',
          'src/scatter.js',
          'src/influences.js',
          'src/worley.js',
          'src/brownian.js',
          'src/analysis.js',
          'Gruntfile.js',
        ],
      },
    },
    jscs: {
      options: {
        config: '.jscs.json',
      },
      main: [
        'demo/index.js',
        'src/noise.js',
        'src/core.js',
        'src/images.js',
        'src/filters.js',
        'src/gaussian.js',
        'src/weightedBoxBlurGaussian.js',
        'src/generators.js',
        'src/materials.js',
        'src/scatter.js',
        'src/influences.js',
        'src/worley.js',
        'src/brownian.js',
        'src/analysis.js',
        'Gruntfile.js',
      ],
    },
    watch: {
      files: [
        'src/noise.js',
        'src/core.js',
        'src/images.js',
        'src/filters.js',
        'src/gaussian.js',
        'src/weightedBoxBlurGaussian.js',
        'src/generators.js',
        'src/materials.js',
        'src/scatter.js',
        'src/influences.js',
      ],
      tasks: ['concat', 'uglify'],
    },
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jscs');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.registerTask('default', ['concat', 'uglify', 'jshint', 'jscs']);
  grunt.registerTask('lint', ['jshint', 'jscs']);
};
