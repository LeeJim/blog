---
title: ES6 Promise
date: 2016-08-05 19:00:49
tags:
desc: 
- ES6
- Promise
---

由于`js`的异步执行特性，我们经常要使用到回调函数，然而当我们的回调函数还需要回调函数的时候，我们就逐渐步入了回调地狱的深渊。`ES6`(也叫`ES2015`)为了解决这个问题提出了`Promse`对象。

<!--more-->

### 出现Promise的原因

当我们多个接口异步请求时，后一个请求依赖前一个请求的结果时，就会像面这样写。

```javascript
$.ajax({
  //...
})
.then(function (data) {
  // 要在第一个请求成功后才可以执行下一步
  $.ajax({  
    //...
  })
  .then(function (data) {
    // ...
  });
});
```

**缺点**：

1. 回调地狱，多个操作的时候就要无限嵌套回调函数了
2. 如果前后请求没有依赖的时候，也要等待前一个接口完成才能发送请求了

### 什么是Promise？

一个`Promise`对象可以理解为一次将要执行的操作（常常被用于异步操作），使用了`Promise`对象之后可以用一种链式调用的方式来组织代码，让代码更加直观。

#### resolve和reject

```javascript
function helloWorld (ready) {
    return new Promise(function (resolve, reject) {
        if (ready) {
            resolve("Hello World!");
        } else {
            reject("Good bye!");
        }
    });
}
helloWorld(true).then(function (message) {
    alert(message);
}, function (error) {
    alert(error);
});
```
`resolve` 方法可以使`Promise`对象的状态改变为成功，同时传递一个参数用于后续成功后的操作，在这个例子当中就是 `Hello World!` 字符串。
`reject` 方法则是将`Promise`对象的状态改变为失败，同时将错误的信息传递到后续错误处理的操作。

### promise三种状态

上面提到了 `resolve` 和 `reject` 可以改变`Promise`对象的状态，那么它究竟有哪些状态呢？
`Promise`对象有三种对象
1 `Fulfilled` 可以理解为成功的状态
2 `Rejected` 可以理解为失败的状态
3 `Pending` 可以理解为`Promise`对象实例创建时候的初始状态

#### then和catch

helloWorld 的例子当中利用了 `then(onFulfilld, onRejected)` 方法来执行一个任务打印 "Hello World!"，在多个任务的情况下then 方法同样可以用一个清晰的方式完成。

```javascript
function printHello (ready) {
    return new Promise(function (resolve, reject) {
        if (ready) {
            resolve("Hello");
        } else {
            reject("Good bye!");
        }
    });
}
function printWorld () {
    alert("World");
}
function printExclamation () {
    alert("!");
}
printHello(true)
    .then(function(message){
        alert(message);
    })
    .then(printWorld)
    .then(printExclamation);
```

`catch` 方法是 `then(onFulfilled, onRejected)` 方法当中 `onRejected` 函数的一个简单的写法，也就是说可以写成`then(fn).catch(fn)`，相当于 `then(fn).then(null, fn)`。使用 `catch` 的写法比一般的写法更加清晰明确。

#### Promise.all 和 Promise.race

`Promise.all` 可以接收一个元素为 `Promise` 对象的数组作为参数，当这个数组里面所有的 `Promise` 对象都变为 `resolve` 时，该方法才会返回。

```javascript
var p1 = new Promise(function (resolve) {
    setTimeout(function () {
        resolve("Hello");
    }, 3000);
});
var p2 = new Promise(function (resolve) {
    setTimeout(function () {
        resolve("World");
    }, 1000);
});
Promise.all([p1, p2]).then(function (result) {
    console.log(result); // ["Hello", "World"]
});
```

`Promise.race` 在`promise`数组中任何一个`promise`对象变成`resolve`或者`reject`，马上执行函数

```javascript
// `delay`毫秒后执行resolve
function timerPromisefy(delay) {
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(delay);
        }, delay);
    });
}

// 任何一个promise变为resolve或reject 的话程序就停止运行
Promise.race([
    timerPromisefy(1),
    timerPromisefy(32),
    timerPromisefy(64),
    timerPromisefy(128)
]).then(function (value) {
    console.log(value);    // => 1
});
```

**特殊地方**：

```javascript
var promise = new Promise(function (resolve){
    console.log("inner promise"); // 1
    resolve(42);
});
promise.then(function(value){
    console.log(value); // 3
});
console.log("outer promise"); // 2
```

输出结果是：`inner promise -> outer promise -> 42`
