---
title: 关于 Vue3 的 Proxy 引起的问题
date: 2021-5-28 17:43:34
tags:
categories:
- vue
toc: true
---

Vue3 是 Vuejs 新出的 3.0 版本，性能以及代码可维护性都提升了许多，也解决了许多 Vue2 中使用不便的地方。
此外，由于使用了 Proxy 来实现 Reactivity，所以对客户端的要求也就更高了，但总的来说，Vue3 的普及是势不可挡的。

TDesign 是汇集了公司多个 Oteam 的结晶，包括了多种框架多种终端的组件。

其中，Tree 可以说是组件库里最复杂的组件了，可以说是没有之一。

这次分享的内容是在我将 Tree 由 Vue2 迁移至 Vue3 过程中遇到的问题、分析过程以及最终的解决方案。

<!-- more -->

## 迁移策略

从 Vue2 升级至 Vue3，可以从官方的 [《Migration Guide》](https://v3.vuejs.org/guide/migration/introduction.html)可以看到了解到底有哪些 breaking changes。

升级的最小成本就是将 breaking changes 修复即可。

至于其他更好用的特性（如 `Composition API`、`Fragments` 等），属于非必需特性，可以放在后置再进行优化。其中的缘由是因为 Vue2 也在高速运转中，仍处于不稳定的状态，不对代码进行较大改动是为了之后可以方便地同步 Vue2 最新的代码。

## Vue3

Vue 的核心模块有三个：Reactivity Module、Compiler Module、Renderer Module。

![Vue 核心模块](/blog/images/vue3/vue-core-modules.png)

其中，Compiler Module 是将 template 转换成 render function，日常开发不会遇到问题。

而 Reactivity Module 则从 `Object.defineProperty` 升级成 `Proxy` 的形式实现，会存在原理上的不同，导致代码的实现思路也会受影响。在较复杂逻辑中比较容易出现问题。

Renderer Module 则是核心的渲染逻辑。问题常出现在 Patch 阶段，需要了解其中的 diff 算法。

## 代码结构

在开始迁移之前，先了解了一下 Tree 的代码结构：
```
- common
  - tree-store.ts
  - tree-node.ts
- src
  - tree
    - td-tree.tsx
    - tree-item.tsx
```
> common里面的代码是tree的公共逻辑，会在多个框架多个终端之间共享。

数据的流动：

![TDesign 树的数据流动](/blog/images/vue3/tree-data-flow.png)

# 状况百出
## 渲染死循环

通过断点发现，在不断地渲染 `td-tree`，其中就卡在 patchChildren 的逻辑：`vue-next/packages/runder-core/src/renderer.ts:1771`，下面是我摘选的部分代码：

```js
while (i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = (c2[i] = optimized
        ? cloneIfMounted(c2[i] as VNode)
        : normalizeVNode(c2[i]))
		//...
}
```
这是一个简单的数组赋值，为什么在 Vue2 正常运行，而在 Vue3 则发生了死循环呢？

是因为我们 `td-tree` 的渲染函数是这样的：

```js
export default defineComponent({
  //...
  render() {
    const { TreeNodes } = this;
    return (<transition-group>{TreeNodes}</transition-group>);
  }	
})
```
而 `TreeNodes` 则是 `TreeItem` 实例的集合：

```js
this.treeNodes.push(<TreeItem
      key={node.value}
      node={node}
      treeScope={treeScope}
      onClick={this.handleClick}
      onChange={this.handleChange}
/>))
```

所以，在 patch 的时候，对当前 VNode Child 进行了替换。

由于Vue3使用了 `Proxy` 而不再是Vue2的 `Object.defineProperty`，因此通过数组的下标进行赋值也会被监听到，自然就又重新进入了渲染流程，最终导致了渲染死循环。

解决办法：避免使用 VNode 数组。

在当前的组件里，就是将 `treeNodes` 的元素改成 `node`，而不是 `tree-item` 的 `VNode`。

最终 `td-tree` 的渲染函数是这样的：

```js
export default defineComponent({
  //...
  render() {
    const { TreeNodes } = this;
    return (<transition-group>
      {TreeNodes.map(node => this.renderItem(node))}
    </transition-group>);
  }	
})
```

## 数据变更不渲染

为了实现多框架之间可以实现逻辑复用，所以 `tree` 的很多复杂逻辑计算都被封装在一个公共模块里。

而其中 `tree-item` 的很多逻辑存在于 `common/tree-node.ts` 里面。

按理说，Vue2 运行正常的情况下，我只需要改动 Vue3 的 breaking changes 的地方，其他逻辑我是不需要改动的。而且由于公共模块的部分是多框架复用的，所以我是不应该改动这部分的，除非 Vue2 同样存在问题。

诡异的情况发生了，在测试 [异步加载节点](http://tdesign.woa.com/vue/components/tree#18-%E5%BC%82%E6%AD%A5%E5%8A%A0%E8%BD%BD%E8%8A%82%E7%82%B9) 的 case 的时候，发现 `loading` 的 `icon` 一直不会消失。

于是我开始梳理各种 `tree` 的渲染逻辑，最后通过数据的追踪，发现其实当前的 `node` 的 `loading` 值已经变成了 `false`，只是`tree-item`的 render 没有被触发而已。

表面的原因发现了，但深层的原因是为什么呢？

其实，这又是 Vue3 和 Vue2 的响应式实现的差异引起的问题。

在 Vue2 中，每个被当作 `property` 传到组件的值，会通过 `Object.defineProperty` 来对每个 `key` 设置 `getter` 和 `setter`。

以当前的组件举例：

```html
<tree-item :node="node" />
```

我们将 `node` 当作 `property` 传给 `tree-item` 的时候，Vue 就将 `node` 的每个 `key` 设置了 `getter` 和 `setter`，其中关键的是 `setter`，如果改变了`node` 的任意属性值，就会触发了 `setter` 与此同时就会对当前这个 `tree-item` 进行渲染。

而在 Vue3 中，由于`Object.definedProperty` 的各种局限，所以采用了更先进的 `Proxy` 来实现响应式。

这也就带了问题。`Proxy` 的机制要求我们访问 **代理对象** 而不是源对象，但由于 `tree` 的封装设计，只会在源对象上进行属性值变更，也就不会触发`tree-item`的渲染了。

找到了核心问题，解决思路有很多种：

1. 让公共部分的逻辑在 **代理对象** 上进行，而不是源对象（不能因为版本的差异去影响公共逻辑，所以这个方案 pass）
2. `tree-item` 不再使用 `tree-store` 返回的 `node`，而是新的 `Object`。在 `tree-store` 触发 `update` 时，再将 `node` 的每个 `key` 值进行比较，逐个`update`，同时也就可以触发渲染了。

# 总结

上面遇到的两个问题都是由 `Vue3` 的 `Reactivity` 机制变更导致的，均不是 `Migration Guide` 里有提到的 `breaking changes`，都属于 Vue3 的核心实现机制的改变。

因此，要想顺利完成 Vue2 到 Vue3 的升级，最好是能理解核心思想的改变，以及能熟悉框架的源码。