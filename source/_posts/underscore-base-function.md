---
title: 理解underscore.js系列——③基础函数
date: 2017-09-18 14:52:42
tags:
- JavaScript
- underscore.js
desc: 理解underscore.js v1.8.3 源码解析
---

从`_.each`函数入手，理解`underscore.js`的基础函数，`_.each`的调用盏可以参考如下思维导图：

![image](http://7xnh42.com1.z0.glb.clouddn.com/each.jpg)

`underscore.js`的很多方法都是基于函数的，因此对于用户传入的回调函数都是需要处理的，`_.each`也不例外。因此先来介绍内置的`cb`函数还有`optimizeCb`函数

### cb

`cb`顾名思义，就是回调函数(CallBack的简称)的意思。

```js
  // An internal function to generate callbacks that can be applied to each
  // element in a collection, returning the desired result — either `identity`,
  // an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (_.iteratee !== builtinIteratee) return _.iteratee(value, context); // 1
    if (value == null) return _.identity; // 2
    if (_.isFunction(value)) return optimizeCb(value, context, argCount); // 3
    if (_.isObject(value) && !_.isArray(value)) return _.matcher(value); // 4
    return _.property(value);
  };
```

1. 对于迭代函数(iteratee)来说，我们是可以重写成自己的迭代函数的。因此如果我们重新了的话就直接调用我们重写的`_.iteratee`
2. 如果没有传入`value`，就使用`_.identity = function(value) { return value; }`
3. 如果传入了`function`，则使用`optimizeCb`格式化一下
4. 如果传入了`object`，就是返回一个匹配函数，用于判断后续传入对象是否和该对象一致
5. 否则就将传入的值当成一个属性，返回一个匹配该属性的函数


### optimizeCb

格式化传入的回调函数，以统一迭代函数，方便后续使用

```js
  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    // 如果没有执行上下文，就直接返回该函数
    if (context === void 0) return func;
    switch (argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      // The 2-parameter case has been omitted only because no current consumers
      // made use of it.
      case null:
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };
```

### collectNonEnumProps

在IE9以下版本，会有一个bug：如果重写了`原不可枚举的属性`，使用`for...in`是不会返回的。

相关信息可参考：[W3Help SJ5003](http://www.w3help.org/zh-cn/causes/SJ5003)

```js
  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  var collectNonEnumProps = function(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    // 获取对象的构造函数，以获取对象的原型
    var constructor = obj.constructor;
    var proto = _.isFunction(constructor) && constructor.prototype || ObjProto;

    // Constructor is a special case.
    // 将构造函数属性放入keys
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      // 如果obj有这个属性
      // obj[prop] !== proto[prop] 说明重写了该属性
      // keys不包含该属性
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  };
```

这里就涉及到JavaScript的对象相关知识，可以参考另一篇文章[待续](/)

### restArgs

`rest`是剩余的意思，顾名思义就是剩余参数，以方便灵活使用函数，灵活传入参数。这个是功能在ES6已经实现了，使用方式为：`function(value, ...rest)`

```js
  // Similar to ES6's rest param (http://ariya.ofilabs.com/2013/03/es6-and-rest-parameter.html)
  // This accumulates the arguments passed into an array, after a given index.
  var restArgs = function(func, startIndex) {
    // func.length可获取函数定义的参数个数
    // eg: function (a, b) {}  => 2
    startIndex = startIndex == null ? func.length - 1 : +startIndex;
    return function() {
      var length = Math.max(arguments.length - startIndex, 0),
          rest = Array(length),
          index = 0;
      // 将定义的最后一个参数和超过定义的参数都放进rest数组
      for (; index < length; index++) {
        rest[index] = arguments[index + startIndex];
      }
      // 这部分逻辑和下部分是重叠的。因为这三种情况是常用的，就可避免执行下面的逻辑。
      switch (startIndex) {
        case 0: return func.call(this, rest);
        case 1: return func.call(this, arguments[0], rest);
        case 2: return func.call(this, arguments[0], arguments[1], rest);
      }
      // 将超出的部分(指rest)放在args数组的最后一位
      var args = Array(startIndex + 1);
      for (index = 0; index < startIndex; index++) {
        args[index] = arguments[index];
      }
      args[startIndex] = rest;
      return func.apply(this, args);
    };
  };
```

这里涉及到两个知识点：

- `function.length`指的是函数定义的参数个数
- `function.call`和`function.apply`的区别：`call`需逐个传入参数，而`apply`则将参数放进一个数组传入