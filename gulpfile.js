
var path = require('path');

var gulp = require('gulp'),
    concat = require("gulp-concat"),
    order = require("gulp-order"),
    rename = require("gulp-rename"),
    wrapper = require('gulp-wrapper'),
    clean = require('gulp-clean'),
    watch = require('gulp-watch'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify');

var map = require('map-stream');

var stylus = require('gulp-stylus'),
    nib = require('nib'),
    sourcemaps = require('gulp-sourcemaps'),
    combineMq = require('gulp-combine-mq');

var rjs = require('gulp-requirejs');

gulp.task('clean', function() {
    gulp.src(['./css/*.css.map'], {read: false})
    .pipe(clean()).on('error', log);
});

gulp.task('jshint', function() {
    return gulp.src(['./js/**/*.js', '!./js/*.min.js', '!./js/lib/**/*.js'])
        .pipe(jshint())
        .pipe(map(function (file, cb) {
            if (!file.jshint.success) {
                console.log('JSHINT fail in ' + path.basename(file.path));
                file.jshint.results.forEach(function (result) {
                    if (result.error) {
                        var err = result.error;
                        var lineStr = 'line ' + pad(err.line + ',', 5);
                        var colStr = 'col ' + pad(err.character + ',', 5);
                        console.log(lineStr + colStr + err.reason);
                    }
                });
            }
            cb(null, file);
        }));

    function pad(msg,length) {
        while (msg.length < length) {
            msg = msg + ' ';
        }
        return msg;
    };
});

gulp.task('requirejs-min', function () {
    return rjs({
        baseUrl: "./js",
        name : 'boot',
        mainConfigFile: ["./js/boot.min.config.js"],
        optimize : 'none',
        out: 'boot.min.js'
    }).on('error', log)
    .pipe(uglify({
        mangle: false,
        compress: {
            unused        : false,  // drop unused variables/functions
            sequences     : false,  // join consecutive statemets with the “comma operator”
            properties    : false,  // optimize property access: a["foo"] → a.foo
            dead_code     : false,  // discard unreachable code
            drop_debugger : false,  // discard “debugger” statements
            conditionals  : false,  // optimize if-s and conditional expressions
            comparisons   : false,  // optimize comparisons
            evaluate      : false,  // evaluate constant expressions
            booleans      : false,  // optimize boolean expressions
            loops         : false,  // optimize loops
            unused        : false,  // drop unused variables/functions
            hoist_funs    : false,  // hoist function declarations
            hoist_vars    : false,  // hoist variable declarations
            if_return     : false,  // optimize if-s followed by return/continue
            join_vars     : false,  // join var declarations
            cascade       : false,  // try to cascade `right` into `left` in sequences
            side_effects  : false,  // drop side-effect-free statements
            warnings      : false
        }
    }))
    .pipe(gulp.dest('./js/'));
});

gulp.task('stylus', function() {
    return gulp.src(['./styl/*.styl', '!./styl/_*.styl'])
        .pipe(sourcemaps.init())
        .pipe(
            stylus({
                compress: false,
                'include css': true,
                url: 'embedurl',
                use: [nib()]
            })
        ).on('error', log)
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./css'));
});

gulp.task('stylus-min', function() {
    return gulp.src(['./styl/*.styl', '!./styl/_*.styl'])
        .pipe(
            stylus({
                compress: false,
                'include css': true,
                url: 'embedurl',
                use: [nib()]
            })
        ).on('error', log)
        .pipe(gulp.dest('./css'));
});

gulp.task('css-combineMq', ['stylus-min'], function () {
    return gulp.src('./css/*.css')
        .pipe(combineMq({
            log: false,
            beautify: true
        })).on('error', log)
        .pipe(gulp.dest('./css'));
});

gulp.task('views-combine', function () {
    return gulp.src(['./views/**/*.html', '!./views/_*.html'])
        .pipe(wrapper({
            header: function(file){
                var index = file.path.indexOf('Content');
                var id = file.path.substr(index);
                id = id.replace(/\\/g, '/');
                id = '/' + id;

                var str = '<div id="'+ id +'" class="my-template">\n';

                return str;
            },
            footer: '\n</div>\n'
        })).on('error', log)
        .pipe(order([
            "home.html",
            "campaign.html",
            "campaign.record.html",
            "campaign.record.recording.html",
            "campaign.record.checking.html",
            "campaign.upload.html",
            "campaign.form.html",
            "campaign.result.html",
            "how.html",
            "info.html",
            "gallery.html",
            "popups/*",
            "directives/*"
        ]))
        .pipe(concat('_result.html'))
        .pipe(gulp.dest('./views'));
});

gulp.task('watch', function () {
    gulp.watch('./styl/**/*.styl', ['stylus'])
});


gulp.task('default', ['clean', 'jshint', 'stylus']);

gulp.task('build', ['clean', 'jshint', 'stylus']);

gulp.task('build-min', ['clean', 'jshint', 'stylus-min', 'css-combineMq', 'requirejs-min']);

function log(error) {
    console.log([
        '',
        "----------ERROR MESSAGE START----------",
        ("[" + error.name + " in " + error.plugin + "]"),
        error.message,
        "----------ERROR MESSAGE END----------",
        ''
    ].join('\n'));

    if (this.end) {
        this.end();
    }
    else if (this.emit) {
        this.emit("end");
    }
    //stream.end();
}

function viewsCombine(options) {



    if (!prefixText) {
        throw new PluginError(PLUGIN_NAME, 'Missing prefix text!');
    }
    prefixText = new Buffer(prefixText); // allocate ahead of time

    // Creating a stream through which each file will pass
    return through.obj(function(file, enc, cb) {
        if (file.isNull()) {
            // return empty file
            return cb(null, file);
        }
        if (file.isBuffer()) {
            file.contents = Buffer.concat([prefixText, file.contents]);
        }
        if (file.isStream()) {
            file.contents = file.contents.pipe(prefixStream(prefixText));
        }

        cb(null, file);

    });

}
