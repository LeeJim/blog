---
title: 关于事件绑定的一些知识
date: 2016-11-24 23:45:59
tags:
- JavaScript
- 事件
desc:
toc: true
categores:
- [前端基础]
- 浏览器
---

前端开发无法避免的就是浏览器兼容问题，虽然我们现在几乎可以抛弃IE7甚至IE8，但是无法避免的是仍然有用户在使用这些远古时代的浏览器。因此面试大型互联网公司总会考察相关的知识。因此我现在分享一下我遇到的一个考题：

<!-- more -->

现在有一段HTML

```html
<ul id="list">
  <li>a</li>
  <li>b</li>
  <li>c</li>
</ul>
```

点击`li`的时候`alert`弹出`li`里面的文本内容，离开`ul`时`alert`提醒。

注意，需要考虑性能和兼容性问题。

### 分析点击事件

首先，大家都知道的是，在`IE`下绑定事件是使用`attachEvent`的，而不是`addEventListener`，因此可以封装一个方法来绑定事件：

```js
/**
 * @param {DOM} target 表示事件绑定的元素
 * @param {String} method 表示绑定的事件
 * @param {Function} handler 表示绑定的事件处理函数
 */
function addEvent(target, method, handler) {
  if (target.addEventListener) {
    target.addEventListener(method, handler, false);
  }
  else if(target.attachEvent) {
    target.attachEvent('on' + method, handler)
  }
 else {
    target['on'+method] = handler
  }
}
```

需要注意的是，使用`attachEvent`时，事件类型都是需要加个`on`前缀的。还有就是因为`attachEvent`是将事件绑定在冒泡阶段的，为了保持一致，所以使用`addEventListener`时，需指定第三个参数为false，否则就添加到事件捕获阶段了。

其次，不能给每个`li`绑定事件，可以利用事件的冒泡机制，故需把事件绑定到`ul`上而不是`li`上。

此时要拿到真正的`li`就要读取事件(event)的真实对象(target)了，这也是一个考察点：

- 在IE上，事件(event)要需要通过`window.event`获取的。

- 在IE上，事件对象(event target)的值是`event.srcElement`而不是`event.target`

因此绑定点击事件的完整代码是这样的：

```js
var list = document.getElementById('list')

addEvent(list, 'click', function(event){
  event = event || window.event;
  var target = event.target || event.srcElement;
  
  alert(target.innerHTML)
})
```

### 分析鼠标移开事件

其实，这个才是这道题考察JavaScript能力的重点，因为通常情况下，我们就是使用`mouseout`事件就完了。然而这里隐藏了一个问题：就是当鼠标移入`ul`的子元素`li`时，也会触发`mouseout`事件的，所以这道题的重点就是考察面试者到底有没考虑到这个点。

然而考察并没有结束，此时又出现了一个考察点：就是如何获取鼠标移出时移到哪个元素了。

在现代浏览器(`chrome`，`firefox`，`safari`等等)上，我们直接用`event.relatedTarget`就可以直接获取；而在IE上则比较繁琐，`mouseout`事件有一个叫`toElement`的元素（顾名思义就是鼠标移到了哪个元素），`mouseover`事件则有一个叫`fromElement`元素。

因此，我们可以这么做：

```js
 addEvent(list, 'mouseout', function(event){
  event = event || window.event;
  var t = event.relatedTarget || event.toElement;
  if(!list.contains(t)) {
    alert('!')
  }
})
```

### 取消冒泡

其实上面的代码就是最终的代码了，但是其实上面的代码我们偷了一个懒。

因为我们没有处理`list.contains(t)`的情况，这时就应该是取消冒泡了。这里就引出来我所理解的最后一个考点：

－ `IE`取消冒泡的方法是`event.cancelBubble = true`

- 在符合`w3c`标准的浏览器上，则是使用`event.stopPropagation()`

最终的代码是这样的：

```js
/**
 * @param {DOM} target 表示事件绑定的元素
 * @param {String} method 表示绑定的事件
 * @param {Function} handler 表示绑定的事件处理函数
 */
function addEvent(target, method, handler) {
  if (target.addEventListener) {
    target.addEventListener(method, handler, false);
  }
  else if(target.attachEvent) {
    target.attachEvent('on' + method, handler)
  }
 else {
    target['on'+method] = handler
  }
}

var list = document.getElementById('list');

addEvent(list, 'mouseout', function(event){
  
  event = event || window.event;
  var t = event.relatedTarget || event.toElement;

  if(list.contains(t)) {
    event.cancelBubble = true;
    event.stopPropagation();
  }
  else {
    alert('你正在离开list!')
  }
})
```
