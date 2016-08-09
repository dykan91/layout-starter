var gutil = require('gulp-util');

module.exports = config;

function config(path) {
  'use strict';

  var SRC_DIR = 'src',
      TMP_DIR = '.tmp',
      config  = {};

  // Paths
  config.paths = {
    src: SRC_DIR,
    tmp: TMP_DIR,
    scripts: path.join(SRC_DIR, 'scripts'),
    styles: path.join(SRC_DIR, 'styles')
  };

  // Wiredep
  config.wiredep = {
    directory: 'bower_components'
  };

  // Error Handler
  config.errorHandler = errorHandler();

  return config;

  function errorHandler() {
    return function (error) {
      gutil.log(gutil.colors.red('[' + error.plugin + ']', error.message));
      this.emit('end');
    }
  }
}


