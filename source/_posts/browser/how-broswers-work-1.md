---
title: 手把手教你实现一个浏览器引擎（一）Start
date: 2020-01-22 20:49:01
toc: true
from: https://limpet.net/mbrubeck/2014/08/08/toy-layout-engine-1.html
tags:
categories:
- [浏览器]
- [译文]
---

## 第一部分：起步

我正在打造一个玩具HTML渲染引擎，与此同时，我觉得你也应该尝试一下。这是这个系列文章的第一篇：

- 第一部分：起步
- 第二部分：HTML
- 第三部分：CSS
- 第四部分：Style
- 第五部分：Boxes
- 第六部分：Block layout
- 第七部分：Painting 101

完整的系列文章将会通过描述我编写的代码，让大家学会如何制作自己的专属浏览器引擎。但是首先，让我解释一些东西。

## 我们准备做的是一个什么东西？

首先，我们先谈谈一些术语(terminology)。

**浏览器引擎(browser engine)** 是网络浏览器(web browser)的一部分，作用是“在幕后”从互联网上获取网页，并将其内容转换为你可以阅读，观看的形式。

Blink，Gecko，WebKit 和 Trident 都是浏览器引擎。

相反，浏览器自己的用户界面（UI），如：标签（tabs）、工具栏（toolbar），菜单（menu）等等，我们称之为 chrome。

Firefox 和 SeaMonkey 是两个采用不同chrome，相同Gecko 引擎的浏览器。

一个浏览器还有其他很多子组件（sub-components）：一个HTTP 客户端，一个HTML解析器（parser），一个CSS解析器（parser），一个JavaScript引擎（包含解析器parsers、解释器interpreters、编译器compilers）等等。这些组件涉及到HTML，CSS等网络格式的解析，并转换成我们在浏览器看到的内容。有时，也将它们称之为布局引擎（layout engine）或者渲染引擎（rendering engine）。

## 为什么是一个玩具引擎？

一个完整的浏览器引擎是相当的复杂的。

