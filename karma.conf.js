// Karma configuration
// Generated on Wed May 25 2016 19:12:11 GMT+0300 (FLE Daylight Time)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
      'lib/angular/angular.js',
      'lib/angular-animate/angular-animate.js',
      'lib/angular-mocks/angular-mocks.js',
      'lib/my-utils/src/utils.js',
      'lib/class-list/classList.js',
      'lib/events/events.js',
      'lib/es6-promise/promise.js',
      'src/ChangesTracker.js',
      'src/SwipeDecorator.js',
      'src/KeyHandlerDecorator.js',
      'src/LazyCarousel.js',
      'src/MyLazyCarouselAngular.js',
      { pattern: 'src/base.css', included: false },
      'test/helpers.js',
      { pattern: 'test/fixtures/**/*.css', included: false },
      'test/**/*Spec.js'
    ],

    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Firefox'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  })
}
