---
title: 理解underscore.js系列——②杂项
date: 2017-09-11 22:21:25
tags:
- JavaScript
- underscore.js
desc: 理解underscore.js v1.8.3 源码解析
toc: true
categories:
- 源码解析
- underscore
---

这一篇文章，就写一些零散的（我所理解的）知识点，感觉`underscore.js`许多细节值得好好深究一下。就像一篇好文章一样，经典的书籍值得重复地去品味，所谓书读百遍其义自现。

<!-- more -->

## typeof 

在`underscore.js`里，`typeof`后面都是跟着`==`而不是我们常用的`===`

看了一些其他人的解释都是笼统地归因于要隐式转换，却不给出任何例子。所以我不是很能理解。有一个理由我觉得是比较合理的：

> typeof typeof x，不管x是什么都是返回string的话，那么`==`就已经足够，并且与`===`相比还节省了一个字节。

## void 0与undefined

首先，`void`在C里是和常见的，但在js里就很少看到了。`void`在js里是一个操作符，它的作用在MDN里是这样描述的：

> The `void` operator evaluates the given expression and then returns `undefined`.

简而言之，`void`后面无论跟着什么表达式，都返回`undefined`。那使用`void 0`就是因为这样比较简洁。即

```js
void 0 === undefined
```

那么，为什么不直接用`undefined`而多此一举呢。

那是因为

- `undefined`有可能被重写(`undefined`不是保留字)

```js
// 在IE8及以下
var undefined = 10
console.log(undefined) // 10

// 主流浏览器
function() {
    var undefined = 10
    console.log(undefined) // 10
}
```
- `void 0`的长度为6个字符，而`undefined`则长达9个字符。减少3个字符传输，也减少了敲击键盘的次数，这个替换还是有必要的。
- 在iOS某版本下，`void 0`的速度比`undefind`快（这个是网上看到的，未验证）

## val == null

在`underscore.js`里，经常会看到`val == null`这样的做法。起初，不以为然，后来仔细琢磨一番。发现，这是一个很好的实践啊。

在开发时，我要判断一个变量是否有传入，是这么做的：

```js
if (typeof val === 'undefined') {
    // others
}
```

这样做没什么问题，但是当有多个参数，而val又不需要传入的时候呢：

```js
function someTest(val, otherVal) {
    
}

someTest(null, 1)
```

此时就要传入null了，而此时很容易补丁式将上面的判断改成如下：

```js
if (typeof val === 'undefined' || val === null) {
    // others
}
```

其实，此时完全可以用：`val == null`代替（**此时val要么是undefined要么是null才会等于true，所以此语句完全等于上面那个语句**）。

其中涉及的`==`（半等）知识，可以参考[Standard ECMA-262](http://www.ecma-international.org/ecma-262/5.1/#sec-11.9.3)