Blink，Gecko，WebKit这些引擎每个都是需要通过数百万行代码实现的。甚至一些如 [Servo](https://github.com/servo/servo/) 和 [WeasyPrint](http://weasyprint.org/) 这样比较新，比较简单的渲染引擎都是数万行代码的级别。对于新人来说，不是一个简单能完成的事。

说到巨型复杂软件：如果你上过编译器或操作系统的课，你可能做过或者修改过一个“玩具型”编译器或者内核。这是一个为学习而设计的简单模型；这可能是除了作者以外没人会运行的代码。不过制作一个“玩具型”的系统是一个很有用的学习方式，有助于我们的真正的编程工作。如果你从未做过真正的编译器或者内核，理解它们的工作机制也能在我们写代码的时候帮助我们更好地使用它们。

## 在家里尝试 try this at home

我希望我已经说服你去做个尝试。如果你已有一定的编程经验，且懂得一些HTML和CSS的高阶概念的话，这个系列的内容就不会难倒你。

然而，如果你刚开始编程的话，或者有些地方不懂，可以自由提问，我尝试讲得更通俗易懂些。

在开始之前，先谈一下，你可以有哪些选择：

## 编程语言

你可以使用任何语言来编写渲染引擎，真的，你可以使用你熟悉或者喜欢的任何语言。或者如果听起来很有趣，也可以以此为借口来学习一种新语言。

如果你想开始对一些主流的浏览器引擎如：Gecko 或 WebKit做贡献的话，你可能要使用C++，因为它是这些引擎的主要语言，并且使用它可以使将代码与其代码进行比较变得更加容易。

我的玩具项目：[robinson](https://github.com/mbrubeck/robinson) 是使用 [Rust](http://www.rust-lang.org/) 编写的。我是 Moziila 的 Servo team 成员，因此我非常喜欢使用Rust编程。另外，我在该项目中的目标之一，是了解Servo的更多实现。Ronbison偶尔也会用到Servo简化版的数据结构和代码。

## 关于库与捷径 On Libraries and Shortcuts

在像这样的学习练习中，你需要决定到底是 直接使用他人的代码还是自己重写实现一遍。我的建议是，如果你想真正得理解的话，你应该自己重新实现一遍，不过千万不要愧于使用第三方库或者参考别人的代码。学习如何使用特定的库本身可能是一个有价值的练习。

我编写的Robinson，不仅要为了自己，而且还要作为这些文章和练习的示例代码。为了这样和那样的理由，我希望它尽可能的小且独立。目前为止，我没使用任何第三方代码除了 Rust 的标准库（这也避免了在语言仍处于开发阶段时使用相同版本的Rust来构建多个依赖项的麻烦。）当然，这些规则也不是一成不变的。举例来说，我可能决定之后使用第三方图形库而不是自己手写低级的绘制代码。

还有一种避免写代码的捷径就是，让这些功能都不要了吧。比如 robinson 是没有任何联网的代码，它仅仅可以读取本地文件。在一个玩具项目里，你可以随心所欲地跳过任何东西。因此，读这个系列文章，你可以随时跳过你不感兴趣的部分，直接阅读你觉得有趣的部分。在你回心转意时，再去补回前面的跳过的内容。

## 第一步：The DOM

你准备好写一些代码了吗？我们从一些小方面开始着手：[DOM](http://dom.spec.whatwg.org/)的数据结构。我们一起来看看 robinson 的 [DOM Module](https://github.com/mbrubeck/robinson/blob/master/src/dom.rs)

DOM是由许多的节点（nodes）组成的树（tree），一个节点（node）有零个或者多个子节点（Child）。（另外，它还有许多其他属性或者方法，不过我们可以暂时忽略这部分）

```rust
struct Node {
    // data common to all nodes:
    children: Vec<Node>,

    // data specific to each node type:
    node_type: NodeType,
}
```

其实节点是有许多的节点类型（node types），不过目前我们将忽略其中的大多数，并当做只有两种类型的节点：元素（Element）或者文本节点（Text node）。在具有继承性的语言中，这些将是Node的子类型。在Rust里，他们可以是枚举（enum ）类型：

```rust
enum NodeType {
    Text(String),
    Element(ElementData),
}
```

一个元素包含：一个标签名（tag name）、任意个属性（attributes），可以将属性其存储为从名称到值的映射。Robinson不支持任何命名空间，因此只是将标签名（tag name）和属性名（attribute name）存成简单的字符串类型。

```rust
struct ElementData {
    tag_name: String,
    attributes: AttrMap,
}

type AttrMap = HashMap<String, String>;
```

最后是一些便于创建新节点的构造方法：
```
fn text(data: String) -> Node {
    Node { children: Vec::new(), node_type: NodeType::Text(data) }
}

fn elem(name: String, attrs: AttrMap, children: Vec<Node>) -> Node {
    Node {
        children: children,
        node_type: NodeType::Element(ElementData {
            tag_name: name,
            attributes: attrs,
        })
    }
}
```

就是这样！全面的DOM实现将包含更多数据和数十种方法，但这就是我们开始所需要的

## 练习

以下是一些建议的练习方法。你可以做一些感兴趣的练习，然后跳过所有您不感兴趣的练习。

1. 开始一个新项目，自由选择一种语言，编写代码实现包含text nodes 和 elements的DOM tree
2. 安装最新版本的Rust，然后下载和构建 Robinson，打开 `dom.rs` 然后继承 `NodeType` 追加实现其他类型，如comment nodes
3. 编写代码输出一个漂亮的树形DOM nodes

在下篇文章里，我们将会添加一个解析器（parser），把HTML源代码（source code）转换成包含DOM nodes的树

## 参考

有关浏览器引擎内部的更多详细信息，请参阅 Tali Garsiel 精彩的 [How Browsers Work ](http://www.html5rocks.com/en/tutorials/internals/howbrowserswork/)及其指向更多资源的链接。

有关参考代码，以下是“小型”开源渲染引擎的清单。其中大部分都比 robinson 大好几倍，但仍远远小于 Gecko 和 WebKit。

其中 WebWHirr 只有2000行代码，这是唯一一个我会称之为玩具的一个引擎。

- [CSSBox](https://github.com/philborlin/CSSBox) (Java)
- [Cocktail](https://github.com/silexlabs/Cocktail) (Haxe)
- [gngr](https://gngr.info/) (Java)
- [litehtml](https://github.com/tordex/litehtml) (C++)
- [LURE](https://github.com/admin36/LURE) (Lua)
- [NetSurf](http://www.netsurf-browser.org/) （C）
- [Servo](https://github.com/servo/servo/) (Rust)
- [Simple San Simon](http://hsbrowser.wordpress.com/3s-functional-web-browser/) (Haskell)
- [WeasyPrint](https://github.com/Kozea/WeasyPrint) (Python)
- [WebWhirr](https://github.com/reesmichael1/WebWhirr) (C++)

你可能会发现这些项目可以给你很多灵感或者参考。如果你知道其他类似的项目或者如果你开始自己的项目，请让我知道！