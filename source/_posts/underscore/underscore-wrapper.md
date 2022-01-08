---
title: 理解underscore.js系列——①分析外包装
date: 2017-09-04 20:26:40
tags:
- JavaScript
- underscore.js
desc: 理解underscore.js v1.8.3 源码解析
toc: true
categories:
- 源码解析
- underscore
---

# 前言

其实每个JavaScript库的外包装都大同小异，读懂一个就差不多能读懂其他的了。

另外提醒，此文对应的`underscore.js`版本是`v1.8.3`

<!-- more -->

## 正文

下面将以源码+解析的形式，叙述我对`underscore.js`的理解，能力有限，如有错误请指正。

### 立即执行函数

源码的最外面是一个立即执行函数(`IIFE`)：

```js
(function() {
  // ...其他内容
}());
```

之所以这么做，在我的理解是，因为js只有函数作用域，只有这样做才不会污染全局变量。

### 全局变量

以前刚接触前端开发的时候，不懂`Node.js`，认为全局变量就是`window`，因此看到下面的代码会很困惑：

```js
  // Establish the root object, `window` (`self`) in the browser, `global`
  // on the server, or `this` in some virtual machines. We use `self`
  // instead of `window` for `WebWorker` support.
  var root = typeof self == 'object' && self.self === self && self ||
             typeof global == 'object' && global.global === global && global ||
             this ||
             {};
```

这是一个很geek的做法，运用了逻辑运算中的[`短路运算`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_Operators)，在`||`操作的时候，如果前面为`true`的话，就不会计算后面的了。

印象当中，以前的js库都是用`window`的，现在改用`self`，是因为要兼容[webWorker](https://developer.mozilla.org/en-US/docs/Web/API/Worker)的缘故。因此（如注释所言）

- 在浏览器或者`webWorker`的话，`root = self`
- 在服务器环境的话，`root = global`
- 在其他的虚拟机的话，则指向`this`即`root = this`
- 其他环境就设置为空对象`{}`

### 变量冲突

我们假设一个情况，如果`_`这个变量被别人使用了。如果我们直接给`_`赋值，不就丢失了前面的对于`_`的定义。

因此`undersocre.js`就先保存起来了：

```js
var previousUnderscore = root._;
```

这样的话，就不会丢失了前面对`_`的定义，如果要使用的话，就可以使用`underscore.js`提供的`noConflict`方法：

```js
_.noConflict = function() {
  root._ = previousUnderscore;
  return this;
};
```

### 缓存引用

这个就属于代码优化的做法了（缓存常用的native方法，以便后面快速访问和使用），比较常规：

```js
// Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype;
  var SymbolProto = typeof Symbol !== 'undefined' ? Symbol.prototype : null;

  // Create quick reference variables for speed access to core prototypes.
  var push = ArrayProto.push,
      slice = ArrayProto.slice,
      toString = ObjProto.toString,
      hasOwnProperty = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var nativeIsArray = Array.isArray,
      nativeKeys = Object.keys,
      nativeCreate = Object.create;
```

### 实现继承

众所周知的是，js是使用原型链来实现继承的。

其实这个实现方法就是ES5的`Object.create`的Polyfill，这么做是为了向后兼容：

```js
  var Ctor = function(){};

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null; // 恢复CTor的原型，以备后续使用
    return result;
  };
```

### 初始化

```js
// Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };
```

一开始我对这个部分有些困惑的，因为我简单地认为`_`就应该是一个空对象`{}`。

其实，`underscore.js`是支持面向对象的方式使用的，也就是把`_`当作一个构造函数。即`new _(obj)`这样的用法。

但是由于js没用真正的构造函数，因此还可以这样使用：`_(obj)`。为了避免这种情况，因此有了第二行代码：`if (!(this instanceof _)) return new _(obj);`。因为直接调用函数的话，`this`是指向全局的。

### 兼容Node.js环境

```js
  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for their old module API. If we're in
  // the browser, add `_` as a global object.
  // (`nodeType` is checked to ensure that `module`
  // and `exports` are not HTML elements.)
  if (typeof exports != 'undefined' && !exports.nodeType) {
    if (typeof module != 'undefined' && !module.nodeType && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }
```

由于`Node.js`的存在，因此在`Node.js`环境就将`_`赋值给`exports`

另外如注释所说，之所以要检测`nodeType`，是为了确保`exports`和`module`不是`HTML`元素

## 结尾

这篇文章就是我阅读`udersocre.js`的第一篇源码分析文章，也是这个系列的第一篇。

写这篇文章是为了提升自己的写作能力，同时也可以让其他读者可以有一个好的思路（我所认为的）去尝试读懂其他的源码。
