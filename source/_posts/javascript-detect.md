---
title: 总结 JavaScript 的检测方式
date: 2016-11-15 20:32:12
tags:
desc:
- JavaScript
- detect
toc: true
categories:
- [前端, 基础]
---

在JavaScript开发当中，因为涉及到跨平台的兼容性问题，我们常常需要去检测一些方法或者属性是否存在，如果不存在而我们贸然使用的话，就是报错导致程序无法继续运行，而用户则会不知所措。

<!-- more -->

我们都知道，JavaScript是有5种原始类型的：
- number
- string
- boolean
- undefined
- null

## 检测原始类型
检测原始类型的最佳选择是使用`typeof`

```js
typeof 'abc' // string
typeof 123 // number
typeof true // boolean
typeof undefined // undefined
```

`typeof`有一个好处就是：未声明的变量也不会报错
```js
typeof someVariable //此时someVariable是未定义，返回undefined
```

## 检测复合类型
复合类型内置有（不只以下几种，只是举例说明）：
- Object
- Array
- Date
- Error

当我们使用`typeof`检测的时候，就会看到都是返回object

```js
typeof {} //object
typeof [] //object
typeof new Date() //object
typeof new Error() //object
```

此时的最佳选择是使用`instanceof`

```js
var today = new Date()

today instanceof Date // true
```

到这里好像全部的检测类型都搞定了。

但是，检测类型并不能这么简单地分为原始类型和复合类型，因为复合类型会涉及到构造函数的问题。

### 检测函数
当我们的页面内嵌了其他的frame时，问题就来了。因为不同的frame的构造函数是独立的，即会发生以下问题：

```js
// 在frame A定义的函数test
function test(){}

// 在frame B检测
test instanceof Function //false

// 而使用typeof则可以正确返回
typeof test // function
```

故检测函数的时候，最佳选择是使用`typeof`

### 检测数组
数组的问题和函数是一样的，因为不同的构造函数。而此时`typeof`也不灵了，因为只返回object。

Douglas Crockford则提供了一种叫duck typing(鸭式辩型)的方式：

```js
function isArray(value){
  return typeof value.sort === 'function';
}
```

其实，这种方式是默认的认为只有数组才有sort方法。其实传入任何有sort方法的对象也是返回true的。因此这个方法并不完美。

最终的解决方案也是ECMAScript 5的实现方案，就是来自Kangax大神的方法：

```js
function isArray(value){
  return Object.prototype.toString.call(value) === '[object Array]' ;
}
```

这个方法能完美地辨别是否为数组。

在ECMAScript 5则可以使用Array的内置方法：

```js
Array.isArray([]) // true
```

## 检测属性
我发现，在检测一个对象的属性是否存在的时候，常常是这样的：

```js
if(object.someProps){
  //一些逻辑
}
```
或者是这样的：

```js
if(object.someProps != null){
  //一些逻辑
}
```
或者是这样的：

```js
if(object.someProps != undefined){
  //一些逻辑
}
```
其实以上都是有问题的！因为以上方式都忽略了object可能存在假值的情况（即是属性存在，但是等于null或者undefined或者0或者false或者空字符串等等）。因此最佳的方式是使用`in`运算符：

```js
if(someProps in object){
  //一些逻辑
}
```

以上检测数据类型的所有方式。

参考：
《Maintainable JavaScript》


