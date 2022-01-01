---
title: 我所理解的BFC
date: 2017-11-11 10:53:38
tags:
- CSS
- BFC
desc: bfc, clear float
---

# BFC

BFC (Block Formatting Context) **块级格式化上下文**，在W3C上是这么定义的：

> Floats, absolutely positioned elements, block containers (such as inline-blocks, table-cells, and table-captions) that are not block boxes, and block boxes with 'overflow' other than 'visible' (except when that value has been propagated to the viewport) establish new block formatting contexts for their contents.  
In a block formatting context, boxes are laid out one after the other, vertically, beginning at the top of a containing block. The vertical distance between two sibling boxes is determined by the 'margin' properties. Vertical margins between adjacent block-level boxes in a block formatting context collapse.  
In a block formatting context, each box's left outer edge touches the left edge of the containing block (for right-to-left formatting, right edges touch). This is true even in the presence of floats (although a box's line boxes may shrink due to the floats), unless the box establishes a new block formatting context (in which case the box itself may become narrower due to the floats).  
For information about page breaks in paged media, please consult the section on allowed page breaks.

## BFC效果

先来说说BFC有什么效果，从效果看本质。

逐个翻译W3c的定义如下：

- `boxes`按顺序，从上到下，垂直排列

> boxes are laid out one after the other, vertically, beginning at the top of a containing block

- 相邻`boxes`的垂直距离由margin决定，但是在同一个BFC容器的话，`margin`会合并

> The vertical distance between two sibling boxes is determined by the 'margin' properties. Vertical margins between adjacent block-level boxes in a block formatting context collapse.

- 每个`boxes`的左边会和BFC容器的左边重叠，`float`元素也是如此

> each box’s left outer edge touches the left edge of the containing block (for right-to-left formatting, right edges touch). This is true even in the presence of floats (although a box’s line boxes may shrink due to the floats), 

- 可以解决因`float`元素导致的高度收缩问题（也就是常说的消除浮动）

>  This is true even in the presence of floats (although a box’s line boxes may shrink due to the floats), unless the box establishes a new block formatting context (in which case the box itself may become narrower due to the floats).

## 如何触发BFC

- `float`元素和 absolutely元素 (例如`position: absolute||fixed`) 
- `display`等于`inline-blocks`, `table-cells`, and `table-captions`的块级容器元素
- `overflow`不等于`visible`的元素

## BFC作用

- 相邻margin合并的问题

- 消除浮动

## 参考：

- [CSS之BFC详解](http://www.html-js.com/article/1866)
- [W3C block-formatting](https://www.w3.org/TR/CSS2/visuren.html#block-formatting)