---
title: 理解underscore.js系列——④精选函数
date: 2017-09-23 18:43:11
tags:
- JavaScript
- underscore.js
desc: 理解underscore.js v1.8.3 源码解析
toc: true
categories:
- 源码解析
- underscore
---

这篇文章就分析一些我觉得很常用，也很有趣的一些函数。很早以前就听过`underscore`的大名，但是很少去用到。通过这次阅读源码，发来了不少有趣的函数，也学习到了许多技巧，真实收益匪浅。

<!-- more -->


### _.sample

随意取出数组中的N个元素。

按我的思路，就是使用`_.random`得到索引然后取N个元素，但是这个方法有一个问题，就是有可能取到同个元素。

`underscore`则另辟蹊径，其算法是遍历前N个元素，每个元素和任意位置的元素替换，最后返回前N个元素即可。

```js
  // Sample **n** random values from a collection using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    var sample = isArrayLike(obj) ? _.clone(obj) : _.values(obj);
    var length = getLength(sample);
    n = Math.max(Math.min(n, length), 0);
    var last = length - 1;
    for (var index = 0; index < n; index++) {
      var rand = _.random(index, last);
      var temp = sample[index];
      sample[index] = sample[rand];
      sample[rand] = temp;
    }
    return sample.slice(0, n);
  };
```

### _.throttle

节流函数，频繁触发的函数可用`throttle`来实现一段时间(周期取决于`wait`)内只执行一次。

常见的场景是：页面滚动时`scroll`、页面大小改变时`resize`

可以看到，这个`throttle`函数是比较健壮的。

有`leading`、`trailing`可选，意思为开始和结束这个临界点是否触发。

```js
  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var timeout, context, args, result;
    var previous = 0;
    if (!options) options = {};

    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };

    var throttled = function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };

    throttled.cancel = function() {
      clearTimeout(timeout);
      previous = 0;
      timeout = context = args = null;
    };

    return throttled;
  };
```

实现`options.leading`（即开始时是否执行）相关：
 - 设置`var previous = 0;`
 - 默认不设置`options.leading`即默认开始时执行，故此时`if (!previous && options.leading === false) previous = now;`不会执行。
 - 此时，`previous = 0`。因此，`remaining = wait - (now - previous);`肯定小于0，故开始时必会执行。
 

实现`options.trailing`（即最后是否执行一次）相关：
 - 考虑一个情况，只触发一次时，那么最终要在`wait`时间之后是否执行呢？
 - 此时`underscore`就是使用一个定时器来实现。

### _.debounce

防抖动函数。频繁执行一个函数时，只有停止执行之后的若干时间(取决于`wait`)才执行一次。

常见场景：输入框搜索的时候，停止输入n秒才发起搜索请求。

```js
  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, result;

    var later = function(context, args) {
      timeout = null;
      if (args) result = func.apply(context, args);
    };

    var debounced = restArgs(function(args) {
      if (timeout) clearTimeout(timeout);
      if (immediate) {
        var callNow = !timeout;
        timeout = setTimeout(later, wait);
        if (callNow) result = func.apply(this, args);
      } else {
        timeout = _.delay(later, wait, this, args);
      }

      return result;
    });

    debounced.cancel = function() {
      clearTimeout(timeout);
      timeout = null;
    };

    return debounced;
  };
```

可以看到，该版本的`debounce`函数增加了`immediate`选项：就是刚开始的时候执行一次，n秒之后再执行一次。

在看`underscore`官网上，介绍说这个在防止意外的双击`submit`按钮时很有用。

这我有一点困惑，那不就提交了两次表单吗？

后来我发现，`later`函数里，执行`func`有一个前置条件:`if (args)`，而在`immediate = true`的情况下，`later`是这么调用的：`setTimeout(later, wait)`，这时没有传入任何参数，故`args = undefind`即`func`不会执行。

因此，`immediate = true`时，就只提交了一次表单，没任何问题。

### _.compose

组成函数，类似`jQuery`的链式调用：将前一个函数的执行结果传入后一个函数。

```js
  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };
```

这里我觉得`var i = start`似乎有些多余，但是如果站在代码语义(可读性的考虑)的角度的话，好像又不应该删除。

### _.after

执行N次之后才执行一次。这个方法的实现很简单，但是给我展示了一种新的开发模式。

```js
// Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };
```

在`javaScript`开发中，经常遇到异步调用的问题。

拿开发小程序为例，上传图片的功能官方只提供`单张上传API`，当我们要批量上次的时候，执行循环调用`单张上传API`。此时要全部上传完执行回调就可以使用这个方法了。

现在想想，我之前的做法是`setTimeout(uploadSuccess, 100)`，每隔0.1s去判断一下是否全部上传完毕，真是惭愧不如啊。

