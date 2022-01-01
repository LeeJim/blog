---
title: iOS 软键盘弹出
date: 2016-07-22 12:22:50
tags: 键盘
desc: 移动开发,软键盘弹出,iOS键盘弹出
---

移动`WEB`开发经常要遇到控制软键盘：**弹出键盘**和**收起键盘**。

<!--more-->

```javascript
 // 弹出键盘
 input.focus();

// 收起键盘
 input.blur();
```

在`Android`上，弹出和收起都比较正常，在任何时候调用都行。
在`iOS`则不一样，一定要有在用户有实际交互时**马上**(right now)调用`focus`或者`blur`才行。比如：

```javascript
   btn.addEventListener('click', function(){
     input.focus(); //弹出键盘
   }, false);
```

如果此时使用了`setTimeout`：

```javascript
   btn.addEventListener('click', function(){
     setTimeout(function(){
       input.focus(); //键盘是不会弹出的
     }, 50);
   }, false);
```

或者此时我调用`ajax`请求再`focus`也是不会弹出来的

```js
  $.ajax({
    //...
  })
  .then(function(){
    input.focus(); //键盘是不会弹出的
  })
```