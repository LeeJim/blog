---
title: 从零开始，部署一个Web应用（二）MongoDB & nginx
date: 2017-10-21 21:37:14
tags: vue.js
desc: for beginner, how to build an web application
toc: true
categories:
- 工程实践
---

这篇文章，就总结一些部署`MongoDB`和`nginx`遇到的问题。

<!-- more -->

# MongoDB

安装的是社区版本([MongoDB Community Edition](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-red-hat/))。

## 安装

先创建Mongodb在yum的配置文件：

```
[mongodb-org-3.4]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/$releasever/mongodb-org/3.4/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-3.4.asc
```

> 可动态改变版本号

然后使用`yum`安装：

```
sudo yum install -y mongodb-org
```

## 安全相关

如果是仅仅是本地开发，完全可以忽略这一步。但是如果要放到线上，就一定要增加安全验证。

在MongoDB中，常用的是增加[用户访问限制](https://docs.mongodb.com/manual/tutorial/enable-authentication/)。

### 高级管理员

第一步，是先创建一个高级管理员。这个高级管理员可**管理其他用户**：

```
> use admin
> db.createUser(
  {
    user: "myUserAdmin",
    pwd: "abc123",
    roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
  }
)
```

> 注意，admin用户是无法访问其他数据库的，访问其他数据库需要增加新用户。

可以这样以该角色进入MongoDB的命令行：

```
mongo --port 27017 -u "myUserAdmin" -p "abc123" --authenticationDatabase "admin"
```

### 增加其他用户

MongoDB的用户权限是和数据库绑定的，故创建用户前需进入一个指定数据库，比如进入`test`数据库：

```
use test
```

然后创建角色时，设置账户，密码以及对应的数据库权限，比如：

```
db.createUser(
  {
    user: "testAdmin",
    pwd: "abc123",
    roles: [ { role: "readWrite", db: "test" },
             { role: "read", db: "reporting" } ]
  }
)
```

# nginx

安装nginx之前，需要先将nginx的依赖安装完：

- gcc 安装：`yum install gcc-c++`
- PCRE pcre-devel 安装：`yum install -y pcre pcre-devel`
- zlib 安装: `yum install -y zlib zlib-devel`
- OpenSSL 安装: `yum install -y openssl openssl-devel`

## 安装

```
# 下载Nginx
wget -c https://nginx.org/download/nginx-1.10.1.tar.gz

# 解压：
tar -zxvf nginx-1.10.1.tar.gz

# 进入nginx解压目录
cd nginx-1.10.1 

# 配置：
./configure

# 编译安装:
make
make install

# 查找安装路径：
whereis nginx
```

## 环境变量

因为是二进制安装，所以环境变量需要手动设置，即此时不能直接使用`nginx`命令。

设置环境变量的方法是：将nginx的二进制文件复制的系统bin目录下：

```
cp /usr/local/nginx/sbin/nginx /usr/local/bin
```

> 假设上面的whereis nginx返回的是/usr/local/nginx

## 开启SSL模块

切换到安装的源码包，我是安装在`/usr/local/src/nginx-1.11.3`。

修改配置：

```
./configure --prefix=/usr/local/nginx --with-http_ssl_modul
```

执行`make`之后，切记**不要执行**`make install`，否则就覆盖安装了。

先备份已安装好的nginx:

```
cp /usr/local/nginx/sbin/nginx /usr/local/nginx/sbin/nginx.bak
```

然后关闭已启动的nginx：

```
# 查看进程号
ps -ef|grep nginx
kill -QUIT [进程号]
```

将刚刚编译好的nginx覆盖掉原有的nginx:

```
cp ./objs/nginx /usr/local/nginx/sbin/
```

启动nginx，仍可以通过命令查看是否已经加入成功

```
/usr/local/nginx/sbin/nginx -V　
```