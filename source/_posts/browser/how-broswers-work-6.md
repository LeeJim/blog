---
title: 手把手教你实现一个浏览器引擎（六）Block Layout
date: 2020-02-20 20:49:01
toc: true
from: https://limpet.net/mbrubeck/2014/09/17/toy-layout-engine-6-block.html
tags:
categories:
- [浏览器]
- [译文]
---

## 第六部分：Block layout

欢迎回到我的关于构建玩具HTML渲染引擎的系列文章：

- [第一部分：起步](https://developers.weixin.qq.com/community/develop/article/doc/00086eef5fcff8f5b3c97d08551413)
- [第二部分：HTML](https://developers.weixin.qq.com/community/develop/article/doc/000042df060558bcb3c9361ce5b013)
- [第三部分：CSS](https://developers.weixin.qq.com/community/develop/article/doc/0004ae6f0b4c80883de95cfaa59413)
- [第四部分：Style](https://developers.weixin.qq.com/community/develop/article/doc/000c0e53584310a068e9f0f7c5fc13)
- [第五部分：Boxes](https://developers.weixin.qq.com/community/develop/article/doc/00020e5163044868e4e974bf452813)

本文将继续讨论我们在第五部分开始讨论的布局模块。此时，我们将增添布局块状盒子的能力。例如标题和段落这些都是垂直堆叠的盒子。

为简单起见，此代码仅实现**正常流**([normal flow](http://www.w3.org/TR/CSS2/visuren.html#positioning-scheme))：没有**浮动**(floats)，没有**绝对定位**(absolute positioning)，也没有**固定定位**(fixed positioning)。

## 遍历布局树 Traversing the Layout Tree

代码的入口是`layout`函数，它利用`LayoutBox`来计算它的尺寸。我将这个函数拆分三种情况，然后目前只实现其中的一种：

```rust
impl LayoutBox {
    // Lay out a box and its descendants.
    fn layout(&mut self, containing_block: Dimensions) {
        match self.box_type {
            BlockNode(_) => self.layout_block(containing_block),
            InlineNode(_) => {} // TODO
            AnonymousBlock => {} // TODO
        }
    }

    // ...
}
```

**块(block)** 的布局取决于其 **包含块(containing block)** 的尺寸。对于正常流的块级盒子，这就是盒子的父级。对于根元素来说，就是浏览器窗口（或者视图）的大小了。

你应该记得上篇文章说过，**块(block)** 的宽度取决于它的父级，而它的高度则取决于子级。这意味着我们的代码需要自上而下地遍历树来计算宽度，这样才可以在知道父级的宽度之后布局子级。接着要自下而上遍历树来计算高度，这样计算完子级的高度就自然可以得到父级的高度。

```rust
fn layout_block(&mut self, containing_block: Dimensions) {
    // Child width can depend on parent width, so we need to calculate
    // this box's width before laying out its children.
    self.calculate_block_width(containing_block);

    // Determine where the box is located within its container.
    self.calculate_block_position(containing_block);

    // Recursively lay out the children of this box.
    self.layout_block_children();

    // Parent height can depend on child height, so `calculate_height`
    // must be called *after* the children are laid out.
    self.calculate_block_height();
}
```

这个函数执行了布局树的单个遍历，通过向下的路径计算宽度，向上的路径来计算高度。一个真正的布局引擎可能会执行多次树的遍历，有时自上而下，有时自下向上。

## 计算宽度 Calculating the width

块的布局函数的第一步就是计算宽度，也是最复杂的步骤。我将逐步介绍。首先，我们需要CSS的`width`属性的值和所有左右边缘的大小：

```rust
fn calculate_block_width(&mut self, containing_block: Dimensions) {
    let style = self.get_style_node();

    // `width` has initial value `auto`.
    let auto = Keyword("auto".to_string());
    let mut width = style.value("width").unwrap_or(auto.clone());

    // margin, border, and padding have initial value 0.
    let zero = Length(0.0, Px);

    let mut margin_left = style.lookup("margin-left", "margin", &zero);
    let mut margin_right = style.lookup("margin-right", "margin", &zero);

    let border_left = style.lookup("border-left-width", "border-width", &zero);
    let border_right = style.lookup("border-right-width", "border-width", &zero);

    let padding_left = style.lookup("padding-left", "padding", &zero);
    let padding_right = style.lookup("padding-right", "padding", &zero);

    // ...
}
```

这使用了一个名为`lookup`的辅助函数，该函数仅按顺序尝试一系列的值。如果第一个属性没设置，它会尝试第二个属性。如果都没有设置，它会返回所设置的默认值。这里提供了一个不完善（但是简单）的 **快捷属性(shorthand properties)** 和 **初始值(initial values)** 的实现版本。

> Rust笔记：下面的代码和JavaScript或者Ruby类似

```rust
margin_left = style["margin-left"] || style["margin"] || zero;
```

由于子级无法改变父级的宽度，因此需要确保自己的宽度适合父级的宽度。CSS规范将其表示为一组约束和求解约束的算法。以下代码实现了该算法。

首先我们将`margin`，`padding`，`border`和内容宽度加在一起。`to_px`辅助函数将长度转换成他们的数值。如果属性设置为`auto`，则返回0，因此它无法影响总数。

```rust
let total = [&margin_left, &margin_right, &border_left, &border_right,
             &padding_left, &padding_right, &width].iter().map(|v| v.to_px()).sum();
```

这就是盒子需要的最小水平空间。如果他和容器的宽度不相等，那我们需要做些调整使其相等。

如果`width`或者`margins`设置成`auto`，他们可以扩展或者收缩以适应可用的空间。根据规范，我们首先要检查盒子是否太大。如果太大，我们将所有可扩展的`margins`设置为0。

```rust
// If width is not auto and the total is wider than the container, treat auto margins as 0.
if width != auto && total > containing_block.content.width {
    if margin_left == auto {
        margin_left = Length(0.0, Px);
    }
    if margin_right == auto {
        margin_right = Length(0.0, Px);
    }
}
```

如果盒子比容器还大。它就 **溢出(overflow)** 了容器。如果他太小，他将 **下溢(underflow)**，留下额外的空间。我们将计算下溢量——容器中剩余的额外空间量。（如果数字为负数，实际上是一个溢出）

```rust
let underflow = containing_block.content.width - total;
```

现在我们依照规范的算法，通过调整可扩展的尺寸来消除任何溢出或下溢。如果没有`auto`的尺寸，我们就调整右边的`margin`（是的，这意味着溢出时`margin`可能为负值）

```rust
match (width == auto, margin_left == auto, margin_right == auto) {
    // If the values are overconstrained, calculate margin_right.
    (false, false, false) => {
        margin_right = Length(margin_right.to_px() + underflow, Px);
    }

    // If exactly one size is auto, its used value follows from the equality.
    (false, false, true) => { margin_right = Length(underflow, Px); }
    (false, true, false) => { margin_left  = Length(underflow, Px); }

    // If width is set to auto, any other auto values become 0.
    (true, _, _) => {
        if margin_left == auto { margin_left = Length(0.0, Px); }
        if margin_right == auto { margin_right = Length(0.0, Px); }

        if underflow >= 0.0 {
            // Expand width to fill the underflow.
            width = Length(underflow, Px);
        } else {
            // Width can't be negative. Adjust the right margin instead.
            width = Length(0.0, Px);
            margin_right = Length(margin_right.to_px() + underflow, Px);
        }
    }

    // If margin-left and margin-right are both auto, their used values are equal.
    (false, true, true) => {
        margin_left = Length(underflow / 2.0, Px);
        margin_right = Length(underflow / 2.0, Px);
    }
}
```

至此，约束已得到解决，并且所有`auto`的值都被转换成长度。结果就是盒子水平尺寸的 **使用值([used values](http://www.w3.org/TR/CSS2/cascade.html#used-value))**，我们将它存储在 **布局树(layout tree)**。你可以在 [layout.rs](https://github.com/mbrubeck/robinson/blob/619a03bea918a0c756655fae02a004e6b4a3974c/src/layout.rs#L132-L217) 看到最终的代码。

## 定位 Positioning

下个步骤相对比较简单。这个函数查找剩余的`margin`/`padding`/`border`样式，然后使用它们和 **包含块(containing block)** 的尺寸决定这个块在页面的位置。

```rust
fn calculate_block_position(&mut self, containing_block: Dimensions) {
    let style = self.get_style_node();
    let d = &mut self.dimensions;

    // margin, border, and padding have initial value 0.
    let zero = Length(0.0, Px);

    // If margin-top or margin-bottom is `auto`, the used value is zero.
    d.margin.top = style.lookup("margin-top", "margin", &zero).to_px();
    d.margin.bottom = style.lookup("margin-bottom", "margin", &zero).to_px();

    d.border.top = style.lookup("border-top-width", "border-width", &zero).to_px();
    d.border.bottom = style.lookup("border-bottom-width", "border-width", &zero).to_px();

    d.padding.top = style.lookup("padding-top", "padding", &zero).to_px();
    d.padding.bottom = style.lookup("padding-bottom", "padding", &zero).to_px();

    d.content.x = containing_block.content.x +
                  d.margin.left + d.border.left + d.padding.left;

    // Position the box below all the previous boxes in the container.
    d.content.y = containing_block.content.height + containing_block.content.y +
                  d.margin.top + d.border.top + d.padding.top;
}
```

仔细看最后的一条设置y位置的语句。这就是使 **块布局(block layout)** 具有独特的 **垂直堆叠(vertical stacking)** 行为的原因。为此，我们需要确保在对每个子级布局之后，更新父级的`content.height`。

## 子级 Child

这是递归排列盒子内容的代码。当遍历子级盒子时，它会跟踪总内容的高度。这被计算定位（上述）的代码用来查找下个子级的 **垂直位置(vertical position)**

```rust
fn layout_block_children(&mut self) {
    let d = &mut self.dimensions;
    for child in &mut self.children {
        child.layout(*d);
        // Track the height so each child is laid out below the previous content.
        d.content.height = d.content.height + child.dimensions.margin_box().height;
    }
}
```

每个子级占用的垂直空间总和就是它的`margin box`的高度。我们这样计算：

```rust
impl Dimensions {
    // The area covered by the content area plus its padding.
    fn padding_box(self) -> Rect {
        self.content.expanded_by(self.padding)
    }
    // The area covered by the content area plus padding and borders.
    fn border_box(self) -> Rect {
        self.padding_box().expanded_by(self.border)
    }
    // The area covered by the content area plus padding, borders, and margin.
    fn margin_box(self) -> Rect {
        self.border_box().expanded_by(self.margin)
    }
}

impl Rect {
    fn expanded_by(self, edge: EdgeSizes) -> Rect {
        Rect {
            x: self.x - edge.left,
            y: self.y - edge.top,
            width: self.width + edge.left + edge.right,
            height: self.height + edge.top + edge.bottom,
        }
    }
}
```

为了简单起见，不实现 **外边距折叠(margin collapsing)**。一个真正的布局引擎会允许一个盒子的`bottom margin`和下个盒子的`top magin`重叠，而不是将每个`margin box`完全放在前一个的下方。

## 高度属性 The 'height' Property

默认情况下，盒子的高度和它的内容高度相等。不过如果`height`属性设置了一个指定的长度，我们将改用它：

```rust
fn calculate_block_height(&mut self) {
    // If the height is set to an explicit length, use that exact length.
    // Otherwise, just keep the value set by `layout_block_children`.
    if let Some(Length(h, Px)) = self.get_style_node().value("height") {
        self.dimensions.content.height = h;
    }
}
```

到此结束了块的布局算法。现在你可以在一个有样式的HTML文档上调用`layout()`，它将吐出一群具有宽度，高度，边距等等的矩形。这很酷，对吧？