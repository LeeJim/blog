---
title: 开发 Button 组件有感
date: 2022-01-25 22:40:19
tags:
---

# 前言

TDesign 的 button 是之前的同事开发的，我接手过来只是做了样式的调整，因此对组件的实现没有很清楚。最近有用户反馈传了 disabled 之后仍然会触发 tap 事件。我的第一反应以为是个小问题，就是漏掉了透传 disabled 而已，但我发现问题没这么简单，于是便有了这篇小文章。

<!-- more -->

## 透传 disabled 属性

将 disabled 透传至 button 之后，就发现 user agent 的样式权重很高：

![小程序最终样式](/images/miniprogram/user-agent.png)

这其实是小程序的坑。按理说 user agent stylesheet 的优先级肯定比 user stylesheet 低才合理的:

![CSS 层叠样式优先级](/images/miniprogram/css-cascade.png)

这明显是不讲武德了，但问题还是要解决。为了样式的正确还原，有两个解决方案：

- 增加封装样式的特异性（specity）
- 不透传disabled

第一种方案，就是为了弥补小程序埋的坑而因此更多的问题，比如用户如果想要自定义主题的话，要想覆盖 TDesign 的样式就需要将 specity 提得更高，因此否定了这个方案。

第二种方案，就是不将 disabled 属性透传到原生 Button，手动实现 disabled 的效果。

## 重新实现 disabled

这种方案很直观，就是监听 tap 事件，然后在 disabled 的时候不触发 tap 事件即可：

```jsx
<button class="t-button" bind:tap="handleTap">
```

```jsx
// t-button
Component({
	handleTap() {
		if (this.data.disabled) return
		this.triggerEvent('tap')
	}
}
```

但此时需要考虑一种情况，就是有 open-type 的时候，会没法阻止。

此时直观的想法是在每个开发能力对应的事件里，对 disabled 做特殊处理，但其实也是不合理的。因为这样没法阻止 open-type 的事件发生，用户仍然会看到对应的授权弹窗。

另外一种方案，反而会合理许多，但也 hack 许多。就是在 disabled 的时候，不透传 open-type：

```jsx
<button open-type="{{ disabled ? '' : openType }}" />
```

## 事件问题

在使用 t-button 组件的时候，就发现问题了，tap 事件触发了两次：

```jsx
<t-button bind:tap="handler">
```

```jsx
Page({
	handler() {
		console.log(1) // 触发两次
	}
})
```

这个问题也是比较典型的事件模型问题：

![事件模型图](/images/miniprogram/eventflow.svg)

因此，需要通过 catch 事件来捕获 tap 事件，避免冒泡：

```jsx
<button class="t-button" capture-catch:tap="handleTap">
```

这样解决了上面的问题，但此时会导致 open-type 的事件不会触发。因此不能使用 capture-catch 而是使用 catch：

```jsx
<button class="t-button" catch:tap="handleTap">
```

## 总结

最后 button 的组件完成了，我就好奇业界其他组件库是如何实现的。

于是我去看了下 vant 和 lin-ui，这两个算是微信小程序组件库的两个明星仓库。

结果发现，这两个库都选择了不透传 disabled，自行实现disabled。但在事件问题上，三个组件库走在了不同的路上：

- vant 的 tap 事件是不受 disabled 影响的，新增了一个 disabled 时不触发的 click 事件。
- lin-ui 则是会在有 open-type 的时候，disabled 失效。
- TDesign 的 tap 的事件保持了和原生一致。