'use strict';

var path           = require('path');
var gulp           = require('gulp');
var eslint         = require('gulp-eslint');
var sass           = require('gulp-sass');
var sourcemaps     = require('gulp-sourcemaps');
var autoprefixer   = require('gulp-autoprefixer');
var inject         = require('gulp-inject');
var useref         = require('gulp-useref');
var filter         = require('gulp-filter');
var gulpif         = require('gulp-if');
var htmlmin        = require('gulp-htmlmin');
var imagemin       = require('gulp-imagemin');
var cleanCSS       = require('gulp-clean-css');
var uglify         = require('gulp-uglify');
var saveLicense    = require('uglify-save-license');
var lazypipe       = require('lazypipe');
var mainBowerFiles = require('main-bower-files');
var runSequence    = require('run-sequence');
var del            = require('del');
var wiredep        = require('wiredep').stream;
var browserSync    = require('browser-sync').create();

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

// Serve Dist
gulp.task('serve:dist', ['build'], function () {
  browserSyncInit(config.paths.dist);
});

// Html
gulp.task('html', ['inject'], function () {
  var target = gulp.src(path.join(config.paths.tmp, '*.html'));

  var userefOptions = {
    searchPath: [
      config.paths.src,
      config.paths.tmp
    ]
  };

  var scripts = lazypipe()
    .pipe(sourcemaps.init)
    .pipe(uglify, {
      preserveComments: saveLicense
    })
    .pipe(sourcemaps.write, 'maps');

  var styles = lazypipe()
    .pipe(sourcemaps.init)
    .pipe(cleanCSS, {
      processImport: false
    })
    .pipe(sourcemaps.write, 'maps');

  return target
    .pipe(useref(userefOptions))
    .pipe(gulpif('**/*.js', scripts()))
    .pipe(gulpif('**/*.css', styles()))
    .pipe(gulp.dest(config.paths.dist));
});

// Clean
gulp.task('clean', function () {
  var target = [
    config.paths.dist,
    config.paths.tmp
  ];

  return del(target);
});

// Images
gulp.task('images', function () {
  var target = gulp.src(path.join(config.paths.images, '**/*'));

  return target
    .pipe(imagemin())
    .pipe(gulp.dest(path.join(config.paths.dist, 'images')));
});

// Copy Files
gulp.task('copy-files', function () {
  var target = gulp.src([
    path.join(config.paths.src, '**/*'),
    path.join('!' + config.paths.src, '**/*.{html,js,scss}'),
    path.join('!' + config.paths.images, '**/*')
  ]);

  var filesFilter = filter(function (file) {
    return file.stat.isFile();
  });

  return target
    .pipe(filesFilter)
    .pipe(gulp.dest(config.paths.dist));
});

// Copy Bower Files
gulp.task('copy-bower-files', function () {
  var fontsFilter = filter('**/*.{eot,svg,ttf,woff,woff2}');

  return gulp.src(mainBowerFiles())
    .pipe(fontsFilter)
    .pipe(gulp.dest(path.join(config.paths.dist, 'fonts')));
});

// Build
gulp.task('build', function (callback) {
  runSequence('clean', 'html', 'images', 'copy-files', 'copy-bower-files', callback);
});

// Default
gulp.task('default', function () {
  gulp.start('build');
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
    .pipe(sourcemaps.init())
    .pipe(sass(sassOptions)).on('error', config.errorHandler)
    .pipe(autoprefixer(autoprefixerOptions)).on('error', config.errorHandler)
    .pipe(sourcemaps.write())
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
