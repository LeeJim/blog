---
title: 手把手教你实现一个浏览器引擎（四）Style
date: 2020-02-12 20:49:01
toc: true
tags:
categories:
- [浏览器]
- [译文]
---

## 第四部分 Style

欢迎回到关于构建你自己的玩具浏览器引擎的系列文章。如果你是刚开始收看文章，你可以从下面找到以前的文章：

- [第一部分：起步](https://developers.weixin.qq.com/community/develop/article/doc/00086eef5fcff8f5b3c97d08551413)
- [第二部分：HTML](https://developers.weixin.qq.com/community/develop/article/doc/000042df060558bcb3c9361ce5b013)
- [第三部分：CSS](https://developers.weixin.qq.com/community/develop/article/doc/0004ae6f0b4c80883de95cfaa59413)

本文将会介绍在CSS标准中所谓的 分配属性值([assigning vproperty values](http://www.w3.org/TR/CSS2/cascade.html)) 或者 样式模块([style](https://github.com/mbrubeck/robinson/blob/275ea716d50565b10ce91c0054fbf527281180bb/src/style.rs) module)。这个模块将拿DOM节点和CSS规则作为输入，将他们互相匹配，为所给的所有节点确定每个CSS属性的值。

这部分不会包含很多代码，因为我还没有实现相对复杂的部分。然而，我觉得剩下的仍然相当有趣，我还会解释如何实现一些缺失的部分。

## 样式树 The Style Tree

我将Robinson的样式模块的输出称为 **样式树(style tree)**， 在树里的每个节点都指向一个DOM节点，加上它的CSS属性值：

```rust
// Map from CSS property names to values.
type PropertyMap = HashMap<String, Value>;

// A node with associated style data.
struct StyledNode<'a> {
    node: &'a Node, // pointer to a DOM node
    specified_values: PropertyMap,
    children: Vec<StyledNode<'a>>,
}
```

> `'a`是什么意思呢？这是都是生命周期，是Rust保证指针是内存安全的且不需要进行垃圾收集的一部分。如果你不是使用Rust工作的话，你可以忽略他们。他们对代码的意义影响不是很大。

其实，我们可以给`dom:Node`的结构增加字段，而不是创建一个新的树。但是我想抱着样式的代码和之前的“课程”相对独立。这也是给了我一个机会讲一下在大部分渲染引擎都会出现的 **平行树(parallel trees)** 

浏览器引擎模块经常会将一个树当做输入，然后输出一个不同但是相关的树 。比如，Gecko的 [布局代码(layout code)](https://wiki.mozilla.org/Gecko:Key_Gecko_Structures_And_Invariants) 利用 **DOM树** 生成 **框架树(frame tree)**，然后将用于构建 **视图树(view tree)**。Blink 和 WebKit 将 DOM树 转换成 **渲染树(render tree)**。在这些引擎的后面阶段还会生成很多树，包括 **层级树(layer tree)** 和 **部件树(widget tree)**。

在完成其他几个阶段之后，我们的玩具浏览器引擎的流水线(pipeline)将会看起来像是这样：

![](https://mmbiz.qpic.cn/mmbiz_jpg/qpiaQcgGBL79wMzjlEyguV4WXTXbgtCwIOX8zNJ9KlOP8TScxxusxZbvAtic8qkmKC54PicgBRUe5iaRibIQIY764oQ/0?wx_fmt=jpeg)

在我的实现方式里，DOM树里的每个节点在样式树里都只有一个节点。但是在更复杂的流水线阶段，几个输入的节点可能会合并成一个输出节点。或者，一个输入节点可能会扩展为多个输出节点，或者被完全跳过。例如，样式树可能移除一个`display`属性设置成`none`的元素。（相反，我将在布局阶段移除这些，因为我的代码反而比较简单）

## 匹配选择器 Selector Matching

构建 **样式树(style tree)** 的第一步就是匹配选择器。因为我的CSS解析器只支持简单选择器，因此这将是很简单。可以通过查看元素本身来判断简单选择器是否与元素匹配。匹配复合选择器则需要遍历整个DOM树来查看元素的 **兄弟元素(siblings)**，**父元素(parents)** 等等。

```rust
fn matches(elem: &ElementData, selector: &Selector) -> bool {
    match *selector {
        Simple(ref simple_selector) => matches_simple_selector(elem, simple_selector)
    }
}
```

为了提供帮助，我们将给我们的 DOM元素类型 增加一些遍历的ID和class访问器。class属性可以包含多个用空格分隔的类名，最后将这些类名通过哈希表的形式返回。

```rust
impl ElementData {
    pub fn id(&self) -> Option<&String> {
        self.attributes.get("id")
    }

    pub fn classes(&self) -> HashSet<&str> {
        match self.attributes.get("class") {
            Some(classlist) => classlist.split(' ').collect(),
            None => HashSet::new()
        }
    }
}
```

要测试一个简单选择器是否匹配了元素，只需要查看每个选择器的 **组件(component)** ，如果一个元素没有一个匹配上的class，ID或者标签名就返回`false`

```rust
fn matches_simple_selector(elem: &ElementData, selector: &SimpleSelector) -> bool {
    // Check type selector
    if selector.tag_name.iter().any(|name| elem.tag_name != *name) {
        return false;
    }

    // Check ID selector
    if selector.id.iter().any(|id| elem.id() != Some(id)) {
        return false;
    }

    // Check class selectors
    let elem_classes = elem.classes();
    if selector.class.iter().any(|class| !elem_classes.contains(&**class)) {
        return false;
    }

    // We didn't find any non-matching selector components.
    return true;
}
```

> Rust笔记：这个函数使用`any`这个方法，如果迭代器包含一个可以通过提供的测试函数的元素则返回true。类似于 Python 或者 Haskell 里的 `any` 函数，JavaScript 里的 `some` 方法

## 构建样式树 Build the Style Tree

接下来，我们需要遍历整个DOM树，对于树中的每个元素，我们将在样式表中搜索匹配的规则。

比较两个匹配相同元素的规则时，我们需要使用每个匹配项中 **最高明确性(highest specificity)** 的选择器。因为我们CSS解析器储存的选择器是按明确性从高往低排序的，所以我们可以在找到匹配的选择器后立即停止，然后返回其明确性以及规则的指针。

```rust
type MatchedRule<'a> = (Specificity, &'a Rule);

// If `rule` matches `elem`, return a `MatchedRule`. Otherwise return `None`.
fn match_rule<'a>(elem: &ElementData, rule: &'a Rule) -> Option<MatchedRule<'a>> {
    // Find the first (highest-specificity) matching selector.
    rule.selectors.iter()
        .find(|selector| matches(elem, *selector))
        .map(|selector| (selector.specificity(), rule))
}
```

为了找到与某个元素匹配的所有规则，我们调用`filter_map`方法，它可以线性扫描整个样式表，检查每个规则并丢弃不匹配的规则。真正的浏览器引擎会通过基于标签名，ID，class等将规则存储在多个哈希表，从而实现快速匹配。

```rust
// Find all CSS rules that match the given element.
fn matching_rules<'a>(elem: &ElementData, stylesheet: &'a Stylesheet) -> Vec<MatchedRule<'a>> {
    stylesheet.rules.iter().filter_map(|rule| match_rule(elem, rule)).collect()
}
```

一旦有了匹配的规则，我们就可以找到元素的 **指定值(specified value)**。将每个规则的属性值插入到`HashMap`。将规则按 **明确性(specificity)** 排序，这样较高明确性的规则会在较低的之后进行处理，可以在`HashMap`将它们的值覆盖。

```rust
// Apply styles to a single element, returning the specified values.
fn specified_values(elem: &ElementData, stylesheet: &Stylesheet) -> PropertyMap {
    let mut values = HashMap::new();
    let mut rules = matching_rules(elem, stylesheet);

    // Go through the rules from lowest to highest specificity.
    rules.sort_by(|&(a, _), &(b, _)| a.cmp(&b));
    for (_, rule) in rules {
        for declaration in &rule.declarations {
            values.insert(declaration.name.clone(), declaration.value.clone());
        }
    }
    return values;
}
```

现在我们拥有了遍历DOM树并构建样式树所需的一切。需要注意的是，选择器匹配仅适用于元素，因此文本节点的指定值只是一个空的`map`

```rust
// Apply a stylesheet to an entire DOM tree, returning a StyledNode tree.
pub fn style_tree<'a>(root: &'a Node, stylesheet: &'a Stylesheet) -> StyledNode<'a> {
    StyledNode {
        node: root,
        specified_values: match root.node_type {
            Element(ref elem) => specified_values(elem, stylesheet),
            Text(_) => HashMap::new()
        },
        children: root.children.iter().map(|child| style_tree(child, stylesheet)).collect(),
    }
}
```

以上是Robinson关于构建样式树的所有代码。接下来，我将谈论一些明显的遗漏。

## 层叠 Cascade

由网页作者提供的样式表称为 **作者样式表(author stlye sheets)**，除此之外，浏览器还通过 **用户代理样式表(user agent style sheets)** 提供了[默认样式](http://www.w3.org/TR/CSS2/sample.html)。还有它可以允许用户通过 **用户样式表(user style sheets)** 添加自定义样式（比如 Gecko 的 [userContent.css](http://www-archive.mozilla.org/unix/customizing.html#usercss)）。

层叠([cascade](http://www.w3.org/TR/CSS2/cascade.html#cascade)) 定义了这三个“数据源”哪个优先权更高。层叠有六个级别：每个数据源都有”普通(normal)“声明，加上每个数据源还有`!important`声明。

Robinson的样式代码没有实现层叠的功能。它仅读取一个样式表。缺少默认样式表意味着HTML元素不会有你预期的任何默认样式。例如：`<head>`元素的内容不会被隐藏，除非你明确在你的样式表中添加这个规则：

```css
head { display: none }
```

实现层叠应该相当容易：只需跟踪每条规则的起源，并根据明确性排序，其中明确性要加入数据源和重要性这些权重。一个简化的两级层叠应该足以支持最常见的情况：普通用户代理样式 和 普通作者样式。

## 计算值 Computed Values

除了上述提到的“指定值(sepecified values)”之外，CSS还定义了 **初始值(initial values)**，**计算值(computed values)**，**使用值(used values)** 和 **实际值(actual values)**。[CSS标准链接](http://www.w3.org/TR/CSS2/cascade.html#value-stages)

初始值是层叠中没有指定的属性默认值。计算值则是基于指定值的，但可能会应用一些特定属性的规范化规则。

根据CSS规范的定义，正确实现这些属性需要为每个属性使用的单独的代码。这是现实浏览器引擎的必要工作，但希望在我的玩具项目中避免这些。在后面阶段，在缺少指定值的时候，使用这些值的代码会（通过某种方式）使用默认值来模拟初始值。

使用值 和 实际值则是在布局期间和布局之后计算的，我将在以后的文章中介绍。

## 继承 Inheritance

如果文本节点不匹配任何选择器，那么它如何得到颜色和字体和其他样式呢？答案就是 **继承**([inheritance](http://www.w3.org/TR/CSS2/cascade.html#inheritance))。

继承属性后，没有层叠值(cascaded value)的任何节点都将收到该属性的父元素的值。默认情况下，某些属性（如颜色）都是继承过来的；其他的属性只有在层叠值指定特殊值`inherit`时才会继承父元素。

我的代码没有支持继承。要实现这个，可以将父元素的样式数据传入`specified_values`函数，并使用硬编码的查找表来决定应继承哪些属性。

## 样式属性 Style Attributes

任何HTML元素都可以包括一个`style`属性，其中包含一系列的CSS声明。它们没有选择器，因为这些声明自动应用到这个元素本身。

```html
<span style="color: red; background: yellow;">
  ```
  
  如果你想支持`style`属性，让`specified_values`函数检查属性即可。如果存在该属性，则将它从CSS解析器传入`parse_declarations`。由于这些属性比任何CSS选择器都更明确，因此在在 **普通作者声明(normal author declarations)** 之后应用这些 **结果声明(resulting declarations)**。
  
  原文链接：https://limpet.net/mbrubeck/2014/08/23/toy-layout-engine-4-style.html