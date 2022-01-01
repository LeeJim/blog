---
title: 探索CSS盒模型
date: 2017-08-16 00:17:32
tags: 
- CSS
- 盒模型
desc: css model，css盒模型，margin，padding，widht，height
---

从w3cschool入门前端开发，到实际开发遇到问题逐个网上搜索解决。

现在开发基本遇到的基本样式(`CSS`)问题都能解决，但是发现知识是零散的，不成体系，一遇到没遇过的问题，不能很好地思考只能依靠google，这就是知识体系的不完善导致的。因此我现在从《CSS权威指南》开始逐渐构建自己的CSS知识体系，并总结一下心得。

<!-- more -->

# 块级元素

毫无疑问的，每个元素的HTML里渲染都是基于盒模型的，因此理解这个很重要。抛出一个MDN制作的盒模型的图：

![](http://7xnh42.com1.z0.glb.clouddn.com/box-model-standard-small.png)

## 水平格式化

水平方向的大小也是有些复杂，主要一个原因是`width`影响的是内容(`content`)区域的宽度，而不是整个可见的元素框。

大多数开发者以为，`widht`指的就是可见元素框的宽度，其实不是这样的(不过`CSS3`的`box-sizing`可以修改盒模型，这里暂不讨论)。


> **可见元素框的宽 = `margin-left` + `border-left` + `padding-left` + `width` + `padding-right` + `border-right` + `margin-right`**

知道这个知识点很重要，后面的内容都是以这个为基础进行延伸的。

> 以上7个属性中，只有`margin-left`、`margin-right`和`width`这三个属性可以设置为auto，其他必须设置特定的值或0

### 使用auto

首先，大家都知道的一点是，块级元素的大小是横向填充的，即自己的宽度等于父元素的`width`。

#### 设置一个auto

假定父元素`width: 400px`

```css
p {
    magrin-left: auto; /* 等于200px */
    margin-right: 100px;
    width: 100px;
}
```

此时`margin-left`就是弥补剩余的宽度即400-100-100=200

#### 不设置auto

如果三个属性都设置指定的值，那么不就有这样的可能：本元素框的可见宽度不等于父元素的`width`:

```css
p {
  magrin-left: 100px;
  margin-right: 100px; /* 等于200px */
  width: 100px;  
}
```

其实情况不是这样的，因为在CSS中，这些格式化属性过分受限(`overconstrained`)，因此此时的`margin-right`会被强制设置成`auto`，即`margin-right=200px`而不是我们想当然的那样等于`100px`。

(ps:在英语这种从左向右读的语言是强制设置`marin-right`，而在从右向左的语言则是强制设置`margin-left`为`auto`了)

#### 设置两个auto

首先先考虑常用的，设置两个`margin`为`auto`，此时就可以实现水平居中的效果。

如果设置其中一个`margin`和`width`为`auto`的话，`margin`的值则会减为0，而`widht`会水平延伸直至充满父元素。

#### 设置三个auto

即`margin-left`、`margin-right`和`widht`都为`auto`。此时和上面那个例子比较类似，就是`margin`都减为0，`width`则填满父元素。

### 负的margin值

前面的情况都还算简单明了，但是遇到这个负的margin值，情况就渐渐复杂起来了。看下下面这个例子：

```css
.parent {
    widht: 400px;
    border: 2px solid black;
}

.child {
    margin-left: 10px;
    width: auto;
    margin-right: -50px;
}
```

这个时候child这个子元素的`widht`是多少呢？

根据前面提到的算法可以得到：**10px + 0 + 0 + width + -50px = 400px**，此时可以得到`width=440px`

另外需要注意的是：`padding`、`border`和`width`都不能设置为负值。

## 垂直格式化

垂直方向和水平的大部分都比较类似，比如：

> 可见元素的高 = margin-top + border-top + padding-top + height + padding-bottom + border-bottom + margin-bottom

如果此时子元素的`height`大于父元素的`height`时，具体效果就要取决于`overflow`属性的值了，这里暂不讨论。

有一点不一样的是：`margin-top`和`margin-bottom`设置为`auto`的话，都会自动计算为0，因此垂直居中的效果不能这么轻易实现。

### 设置margin-top、margin-bottom

经常会有这么一个情况：子元素设置了`margin-top`或者`margin-bottom`，但是父元素不会撑开这部分的`margin`高度，这部分出现在父元素以外:

```html
<div class="parent" style="background-color: silver">
    <p class="child" style="margin-top: 100px; margin-bottom: 100px">test</p>
</div>
```

此时效果是这样的：

![](http://7xnh42.com1.z0.glb.clouddn.com/1502812757152.jpg)

因为块级元素只有块级子元素的话，其高度是子元素的`border-top` + `padding-top` + `height` + `padding-bottom` + `border-bottom`的总和。

但是如果该块级元素有padding或者border的话，则其高度等于子元素的`margin-top` + `border-top` + `padding-top` + `height` + `padding-bottom` + `border-bottom` + `margin-bottom`总和。比如：

```html
<div class="parent" style="background-color: silver; border: 1px solid black">
    <p class="child" style="margin-top: 100px; margin-bottom: 100px">test</p>
</div>
```

#### 合并margin-top和margin-bottom

众所周知的是，如果有上下两个元素，上元素的`margin-bottom`和下元素的`margin-top`是会合并的，大小等于这两个的最大值。

这时又有一个例外，就是如果元素含有`padding`或者`border`的话，则不会合并。