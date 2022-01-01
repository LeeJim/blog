---
title: CSS background
date: 2015-10-17 16:05:26
tags: 
- CSS
desc: CSS,background,background-size,background-clip,background-origin,background-position,background-attachment
---

WEB开发常用到`background`但是没有去深究，仔细看了之后，发现`background`里面的知识点还是挺多不懂的。

<!--more-->

### background-size

设置背景图大小[`初始值auto auto`-`非继承`-`适用所有元素`]

```
backgrount-size: (<length> | <percentage> | auto){1,2} | contain | cover
```
- `length`：直接指定背景图大小
- `percentage`：指定背景图片相对背景区的百分比
- `auto`：以背景图片的比例缩放背景图片
- `contain`：缩放背景图片以完全装入背景区，可能背景区部分空白。
- `cover`：缩放背景图片以完全覆盖背景区，可能背景图片部分看不见。

补充：
- `<length>`/`<percentage>`/`auto` 可设置两个，第一个对应宽度，第二个对应高度；如果只指定一个，高度则隐式设置成`auto`
- 逗号分隔的多个值：设置多重背景
- `contain`/`cover` 会保留图片的原来比例

### background-origin

规定了指定背景图片`background-image`属性的原点位置的背景相对区域[`初始值padding-box`-`非继承`-`适用所有元素`]


```
backgrount-origin: border-box | padding-box | content-box
```

- `border-box`: 背景图将显示在`border`上，设置`border-style:dashed`即可以看到效果
- `padding-box`: 背景图将显示到`padding`上。
- `content-box`: 背景图只显示在内容区域

如果还不明白，可以看[这个例子](https://jsfiddle.net/vk3v9sez/)

补充：

- 当使用 `background-attachment` 为`fixed`时，该属性将被忽略不起作用。

### background-clip

效果同上面的`background-origin`，差别在于指定的是背景色不是图片

[例子才此](https://jsfiddle.net/vk3v9sez/1/)，可以和上面对比一下

### background-attachment

如果指定了 `background-image` ，那么 `background-attachment` 决定背景是在视口中固定的还是随包含它的区块滚动的[`初始值scroll`-`非继承`-`适用所有元素`]


```
background-attachment: scroll | fixed | local
```

- `scroll`： 表示背景相对于元素本身固定，而不是随着它的内容滚动（对元素边框是有效的）。
- `fixed`：表示背景相对于视口固定
- `local`：表示背景相对于元素的内容固定。

解释：
- `fixed`和其他两个的差别在于：`fixed`是相对于视窗（可以理解成屏幕）固定的。
- `scroll`和`local`的差别在于：`scroll`在本元素有滚动条的情况下，背景图相对于本元素的滚动条不动，而`local`则是跟着滚动的。可以看下[根据MDN改编的例子](https://jsfiddle.net/bcLs7uxk/)

### background-position

指定背景图片的初始位置[`初始值0% 0%`-`非继承`-`适用所有元素`]

```
background-position: (top, bottom, left, right){1,2} | <percentage> | <length>

```

- `top`: 等于垂直方向的0%
- `bottom`：等于垂直方向的100%
- `left`：等于水平方向的0%
- `right`：等于水平方向的100%