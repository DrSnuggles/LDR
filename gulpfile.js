const gulp = require('gulp')
const rollup = require('gulp-better-rollup')
const concat = require('gulp-concat')
const terser = require('gulp-terser')
const brotli = require('gulp-brotli')
const rename = require('gulp-rename')

gulp.task('rollupLDR', () => {
	return gulp.src('./ldr.js')
		.pipe(rollup({ plugins: [] }, 'es'))
		.pipe(terser({
			ecma: 6,
			keep_fnames: false,
			mangle: {
				toplevel: true,
			},
		  }))
		.pipe(rename('./ldr.min.js'))
		.pipe(gulp.dest('.'))
})

gulp.task('brotliLDR', () => {
	return gulp.src(['./ldr.min.js'])
	.pipe( brotli.compress({quality: 11}) )
    .pipe(gulp.dest('.'))
})

gulp.task('rollupZIP', () => {
	return gulp.src('./ldr-zip.js')
		.pipe(rollup({ plugins: [] }, 'es'))
		.pipe(terser({
			ecma: 6,
			keep_fnames: false,
			mangle: {
				toplevel: true,
			},
		  }))
		.pipe(rename('./ldr-zip.min.js'))
		.pipe(gulp.dest('.'))
})

gulp.task('brotliZIP', () => {
	return gulp.src(['./ldr-zip.min.js'])
	.pipe( brotli.compress({quality: 11}) )
    .pipe(gulp.dest('.'))
})

gulp.task('default', gulp.parallel(
	gulp.series('rollupLDR','brotliLDR'),
	gulp.series('rollupZIP','brotliZIP')
	)
)