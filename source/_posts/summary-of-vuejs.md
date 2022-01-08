---
title: 初用Vue.js的一些心得
date: 2017-5-19 20:40:03
tags: 
- vue.js
desc: summary of vuejs
toc: true
categories:
- [框架, Vue.js]
---

其实很多框架发展到后面，都是非常类似的。以前写过React，所以对Vue.js还是能比较快速地上手的。

期间，遇到了不少问题，整理了一下，就和大家分享一下阁下小小的见解。

<!-- more -->

## input

type类型的选择

### 初始版本

```vue
<template v-if="type === 'number'">
    <input type="number" />
</template>
<template v-else-if="type === 'tel'">
    <input type="tel" />
</template>
<template v-else>
    <input type="text" />
</template>
```

原因：避免使用非法类型

### 最终版本

```vue
<input :type="type"/>

<script type="es6">
export default {
    props: {
        type: {
            type: 'string',
            default: 'text',
            validator(type){
                return ['password', 'tel', 'number'].indexOf(type) > -1
            }
        }
    }
}
</script>
```

### 同步校验与异步校验

#### 同步校验

input事件触发的时候，实时校验然后输出错误信息，blur事件触发的时候展示错误信息。

#### 异步校验

因为存在HTTP延迟，所以不能实时触发，就在同步校验成功之后才触发。

```js

export default {
    props: {
        verify: { // 验证规则 {rule: '规则', errMsg: '错误信息提示'}
            type: Object,
            'validator'(value) {
              return value.rule 
                && (value.rule instanceof RegExp || typeof value.rule === 'string')
            }
        },
        asyncVerify: String, // 异步验证规则（URL地址）
    },
    methods: {
        async validate() {

            const {verify, inValue, asyncVerify} = this

            let isValid

            // 存在验证规则
            if (verify) {

              const {rule, errMsg} = verify

              // 正则的验证规则
              if (rule instanceof RegExp) {
                isValid = rule.test(inValue)
              }

              // 字符串型内置类型验证
              else if (typeof rule === 'string') {
                switch (rule) {
                  case 'tel':
                    isValid = /^1[34578]\d{9}$/.test(inValue)
                    break

                  case 'password':
                    isValid = /^(?![0-9]+$)(?![a-zA-Z]+$)[0-9a-zA-Z]{6,12}$/.test(inValue)
                    break

                  case 'telCaptcha':
                    isValid = /^\d{6}$/.test(inValue)
                    break

                  case 'imgCaptcha':
                    isValid = /^\S{4}$/.test(inValue)
                    break

                  default:
                  // no default
                }
              }

              if (!isValid) {
                this.$emit('show-error', errMsg || '格式错误')
                return
              }
            }
            

            // 存在异步校验
            if (asyncVerify) {
              
            }
            
      }
    }
}
```

## 数据流动问题

### 情况

一个父元素，一个子元素。父元素传递parentError给子元素，子元素自己也可以产生childError

### 问题

父元素传递'first error'，子元素自产生'second error'，此时父再传'first error'，子元素就会忽略，因为父元素传递的数据还没改变还是'first error'。

### 解决

A方法：子元素不自己产生childError，统一`$emit`发送给父元素，然后才传递给子元素

B方法：父元素传递的数据，前缀加计数器以区别每次传递的数据

## 错误信息往上传递

```js
// bd-input
this.$emit('show-error', '出错了!')

// 父组件

// 用户名
<bd-input @show-error="showError" type="text" />

// 密码
<bd-input @show-error="showError" type="password" />

showError(error) {
    // error = 谁的错误信息? 用户名 or 密码
}

```

- A方法：给bd-input传入一个token，然后传错误信息的时候，把token带上即可
- B方法：使用curry化函数

### A方法

```js
// bd-input
this.$emit('show-error', JSON.stringify([token, '出错了!']) )

// 父组件

// 用户名
<bd-input @show-error="showError" type="text" token="username"/>

// 密码
<bd-input @show-error="showError" type="password" token="password"/>

showError(errObj) {
    parsedErrObj = JSON.parse(errObj)

    token = parsedErrObj[0] // 错误信息的宿主
    error = parsedErrObj[1]
}
```

### B方法

```js
// bd-input
this.$emit('show-error', '出错了!')

// 父组件

// 用户名
<bd-input @show-error="curryShowError('username')" type="text" />

// 密码
<bd-input @show-error="curryShowError('password')" type="password" />

curryShowError(token) {
    return function(error){

    }
}
```


