---
title: JavaScript 的数据类型转换
date: 2021-02-03 20:09:07
tags:
toc: true
categories:
- 前端基础
---

# 前言

JavaScript 是弱类型语言，在定义变量时不需要明确定义类型，刚接触是觉得非常灵活，很方便。

但随着开发走进深水区，更多的协作开发，越发觉得这种弱类型语言不受控，容易出错。

社区为了解决弱类型的问题，也有了如 Flow、TypeScript 等扩充。从团队的收益出发，增加这些是一个好的选择，但是也增加了许多学习成本。思考本质的话，这其实是为了解决问题而引入新的语法糖，增加了项目的复杂度，将问题转移罢了。

因此对于个人成长而言，对待问题的最好解决办法是正视它，剖析其背后原理。

本文将尝试将 JavaScript 的类型转换归纳总结，试图将日常开发遇到的问题与技巧尽可能地分享给大家。

原始数据类型：boolean、number、bigint、string、undefined、null、symbol（ES2016新增）

复合数据类型：Object

<!-- more -->

# 相等算法

截止 ES2015，存在 4 种数值相等算法：

- Abstract Equality Comparison(==)：也称半等
- Strict Equality Comparison(===)：也成全等；使用相同算法的还有 `Array.prototype.indexOf`、`Array.prototype.lastIndexOf`、`case` 语法
- Same-Value-Zero：`Set`、`Map`、还有 `Array.prototype.includes` 和 `String.prototype.includes`
- Same-Value：除了以上都是该算法；常见：`Object.is`

半等和全等比较常见，唯一差别就是是否进行类型转换（当类型相同时，两个算法是相等的）

半等和全等为了满足 IEEE 754 标准，做了特殊处理：NaN ! = NaN 和 -0 == +0

## 半等 Abstract Equality Comparison

半等（==）的逻辑大致可以这么理解：

1. 类型是否相等？同类型则使用全等比较，类型不同则往下
2. 两个数分别是 undefined、null？是则返回 true，否则往下
3. 类型是 boolean 或 string？通过转换成 number 再比较

    使用`Number()`转换而不是`parseInt`，可以看下面代码：

    ```jsx
    '123abc' == 123 // false
    parseInt('123abc') == 123 // true
    ```

4. 类型是 object？通过 **转换成原始数据类型(`toPrimitive`)** 再比较

    转换原始数据类型优先使用 `valueOf()` 而不是 `toString()` ，但如果未定义 `valueOf()` 则会使用 `toSting()`

    ```jsx
    var obj = {
    	valueOf: () => 1,
    	toString: () => 2
    }

    obj == 1 // true
    obj == 2 // false

    var obj2 = {
    	toString: () => 2
    }

    obj == 2 // true
    ```

5. 都不是则返回 false

> 总的原则是：尽可能都转换成Number容易比较

## 全等 Strict Equality Comparison

全等（===）的逻辑比较符合预期：

1. 类型不一致，直接返回 false
2. 如果是 undefined 或 null，则返回 true
3. 如果是 Number 的话，做了特殊处理：
    - `NaN != NaN`
    - `-0 == +0`
4. 如果是对象，查看是否是同个引用，是则返回 true，否则返回 false
5. 剩下的逻辑都是判断两值是否相等

## Same-Value 算法

之所以会提供这个算法，是因为半等和全等存在两个问题：

- 无法正确判断NaN，因为 `NaN != NaN`
- 无法区分 `+0` 和 `-0`

而支持该算法的函数有 `Object.is()` ：

```jsx
Object.is(-0, +0) // false
-0 == +0 // true
-0 === +0 // true

Object.is(NaN, NaN) // true
NaN == NaN // false
NaN === NaN // false
```

此处 NaN 的判断又可以延伸一下，ES2015 提供了 `Number.isNaN` 方法

此时，你会很奇怪，之前不是有个全局方法 `isNaN` 了吗？是的，这个方法也是很诡异的。

因为 isNaN 会对传入的参数做类型转换，如果能转换成 Number 类型，则返回 true，否则返回 false

而 Number.isNaN 修正了这个逻辑，只做纯粹的判断，避免了歧义：

```jsx
var numberStr = '123'

isNaN(numberStr) // false
Number.isNaN(numberStr) // false

var str = 'abc'

isNaN(str) // true **歧义点**
Number.isNaN(str) // false

isNaN(NaN) // true
Number.isNaN(NaN) // true
```

因此，`Number.isNaN` 的 pollfill 可以这样实现：

```jsx
Number.isNaN = function(value) {
	return typeof value == 'number' && isNaN(value);
}
```

## Same-Value-Zero 算法

很多时候，可能并不想区别开 `+0` 与 `-0`，但还需要知道是不是 `NaN`，因此推出了这个算法。

这个算法和 Same-Value 算法很类似，以为差别是目前这个算法 `+0` 等于 `-0` 。

内置该算法的函数前面有提到，下面以 `Set` 举例：

```jsx
let set = new Set()

set.add(NaN)
set.add(0 / 0) // 0 / 0 = NaN 因此不会添加

console.log(set.size) // 1

set.add(+0)
set.add(-0) // -0 == +0 因此不会添加

console.log(set.size) // 2
```

参考资料：

- [Primitive | MDN](https://developer.mozilla.org/en-US/docs/Glossary/Primitive)
- [Standard ECMA-262 5.1 Edition](https://262.ecma-international.org/5.1)
- [Equality comparisons and sameness | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness)