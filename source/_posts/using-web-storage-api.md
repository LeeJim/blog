---
title: 使用Web Storage API
date: 2017-08-07 23:20:31
tags:
- JavaScript
- Storage
desc: localStorage的使用与分析
toc: true
categories:
- [前端, 基础]
- 浏览器
---

其实这是很简单的一个API。但这个API也存在不少问题可以深究一下。

<!-- more -->

> 说到这个API，我就想起曾经一次面试：当时面试我的CTO拿出自己的iPhone6，打开一个网址，说这个页面在其他所有的手机都没问题，偏偏就是我的手机无法访问。我一瞧，果然一片空白，然后我敏锐地发现他的浏览器开启了隐私模式，我马上就猜到这是隐私模式下设置Storage的问题。和CTO扯了一些关于Storage API的知识后，关掉隐私模式果然没问题。

### MDN

要探究Web API，首先就想到[MDN](https://developer.mozilla.org/en-US/)。因为平常习惯了中文阅读，所以也自然而然地打开中文语言。然而我脑袋一转，觉得这么简单的API阅读英文应该也是比较简单的吧，而且还可以顺便对比一下中英文版本练练自己的翻译。然而这个偶然的动作让我发现了英语阅读是多么地重要！

#### 中英文版本的差异

中文版本漏翻译了许多部分（有些还是很重要的），我觉得这估计是选择性翻译导致的问题。

比如：

- 我们可以像访问对象一样来访问Storage
```js
localStorage.colorSetting = '#a4509b';
localStorage['colorSetting'] = '#a4509b';
localStorage.setItem('colorSetting', '#a4509b');
```
但是，不推荐这样使用，因为会有可能读取到Storage原型链上的属性，还有一些可能会遇到的“陷阱”，有一篇相关的阅读可以看一下[《The pitfalls of using objects as maps in JavaScript》](http://2ality.com/2012/01/objects-as-maps.html)。译者忽略这段内容，估计是觉得既然不推荐这样使用，就干脆不告诉你了。虽然这部分内容对使用这个API没什么帮助，但是它关联到了一些重要的其他JavaScript知识。

- 可用性检测。这个是很重要的一点，和我前面提到的那个故事有着密切的联系。因为在使用storage API的时候，我们需要检测一下当前环境这个API是否可用，如果不可用还继续使用的话，用户代理（一般就指浏览器）会抛出异常。如果是SPA(single page application)的话就会出现我前面那个故事一样的结果——白屏。而且MDN还提供了一个可用性检测的函数，不过这里我要推荐的是另一个写法：
```js
function storageAvailable() {
    try {
        const mod = '__storage__test__'
        localStorage.setItem(mod, mod);
        localStorage.removeItem(mod);
        return true;
    } catch(e) {
        return false;
    }
}
```
附上一个[Storage可用性检测函数的简要历史](https://gist.github.com/paulirish/5558557)

### 基本概念

Web Storage提供了两种机制让我们实现离线存储：
- localStorage
- sessionStorage

其中，sessionStorage会存储数据，直到浏览器关闭才销毁数据。而localStorage则是持久式存储。

另外需要注意的是，两种机制都是在**每个独立域名**下**分开独立存储数据**的。也就是浏览器的同源策略(相同协议；相同域名；相同端口)

意思就是，在`a.com`下无法访问到`b.com`的storage数据，当然这是基于安全性的考虑。

### 跨域

跨域是前端开发（面试）常遇到的问题。说到这个本人就好苦恼了，因为实际开发遇到的跨域问题，受到各种（后端）限制，通常简单地使用`Access-Control-Allow-origin`解决。因此跨域的问题真心没什么总结和心得，只能强行看人家的心得，来再次吸收与总结了。

由于同源策略的限制，相同主域名，不同子域名的页面的storage都不能互相访问，因此要实现跨域访问的话，就必须采用其他的办法，比如HTML5提出的`postMessage`方法：

首先设置一个控制中心hub，负责写入／读取／删除 storage。其他要相互交互的域名就都通过iframe引入这个hub，通过postMessage和hub交互，达到读写storage的目的。参考[annn.me](http://annn.me/cross-domain-local-storage/)的流程图如下：

![](http://ww1.sinaimg.cn/large/6a47a305ly1fibkidw034j20si09x3z4.jpg)

github上已有一个比较完备的类库可以参考：[cross-storage](https://github.com/zendesk/cross-storage)