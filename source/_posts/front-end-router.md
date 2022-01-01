---
title: 前端路由
date: 2015-09-21 12:44:09
tags: 路由
desc: router
---

路由一直都是后端控制的，然而，其实我们前端也可以使用`hash`实现我们前端自己的路由。
下面的代码就是参考他人代码实现的：

<!--more-->

```js
var router = {
  routes: {},
  currentUrl: '',
  lastPanel: ''
};

router.init = function(){
  window.addEventListener('load', this.update.bind(this), false);
  window.addEventListener('hashchange', this.update.bind(this), false);
};

router.add = function(path, callback){
  this.routes[path] = callback;
};

router.update = function(){
  this.currentUrl = location.hash.slice(1) || '/';
  this.routes[this.currentUrl]();
}

if(this === window && typeof window.document !== 'undefined') {
  window.router = router;
}
else if(typeof define === 'function') {
  define('router', [], function(){
    return router;
  })
}
```