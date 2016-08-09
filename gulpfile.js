'use strict';

var path         = require('path');
var gulp         = require('gulp');
var eslint       = require('gulp-eslint');
var sass         = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var inject       = require('gulp-inject');
var wiredep      = require('wiredep').stream;
var browserSync  = require('browser-sync').create();

// Config
var config = require('./gulp.config')(path);

// Scripts
gulp.task('scripts', function () {
  return buildScripts();
});

// Scripts Reload
gulp.task('scripts:reload', function () {
  return buildScripts()
    .pipe(browserSync.stream());
});

// Styles
gulp.task('styles', function () {
  return buildStyles();
});

// Styles Reload
gulp.task('styles:reload', function () {
  return buildStyles()
    .pipe(browserSync.stream());
});

// Inject
gulp.task('inject', ['scripts', 'styles'], function () {
  var target = gulp.src(path.join(config.paths.src, '*.html'));

  var injectSources = gulp.src([
    path.join(config.paths.scripts, '**/*.js'),
    path.join(config.paths.tmp, 'styles', '**/*.css')
  ], {
    read: false
  });

  var injectOptions = {
    ignorePath: [
      config.paths.src,
      config.paths.tmp
    ],
    addRootSlash: false
  };

  return target
    .pipe(inject(injectSources, injectOptions))
    .pipe(wiredep(config.wiredep))
    .pipe(gulp.dest(config.paths.tmp));
});

// Inject Reload
gulp.task('inject:reload', ['inject'], function () {
  browserSync.reload();
});

// Watch
gulp.task('watch', ['inject'], function () {
  var bowerWatcher   = gulp.watch('bower.json'),
      htmlWatcher    = gulp.watch(path.join(config.paths.src, '*.html')),
      scriptsWatcher = gulp.watch(path.join(config.paths.scripts, '**/*.js')),
      stylesWatcher  = gulp.watch(path.join(config.paths.styles, '**/*.scss'));

  bowerWatcher.on('change', function () {
    gulp.start('inject:reload');
  });

  htmlWatcher.on('change', function () {
    gulp.start('inject:reload');
  });

  scriptsWatcher.on('change', function (event) {
    if (isOnlyChange(event)) {
      gulp.start('scripts:reload');
    } else {
      gulp.start('inject:reload');
    }
  });

  stylesWatcher.on('change', function (event) {
    if (isOnlyChange(event)) {
      gulp.start('styles:reload');
    } else {
      gulp.start('inject:reload');
    }
  });
});

// Serve
gulp.task('serve', ['watch'], function () {
  browserSyncInit([
    config.paths.tmp,
    config.paths.src
  ]);
});

// Default
gulp.task('default', function () {
  gulp.start('serve');
});

// Build Scripts
function buildScripts() {
  var target = gulp.src(path.join(config.paths.scripts, '**/*.js'));

  return target
    .pipe(eslint())
    .pipe(eslint.format());
}

// Build Styles
function buildStyles() {
  var target = gulp.src(path.join(config.paths.styles, '**/*.scss'));

  var sassOptions = {
    outputStyle: 'expanded'
  };

  var autoprefixerOptions = {
    browsers: ['last 2 versions'],
    cascade: false
  };

  return target
    .pipe(sass(sassOptions))
    .pipe(autoprefixer(autoprefixerOptions))
    .pipe(gulp.dest(path.join(config.paths.tmp, 'styles')));
}

// BrowserSync Init
function browserSyncInit(baseDir) {
  var routes = null;

  if (Array.isArray(baseDir)) {
    routes = {
      '/bower_components': 'bower_components'
    };
  }

  browserSync.init({
    startPath: '/',
    server: {
      baseDir: baseDir,
      routes: routes
    },
    open: false
  });
}

// Helper
function isOnlyChange(event) {
  return event.type === 'changed';
}
