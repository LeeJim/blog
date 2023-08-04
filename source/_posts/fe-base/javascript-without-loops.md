---
title: 正确使用 JavaScript 数组
date: 2017-02-21 00:08:29
tags:
- JavaScript
- Array
desc: JS数组进阶使用
toc: true
categories:
- [前端基础]
- [译文]
from: http://jrsinclair.com/articles/2017/javascript-without-loops/?utm_source=javascriptweekly&utm_medium=email
---


首先，我们可以简单地认为缩进就是代码复杂性的指标（尽管很粗略）。因为缩进越多代表我们的嵌套越多，因此代码就越复杂。今天就拿数组来做具体的例子，来展示以下如何抛弃循环，减少缩进，正确地使用JavaScript数组。

<!--more -->

> “…a loop is an imperative control structure that’s hard to reuse and difficult to plug in to other operations. In addition, it implies code that’s constantly changing or mutating in response to new iterations.”
－Luis Atencio

## 循环

我们都知道，循环结构就是会无形地提高代码的复杂性。那我们现在看看在JavaScript上的循环是如何工作的。

在JavaScript上至少有四五种循环的方式，其中最基础的就是`while`循环了。讲例子前，先设定一个函数和数组：

```js
// oodlify :: String -> String
function oodlify(s) {
    return s.replace(/[aeiou]/g, 'oodle');
}

const input = [
    'John',
    'Paul',
    'George',
    'Ringo',
];
```

那么，如果我们现在要使用`oodlify`函数操作一下数组里每个元素的话，如果我们使用`while`循环的话，是这样子的：

```js
let i = 0;
const len = input.length;
let output = [];

while (i < len) {

    let item = input[i];
    let newItem = oodlify(item);

    output.push(newItem);
    i = i + 1;
}
```

这里就有许多无谓的，但是又不得不做的工作。比如用`i`这个计数器来记住当前循环的位置，而且需要把`i`初始化成0，每次循环还要加一；比如要拿`i`和数组的长度`len`对比，这样才知道循环到什么时候停止。

这时为了让清晰一点，我们可以使用JavaScript为我们提供的`for`循环：

```js
const len = input.length;
let output = [];

for (let i = 0; i < len; i = i + 1) {

    let item = input[i];
    let newItem = oodlify(item);

    output.push(newItem);
}
```

`for`循环的好处就是把与业务代码无关的计数逻辑放在了括号里面了。

对比起`while`循环虽有一定改进，但是也会发生类似忘记给计数器`i`加一而导致死循环的情况。

现在回想一下我们的最初目的：就只是给数组的每一个元素执行一下`oodlify`函数而已。其实我们真的不想关什么计数器。

因此，`ES2015`就为我们提供了一个全新的可以让我们忽略计数器的循环结构－ `for...of`循环 ：

```js
let output = [];
for (let item of input) {
    let newItem = oodlify(item);
    output.push(newItem);
}
```

这个方式是不是简单多了！我们可以注意到，计数器和对比语句都没了。

如果我们这就满足的话，我们的目标也算完成了，代码的确是简洁了不少。

但是其实，我们可以对JavaScript的数组再深入挖掘一下，更上一层楼。

## Mapping

`for...of`循环的确比`for`循环简洁不少，但是我们仍然写了一些不必要的初始化代码，比如`output`数组，以及把每个操作过后的值push进去。

其实我们有办法写得更简单明了一点的。不过，现在我们来放大一下这个问题先：

如果我们有两个数组需要使用`oodlify`函数操作的话呢？

```js
const fellowship = [
    'frodo',
    'sam',
    'gandalf',
    'aragorn',
    'boromir',
    'legolas',
    'gimli',
];

const band = [
    'John',
    'Paul',
    'George',
    'Ringo',
];
```

很明显，我们就要这样循环两个数组：

```js
let bandoodle = [];

for (let item of band) {
    let newItem = oodlify(item);
    bandoodle.push(newItem);
}

let floodleship = [];

for (let item of fellowship) {
    let newItem = oodlify(item);
    floodleship.push(newItem);
}
```

