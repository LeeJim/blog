---
title: 手把手教你实现一个浏览器引擎（七）Paint
date: 2020-02-21 20:49:01
toc: true
from: https://limpet.net/mbrubeck/2014/11/05/toy-layout-engine-7-painting.html
tags:
categories:
- [浏览器]
- [译文]
---

## 第七部分：Painting 101

欢迎回到我的关于构建玩具HTML渲染引擎的系列文章的最后一篇：

- [第一部分：起步](https://developers.weixin.qq.com/community/develop/article/doc/00086eef5fcff8f5b3c97d08551413)
- [第二部分：HTML](https://developers.weixin.qq.com/community/develop/article/doc/000042df060558bcb3c9361ce5b013)
- [第三部分：CSS](https://developers.weixin.qq.com/community/develop/article/doc/0004ae6f0b4c80883de95cfaa59413)
- [第四部分：Style](https://developers.weixin.qq.com/community/develop/article/doc/000c0e53584310a068e9f0f7c5fc13)
- [第五部分：Boxes](https://developers.weixin.qq.com/community/develop/article/doc/00020e5163044868e4e974bf452813)
- [第六部分：Block layout](https://developers.weixin.qq.com/community/develop/article/doc/000c06035e4620edf2e9e0aa756c13)

本文我将添加非常基础的绘制代码。此代码将布局模块生成的由盒子组成的树转换成一个像素数组。这个过程也被称为”栅格化“。

![](/blog/images/browsers/paint-1.jpg)

浏览器通常借助图形API和一些例如 Skia，Cairo，Direct2D 等等的库来实现栅格化。这些APIs提供函数来绘制多边形，线条，曲线，渐变色和文本。目前为止，我打算写我自己的栅格化工具，它只能绘制一种图形：矩形。

最终我想实现文本渲染。到那时，我可能会丢弃这个玩具绘制代码，并切换到一个”真正“的2D图形库。不过目前为止，矩形是足以将我的块布局算法的输出转换成图片。

## 追赶 Catching Up

从上篇文章开始，我对以前的文章中的代码做了一些小的改变。其中包含一些小的重构，和一些更新，以保持代码和最新的Rust每晚构建版本兼容。这些改变对理解代码都不重要，不过如果你觉得困惑，可以查看下 [提交历史](https://github.com/mbrubeck/robinson/commits/master)

## 构建显示列表 Building the Display List

开始绘制之前，我们要遍历布局树构建一个[显示列表](https://en.wikipedia.org/wiki/Display_list)。这是一个例如”画一个圆圈“或”画一个文本字符串“的图形操作列表。或者在我们这个例子，就是”画一个矩形“。

为什么将这些命令放在一个显示列表而不是直接执行他们呢？显示列表之所以有用，有几个原因。你可以在其中搜索到被后续操作完全覆盖的项目，然后将他们移除来消除冗余的绘制。当你知道只有一个确定的项目被修改时，可以修改和重复使用这个显示列表。你可以使用相同的列表来生成不同类型的输出：例如，屏幕的显示，或者以矢量图的形式发送到打印机。

Robinson的显示列表是一个`DisplayCommands`的向量。目前只有一个类型的`DisplayCommands`，一个纯色的矩形。

```rust
type DisplayList = Vec<DisplayCommand>;

enum DisplayCommand {
    SolidColor(Color, Rect),
    // insert more commands here
}
```

为了构建显示列表，我们需要遍历布局树和为每个盒子生成一系列的命令。首先我们绘制盒子的背景，然后位置它的边框和背景上的内容。

```rust
fn build_display_list(layout_root: &LayoutBox) -> DisplayList {
    let mut list = Vec::new();
    render_layout_box(&mut list, layout_root);
    return list;
}

fn render_layout_box(list: &mut DisplayList, layout_box: &LayoutBox) {
    render_background(list, layout_box);
    render_borders(list, layout_box);
    // TODO: render text

    for child in &layout_box.children {
        render_layout_box(list, child);
    }
}
```

默认情况下，HTML元素依照出现它们出现顺序来叠放的：如果两个元素重叠，后面的那个将绘制在前面那个上方。这反映到我们的显示列表中，该列表将按照于它们在DOM树种出现的顺序相同的顺序绘制元素。如果这代码支持 [z-index](http://www.w3.org/TR/CSS2/visuren.html#z-index) 属性，则单个元素能够覆盖此堆叠顺序，并且我们需要相应地对显示列表进行排序。

背景比较简单。这仅仅是实心的矩形。如果没指定背景的颜色，那么背景是透明的，然后我们也就不需要生成一个显示命令了。

```rust
fn render_background(list: &mut DisplayList, layout_box: &LayoutBox) {
    get_color(layout_box, "background").map(|color|
        list.push(DisplayCommand::SolidColor(color, layout_box.dimensions.border_box())));
}

// Return the specified color for CSS property `name`, or None if no color was specified.
fn get_color(layout_box: &LayoutBox, name: &str) -> Option<Color> {
    match layout_box.box_type {
        BlockNode(style) | InlineNode(style) => match style.value(name) {
            Some(Value::ColorValue(color)) => Some(color),
            _ => None
        },
        AnonymousBlock => None
    }
}
```

边框也是类似的。不过我们绘制的不是一个矩形，而是四个——对应盒子的各个边缘。

```rust
fn render_borders(list: &mut DisplayList, layout_box: &LayoutBox) {
    let color = match get_color(layout_box, "border-color") {
        Some(color) => color,
        _ => return // bail out if no border-color is specified
    };

    let d = &layout_box.dimensions;
    let border_box = d.border_box();

    // Left border
    list.push(DisplayCommand::SolidColor(color, Rect {
        x: border_box.x,
        y: border_box.y,
        width: d.border.left,
        height: border_box.height,
    }));

    // Right border
    list.push(DisplayCommand::SolidColor(color, Rect {
        x: border_box.x + border_box.width - d.border.right,
        y: border_box.y,
        width: d.border.right,
        height: border_box.height,
    }));

    // Top border
    list.push(DisplayCommand::SolidColor(color, Rect {
        x: border_box.x,
        y: border_box.y,
        width: border_box.width,
        height: d.border.top,
    }));

    // Bottom border
    list.push(DisplayCommand::SolidColor(color, Rect {
        x: border_box.x,
        y: border_box.y + border_box.height - d.border.bottom,
        width: border_box.width,
        height: d.border.bottom,
    }));
}
```

接下来的渲染函数将绘制每个盒子的子级，直到整个布局树都被翻译成 **显示命令(display commands)**。

## 栅格化 Rasterization

现在我们完成了显示列表的构建，我们需要执行每个`DisplayCommand`并将它转换成像素。我们将像素存储到 **画布(Canvas)**。

```rust
struct Canvas {
    pixels: Vec<Color>,
    width: usize,
    height: usize,
}

impl Canvas {
    // Create a blank canvas
    fn new(width: usize, height: usize) -> Canvas {
        let white = Color { r: 255, g: 255, b: 255, a: 255 };
        return Canvas {
            pixels: repeat(white).take(width * height).collect(),
            width: width,
            height: height,
        }
    }
    // ...
}
```

在画布上绘制矩形，我们只需要借助辅助函数来遍历其行和列，以确保我们不会超出画布边界。

```rust
fn paint_item(&mut self, item: &DisplayCommand) {
    match item {
        &DisplayCommand::SolidColor(color, rect) => {
            // Clip the rectangle to the canvas boundaries.
            let x0 = rect.x.clamp(0.0, self.width as f32) as usize;
            let y0 = rect.y.clamp(0.0, self.height as f32) as usize;
            let x1 = (rect.x + rect.width).clamp(0.0, self.width as f32) as usize;
            let y1 = (rect.y + rect.height).clamp(0.0, self.height as f32) as usize;

            for y in (y0 .. y1) {
                for x in (x0 .. x1) {
                    // TODO: alpha compositing with existing pixel
                    self.pixels[x + y * self.width] = color;
                }
            }
        }
    }
}
```

现在这些代码能只绘制不透明的颜色。如果我们添加透明度（通过读取`opacity`属性，或者在CSS解析器增加支持`rgba()`值），然后它需要将每个新像素与它所绘制的内容混合。

现在我们可以将所有内容组合到`paint`函数中，来构建显示列表，然后将其格栅化成画布：

```rust
// Paint a tree of LayoutBoxes to an array of pixels.
fn paint(layout_root: &LayoutBox, bounds: Rect) -> Canvas {
    let display_list = build_display_list(layout_root);
    let mut canvas = Canvas::new(bounds.width as usize, bounds.height as usize);
    for item in display_list {
        canvas.paint_item(&item);
    }
    return canvas;
}
```

最后，我们可以写 [几行代码](https://github.com/mbrubeck/robinson/blob/8feb394e9c87663e35a4e8e5040d6e964ffc2396/src/main.rs#L60-L65)，使用 [Rust Image](https://github.com/PistonDevelopers/image/) 库将像素数组另存为PNG文件。

## 漂亮的图片 Pretty Pictures

最后，我们抵达了我们的渲染流程的尾部。在不到1000行代码里，Robinson现在可以解析这个HTML文件：

```html
<div class="a">
  <div class="b">
    <div class="c">
      <div class="d">
        <div class="e">
          <div class="f">
            <div class="g">
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

和这个CSS文件：

```css
* { display: block; padding: 12px; }
.a { background: #ff0000; }
.b { background: #ffa500; }
.c { background: #ffff00; }
.d { background: #008000; }
.e { background: #0000ff; }
.f { background: #4b0082; }
.g { background: #800080; }
```

和生成这个：

![](/blog/images/browsers/paint-2.png)