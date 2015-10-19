var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var babel = require('gulp-babel');
var rjs = require('gulp-requirejs-optimize');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

gulp.task('babel', function() {
    return gulp.src('src/**/*.js')
        .pipe(sourcemaps.init())
        .pipe(babel({
            modules: "amd"
        }))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('tests/compiled/'));
});

gulp.task('rjs', function() {
    "use strict";
    var requirejs = require('requirejs');

    requirejs.optimize({
        'optimize': 'none',
        'out': 'dist/d3-state-handler.js',
        'wrap': true,
        'baseUrl': './tests/compiled/',
        'name': 'd3-state-handler',
        'onModuleBundleComplete': function(data) {
            var f = data.path;
            var fs = require('fs');
            var amdclean = require('amdclean');
            fs.writeFileSync(f, amdclean.clean({
                'filePath': f
            }))
        }
    });
});

gulp.task('minify', function() {
    "use strict";
    return gulp.src('dist/d3-state-handler.js')
    .pipe(uglify())
    .pipe(rename('d3-state-handler.min.js'))
    .pipe(gulp.dest('dist/'))
});

gulp.task('watch', function() {
    "use strict";
    gulp.watch('src/**/*.js',['babel']);
    gulp.watch('tests/compiled/d3-state-handler.js',['rjs']);
    gulp.watch('dist/d3-state-handler.js',['minify']);
});

gulp.task('default',['watch']);