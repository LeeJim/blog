---
title: 小程序复用函数的五种方式
date: 2020-03-14 18:42:32
tags:
categories:
- 小程序
toc: true
---

开发过小程序的朋友们应该都遇到这样的情况，可能很多个页面有相同的函数，例如`onShareAppMessage`，有什么最佳实践吗，应该如何处理呢？

本次开发技巧，我从以下几种解决办法剖析：
1.  将它复制粘贴到每个地方（最烂的做法）
2.  抽象成一个公共函数，每个`Page`都手动引用
3.  提取一个behavior，每个页面手动注入
4.  通过`Page`封装一个新的`newPage`，以后每个页面都通过`newPage`注册
5.  劫持Page函数，注入预设方法，页面仍可使用`Page`注册

<!-- more -->

## 复制粘贴大法

这是最直观，也是初学者最常用到的办法。也是作为工程师最不应该采取的办法。这有一个致命的问题，如果某一天，需要改动这个函数，岂不是要将所有的地方都翻出来改，所以这个办法直接否决。

## 抽象公共函数

这种方式，解决了复制粘贴大法的致命问题，不需要改动很多地方，只需要改动这个抽象出来的函数即可。但是其实，这个方式不便捷，每次新增页面都需要手动引入这个函数。

以下都通过`onShareAppMessage`方法举例。

假设在`app.js`通过`global`注册了`onShareAppMessage`方法：

```js
// app.js
global.onShareAppMessage = function() {
    return {
    	title: '我在这里发现了很多好看的壁纸',
        path: 'pages/index/index',
        imageUrl: ''
    }
}
```

那么此时每次新增的Page都需要这样引入：

```
// page.js
Page({
    ...global.onShareAppMessage,
    
    data: {}
})
```

这样的缺点也是非常明显的：
1. 创建新页面时，容易遗忘
2. 如果多个相同的函数，则需要每个独立引入，不方便

## 提取Behavior

将多个函数集成到一个对象中，每个页面只需要引入这个对象即可注入多个相同的函数。这种方式可以解决 **抽象公共函数** 提到的 **缺点2**。

大致的实现方式如下：

同样在`app.js`通过`global`注册一个`behavior`对象：

```js
// app.js
global.commonPage = {
    onShareAppMessage: function() {
        return {
            title: '我在这里发现了很多好看的壁纸',
            path: 'pages/index/index',
            imageUrl: ''
        }
    },
    onHide: function() {
        // do something
    }
}
```

在新增的页面注入：

```js
// page.js
Page({
    data: {},
    
    ...global.commonPage,
}})
```

缺点仍然是，新增页面时容易遗忘

## 封装新Page

封装新的`Page`，然后每个页面都通过这个新的`Page`注册，而不是采用原有的`Page`。

同理，在`app.js`先封装一个新的`Page`到全局变量`global`：

```js
// app.js
global.newPage = function(obj) {
    let defaultSet = {
        onShareAppMessage: function() {
            return {
                title: '我在这里发现了很多好看的壁纸',
                path: 'pages/index/index',
                imageUrl: ''
            }
        },
        onShow() {
            // do something
        }
    }
    return Page({...defaultSet, ...obj})
}
```

往后在每个页面都使用新的`newPage`注册：

```js
// page.js
global.newPage({
    data: {}
})
```

好处即是全新封装了`Page`，后续只需关注是否使用了新的`Page`即可；此外大家也很清晰知道这个是采用了新的封装，避免了覆盖原有的`Page`方法。

我倒是觉得没什么明显缺点，要是非要鸡蛋里挑骨头的话，就是要显式调用新的函数注册页面。

## 劫持Page

劫持函数其实是挺危险的做法，因为开发人员可能会在定位问题时，忽略了这个被劫持的地方。

劫持`Page`的做法，简单的说就是，覆盖`Page`这个函数，重新实现`Page`，但这个新的`Page`内部仍会调用原有的`Page`。说起来可能有点拗口，通过代码看就一目了然：

```js
// app.js
let originalPage = Page
Page = function(obj) {
    let defaultSet = {
        onShareAppMessage: function() {
            return {
                title: '我在这里发现了很多好看的壁纸',
                path: 'pages/index/index',
                imageUrl: ''
            }
        },
        onShow() {
            // do something
        }
    }
    return originalPage({ ...defaultSet, ...obj})
}
```

通过这种方式，不改变页面的注册方式，但可能会让不了解底层封装的开发者感到困惑：明明没注册的方法，怎么就自动注入了呢？

这种方式的缺点已经说了，优点也很明显，不改变任何原有的页面注册方式。

其实这个是一个挺好的思路，在一些特定的场景下，会有事半功倍的效果。