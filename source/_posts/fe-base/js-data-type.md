---
title: JavaScript 数据类型详解
date: 2020-07-27 20:04:26
tags:
toc: true
---

# 前言

JavaScript 是弱类型语言，在定义变量时不需要明确定义类型，刚接触是觉得非常灵活，很方便。

但随着开发走进深水区，更多的协作开发，越发觉得这种弱类型语言不受控，容易出错。

社区为了解决弱类型的问题，也有了如 Flow、TypeScript 等扩充。但为了解决问题而引入新的语法糖，只会是增加复杂度，将问题转移罢了。

因此对待问题的最好解决办法是正视它，剖析其背后原理。

本文将尝试将 JavaScript 的类型转换归纳总结，试图将日常开发遇到的问题与技巧尽可能地分享给大家。

<!-- more -->

# 数据类型

- 基础数据类型：undefined、null、Boolean、String、Number、Symbol
- 引用数据类型：Object


![](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2020/7/24/1737fee2f56647c6~tplv-t2oaga2asx-image.image)

> 任何没有赋值的变量都有这个值：undefined

# 类型转换

## 显示类型转换（explicit conversion）

常用的数据类型有这三种：Boolean、Number、String，可以看下显示转换：

||undefined|null|Boolean|Number|String|Symbol|Object|
|--|--|--|--|--|--|--|--|
|toBoolean|false|false|/|false: -0、+0、NaN<br>true：其他|false: ''<br>true：其他|true|true|
|toNumber|NaN|0|1：true<br>0：false|/|（下章详解）|抛出异常TypeError|调用valueOf()|
|toString|'undefined'|'null'|'true'：true<br>'false'：false|（下章详解）|/|抛出异常TypeError|调用toString()|

## 隐式类型转换（implicitly conversion）

大致有以下场景会出现隐式类型转换：
- 条件语句（`if`、`else`、）
- 循环语句（`for`、`while`）
- 逻辑运算符：`!`、`&&`、`||`、`?:`三元运算符
- 算术运算符：`+`
- 比较运算符：`==`、`<`、`>`

其中，条件语句和循环语句都是将类型转换成 Boolean，因此可以参考上表。其他的类型，会有特殊的类型转换规则：

||Number|String|Boolean|Object|undefined|null|Symbol|
|--|--|--|--|--|--|--|--|
Number|===||||||
String|string.toNumber()|===|||||
Boolean|boolean.toNumber()|boolean.toNumber()|===||||
Object|Object.toPrimitive()|Object.toPrimitive()|false|===|||
undefined|false|false|false|false|true||
null|false|false|false|false|true|true|
Symbol|false|false|false|Object.toPrimitive()|false|false|===|

## 字符串转数字

具体转换算法有些复杂，以下拿具体的方式举例。

JavaScript 提供了好几种方式：
- `parseInt()`
- `parseFloat()`
- `Number()`
- `Math.ceil()`
- `Math.floor()`
- 运算符：`+`或`*`

以下举例对比之前的差别，如整数字符串(int string)：

```js
let intStr = '1'

parseInt(intStr) // 1
parseFloat(intStr) // 1
Number(intStr) // 1
Math.ceil(intStr) // 1
Math.floor(intStr) // 1
+ intStr // 1
intStr * 1 // 1
```

浮点型数字字符串(float string)：

```js
let fltStr = '1.23'

parseInt(fltStr) // 1
parseFloat(fltStr) // 1.23
Number(fltStr) // 1.23
Math.ceil(fltStr) // 2
Math.floor(fltStr) // 1
+ fltStr // 1.23
fltStr * 1 // 1.23
```

非数字字符串(NaN string)

```js
let str = 'abcdefg'

parseInt(str) // NaN
parseFloat(str) // NaN
Number(str) // NaN
Math.ceil(str) // NaN
Math.floor(str) // NaN
+ str // NaN
str * 1 // NaN
```

数字+字母 字符串(number and alpha string):

```js
let str = '1.23abcdefg'

parseInt(str) // 1
parseFloat(str) // 1.23
Number(str) // NaN
Math.ceil(str) // NaN
Math.floor(str) // NaN
+ str // NaN
str * 1 // NaN
```

字母+数字 字符串(alpha and number string)

```js
let str = 'abcd1.23'

parseInt(str) // NaN
parseFloat(str) // NaN
Number(str) // NaN
Math.ceil(str) // NaN
Math.floor(str) // NaN
+ str // NaN
str * 1 // NaN
```

除了结果直接的差异之外，性能也有些差异，在[《how-to-convert-string-to-number-javascript》](https://flaviocopes.com/how-to-convert-string-to-number-javascript/)文章有相关的性能对比，有兴趣的可以看一下。这里我直接贴个结果图：


![](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2020/7/27/1738f4e0446f03b9~tplv-t2oaga2asx-image.image)

## 数字转字符串

相对比较复杂，可以参考 ecma262 的[文档](https://tc39.es/ecma262/#sec-numeric-types-number-tostring)


![](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2020/7/24/1737fe0f5d595809~tplv-t2oaga2asx-image.image)

。。。持续更新

# 参考

- [深入理解JS的类型、值、类型转换](https://github.com/amandakelake/blog/issues/34)
- [JavaScript Convert String to Number](https://stackabuse.com/javascript-convert-string-to-number/)
- [Converting strings to numbers with vanilla JavaScript](https://gomakethings.com/converting-strings-to-numbers-with-vanilla-javascript/)
- [How to convert a string to a number in JavaScript](https://flaviocopes.com/how-to-convert-string-to-number-javascript/)