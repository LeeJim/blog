---
title: 从零开始，部署一个Web应用（一）
date: 2017-10-14 20:37:14
tags: vue.js
desc: for beginner, how to build an web application
toc: true
categories:
- 工程实践
---

起始篇，先介绍一个整个系列文章涉及到的开发环境，技术栈。

<!-- more -->

## 环境

开发环境：

设备：MacBook Pro 2015
环境：Node.js v8.9.3 + WebPack v3.0
IDE：Sublime Text + Visual Studio Code

生产环境：

设备：腾讯云CVM(香港)
系统：CentOS 7.2 64位

## 技术盏

前端采用了Vue.js + Vue-router + Element-UI

> 采用Vue.js是因为最近都在使用Vue.js技术盏，但是从未从零开始创建一个Vue.js项目。故想尝试一遍。

> 而采用Elment-UI是因为不想花太多事件在UI的设计上，毕竟我的设计能力有限。

后端采用 Node.js + Think.js

> 因为个人技术盏限制，故采用比较擅长的Node.js。

> 采用Think.js是因为目前所在公司是这个方案，也觉得这样比较省事，不想Express那样灵活，什么都需要自己配置。

数据库采用MongoDB + Redis

> MongoDB是No SQL数据库，和JavaScipt的JSON格式完美匹配，为了高效开发而选。另外，数据结构的不确定性也是一个因素。

> Redis是用来保存Session，邀请码等数据。

服务器部署：Nginx + Node.js反向代理

> 利用Nginx来实现负载均衡

代码管理：[Coding](https://coding.net)

> 由于GitHub的私有仓库需要收费，所以选了一个国内的代码仓库。