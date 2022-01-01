---
title: 模块化 CommonJS VS ES6 Module
date: 2016-11-4 17:46:21
tags:
- ES6
- 模块化
desc:
---

以下ES5方式代表的是Node.js采用的CMD，ES6方式代表的是ES6提供的模块化定义

<!-- more -->

#### ES5方式输出模块

- ES5方式输出模块，ES5方式输入

```js
// 输出out.js
var a = 1;

function add(){
 a++;
}

module.exports = {a, add} //ES5输出
```

```js
var out = require('./out.js'); //ES5输入

console.log('before:', out.a); // before:1
out.add();
console.log('after:', out.a); // after:1
```

- ES5方式输出模块，ES6方式输入

```js
// 输出out.js
var a = 1;

function add(){
 a++;
}

module.exports = {a, add} //ES5输出
```

```js
import {a, add} from './out.js'; //ES6输入

console.log('before:', a); // before:1
add();
console.log('after:', a); // after:1
```

#### ES6方式输出模块

- ES6方式输出模块，ES5方式输入

```js
// 输出out.js
var a = 1;

function add(){
 a++;
}

export {a, add} // ES6输出
```

```js
var out = require('./out.js'); //ES5输入

console.log('before:', out.a); // before:1
out.add();
console.log('after:', out.a); // after:2
```

- ES6方式输出模块，ES6方式输入

```js
// 输出out.js
var a = 1;

function add(){
 a++;
}

export {a, add} // ES6输出
```

```js
import {a, add} from './out.js'; //ES6输入

console.log('before:', a); // before:1
add();
console.log('after:', a); // after:2
```

#### 总结

上面的例子可以看出：

- ES5方式输出的a值都是不受原有的模块的代码影响的，永远都是1
- ES6方式输出的b值则是随着原有模块的代码影响，执行add()函数之后，变成了2

因此可以得出结论：ES5输出的a值是模块里a的拷贝；而ES6输出的a值就是模块里a的引用