---
title: Promise 原理 & 宏微任务
date: 2021-01-17 14:59:13
tags: 
- promise
toc: true
categories:
- [前端, 进阶]
---

读完这篇文章，你的收获有：
1. Promise简史
2. Promise的关键概念
3. 可以手写符合标准的Promise
4. 可以解答任意宏任务/微任务的题目

<!-- more -->

# 前言

为什么写这篇文章？

JavaScript是异步语言，因此Promise的重要性不言而喻。

而我看了一些文章，觉得质量参差不齐。

于是就系统地整理了些资料，然后输出一篇文章，即帮助他人，也能让大家给我挑问题，避免自己错而不知。

由于能力有限，文中可能存在错误，望广大网友指正。

# Promise 简史

Promise 并不是一个新鲜的概念，早在2011年就出现在社区里了，目的是为了解决著名的回调地狱问题。

这个概念是在JQuery Deferred Objects出现之后，开始流行的。并于2012年，Promise被提出作为规范：[Promise/A+](https://promisesaplus.com)。

在成为ES6标准之前，社区里也出现了许多符合Promise标准的库，如bluebird、q、when等等。

# Promise 的关键概念

> “The Promise object is used for deferred and asynchronous computations. A Promise represents an operation that hasn’t completed yet, but is expected in the future.” — MDN Promise Reference

Promise的基础认知，推荐看阮一峰的[《ES6 入门教程》](https://es6.ruanyifeng.com/#docs/promise)。

本文的重点是讲解一些手写Promise需要关注的关键概念。

## Promise 有三个状态：

- pending
- resolved
- rejected

只能从pending到resolved或rejected，之后状态就凝固了。

![](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c0704fc368da4c8cb5acee94a1659a1b~tplv-k3u1fbpfcp-watermark.image)

当状态流转成resolved时，需要选择一个值作为当前Promise的value：
- `new Promise`时，则是通过`resolve(val)`
- `promise.then`时，则是通过`return`（需要注意的是，没有显式`return`时是默认`return undefined`）

这个值可以是任意的合法JavaScript值（包括`undefined`、`thenable对象`或者`promise`）

> thenable对象是一个定义了then方法的对象或者函数

状态流转成rejected时，则需要用一个reason来作为当前Promise被reject的理由，和resolved时同理。

## Promise.prototype.then

```js
promise.then(onFulfilled, onRejected)
```

- [Promise/A+](https://promisesaplus.com/) 是Promise的标准规范，**其中指出Promise实例只需要实现then一个方法**
- then接收两个参数，而两个参数都是可选的，意味着可以什么都不传
- then是可以调用多次的。会按顺序调用，并且每次得到的promise状态和值都是相同的
- 每次调用then均返回一个全新的Promise实例，这样就可以链式调用
- then会在当前宏任务下形成一个微任务（具体介绍看下面）

### Promise 的状态

then其实和Promise的构造函数是类似的，返回值都是一个新的Promise实例。

它们之前的差异在于，通过构造函数生成的promise的状态，由构造函数自身决定：

```js
new Promise((resolve, reject) => {
	resolve(1) // 将当前的状态流转成resolved
})
```

而then返回的promise的状态判断需要分两步走：
1. then的回调函数能否处理上一个promise的状态，否则直接复用上一个promise的状态
2. 若满足条件1，则看当前回调函数能否正常处理

说得有点绕口，看下面的实例代码即可理解：

**理解条件1：**

```js
let p1 = new Promise((resolve, reject) => { // Promise {<rejected>: "error1"}
	reject('error1')
})

let p2 = p1.then(console.log) // Promise {<rejected>: "error1"}
```

由于`p1`的状态是`Rejected`的，而`p2`没有传入`onRejected`的回调函数，因此`p2`的状态完全复用`p1`的状态。

**理解条件2：**

```js
let p1 = new Promise((resolve, reject) => { // Promise {<fulfilled>: 1}
	resolve(1)
})

let p2 = p1.then(val => { // Promise {<rejected>: ReferenceError: x is not defined}
	console.log('p1 was resolved:', val)
	return x; // Uncaught referenceError
})

let p3 = p2.then(undefined, reason => 1) // Promise {<fulfilled>: 1}
```

`p1`的状态是`fulfilled`的，而`p2`有`onFulfilled`的回调函数，但是没有正确处理，抛异常了。因此`p2`的状态变成了`rejected`，其中的reason为则报错的原因。

而此时`p3`刚好有`onRejected`的函数，也能正确处理，最后的返回值则是自己的value，因此`p3`的状态是`fulfilled`的。

### Promise 的返回值

前文也提到，promise的返回值可以是任意合法的JavaScript值，包括了`promise`，这里重点讲下。

由于promise的返回值决定了当前promise的value，而value是其他的promise时，则说明value是未知的，依赖其他的promise的状态。

同样看看例子：

```js
let p1 = new Promise(resolve => {
	setTimeout(resolve, 1000, 1)
}) 

let p2 = new Promise(() => p1)
```

`p1`是一个简单的定时器promise，在1000ms之后，状态会变成`<fulfilled: 1>`。

而`p2`的返回值是`p1`，因此`p2`在1000ms之内也是`<pending>`，同样会在1000ms之后，变成`<fulfilled: 1>`

## Promise.prototype.catch

虽然catch不是Promise/A+标准的方法，但是也需要提一下，因为这也是常用的方法之一。

其实，catch可以理解成then的一种封装：

```js
promise.catch(function onRejected() {}) == promise.then(undefined, function onRejected() {})
```

## 微任务 microtask

当前promise的状态变更之后，不是立即执行then方法的。此时引入了 **微任务(microtask)** 的概念。

与之对应的则是 **宏任务(macrotask)**，基本的JavaScript代码则是在一个宏任务里执行的。

也可以通过其他的方式生成宏任务：`setTimeout`、`setInterval`；而微任务则可以通过`promise.then`、`Object.observe(已废弃)`、`MutationObserver`生成。

宏任务和微任务的关系则是这样的（此处引入winter老师在《重新前端》画的图）：

![](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/167014f8fe4d4befa1dc6bde5cf43ec4~tplv-k3u1fbpfcp-watermark.image)

即一个宏任务下，是可以有多个微任务的。

> 由于微任务的机制是引擎提供的，因此手写Promise的时候，可以用setTimeout来代替。

### 解析任务

分析代码的时候，可以这样分几步走：

1. 理想情况下，如果没有任何`setTimeout`和`promise.then`的话，则全部在一个宏任务里执行
2. 若出现`promise.then`，则在当前宏任务生成一个微任务，用于执行`promise.then`
3. 若出现了`setTimeout`，则添加一个宏任务，重复条件1

分析几个例子考验一下：

**例子1：**
```js
setTimeout(console.log, 0, 0)

new Promise((resolve) => {
    console.log(1)
    resolve(2)
}).then(console.log)

console.log(3)
```

<details><summary><b>正确的输出顺序：</b></summary>
<p>
1、3、2、0
</p>
</details>

**例子2：**
```js
console.log(8)

setTimeout(function() {
    console.log(0)
    Promise.resolve(4).then(console.log)
}) // 省略参数，delay默认为0

new Promise((resolve) => {
    console.log(1)
    resolve(2)
}).then(console.log)

console.log(3)

setTimeout(console.log, 0, 5)
```

<details><summary><b>正确的输出顺序：</b></summary>
<p>
8、1、3、2、0、4、5
</p>
</details>

其实，还有`async/await`相关的题目，如果阅读足够多的话，我再完善吧。

# 手写 Promise

其实，看到这里说明你已经掌握了几乎全部关键概念了。剩下的任务就是将这些逻辑翻译成代码。

我在[github](https://github.com/LeeJim/word)写了一份，代码逻辑都算挺清晰的，大家可以去看看。

我建议大家在写之前，再仔细看一下`Promise/A+`的标准规范，可以结合我的代码一起看。

清晰理解细节之后，再动手写一遍。

如果觉得不错的话，记得给我点赞 + [star](https://github.com/LeeJim/word)。

撒花，感谢阅读！