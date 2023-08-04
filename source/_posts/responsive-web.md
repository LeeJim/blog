---
title: 移动端适配的四种方案
date: 2020-08-11 19:44:03
tags:
categories:
- 前端基础
toc: true
---

# viewport 的作用

viewport 翻译成中文是“视窗”的意思，也就是字面上的意思，页面展示的窗口。知道这个 viewport 有哪些作用呢？我举例一下：

<!-- more -->

## 计算百分比值

当我们设置一个块级元素的宽度为百分比的时候，在HTML的规则中，最终的大小取决于它的父元素。如果元素嵌套情况如下：

```
html > body > div
```

最终要计算出 `div` 的实际大小，就要知道 `body` 的大小，而 `body` 的大小又依赖于 `html`。所以最终的问题是，如何计算 `html` 的大小。而这个 `html` 是根元素，没有父元素。此时就是 `viewport` 登场了。由它来约束 `html` 的大小。

## 用户缩放

当用户进行缩放时，对于我们的页面是如何变化的，或者用户当前是否存在缩放状态，这些都是通过 `viewport` 来获取的。

用户进行缩放时，页面的 CSS 像素是不发生变化的（如果有变化，必然触发重新渲染），变化的是视窗的大小。当用户放大页面是，视窗应该是变小，但物理像素是不会变化的，因此相同的 CSS 像素占用更多的设备像素，因此此时 dpr 会变大。

> dpr(device pixel ratio) 设备像素比 = 物理像素 / 设备独立像素

在 `JavaScript` 里，我们可以通过 `screen.width` 获取物理像素的宽度，通过 `window.innerWidth` 获取当前页面的独立设备像素，因此可以这样计算设备像素比：`screen.width / window.innerWidth`。

当然，也可以直接获得设备像素比：`window.devicePixelRatio`

在桌面端，**设备像素比(dpr)** 通常情况下都是等于 1，当不等于 1 的时候，通常是用户进行缩放了。

## 移动端适配

在移动端，会有许多各种尺寸的屏幕。如何在不同的屏幕呈现相同的效果，这就是移动端适配的工作，要想弄清楚如何兼容，就要先理解 `viewport` 的概念。

# 基础概念

## 屏幕尺寸

可通过 `screen.width/height` 获得。一般是通过 **设备像素(device pixel)** 来计算。

![screen-width](/blog/images/responsive-web/screen-width.png)

## 窗口尺寸

可通过 `window.innerWidth/innerHeight` 获得。一般是通过 CSS 像素来计算。窗口是浏览器的窗口，包含了滚动条的尺寸，不包含顶部菜单：

![window-width](/blog/images/responsive-web/window-width.png)

## 视窗尺寸

可通过 `document.documentElement.clientWidth/clientHeight` 获得。一般是通过 CSS 像素来计算。视窗与窗口差别在于不包含滚动条的尺寸：

![viewport-width](/blog/images/responsive-web/viewport-width.png)

# 移动端适配

## REM 方案

视觉稿 750px，设置根元素即（html）的大小为 75px，所有元素均这样计算，以 `230px` 举例:

```
width: 350px / 75px = 5rem
```

此时页面上的所有元素均以根元素的 `font-size` 计算，因此要做到动态支持不同尺寸的手机，只需要动态修改根元素的 `font-size` 即可。由于我们是以 `750px` 的十分之一为基准的，所以只需将当前 **视觉窗口(visual viewport)** 同样除以 10 即可：

```js
let docEl = document.documentElement
let rem = docEl.clientWidth / 10

docEl.style.fontSize = rem + 'px'
```

另外，由于 `font-size` 是继承性属性，上述代码将 `<html>` 的 `font-size` 修改了，为了不影响到默认的字体大小，可以在 `<body>` 上重置 `font-size`:

```css
body {
  font-size: inital;
}
```

## VW 方案

VW 方案是和 REM 方案的原理是一致的：以当前宽度按比例动态调整。

VW 方案的优势是 **不需要动态调整基数**。vw 单元原生支持与当前视觉窗口按比例动态变化。**缺点是会有一定的兼容性**，可以看下 vw 的兼容情况：

![vw-compatibility](/blog/images/responsive-web/vw-compatibility.png)

具体实现方案与 REM 类似，以视觉稿的宽度（一般为 750px）为基准，将 px 单位转换成 vw 单位，以 `75px` 举例：(基于 vw 的定义，全宽等于 100vw)：

```css
.banner {
  width: calc(75 / 750 * 100) vw
}
```

## transfrom 方案

该方案不需要转换单位，正常以 `px` 为单位。只需要以屏幕宽度与视觉稿的宽度的比作为基数，在根节点上进行缩变即可：

```js
let docEl = document.documentElement
let ratio = 750 / docEl.clientWidth

document.body.style.transform = `scale(${ratio})`
```

> 目前发现此方案存在兼容性问题，在 iOS 上，`fixed` 定位的元素会失去固定的效果，会随着滚动改变位置。另外在某些 Android 上，`fixed` 的元素会滑动之后消失。因此，**不建议使用此方案**

## viewport meta 方案

此方案与 transform 方案类似，通过缩变，以将页面宽度适应屏幕宽度。

不同的地方在于，需要移除现有的 `viewport meta`，在 `head` 增加一个脚本实时生成 `viewport meta`：

```html
<script>
  let meta = document.createElement('meta')
  meta.setAttribute('name', 'viewport')
  meta.setAttribute('content', `width=750, initial-scale=${screen.width/750}, user-scalable=no`)
  document.documentElement.firstElementChild.appendChild(meta)
</script>
<!-- <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1, maximum-scale=1, user-scalable=no"> -->
```

# 参考资料

- [移动端viewport标签背后的三层含义](https://zhuanlan.zhihu.com/p/21276657)
- [使用Flexible实现手淘H5页面的终端适配](https://github.com/amfe/article/issues/17)
- [MDN meta](https://developer.mozilla.org/zh-CN/docs/Mobile/Viewport_meta_tag)
- [Configuring the Viewport](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/UsingtheViewport/UsingtheViewport.html)
- [A tale of two viewports — part two](https://www.quirksmode.org/mobile/viewports2.html)
- [掘金](https://juejin.im/post/5b6503dee51d45191e0d30d2#heading-24)
- [H5移动多终端适配全解 - 从原理到方案](https://zhuanlan.zhihu.com/p/25422063)