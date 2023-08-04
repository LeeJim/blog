---
title: 手把手教你实现一个浏览器引擎（二）HTML
date: 2020-01-23 20:49:01
toc: true
from: https://limpet.net/mbrubeck/2014/08/11/toy-layout-engine-2.html
tags:
categories:
- [浏览器]
- [译文]
---

这是关于构建一个玩具浏览器引擎这个系列文章的第二篇。

本文主要阐述如何将HTML源代码转化成Node节点树。解析（Parsing）是一个吸引人的主题，但是我没有足够的时间或专业知识来详细介绍它。你可以通过任何关于编译器（compilers）的好课程或书中获得有关解析（parsing）的详细介绍。或者选择你自己的编程语言，通过分析程序生成器(parser generator)的文档着手开始做项目也可以。

HTML拥有自己独特(unique)的解析算法。不像其他大部分编程语言和文件格式，HTML解析算法不拒绝非法输入。相反，它包含特定的错误处理操作指南，因此网络浏览器可以一致地显示每个网页，甚至是不符合语法规则的网页。网络浏览器不得不使这些不符合语法规则的页面正常显示：由于自web早期以来，就一直支持这些不符合要求的HTML，因此现在已有大量现有的页面正在使用这些不符合语法规则的HTML。

# 一个简单的HTML例子

我不打算尝试去实现标准的HTML解析算法。相反我写了一个基础的解析器，支持HTML语法的子集。我的解析器可以处理这样简单的页面：

```html
<html>
    <body>
        <h1>Title</h1>
        <div id="main" class="test">
            <p>Hello <em>world</em>!</p>
        </div>
    </body>
</html>
```

以下语法是允许的：

- 平衡的标签(Balanced tags)：`<p>...</p>`
- 带上引号的属性值：`id="main"`
- 文本节点：`<em>world</em>`

所有其他都是不支持的，包括以下：

- 注释（Comments）
- Doctype申明
- 转义字符（比如 $amp;) 和 CDATA sections
- 自闭合标签: <br/> 或者 <br> 没有闭合的标签
- 错误处理（如 标签不平衡 或者 不合理的嵌套标签）
- 命名空间（Namespaces） 和 其他 XHTML语法：<html:body>
- 字符编码检测

在该项目的每个阶段，我都会或多或少地编写支持后续阶段所需的最少的代码。不过如果你想学习更多有关解析理论和工具的信息，你可以尽可能地完善你自己的项目。

# 样例代码

接下来，让我们来看一下我的玩具HTML解析器。切记这只是其中一种实现方式（可能不是最好的方式）。它的结构大致基于Servo的 cssparser 库的 tokenizer 模块。它没有真正的错误处理，在大部分的情况，只会在遇到不预期的语法时才会中断。代码是基于 Rust，但我希望对使用外观看似相似的语言如Java，C++或者C#的人来说，是可以理解的。可以看到，这使用了该系列文章第一部分的DOM数据结构。

解析器保存其输入的字符串（input）和该字符串当前的位置（pos）。这个位置是下一个我们还为处理的字符的索引（index）

```rust
struct Parser {
    pos: usize, // "usize" is an unsigned integer, similar to "size_t" in C
    input: String,
}
```

我们可以使用它来实现一些简单的方法来寻找输入中的下一个字符：

```rust
impl Parser {
    // Read the current character without consuming it.
    fn next_char(&self) -> char {
        self.input[self.pos..].chars().next().unwrap()
    }

    // Do the next characters start with the given string?
    fn starts_with(&self, s: &str) -> bool {
        self.input[self.pos ..].starts_with(s)
    }

    // Return true if all input is consumed.
    fn eof(&self) -> bool {
        self.pos >= self.input.len()
    }

    // ...
}
```

Rust 的字符串是以 UTF-8 字节数组 的形式存储的。要跳转到到下一个字符，我们不能简单地前进一个字节。相反，我们使用 char_indices 来正确处理多字节字符（如果我们使用等宽字符的字符串，那我们可以仅给 pos 加一即可）

```rust
// Return the current character, and advance self.pos to the next character.
fn consume_char(&mut self) -> char {
    let mut iter = self.input[self.pos..].char_indices();
    let (_, cur_char) = iter.next().unwrap();
    let (next_pos, _) = iter.next().unwrap_or((1, ' '));
    self.pos += next_pos;
    return cur_char;
}
```

通常，我们会想要消耗一串连续的字符。consume_while 方法会一直收集字符，直到满足给定的条件，最终将他们以字符串的形式返回。这个方法的参数是一个接收字符返回布尔值的函数。