这的确可以完成我们的目标，但是这样写得有点累赘。我们可以重构一下以减少重复的代码。因此我们可以创建一个函数：

```js
function oodlifyArray(input) {
    let output = [];

    for (let item of input) {
        let newItem = oodlify(item);
        output.push(newItem);
    }

    return output;
}

let bandoodle = oodlifyArray(band);
let floodleship = oodlifyArray(fellowship);
```

这样是不是好看多了。但是问题来了，如果我们要使用其他函数来操作这个数组的话呢？

```js
function izzlify(s) {
    return s.replace(/[aeiou]+/g, 'izzle');
}
```

这时，我们前面创建的`oodlifyArray`函数帮不了我们了。不过如果我们这时创建`izzlifyArray`函数的话，代码不就又有许多重复的部分了吗？

```js
function oodlifyArray(input) {
    let output = [];

    for (let item of input) {
        let newItem = oodlify(item);
        output.push(newItem);
    }

    return output;
}

function izzlifyArray(input) {
    let output = [];

    for (let item of input) {
        let newItem = izzlify(item);
        output.push(newItem);
    }

    return output;
}
```

这两个函数是不是及其相似呢。

如果此时我们将其抽象成一个模式的话呢：**我们希望传入一个数组和一个函数，然后映射每个数组元素，最后输出一个数组**。这个模式就称为`mapping`：

```js
function map(f, a) {
    let output = [];
    for (let item of a) {
        output.push(f(item));
    }
    return output;
}
```

其实我们并不需要自己手动写`mapping`函数，因为JavaScript提供了内置的`map`函数给我们使用，此时我们的代码是这样的：

```js
let bandoodle     = band.map(oodlify);
let floodleship   = fellowship.map(oodlify);
let bandizzle     = band.map(izzlify);
let fellowshizzle = fellowship.map(izzlify);
```

## Reducing

此时`map`是很方便了，但是并不能覆盖我们所有的循环需要。

如果此时我们需要累计数组中的所有数组呢。我们假设有一个这样的数组：

```js
const heroes = [
    {name: 'Hulk', strength: 90000},
    {name: 'Spider-Man', strength: 25000},
    {name: 'Hawk Eye', strength: 136},
    {name: 'Thor', strength: 100000},
    {name: 'Black Widow', strength: 136},
    {name: 'Vision', strength: 5000},
    {name: 'Scarlet Witch', strength: 60},
    {name: 'Mystique', strength: 120},
    {name: 'Namora', strength: 75000},
];
```

如果我们要找到`strength`最大的那个的元素的话，使用`for...of`循环是这样的：

```js
let strongest = {strength: 0};
for (hero of heroes) {
    if (hero.strength > strongest.strength) {
        strongest = hero;
    }
}
```

如果此时我们想累计一下所有的`strength`的话，循环里面就是这样的了：

```js
let combinedStrength = 0;
for (hero of heroes) {
    combinedStrength += hero.strength;
}
```

这两个例子我们都需要初始化一个变量来配合我们的操作。合并两个例子的话就是这样的：

```js
function greaterStrength(champion, contender) {
    return (contender.strength > champion.strength) ? contender : champion;
}

function addStrength(tally, hero) {
    return tally + hero.strength;
}

// 例子 1
const initialStrongest = {strength: 0};
let working = initialStrongest;
for (hero of heroes) {
    working = greaterStrength(working, hero);
}
const strongest = working;

// 例子 2
const initialCombinedStrength = 0;
working = initialCombinedStrength;
for (hero of heroes) {
    working = addStrength(working, hero);
}
const combinedStrength = working;

```

此时我们可以抽象成这样一个函数：

```js
function reduce(f, initialVal, a) {
    let working = initialVal;
    for (item of a) {
        working = f(working, item);
    }
    return working;
}
```

其实这个方法JavaScript也提供了内置函数，就是`reduce`函数。这时代码是这样的：

```js
const strongestHero = heroes.reduce(greaterStrength, {strength: 0});
const combinedStrength = heroes.reduce(addStrength, 0);
```

## Filtering

前面的`map`函数是将数组的全部元素执行同个操作之后输出一个同样大小的数组；

