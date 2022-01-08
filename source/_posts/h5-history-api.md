---
title: HTML5 History API
date: 2016-07-05 21:16:18
tags: History API
desc: html5,history api,历史API,操作历史记录
toc: true
categories:
- [前端, 基础]
- 浏览器
---

在`DOM`中，`window`对象中有一个`history`的对象可以用来访问浏览器的历史记录，在`HTML5`中，更可以通过它来操作历史记录

<!--more-->

### 以前的API

历史记录的前进和后退（相当于点击浏览器上的前进和后退按钮）

```js
  history.forward(); //前进
  history.back(); //后退
```

移动到指定的历史记录位置（其中0为当前页，-1为上一页，1为下一页）

```js
  history.go(-1) //相当于history.back();
  history.go(1) //相当于history.forward();
```

其中，`history`有一个`length`的属性，就是历史记录的长度

```js
  var historyLength = history.length;
```

## 更强大的HTML5 Histroy API

- `history.pushState()`
- `history.replaceState()`
两个方法配合`window.onpopstate`事件使用更佳。

其中，`pushState()`方法接受三个参数
- 状态对象（state obejct）即一个可序列化的`javascript`对象，与新历史记录相关联。可以使用`history.state`读取当前历史记录相关的数据对象。
- 标题（title）目前暂时会忽略这个参数，以后可能会用上。
- 地址（URL）新的历史记录的地址。

举个例子，假设我们现在打开的是index.html

```js
  var stateObj = { country: 'China' };
  setTimeout(function(){
    history.pushState(stateObj, 'china', 'china.html');
  }, 1000);
```

页面加载完index.html，一秒之后URL就会变成china.html，然而页面并不会加载china.html，所以就算china.html这个页面不存在也没问题。此时的`history.state`就是`stateObj`的拷贝，此时我们就可以利用这个数据来进行相关的操作了。
如果此时我们点击后退，则URL变成index.html，此时`history.state=null`

说到这里，你应该会有点困惑，好像这个`API`并没什么卵用，直接用`hash`配合`window.onhashchange`就可以做到啦，类似如下

```js
  location.href = 'www.someURL.com#/china.html?country=china';
```

上面这个代码也能实现添加历史记录，并且不刷新页面，也有对应`伪URL`的相关的数据。

不过对比而言，`pushState`也有它的优势：

- 使用`hash`的方式时，如果当前`hash`的值不变（即url='www.someURL.com#foo'时，设置location.href = 'www.someURL.com#foo'），是不会创建新的历史记录的，也不会触发`onhashchange`事件的，而`history.pushState`插入相同 url 时则会创建新的历史记录。
- 绑定相关数据时，`history.state`可以说是可以绑定任意数据，而基于`hash`的方式则要把所有数据转换成相关的字符串

`replaceState()`使用方法和`pushState()`基本一致。不同的是，`replaceState()`方法会修改当前历史记录而不是创建新的历史记录

相关DEMO，敬请期待。。。