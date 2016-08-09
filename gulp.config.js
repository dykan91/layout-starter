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

  return config;
}