`reduce`则是将数组的全部值执行操作之后，最终输出一个值。

如果此时我们只是需要提取几个元素到一个数组内呢？为了更好得解释，我们来扩充一下之前的例子：

```js
const heroes = [
    {name: 'Hulk', strength: 90000, sex: 'm'},
    {name: 'Spider-Man', strength: 25000, sex: 'm'},
    {name: 'Hawk Eye', strength: 136, sex: 'm'},
    {name: 'Thor', strength: 100000, sex: 'm'},
    {name: 'Black Widow', strength: 136, sex: 'f'},
    {name: 'Vision', strength: 5000, sex: 'm'},
    {name: 'Scarlet Witch', strength: 60, sex: 'f'},
    {name: 'Mystique', strength: 120, sex: 'f'},
    {name: 'Namora', strength: 75000, sex: 'f'},
];
```

现在假设我们要做的两件事：

1. 找到`sex = f`的元素
2. 找到`strength > 500`的元素

如果使用`for...of`循环的话，是这样的：

```js
let femaleHeroes = [];

for (let hero of heroes) {
    if (hero.sex === 'f') {
        femaleHeroes.push(hero);
    }
}

let superhumans = [];

for (let hero of heroes) {
    if (hero.strength >= 500) {
        superhumans.push(hero);
    }
}
```

由于有重复的地方，那么我们就把不同的地方抽取出来：

```js
function isFemaleHero(hero) {
    return (hero.sex === 'f');
}

function isSuperhuman(hero) {
    return (hero.strength >= 500);
}


let femaleHeroes = [];

for (let hero of heroes) {
    if (isFemaleHero(hero)) {
        femaleHeroes.push(hero);
    }
}

let superhumans = [];

for (let hero of heroes) {
    if (isSuperhuman(hero)) {
        superhumans.push(hero);
    }
}
```

此时就可以抽象成JavaScript内置的`filter`函数：

```js
function filter(predicate, arr) {

    let working = [];

    for (let item of arr) {

        if (predicate(item)) {

            working = working.concat(item);

        }
    }
}

const femaleHeroes = filter(isFemaleHero, heroes);
const superhumans  = filter(isSuperhuman, heroes);
```

## Finding

`filter`搞定了，那么如果我们只要找到一个元素呢。

的确，我们同样可以使用`filter`函数完成这个目标，比如：

```js
function isBlackWidow(hero) {
    return (hero.name === 'Black Widow');
}

const blackWidow = heroes.filter(isBlackWidow)[0];
```

当然我们也同样会发现，这样的效率并不高。因为`filter`函数会过滤所有的元素，尽管在前面已经找到了应该要找到的元素。因此我们可以写一个这样的查找函数：

```js
function find(predicate, arr) {
    for (let item of arr) {
        if (predicate(item)) {
            return item;
        }
    }
}

const blackWidow = find(isBlackWidow, heroes);
```

正如大家所预期那样，JavaScript也同样提供了内置方法`find`给我们，因此我们最终的代码是这样的：

```js
const blackWidow = heroes.find(isBlackWidow);
```

## 总结

这些JavaScript内置的数组函数就是很好的例子，让我们学会了如何去抽象提取共同部分，以创造一个可以复用的函数。

现在我们可以用内置函数完成几乎所有的数组操作。分析一下，我们可以看出每个函数都有以下特点：

1. 摒弃了循环的控制结构，使代码更容易阅读。
2. 通过使用适当的方法名称描述我们正在使用的方法。
3. 减少了处理整个数组的问题，只需要关注我们的业务代码。

在每种情况下，JavaScript的内置函数都已经将问题分解为使用小的纯函数的解决方案。通过学习这几种内置函数能让我们消除几乎所有的循环结构，这是因为我们写的几乎所有循环都是在处理数组或者构建数组或者两者都有。因此使用内置函数不仅让我们在消除循环的同时，也为我们的代码增加了不少地可维护性。

本文翻译自：[JavaScript Without Loops](http://jrsinclair.com/articles/2017/javascript-without-loops/?utm_source=javascriptweekly&utm_medium=email)

