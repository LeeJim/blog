---
title: 开始拥抱 Gulp
date: 2016-09-23 12:17:53
tags: gulp
desc: getting-started-with-gulp,gulp,grunt,gulpfile,gruntfile
from: https://markgoodyear.com/2014/01/getting-started-with-gulp/
toc: true
categories:
- 前端工程化
---

前端工作流中常用的构建工具除了`grunt`，还有一个`gulp`(当然现在还有`webpack`)。`gulp`是一个直观的，执行代码覆盖配置(code-over-configuration)的，基于`nodejs`流的构建工具，而且执行很快。

<!--more-->

既然有了`grunt`，为啥还要来学习`gulp`呢？这是一个好问题，用过`grunt`的都知道，每次写`Gruntfile.js`的时候，都要先写一大片的配置文件，而`gulp`和`grunt`最大的差别在于，`gulp`是执行代码覆盖配置的。这样的好处在于，`gulpfile.js`很容易写，而且阅读起来清晰明了，并且容易维护。

`gulp`使用`node.js`的流(stream)，这让`gulp`构建的时候不需要写入临时的文件/目录到硬盘上。如果你想要学习关于流(stream)的更多知识，可以看[这篇文章](https://github.com/substack/stream-handbook)（写得很好）

`gulp`允许将你输入的源文件使用管道(pipe)，让文件流经一堆的插件，最后输出出来。而不是像`grunt`那样，为每一个`grunt`都写一些配置信息和输入输出路径。让我们看下使用`grunt`和`gulp`写的`Sass`编译：


**Grunt**:

```js
sass: {
  dist: {
    options: {
      style: 'expanded'
    },
    files: {
      'dist/assets/css/main.css': 'src/styles/main.scss',
    }
  }
},

autoprefixer: {
  dist: {
    options: {
      browsers: [
        'last 2 version', 'safari 5', 'ie 8', 'ios 6', 'android 4'
      ]
    },
    src: 'dist/assets/css/main.css',
    dest: 'dist/assets/css/main.css'
  }
},

grunt.registerTask('styles', ['sass', 'autoprefixer']);
```

`Grunt`需要为每个插件各自写配置信息，并且指定输入输出的路径。比如，我们输入一个文件到`Sass`插件，执行完就要保存输出的文件。然后我们再将sass的输出文件传递给`Autoprefixer`输入，然后我们再将文件输出保存起来。

**gulp**:

```js
gulp.task('sass', function() {
  return sass('src/styles/main.scss', { style: 'expanded' })
    .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ios 6', 'android 4'))
    .pipe(gulp.dest('dist/assets/css'))
});
```

使用`gulp`的时候，我们只需要输入一个文件，然后经过`Sass`插件修改，然后经过`Autoprefixer`插件修改，最后输出一个文件。这样会让我们的构建速度加快，因为我们避免了多次不必要的读取和写入。

### 安装Gulp

在我们钻研配置任务信息之前，我们需要安装`gulp`：

```
$ npm install gulp -g
```

以上命令会在全局环境上安装`gulp`，让我们可以使用`gulp`命令行。然后，我们需要在项目文件夹内安装本地的`gulp`，`cd`到你的项目路径，然后运行一下命令(执行命令前需确保项目下有`package.json`这个文件)

```
$ npm install gulp --save-dev
```

以上命令会在项目内安装本地的gulp并保存到`package.json`里的`devDependencies`

### 安装gulp插件

我们需要安装一些插件来完成以下的任务：

- 编译sass ([gulp-ruby-sass](https://github.com/sindresorhus/gulp-ruby-sass))

- 自动添加厂商前缀 ([gulp-autoprefixer](https://github.com/Metrime/gulp-autoprefixer))

- 压缩CSS ([gulp-cssnano](https://github.com/jonathanepollack/gulp-cssnano))

- js检测 ([gulp-jshint](https://github.com/wearefractal/gulp-jshint))

- 合并文件 ([gulp-concat](https://github.com/wearefractal/gulp-concat))

- 压缩JS ([gulp-uglify](https://github.com/terinjokes/gulp-uglify))

- 压缩图片 ([gulp-imagemin](https://github.com/sindresorhus/gulp-imagemin))

- 动态加载 ([gulp-livereload](https://github.com/vohof/gulp-livereload))

- 缓存图片然后只压缩改变后的图片 ([gulp-cache](https://github.com/jgable/gulp-cache/))

- 提示信息 ([gulp-notify](https://github.com/mikaelbr/gulp-notify))

- 清除文件 ([del](https://www.npmjs.org/package/del))

通过以下命令来安装这些插件：

```
npm install gulp-ruby-sass gulp-autoprefixer gulp-cssnano gulp-jshint gulp-concat gulp-uglify gulp-imagemin gulp-notify gulp-rename gulp-livereload gulp-cache del --save-dev
```

这将会安装全部需要的插件并将它们保存到`package.json`的`devDependencies`里面。你可以[在这里](http://gulpjs.com/plugins/)找到gulp的全部插件。

### 加载插件

之后，我们要创建一个文件夹`gulpfile.js`并加载这些插件：

```js
var gulp = require('gulp'),
    sass = require('gulp-ruby-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    cssnano = require('gulp-cssnano'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    notify = require('gulp-notify'),
    cache = require('gulp-cache'),
    livereload = require('gulp-livereload'),
    del = require('del');
```

这个时候，看起来是不是好像需要写的东西比`grunt`还多？其实，`gulp`插件和`grunt`插件有略微的不同——`gulp`插件的理念是：每个插件只需做一件事然后把这件事做好就可以了（翻译得好渣，原文是they are designed to do one thing and one thing well）比如，`grunt`的`imagemin`使用缓存来避免压缩已经压缩过的图片；而`gulp`则需要`cache`插件来协助完成这样的任务，当然`cache`插件也可以缓存其他的文件。这就给你的构建任务添加了许多灵活性，很酷是吧？

我们同样可以像`grunt`那样[自动加载所有已安装的插件](https://github.com/jackfranklin/gulp-load-tasks)，不过为了这篇文章，我们就将坚持纯手工工艺！

### 创建任务

#### Compile Sass, Autoprefix and minify

首先，我们先配置`Sass`编译，然后使用`Autoprefixer`添加厂商前缀，这时可以先输出到一个目的地。之后，再将文件流传递给`cssnao`压缩成一个`.min`版本，最后再输出到另一个目的地，最后的最后调用`notify`提示我们任务完成了：

```js
gulp.task('styles', function() {
  return sass('src/styles/main.scss', { style: 'expanded' })
    .pipe(autoprefixer('last 2 version'))
    .pipe(gulp.dest('dist/assets/css'))
    .pipe(rename({suffix: '.min'}))
    .pipe(cssnano())
    .pipe(gulp.dest('dist/assets/css'))
    .pipe(notify({ message: 'Styles task complete' }));
});
```

继续往下讲之前，有一点东西需要解释一下：

```js
gulp.task('styles', function() {...});
```

这里的`gulp.task`API是用来创建任务的。我们在命令行工具中可以使用`$ gulp styles`运行上面的任务。

```js
return sass('src/styles/main.scss', { style: 'expanded' })
```

这里是一个新的`gulp-rubu-sass`API，我们用来定义源文件并可以添加一些参数配置；而在其他的许多插件中，我们将会用`gulp.src`API来代替（在文章的下部分你将会看到）这同样可以使用`glob pattern`，比如：`/**/*.scss`来匹配多个文件。（以下未翻译:By returning the stream it makes it asynchronous, ensuring the task is fully complete before we get a notification to say it’s finished.)

```js
.pipe(autoprefixer('last 2 version'))
```

我们通过`.pipe()`来导数据流到一个插件。通常我们可以在各个插件的GitHubPage找到各自的options信息。为了方便大家，我已经在上面粘贴了它们的地址。管道(Pipes)是可链式调用的，因此你可以尽可能地添加插件到文件流中。

```js
.pipe(gulp.dest('dist/assets/css'));
```

这里的`gulp.dest`API我们是用来设置输出路径的。一个任务可以有多个输出路径的，上面的例子就是一个用来输出`expanded version`(正常大小版本)，另一个输出`minifed version`(压缩版本)

我建议去看下`gulp`的[API文档](https://github.com/gulpjs/gulp/blob/master/docs/API.md)来更好地理解这些方法，它并不像听起来那么吓人！

#### JSHint, concat, and minify JavaScript

希望你现在对如何创建一个`gulp`任务有一个很好的idea，接下来我们将设置scripts任务去检测，合并和压缩js文件：

```js
gulp.task('scripts', function() {
  return gulp.src('src/scripts/**/*.js')
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('default'))
    .pipe(concat('main.js'))
    .pipe(gulp.dest('dist/assets/js'))
    .pipe(rename({suffix: '.min'}))
    .pipe(uglify())
    .pipe(gulp.dest('dist/assets/js'))
    .pipe(notify({ message: 'Scripts task complete' }));
});
```

这里我们就是用`gulp.src`API来指定我们的输入文件。有一件事情需要注意的是，我们需要为`JSHint`指定一个reporter，我使用的是适合大部分人使用的默认reporter，你可以在[JSHint官网](http://www.jshint.com/docs/reporters/)找到更多的信息。

#### Compress Images

接下来，我们设置图片压缩。

```js
gulp.task('images', function() {
  return gulp.src('src/images/**/*')
    .pipe(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true }))
    .pipe(gulp.dest('dist/assets/img'))
    .pipe(notify({ message: 'Images task complete' }));
});
```

这里我们将拿到一些图片，然后导到`imagemin`插件。我们可以做得更好一点，就是使用缓存来避免重复压缩已经压缩过的图片——这只需要我们之前已经安装好的`gulp-cache`插件。为了实现这个，我们需要改变这一行：

```js
.pipe(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true }))
```

改成：

```js
.pipe(cache(imagemin({ optimizationLevel: 5, progressive: true, interlaced: true })))
```

现在就只用新的图片和改变过的图片会被压缩了，nice吧？

#### Clean up!

在部署之前，清除输出目录再执行构建任务是一个好想法——为了避免一些在原目录也就是输出目录已经删除的文件还遗留在输出目录：

```js
gulp.task('clean', function() {
    return del(['dist/assets/css', 'dist/assets/js', 'dist/assets/img']);
});
```

这里我们不需要使用`gulp`的插件，因为我们可以利用node模块的优点，我们使用return来确保在退出之前完成任务（翻译得有点渣，原文奉上：We don’t need to use a gulp plugin here as we can take advantage of Node modules directly within gulp. We use a return to ensure the task finishes before exiting.）

#### The default task

我们定义的default任务可以直接使用`$ gulp`运行，比如：

```js
gulp.task('default', ['clean'], function() {
    gulp.start('styles', 'scripts', 'images');
});
```

需要注意到的是，我们添加了一个数组到`gulp.task`上，在这里我们可以定义任务依赖。在这里例子里，`clean`任务将会在`gulp.start`之前先运行。`gulp`里的任务是并发的，所以无法确定各个任务的完成顺序，所以我们需要确保`clean`任务完成之后才开始其他的任务。

**注意**：

建议是的不要在依赖任务中使用`gulp.start`，不过在这个脚本里为了确保`clean`完全完成，这似乎是最好的选择（原文：It’s advised against using gulp.start in favour of executing tasks in the dependency arrary, but in this scenario to ensure clean fully completes, it seems the best option）

#### watch

监听我们的文件，然后当它们修改的时候执行相应的任务。首先我们要创建一个新的任务，然后使用`gulp.watch`API来开始监听文件。

```js
gulp.task('watch', function() {

  // Watch .scss files
  gulp.watch('src/styles/**/*.scss', ['styles']);

  // Watch .js files
  gulp.watch('src/scripts/**/*.js', ['scripts']);

  // Watch image files
  gulp.watch('src/images/**/*', ['images']);

});
```
我们可以通过`gulp.watch`API来指定我们需要监听的文件，然后通过依赖数组来定义需要执行的任务。现在我们可以运行`$ gulp watch`，然后修改一下对应监听目录下的文件，就将会执行对应的任务。


#### LiveReload

`gulp`同样可以在文件修改的时候刷新页面，我们需要修改我们的`watch`任务来配置`LiveReload`服务：

```js
gulp.task('watch', function() {

  // Create LiveReload server
  livereload.listen();

  // Watch any files in dist/, reload on change
  gulp.watch(['dist/**']).on('change', livereload.changed);

});
```

为了让实现这个梦想，你需要安装和启用`LiveReload`的浏览器插件。或者你也可以[手动的添加这些东西](http://feedback.livereload.com/knowledgebase/articles/86180-how-do-i-add-the-script-tag-manually-)

### 合并所有代码

现在你拥有了一个完整的`gulpfile`了， 它来自于[这里](https://gist.github.com/markgoodyear/8497946#file-01-gulpfile-js)

```js
/*!
 * gulp
 * $ npm install gulp-ruby-sass gulp-autoprefixer gulp-cssnano gulp-jshint gulp-concat gulp-uglify gulp-imagemin gulp-notify gulp-rename gulp-livereload gulp-cache del --save-dev
 */

// Load plugins
var gulp = require('gulp'),
    sass = require('gulp-ruby-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    cssnano = require('gulp-cssnano'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    notify = require('gulp-notify'),
    cache = require('gulp-cache'),
    livereload = require('gulp-livereload'),
    del = require('del');

// Styles
gulp.task('styles', function() {
  return sass('src/styles/main.scss', { style: 'expanded' })
    .pipe(autoprefixer('last 2 version'))
    .pipe(gulp.dest('dist/styles'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(cssnano())
    .pipe(gulp.dest('dist/styles'))
    .pipe(notify({ message: 'Styles task complete' }));
});

// Scripts
gulp.task('scripts', function() {
  return gulp.src('src/scripts/**/*.js')
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('default'))
    .pipe(concat('main.js'))
    .pipe(gulp.dest('dist/scripts'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(uglify())
    .pipe(gulp.dest('dist/scripts'))
    .pipe(notify({ message: 'Scripts task complete' }));
});

// Images
gulp.task('images', function() {
  return gulp.src('src/images/**/*')
    .pipe(cache(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true })))
    .pipe(gulp.dest('dist/images'))
    .pipe(notify({ message: 'Images task complete' }));
});

// Clean
gulp.task('clean', function() {
  return del(['dist/styles', 'dist/scripts', 'dist/images']);
});

// Default task
gulp.task('default', ['clean'], function() {
  gulp.start('styles', 'scripts', 'images');
});

// Watch
gulp.task('watch', function() {

  // Watch .scss files
  gulp.watch('src/styles/**/*.scss', ['styles']);

  // Watch .js files
  gulp.watch('src/scripts/**/*.js', ['scripts']);

  // Watch image files
  gulp.watch('src/images/**/*', ['images']);

  // Create LiveReload server
  livereload.listen();

  // Watch any files in dist/, reload on change
  gulp.watch(['dist/**']).on('change', livereload.changed);

});
```

我也使用`grunt`写了一份配置文件来完成同样的东西，你可以对比一些有什么不一样。[拿好了，不送了](https://gist.github.com/markgoodyear/8497946#file-02-gruntfile-js)

本文翻译自：[Getting started with gulp](https://markgoodyear.com/2014/01/getting-started-with-gulp/)