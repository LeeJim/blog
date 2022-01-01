---
title: CSS空格和换行
date: 2015-10-14 14:25:19
tags:
- CSS
desc: CSS空格和换行,word-break,overflow-wrap,word-wrap,white-space
---

在WEB开发当中，往往容易忽略文本样式的控制，关注点常常停留在元素上。最近开发涉及到文本的样式，发现对应的属性的值都挺多的，因此来总结记录一下，以后给自己做参考。

<!--more-->

### break-all

指定怎么在单词内断行。[`初始值normal`-`继承属性`-`适用全部元素`]

```
work-break: normal | break-all | keep-all;
```

`normal`: 使用默认的换行

`break-all`: 对于non-CJK(中文/日文/韩文)文本，可在任意字符间断行。

`keep-all`: CJK文本不断行，non-CJK文本的行为则和`normal`保持一致。

具体效果可以看这个[参考例子](https://jsfiddle.net/5psou6y5/)

### overflow-wrap(别名：word-wrap)

指定一个不可断句的字符串太长溢出盒子模型时，是否要断行。[`初始值normal`-`继承属性`-`适用全部元素`]

```
overflow-wrap: normal | break-word;
```

`normal`: 表示在正常的单词结束处换行。

`break-word`: 如果一行内无法容下某个单词的话，那就断开这个单词。

**补充**：

如果不明白`break-all`和`overflow-wrap`的差别的话，查看[这个例子](https://jsfiddle.net/ar6nha8e/)就可以明白了。

---

### white-space
用来描述要如何处理元素内的空格。[`初始值normal`-`继承属性`-`适用全部元素`]

```
white-space: normal | pre | nowrap | pre-wrap | pre-line;
```

`normal`: 连续的空白符会被合并，换行符(Newline characters )会被当作空白符来处理。填充line盒子时，必要的话会换行。

`nowrap`: 和 `normal` 一样，连续的空白符会被合并。但文本内的换行无效。

`pre`: 连续的空白符会被保留。在遇到换行符或者`<br>`元素时才会换行。

`pre-wrap`: 连续的空白符会被保留。在遇到换行符或者`<br>`元素，或者需要为了填充line盒子时才会换行。

`pre-line`: 连续的空白符会被合并。在遇到换行符或者`<br>`元素，或者需要为了填充line盒子时会换行。

**各种white-space的值对应的行为如下**：

||换行符|空白符和制表符|文字换行|
|--|--|--|--|
|normal|合并|合并|转行|
|nowrap|合并|合并|不转行|
|pre|保留|保留|不转行|
|pre-wrap|保留|保留|转行|
|pre-line|保留|合并|转行|

效果请看这个[MDN的例子](https://jsfiddle.net/hzywLx6u/)