```rust
// Consume characters until `test` returns false.
fn consume_while(&mut self, test: F) -> String
        where F: Fn(char) -> bool {
    let mut result = String::new();
    while !self.eof() && test(self.next_char()) {
        result.push(self.consume_char());
    }
    return result;
}
```

我们可以使用这个来忽略一连串的空格字符。或者是消耗字母数字组成的字符串：

```rust
// Consume and discard zero or more whitespace characters.
fn consume_whitespace(&mut self) {
    self.consume_while(CharExt::is_whitespace);
}

// Parse a tag or attribute name.
fn parse_tag_name(&mut self) -> String {
    self.consume_while(|c| match c {
        'a'...'z' | 'A'...'Z' | '0'...'9' => true,
        _ => false
    })
}
```

现在我们已做好准备开始解析HTML。解析一个独立的节点，我们先看它的第一个字符，可以区分这是一个元素（element）还是文本节点（text node）。在我们HTML的简化版本，一个文本节点可以包含非 < 的任何字符。

```rust
// Parse a single node.
fn parse_node(&mut self) -> dom::Node {
    match self.next_char() {
        '<' => self.parse_element(),
        _   => self.parse_text()
    }
}

// Parse a text node.
fn parse_text(&mut self) -> dom::Node {
    dom::text(self.consume_while(|c| c != '<'))
}
```

元素（element）则会更复杂一些。它包含开始和结束标签，以及标签之间的若干个子节点：

```rust
// Parse a single element, including its open tag, contents, and closing tag.
fn parse_element(&mut self) -> dom::Node {
    // Opening tag.
    assert!(self.consume_char() == '<');
    let tag_name = self.parse_tag_name();
    let attrs = self.parse_attributes();
    assert!(self.consume_char() == '>');

    // Contents.
    let children = self.parse_nodes();

    // Closing tag.
    assert!(self.consume_char() == '<');
    assert!(self.consume_char() == '/');
    assert!(self.parse_tag_name() == tag_name);
    assert!(self.consume_char() == '>');

    return dom::elem(tag_name, attrs, children);
}
```

在我们的简化语法，解析属性则是相对的简单。直到我们到达开始标签（>）的末尾，我们反复查找名称，后跟=，然后是用引号引起来的字符串。

```rust
// Parse a single name="value" pair.
fn parse_attr(&mut self) -> (String, String) {
    let name = self.parse_tag_name();
    assert!(self.consume_char() == '=');
    let value = self.parse_attr_value();
    return (name, value);
}

// Parse a quoted value.
fn parse_attr_value(&mut self) -> String {
    let open_quote = self.consume_char();
    assert!(open_quote == '"' || open_quote == '\'');
    let value = self.consume_while(|c| c != open_quote);
    assert!(self.consume_char() == open_quote);
    return value;
}

// Parse a list of name="value" pairs, separated by whitespace.
fn parse_attributes(&mut self) -> dom::AttrMap {
    let mut attributes = HashMap::new();
    loop {
        self.consume_whitespace();
        if self.next_char() == '>' {
            break;
        }
        let (name, value) = self.parse_attr();
        attributes.insert(name, value);
    }
    return attributes;
}
```

解析子节点，我们可以递归地调用 parse_node 在循环里，直到我们遇到结束标签。这个方法返回一个 Vec，是 Rust 的自增长数组。

```rust
// Parse a sequence of sibling nodes.
fn parse_nodes(&mut self) -> Vec<dom::Node> {
    let mut nodes = Vec::new();
    loop {
        self.consume_whitespace();
        if self.eof() || self.starts_with("</") {
            break;
        }
        nodes.push(self.parse_node());
    }
    return nodes;
}
```

最好，我们将以上的所有代码整合一起，就可以将完整的HTML文档解析成DOM树了。这个函数将会未包含根节点的文档创建根节点。这类似于真正的HTML解析器所做的。

```rust
// Parse an HTML document and return the root element.
pub fn parse(source: String) -> dom::Node {
    let mut nodes = Parser { pos: 0, input: source }.parse_nodes();

    // If the document contains a root element, just return it. Otherwise, create one.
    if nodes.len() == 1 {
        nodes.swap_remove(0)
    } else {
        dom::elem("html".to_string(), HashMap::new(), nodes)
    }
}
```

以上是 robinson HTML parser 的完整代码！整个过程仅包含100多行代码（不包含空行和注释）。如果你使用好的库 或 解析器生成器，你可以使用更少的空间实现类似的玩具解析器。
