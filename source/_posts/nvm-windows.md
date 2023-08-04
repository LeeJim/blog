---
title: 多版本 Node.js
date: 2016-11-03 17:06:19
tags: Node.js
desc: Windows下安装多版本的Node.js
toc: true
categories:
- Node.js
---

最近，Node.js的LTS版本已经升级到6.9.1了，最新的版本都已经出到7.0了。

然而我还在使用5.x版本，于是我将本地开发的Node.js升级到6.9.1。

于是，悲剧发生了，以前的项目在新版本的Node.js下运行不了。

所以我发现，拥有多版本的Node.js还是很有必要的。

<!-- more -->

## 开发环境

#### linux / MacOs
如果是在*nux的开发环境可以直接安装`nvm`即可

#### Windows
需要安装`nvm-window`。[github地址在此](https://github.com/coreybutler/nvm-windows)，[下载地址在此](https://github.com/coreybutler/nvm-windows/releases)

在此我着重说一下`nvm-windows`需要注意的地方：

- 安装`nvm-windows`之前需把已安装的Node.js删除，（比如：如果“C:\Program Files\nodejs”这个目录存在的话就要删掉，不然NVM无法使用）
- 需要把NPM删掉(e.g. "C:\Users<user>\AppData\Roaming\npm")
- 对应每个Node.js版本的全局安装方法都用重新安装，比如：

```sh
nvm use 4.0.0
npm install -g grunt


#切换版本
nvm use 7.0.0
npm install -g grunt
```