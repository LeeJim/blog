---
title: 小程序实战汇总一
date: 2018-01-07 22:54:42
tags: 小程序
desc: 小程序 授权处理
---

随着小程序的能力越来越强，逐渐得到越来越多用户的认可，因此对小程序的需要也越来越大。

那么总结一下小程序的开发实践还是蛮有意义的一件事，希望能帮助大家，可以让大家避免走弯路。

# 授权处理

在小程序中，最常见的场景就是授权处理。在小程序刚推出的时候，这个流程也还不完善，对于拒绝授权的用户将无法正常使用小程序。

因为拒绝授权的用户，几分钟内是默认拒绝的，尽管你一再地调用授权的接口。

## 解决方案

在基础库**1.2**版本，新增了`wx.getSetting`接口，可以获取到用户的当前设置，利用这个接口可以实现二次授权。

具体实现可参考一下代码：

```js
wx.getUserInfo({
  success: function (res) {
    // 成功获取用户信息，继续操作
  },
  fail: (res) => {
    wx.showModal({
      title: '用户未授权',
      content: '如需正常使用清单同步功能，请按确认并在授权管理中选中“用户信息”，是否重新授权登录？',
      success: (action) => {
        if (action.confirm) {
          
        }
      }
    })
  }
})

// 检查状态
wx.openSetting({
  success: (res) => {
    // 二次授权成功
    if (res.authSetting["scope.userInfo"]) {
      // 成功获取用户信息
    }
  },
  fail: function () {
    fail()
  }
})
```

# 页面数据传递

页面之间的数据传递是很常见的，那么在小程序中能如何传递数据呢？

## URL传递

类似Web的链接跳转，使用类似query串的形式。

```js
wx.navigateTo('../user/user?name=leejim')
```

在目的页的`onload`函数，可以这么获取：

```js
onLoad(options) {
  console.log(options.name) // leejim
}
```

## 使用客户端缓存

小程序提供了本地存储的方式：`wx.setStorage`和`wx.getStorage`。

可以在页面跳转前，先用`wx.setStorage`缓存数据，然后在目的页使用`wx.getStorage`获取数据。

## 使用全局变量

在小程序里，有一个全局函数`getApp`用来获取全局变量`app`。

比如这样：

```js
var app = getApp()
app.index = 1 // 设置变量
```

## 往栈内的页面传递数据

使用全局函数`getCurrentPages`函数可以获取栈内的所有页面。

然后就可以直接设置那个页面的数据：

```js
var pages = getCurrentPages()
pages[pages.length -1].setData({ // 往前一个页面设置数据
  data: 123
})
```

# 修改Input组件的值

因为小程序实现的是单向绑定，而且去除了原有DOM的操作，导致我们无法用常规的方式去操作input的值。

但是我们能通过data绑定的方式来实现：

```html
<input value='{{inputValue}}' />
```

js部分：

```js
this.setData({
  inputValue: ''
})
```