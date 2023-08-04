---
title: 手把手教你实现一个浏览器引擎（五）Boxes
date: 2020-02-19 20:49:01
toc: true
tags:
categories:
- [浏览器]
- [译文]
---

## 第五部分：Boxes

这是关于编写一个简单HTML渲染引擎系列文章的最后一篇（译者注：后续两篇是对这部分内容的补充）：

- [第一部分：起步](https://developers.weixin.qq.com/community/develop/article/doc/00086eef5fcff8f5b3c97d08551413)
- [第二部分：HTML](https://developers.weixin.qq.com/community/develop/article/doc/000042df060558bcb3c9361ce5b013)
- [第三部分：CSS](https://developers.weixin.qq.com/community/develop/article/doc/0004ae6f0b4c80883de95cfaa59413)
- [第四部分：Style](https://developers.weixin.qq.com/community/develop/article/doc/000c0e53584310a068e9f0f7c5fc13)

这篇文章将开始讨论 [布局(layout)](https://github.com/mbrubeck/robinson/blob/master/src/layout.rs) 模块，它将输入的样式树，转换成二维空间的一堆矩形。这是一个庞大的模块，因此我将它拆分成多篇文章。另外，我为后面部分内容写代码时，可能会改动这篇文章分享的一些代码。

布局模块的输入是来自 [第四部分](https://developers.weixin.qq.com/community/develop/article/doc/000c0e53584310a068e9f0f7c5fc13) 的样式树，输出的是其他的树——**布局树(layout tree)**。这让我们的迷你渲染流程向前迈进了一步：

![](/blog/images/browsers/boxes-1.jpg)

我将从基础的HTML/CSS布局模型开始讲起。如果你曾经学过开发网页，则可能已经对这些比较熟悉——不过它可能和开发者的视角不太一样。

## 盒模型 The Box Model

布局与 **盒子(boxes)** 有关。盒子是网页的矩形部分。它有 **宽度(width)**，**高度(height)**，和在页面上的 **位置(position)**。这个矩形被称为 **内容区域(content area)** ，因为它是盒子内容绘制的位置。内容可能是文本，图片，视频或者其他盒子。

盒子可能也有 **内边距(padding)**，**边框(borders)**，**外边距(margins)** 围绕着它的内容区域。CSS规范有一张 [例图](http://www.w3.org/TR/CSS2/box.html#box-dimensions) 展示了所有这些层是如何组合在一起的。

Robinson使用以下的结构来存储盒子的内容区域和周围区域。

> Rust笔记：`f32`是32位浮点类型。

```rust
// CSS box model. All sizes are in px.

struct Dimensions {
    // Position of the content area relative to the document origin:
    content: Rect,

    // Surrounding edges:
    padding: EdgeSizes,
    border: EdgeSizes,
    margin: EdgeSizes,
}

struct Rect {
    x: f32,
    y: f32,
    width: f32,
    height: f32,
}

struct EdgeSizes {
    left: f32,
    right: f32,
    top: f32,
    bottom: f32,
}
```

## 块和内联布局 Block and Inline Layout

CSS的`display`属性决定元素生成哪种类型的盒子。CSS定义了多种盒类型，各自有自己的布局规则。我只打算介绍其中两种：**块(block)** 和 **内联(inline)**。

我使用伪HTML来说明两者的差别：

```html
<container>
  <a></a>
  <b></b>
  <c></c>
  <d></d>
</container>
```

**块状盒子(Block boxes)** 自上而下垂直地在他们的容器内排列。

```css
a, b, c, d { display: block; }
```

![](/blog/images/browsers/boxes-2.jpg)

**内联盒子(inline boxes)** 自左向右水平地在他们的容器里排列。如果他们触碰到容器的右边缘，将会环绕着容器，并继续在下面起新的一行排列。

```css
a, b, c, d { display: inline; }
```

![](/blog/images/browsers/boxes-3.jpg)

每个盒子只能包含 **块级子元素(block children)**，或者 **内联子元素(inline children)**。当一个DOM元素包含了混合块级子元素和内联子元素时，布局引擎插入一个 **匿名盒子(anonymous boxes)** 去分隔两种类型。（这些盒子是“匿名的”，因为他们与DOM树种的节点没有关联）

在这个例子中，内联盒子 b 和 c 被一个匿名块状盒子围绕着，用粉色显示：

```css
a    { display: block; }
b, c { display: inline; }
d    { display: block; }
```

![](/blog/images/browsers/boxes-4.jpg)

注意，默认情况下内容是纵向增长的。也就是说，添加子元素到容器内，通常使其变得更高，而不是更宽。换句话说，一块或者一行的宽度是依赖它们容器的宽度，而容器的高度则依赖子元素的高度。

如果你覆盖了例如`width`和`height`属性的默认值的话，情况将变得更加复杂。如果要支持垂直书写这样的特性的话，则情况会更加复杂。

## 布局树 The Layout Tree

布局树是盒子的集合。盒子有尺寸，并且可能包含 **子盒子(child boxes)**。

```rust
struct LayoutBox<'a> {
    dimensions: Dimensions,
    box_type: BoxType<'a>,
    children: Vec<LayoutBox<'a>>,
}
```

盒子可以是一个块级节点，一个内联节点，或者是一个匿名块状盒子（如果我实现文本布局，这个将需要改变，因为换行会导致单个内联节点拆分为多个盒子。不过目前这样也是可以的）

```rust
enum BoxType<'a> {
    BlockNode(&'a StyledNode<'a>),
    InlineNode(&'a StyledNode<'a>),
    AnonymousBlock,
}
```

构建布局树，我们需要查看每个DOM节点的`display`属性。为了获得节点的`display`的值，我在`style`模块添加了一些代码。如果没有指定的值，则返回默认值`inline`。

```
enum Display {
    Inline,
    Block,
    None,
}

impl StyledNode {
    // Return the specified value of a property if it exists, otherwise `None`.
    fn value(&self, name: &str) -> Option<Value> {
        self.specified_values.get(name).map(|v| v.clone())
    }

    // The value of the `display` property (defaults to inline).
    fn display(&self) -> Display {
        match self.value("display") {
            Some(Keyword(s)) => match &*s {
                "block" => Display::Block,
                "none" => Display::None,
                _ => Display::Inline
            },
            _ => Display::Inline
        }
    }
}
```

现在我们可以遍历样式树，为每个节点构建一个`LayoutBox`，然后为改节点的子级插入盒子。如果一个节点的`display`属性设置成`none`，那么它将不会被包含在布局树里。

```rust
// Build the tree of LayoutBoxes, but don't perform any layout calculations yet.
fn build_layout_tree<'a>(style_node: &'a StyledNode<'a>) -> LayoutBox<'a> {
    // Create the root box.
    let mut root = LayoutBox::new(match style_node.display() {
        Block => BlockNode(style_node),
        Inline => InlineNode(style_node),
        DisplayNone => panic!("Root node has display: none.")
    });

    // Create the descendant boxes.
    for child in &style_node.children {
        match child.display() {
            Block => root.children.push(build_layout_tree(child)),
            Inline => root.get_inline_container().children.push(build_layout_tree(child)),
            DisplayNone => {} // Skip nodes with `display: none;`
        }
    }
    return root;
}

impl LayoutBox {
    // Constructor function
    fn new(box_type: BoxType) -> LayoutBox {
        LayoutBox {
            box_type: box_type,
            dimensions: Default::default(), // initially set all fields to 0.0
            children: Vec::new(),
        }
    }
    // ...
}
```

如果一个块级节点包含一个内联子级，创建一个匿名块级盒子去包含它。如果有多个内联子级在同一行，那么将他们都放在同一个匿名容器里。

```rust
// Where a new inline child should go.
fn get_inline_container(&mut self) -> &mut LayoutBox {
    match self.box_type {
        InlineNode(_) | AnonymousBlock => self,
        BlockNode(_) => {
            // If we've just generated an anonymous block box, keep using it.
            // Otherwise, create a new one.
            match self.children.last() {
                Some(&LayoutBox { box_type: AnonymousBlock,..}) => {}
                _ => self.children.push(LayoutBox::new(AnonymousBlock))
            }
            self.children.last_mut().unwrap()
        }
    }
}
```

以上是从标准CSS **盒子生成([box generation](http://www.w3.org/TR/CSS2/visuren.html#box-gen))** 算法刻意通过多种方式简化后的版本。例如，这版本无法处理一个内联盒子包含块级子级的情况。还有，如果一个块级节点仅有一个内联子级，这会生成一个不必要的匿名盒子。

原文链接：https://limpet.net/mbrubeck/2014/09/08/toy-layout-engine-5-boxes.html