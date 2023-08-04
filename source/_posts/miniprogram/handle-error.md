---
title: 浅谈小程序的错误处理
date: 2020-03-23 18:53:52
tags:
- 小程序
toc: true
---

> 其实，错误（异常）处理在任何编程语言里，都是不可避免的。正确处理异常，是一个程序/应用保持健壮的关键。

<!-- more -->

## 现实

从小程序的 API 文档可以看出，每个异步方法都支持传入一个 `fail` 方法，用于异常处理，例如：

```js
wx.login({
  success (res) {
    console.log(res)
  },
  fail(err) {
    // handle error
  }
})
```

会存在这样一种情况：开发人员会因为惰性直接忽略这个参数；而测试人员由于无法 mock 这些错误情况，导致测试用例没有覆盖，最终可能会因此流失用户。

还有一种情况，当这些 API 调用是在非关键流程上。若调用成功，则继续执行；若调用失败，直接忽略也不会影响。

对于第一种情况，除了在 fail 里做异常处理以外，别无他法。

本文将进一步讨论第二种情况。

## 分析

官方提供的 API，在发生异常时，均会通过回调函数 `fail` 回传错误信息。如果我们能采集这些数据，进行统计分析能有这些作用：

- 为后续技术优化提供指导方向
- 了解用户设备的兼容性，预防踩重复的坑

由于官方提供的 API，所有的异步方法都需要手动传入 `fail`，因此手动给每个方法传入 `fail` 可能是不可行的。

另外，小程序的更新频率很高，每隔一段时间就会出现许多新的API。

因此，最佳的实践即是封装全局对象 `wx`

## 实践

封装 `wx` 的方案有很多，这里就列出两种比较常规的方案：

- 较安全的方案：在全局变量 `global` 上新增方法（如：`global.wx`）
- 较激进的方案：劫持 `wx`，直接在 `wx` 上动刀

两种方案可有利弊，要看如何权衡。以下我将以第二种方案举例：

```js
// global.js

let originalWX = wx;
wx = new Proxy({}, {  // [0]
    get(target, name) {
        if (name in originalWX ) {
            let isSyncFunction = name.endsWith('Sync'); // 同步函数 [1]
            let isNotFunction = typeof originalWX[name] !== 'function'; // 非函数 [2]

            if (isSyncFunction || isNotFunction) return originalWX[name];

            return function(obj) {
                if (typeof obj === 'object') { // [3]
                    let originalFail = function() {};
                        
                    if ('fail' in obj) {
                        originalFail = obj.fail;
                    }
                    obj.fail = function() {
                        // todo 上报数据到后端 [4]
                        console.log('hijack success');
                        originalFail();
                    };
                }
                return originalWX[name](obj);
            };
        }
    }
});
```

代码注释：
- [0]： 这里使用的是ES6提供的`Proxy`代理对象；会有一定的兼容性，如果需要兼容更低版本的机型，可采用其他方案（感兴趣的人多的话，后续补上）
- [1]：前文也提到，只有异步方法才会有回调，因此同步方法直接返回原`wx`的方法
- [2]：非函数；wx对象里有非函数的值，如 [wx.env](https://developers.weixin.qq.com/miniprogram/dev/api/base/env/env.html)
- [3]：wx对象里的函数，可能传入非对象参数。如：[wx.canIUse](https://developers.weixin.qq.com/miniprogram/dev/api/base/wx.canIUse.html)
- [4]：请看下一章节

![ ](/blog/images/miniprogram/caniuse-proxy.png)


## 进阶

其实上述的代码，还不是最终版本。因为数据上报部分，还依赖后端提供接口。

按理说，日志系统也算是通用的服务。我很早前就在思考，为什么微信官方不提供呢？细心的读者可能会反驳说，微信有提供类似的功能：**wx.reportMonitor（业务数据监控上报接口）**。

其实，用过的读者应该了解，这个接口是非实时的，不能算是日志服务。

如果你有不定时翻看微信小程序开发文档的习惯的话，你总会有这样的感觉：时不时就新增了一个特性，塞在了一个不容易发现的角落。接下来要讲的新特性，就是官方提供的 [实时日志](https://developers.weixin.qq.com/miniprogram/dev/framework/realtimelog/)：

```js
var log = wx.getRealtimeLogManager ? wx.getRealtimeLogManager() : null

log && log.info.apply(log, arguments)
```

所有的日志，都可以通过 **小程序管理后台** 查看。

> 访问路径：[ 开发->运维中心->实时日志 ]

![ ](/blog/images/miniprogram/realtime-log.jpg)