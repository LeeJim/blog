---
title: 关于小程序组件透传函数的实践
date: 2022-01-06 20:21:28
tags: 
- 小程序
- 自定义组件
toc: true
categories:
- 小程序
---

> 开发小程序组件库 TDesign 有感

微信小程序，从基础库 `2.0.9` 开始，自定义组件的 `type: Object` 属性（properties）支持函数类型的值了，但仍不支持函数类型的属性，即：

<!-- more -->

```js
// dialog.js
Component({
  properties: {
    confirmBtn: {
      type: Object, // ok
    },
    cancelBtn: {
      type: Function // wrong
    }
  },

  observer: {
    confirmBtn(obj) {
      console.log(obj.bindgetuserinfo) // function
    }
  }
})
```

这种能力，在实现 Dialog 组件的时候，非常有用。这样在 Dialog 组件的 `cancel` 和 `confirm` 按钮可以方便地支持 Button 的各种开放能力。

于是，就会想当然地这样实现：

```html
<view class="t-dialog">
  <!-- ... -->
  <button
    class="cancel-btn" 
    size="{{cancelBtn.size}}"
    type="{{cancelBtn.type}}"
    plain="{{cancelBtn.plain}}"
    disabled="{{cancelBtn.disabled}}"
    open-type="{{cancelBtn.openType}}" 
    bindgetuserinfo="{{cancelBtn.bindgetuserinfo}}"
  >
    取消
  </button>

  <button
    class="confirm-btn" 
    size="{{confirmBtn.size}}"
    type="{{confirmBtn.type}}"
    plain="{{confirmBtn.plain}}"
    disabled="{{confirmBtn.disabled}}"
    open-type="{{confirmBtn.openType}}" 
    bindgetuserinfo="{{confirmBtn.bindgetuserinfo}}"
  >
    确认
  </button>
</view>
```

这样就会出现几个问题：
- 属性透传写法太冗余
- 事件不会触发
- 按钮内容没法传入

## 属性透传

Dialog 组件存在两个按钮，所以两个按钮都需要透传 button 属性，直观的想法就是采用 template 来处理:

```html
<!-- button.wxml -->
<template name="button">
  <button
      class="{{class}}" 
      size="{{size}}"
      type="{{type}}"
      plain="{{plain}}"
      disabled="{{disabled}}"
      open-type="{{openType}}" 
      bindgetuserinfo="{{bindgetuserinfo}}"
    >
    确认
  </button>
</template>
```

于是 Dialog 的代码就可以省略成这样：

```html
<import src="./button.wxml" /> 

<view class="t-dialog">
  <!-- ... -->
  <template is="button" data={{...cancelBtn, class: 'cancel-btn'}}>
  <template is="button" data={{...confirmBtn, class: 'confirm-btn'}}>
</view>
```

这里确实挺奇怪的，可以直接传入了一个解构后的值。

> 这里可以直接合并对象

## 事件不会触发

一开始以为是 template 的值传递过程，不支持 function 类型的值，因此丢失了。

比如在 template 里面使用 wxs 打印类型，居然是空的。

后来经过各种测试，最后在官网文档找到答案：[小程序框架/事件系统](https://developers.weixin.qq.com/miniprogram/dev/framework/view/wxml/event.html)

在小程序的事件绑定，只需要传入的是字符串: 

```html
<view bindtap="handletap">Tap me!</view>
```

也可以是一个数据绑定:

```html
<view bindtap="{{ handlerName }}">Tap me!</view>
```

但，这个数据的返回值类型应该是 string 而不是 function。

通过这点，恍然大悟，想起了小程序的双线程模型：

![](https://res.wx.qq.com/wxdoc/dist/assets/img/4-1.ad156d1c.png)

为了减轻线程之间的传输负担，是不需要将 function 传到渲染层的，只需要给一个函数名，然后在逻辑层执行对应的函数即可。

因此没有办法在 wxml 里面执行对象属性的函数，需要找一个代理函数（Proxy function）处理。

为了区分对应的按钮，因此 template 做了小改动，增加了一个 `data-token` 的属性：

```html
<template name="button">
  <button data-token="{{token}}" bindtap="onTplButtonTap">
</template>
```

对应的 Dialog 的 wxml 的改动是这样的：

```html
<import src="button.wxml" /> 

<view class="t-dialog">
  <!-- ... -->
  <template is="button" data={{...cancelBtn, token: 'cancel', class: 'cancel-btn'}}>
  <template is="button" data={{...confirmBtn, token: 'confirm', class: 'confirm-btn'}}>
</view>
```

对应的 JS 是这样的：

```js
Component({
  methods: {
    onTplButtonTap(e) {
      const { token } = e.target.dataset // cancel or confirm
      const evtType = e.type // 对应的事件名，如 getuserinfo/getphonenumber 等
      const evtName = `bind${evtType}`
      const targetBtn = this.data[`${type}Btn`]

      if (typeof targetBtn[evtName] == 'function') {
        targetBtn[evtName](e.detail)
      }
    }
  }
})
```

这样就能完美透传并触发各种 button 事件了。

## 按钮内容传入

其事这个倒是个小问题，因为 TDesign 组件在规划的时候，就已经充分地考虑了多框架之间的差异。为了弥补框架之间的差异，都可以通过 content 的属性来传入插槽的内容，起初我还不理解，直到遇到了这个问题。

以前总觉得，可以通过 slot 的方式传入，又支持一个 content 有点多此一举。直到我遇到了需要透传 button 属性的 dialog 组件。

# 总结

小程序的黑盒子运行时，在遇到问题的时候真的很容易陷入盲调的困境，此时应该去看看官方文档的资料，或者网上搜一下是否其他人也遇到类似的问题，这样才可能破局。

毕竟只有他们才知道代码是怎么跑的。