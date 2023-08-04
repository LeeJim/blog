---
title: 手把手教你实现一个浏览器引擎（三）CSS
date: 2020-02-10 20:49:01
toc: true
tags:
categories:
- [浏览器]
- [译文]
---

## 第三部分：CSS

这是关于构建玩具浏览器渲染引擎的系列文章中的第三篇。想要构建你自己的吗？从开始的文章了解更多吧：

- [第一部分：起步](https://developers.weixin.qq.com/community/develop/article/doc/00086eef5fcff8f5b3c97d08551413)
- [第二部分：HTML](https://developers.weixin.qq.com/community/develop/article/doc/000042df060558bcb3c9361ce5b013)

本文介绍如何关于如何读取并解析 层叠样式表（Cascading Style Sheets，缩写为 CSS）的代码。和往常一样，我不会尝试去涵盖规范中的所有内容。取而代之的是，我会尝试实现这样一个渲染引擎：足以说明一些概念，并为渲染流程的后续阶段提供输入。

## 解剖样式

这是CSS源代码的示例：

```css
h1, h2, h3 { margin: auto; color: #cc0000; }
div.note { margin-bottom: 20px; padding: 10px; }
#answer { display: none; }
```

接下来，我将通过我的玩具渲染引擎 [Robinson](https://github.com/mbrubeck/robinson) 来详细介绍 [css module](https://github.com/mbrubeck/robinson/blob/master/src/css.rs)。代码是由 Rust 编写的，尽管这些概念可以轻松地转换成其他编程语言。先阅读前面的文章会帮助你更好理解下面的代码。

CSS样式表是一系列的规则（上面的示例，每一行包含一条规则）

```rust
struct Stylesheet {
    rules: Vec<Rule>,
}
```

一个规则包含一个或多个选择器（由逗号隔开）。后跟着一系列由大括号括起来的声明（declaration）

```rust
struct Rule {
    selectors: Vec<Selector>,
    declarations: Vec<Declaration>,
}
```

选择器可以是[简单选择器](http://www.w3.org/TR/CSS2/selector.html#selector-syntax)，也可以是通过组合器连接的选择器链。Robinson 目前只支持简单选择器。

> 令人困惑的是，在较新的 [Selectors Level3](http://www.w3.org/TR/css3-selectors/) 标准中，使用了相同的术语表示稍有不同的东西。本文将主要参考 CSS2.1。尽管内容有些过时，但这是一个有用的起点，因为这更小且更独立（与CSS3相比，CSS3分为无数的规范，这些规范和CSS2.1各自相互依赖）

在 Robinson，一个简单选择器可以包括一个标签名，一个带有 `#` 前缀的ID，任何以 `.` 为前缀的类名，或者以上的一些组合。如果标签名为空或者是 `*`，这是一个“通用选择器”，意味着将匹配所有标签。

还有很多其他类型的选择器（特别是CSS3），不过现在这就可以了。
```rust
enum Selector {
    Simple(SimpleSelector),
}

struct SimpleSelector {
    tag_name: Option<String>,
    id: Option<String>,
    class: Vec<String>,
}
```

声明（declaration）是一个键值对，由冒号隔开，以分号结尾。举个例子：`margin: auto;`就是一个声明。

```rust
struct Declaration {
    name: String,
    value: Value,
}
```

我的玩具引擎只支持CSS众多的值类型（value types）的少数。
```rust
enum Value {
    Keyword(String),
    Length(f32, Unit),
    ColorValue(Color),
    // insert more values here
}

enum Unit {
    Px,
    // insert more units here
}

struct Color {
    r: u8,
    g: u8,
    b: u8,
    a: u8,
}
```

> Rust提示：u8是一个8位的无符号整型，而 f32 则是 32位浮点型。

其他的所有语法都不支持。包括 @规则，注释，其他上面没提到的选择器，值，单位。

## 解析

CSS具有常规的语法，相比起怪异的HTML更易于正确解析。一个符合标准的CSS解析器，遇到解析错误时，会丢弃样式表中不可识别的部分，然后继续处理剩余的部分。这很有用，因为它允许样式表包含新的语法，但仍在较旧的浏览器中产生定义良好的输出。

Robinson 使用了一个简化的（完全不符合标准的）解析器，和第二部分的HTML解析器构建方式相同。我将不再粘贴所有内容，而只是粘贴一些代码片段。例如，下面是解析单个选择器的代码：

```rust
// Parse one simple selector, e.g.: `type#id.class1.class2.class3`
fn parse_simple_selector(&mut self) -> SimpleSelector {
    let mut selector = SimpleSelector { tag_name: None, id: None, class: Vec::new() };
    while !self.eof() {
        match self.next_char() {
            '#' => {
                self.consume_char();
                selector.id = Some(self.parse_identifier());
            }
            '.' => {
                self.consume_char();
                selector.class.push(self.parse_identifier());
            }
            '*' => {
                // universal selector
                self.consume_char();
            }
            c if valid_identifier_char(c) => {
                selector.tag_name = Some(self.parse_identifier());
            }
            _ => break
        }
    }
    return selector;
}
```

需要注意的时，这缺少了错误检查。一些类似 `###` 或者 `*foo*` 的错误输入都会被成功解析，然后输出奇怪的结果。一个真正的CSS解析器将会忽略这些无效的选择器。

## 明确性 Specificity

明确性是渲染引擎在样式冲突时，决定哪个覆盖哪个的一种方式。

如果一个样式表中两个规则匹配同一个元素，那么具有较高明确性（high specificity)的匹配选择器的规则可以覆盖具有较低明确性的规则的值。

选择器的明确性取决于其组成部分。ID选择器比class选择器更明确，而class选择器比tag选择器更明确。重点是，选择器越多越明确。

```rust
pub type Specificity = (usize, usize, usize);

impl Selector {
    pub fn specificity(&self) -> Specificity {
        // http://www.w3.org/TR/selectors/#specificity
        let Selector::Simple(ref simple) = *self;
        let a = simple.id.iter().count();
        let b = simple.class.len();
        let c = simple.tag_name.iter().count();
        (a, b, c)
    }
}
```

（如果我们支持链式选择器，我们可以通过将各个部分的明确性相加来计算一条链式选择器的明确性）

每个规则的选择器都存储在有序的数组（译者注：原文为vector，vector在rust表示自增长的数组）中，最具体的放前面。这对于匹配非常重要，我将在下一篇文章介绍。

```rust
// Parse a rule set: `<selectors> { <declarations> }`.
fn parse_rule(&mut self) -> Rule {
    Rule {
        selectors: self.parse_selectors(),
        declarations: self.parse_declarations()
    }
}

// Parse a comma-separated list of selectors.
fn parse_selectors(&mut self) -> Vec<Selector> {
    let mut selectors = Vec::new();
    loop {
        selectors.push(Selector::Simple(self.parse_simple_selector()));
        self.consume_whitespace();
        match self.next_char() {
            ',' => { self.consume_char(); self.consume_whitespace(); }
            '{' => break, // start of declarations
            c   => panic!("Unexpected character {} in selector list", c)
        }
    }
    // Return selectors with highest specificity first, for use in matching.
    selectors.sort_by(|a,b| b.specificity().cmp(&a.specificity()));
    return selectors;
}
```

CSS解析器的剩余部分是相当的直截了当的了。你可以在 [GitHub](https://github.com/mbrubeck/robinson/blob/master/src/css.rs) 上看到完整的代码。如果你还没有阅读 [系列文章第二部分](https://developers.weixin.qq.com/community/develop/article/doc/000042df060558bcb3c9361ce5b013)，这是一个很好的机会去尝试做一个分析程序生成器（parser generator）。我的手动（译者注：原文为hand-rolled，想表达的意思是作者的解析器是不完善的，只能手动读取文件）解析器可以完成简单文件的解析工作，但是如果你违反了其中的假设，那么将会有很多棘手的地方，且会运行失败。总有一天，我可能会用内置在 [rust-peg](https://github.com/kevinmehall/rust-peg/)的东西 或者 类似的东西替换它。

原文链接：https://limpet.net/mbrubeck/2014/08/13/toy-layout-engine-3-css.html