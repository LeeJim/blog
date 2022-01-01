---
title: 从零开始，部署一个Web应用（三）Vue.js & Redis
date: 2017-10-27 18:37:14
tags: vue.js
desc: for beginner, how to build an web application
---

这篇文章，就总结一些`Vue.js`和`Redis`遇到的问题。

# Vue.js

## 非index页面刷新报404

由于采用了`Vue-router`前端路由。因此在非index页面刷新会出现404的问题。

原理：Vue.js是单页面应用(SPA)，除了主页，其他页面都是利用hash或者HTML5 History API实现的，是浏览器虚拟的路由，故需要配置一下服务器。

以下是nginx的解决方案：

```
server {
    listen 80;
    server_name favweb.cn;
    access_log  off;

    root /home/vuejs/dist;

    location / {
      try_files $uri $uri/ /index.html;
    }
}
```

## 页面统计问题

由于Google Analytics的不可用，采用的是百度统计。

发现统计数据都是只有主页，因此又是因为SPA的问题。

解决方案是在前端路由切换的时候，手动调用PV追踪代码：

```js
_hmt.push(['_trackPageview', pageURL]);
```

Vuejs的配置为：

```js
import Router from 'vue-router'

const router = new Router(config)

router.afterEach((to, from, next) => {
  try {
    window._hmt.push(['_trackPageview', to.path])
  } catch (e) { }
})
```

# Redis

## 安装：

```
wget http://download.redis.io/releases/redis-4.0.2.tar.gz
tar xzf redis-4.0.2.tar.gz
cd redis-4.0.2
make
```

## 常用配置

以`MacOS`的`homebrew`安装方式为例。其中`redis.conf`文件在`/usr/local/etc/`。

### 后台运行

```
# 原来
daemonize no

# 改成
daemonize yes
```

### 增加密码

找到`requirepass`，去掉前面的注释符号`#`，后面改成自己的密码

```
#原来
#requirepass yourPassword

#改成
requirepass yourPassword
```

### 远程访问

找到`bind`，将`127.0.0.1`改成`0.0.0.0`即可。

因为安全问题，默认只绑定在127.0.0.1，这样的话就只有运行redis的那台机器可以访问，其他机器都无法访问。

因此要开启这个之前，一定要先设置好密码。


