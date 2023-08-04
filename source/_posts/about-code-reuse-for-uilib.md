---
title: 关于组件库的代码复用
date: 2021-12-01 11:31:30
categories:
- 组件库
toc: true
---

TDesign 组件库覆盖的范围很广，包括移动端、PC端、小程序端；也覆盖了主流的前端框架，如 Vue、React、Angular 等。因此，开发组件库时，代码的维护及复用是我们最头疼的问题，这就引发了我的思考，也就诞生了这篇文章。

<!-- more -->

## 终端的差异

其实这里讲的差异主要是 web 端和小程序端。本质上，他们不是在一个水平上的产物，小程序属于更高级的框架，提供了新的语法之外，还提供了许多二次封装的组件。

除了组件这方面的差异，还体现在语法支持上的差异。比如说，小程序的组件属性，不支持 Date 类型，这类的问题还属于是开发中才会发现的“陷阱”。

## CSS 的复用

Web 的组件，本质上是 HTML + CSS + JS 的组合。不管框架如何变化，本质上只会影响 HTML + JS 的写法，并不会对 CSS 有太多影响。反而是终端的变化对 CSS 的影响更大一些。很多时候，我们只会考虑在逻辑做分层处理，反而忽略了 CSS 的分层，其实对 CSS 分层的意义在组件库开发中，尤为重要。其中 CSS 规则大致可以分成以下几类：

- 颜色/文本
- 尺寸/位置
- 布局
- 动画

在不同终端，颜色/文本 和 动画 不会有太大差异，因此可以做到复用。但尺寸/位置 和 布局 则会因为终端的变化而变化。因此 CSS 的分层是这样的：

![CSS分层示意图](/blog/images/ui-library/css-layer.png)

通过这样的分层，就可以最大化复用 CSS ，只需要各自实现一下 Mobile 和 Desktop 的尺寸/位置 和 布局样式即可。对于小程序的处理，则需要对 CSS unit 做个转换即可。不至于导致每个终端都需要重新写一份 CSS。降低代码的重复率，也就降低代码的维护成本，尽可能延续组件库的生命。

## 逻辑复用

业界比较热门的组件库，如 Ant Design 和 Element UI 都是专注于一个框架来开发的。因此他们并不会遇到多框架逻辑复用的问题。

### 跨框架级复用

但最近发布的 Semi Design 则和 TDesign 一样，同步开发了 Vue 和 React 组件库，采用的逻辑复用方案被他们称之为 F/A 方案。其中 F 是 Foundation 的简称，代表与框架无关的逻辑；而 A 则是 Adapter 的简称，代表每个框架的适配器，与框架强相关。

![跨框架复用](/blog/images/ui-library/foundation-adapter.png)

其实思路还是比较直观的，将逻辑拆分成工具函数，封装成一个工具类作为 Foundation，然后在用户操作或者组件生命周期中调用 Foundation 对应的函数。

本质上就是提前规划好组件的函数拆分，做到函数级别上的复用。

目前来说，如果不使用 DSL 或者二次编译的方式，确实没办法做到更多的复用。但如果采用 DSL 的话，极大可能会陷入编译器的深渊之中。

### 组件级复用

当我们使用一个组件，UI 又没法满足要求时，我们往往会选择重新造一个轮子。

但其实，如果此时组件的 UI 无法满足，但逻辑是符合的，是不是可以做到只复用逻辑，然后只需要重写 UI 即可。

比如，以我实际开发时遇到的 Select 举例，TDesign 的 Select 是长这样的：

![TDesign Select](/blog/images/ui-library/select-tdesign.webp)

但用户反馈说，他们的视觉是这样的：

![用户想要的 Select](/blog/images/ui-library/select.webp)

功能可以说是一致的，差别仅仅是 用于筛选的 input 的位置。

对于常规的组件来说，组件的每个节点是固定的，可以扩展的位置（插槽 Slot）也是固定的。像这样要大范围调整内部节点的场景，是无法满足的。

为了满足这样的诉求，我的实现思路是这样的：将组件的实现拆分成两层：rawComponent 和 realComponent

![headless component](/blog/images/ui-library/cross-frame.png)

RawComponent 将每个模块输出，拆分成更小粒度的组件，用户可以自定义组合，也可以通过渲染函数或者 Scoped Slot 来实现不一样的 UI。

在 React 中使用 Render Props 自定义渲染

```jsx
// raw
class RawComponent extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    return this.props.render({
      // ... some props
    })
  }
}

class RealComponent extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <RawComponent
        render={() => (<div></div>)}
      />
    )
  }
}
```

在 Vue 中使用 Scoped Slot 自定义渲染

```jsx
// raw.vue
Vue.extend({
  data() {
    return {}
  },

  render() {
    return this.$scopedSlots.default({ result: []})
  }
})
```

```jsx
// real.vue
<template>
  <RawComponent>
    <div scope-slot="{ result }">
      <span>{{result}}</span>
    </div>
  </RawComponent>
</template>

<script>
import RawComponent from './raw.vue';

Vue.extend({
  components: { RawComponent }
})
</script>
```

## 思考

作为组件库的开发者，也是使用者。我选用组件库时，对组件库的期望是这样的：

- 组件数量齐全且特性完善
- 代码质量高（可维护性高，可阅读性高，可扩展性高）
- 可复用性高

组件的特性完善需要通过不断的用户反馈然后进行迭代才能达到的。而代码的质量，和可复用性高则是我们从一开始就能考虑并尽可能实现的。

如果说，要如何在相对成熟的组件库市场上有所与众不同，或者说能让用户选用我们的话，那可复用性可能是其中之一。

## 参考资料

- [Semi Design - UI组件库如何分层设计，使其具备适配多种mvvm框架能力](https://bytedance.feishu.cn/docs/doccnTgc0iGOVPubHZkwPpxXSNh)
- [Component Reusability in React &amp; Vue](https://www.jonathan-harrell.com/blog/component-reusability-in-react-vue/)