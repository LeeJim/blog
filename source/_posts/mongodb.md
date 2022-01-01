---
title: mongodb使用记录
date: 2016-10-17 20:11:36
tags: MongoDB
desc:
---

记录一下mongodb的使用记录，包含常用的启动、操作等命令。

<!-- more -->


## 初始化

#### 文件目录

```sh
-data #数据
+ log #日志
  - mongod.log
+ conf #配置文件
  - mongod.conf
bin #二进制目录
```


#### 启动的配置文件

```sh
port = 12345 #启动端口
dbpath = data #数据路径
logpath = log/mongod.log #日志路径
fork = true #表明启动的是后台进程 windows下无效
```

## 启动

#### 启动数据库

```sh
mongod -f conf/mongod.conf
```

#### 连接数据库

```sh
mongo 127.0.0.1:12345/test
```

## 基本操作

```sh
show dbs #显示所有数据库
use company #使用company数据库 不存在则自动创建
show collections #显示所有collection
show tables #效果同上
```

## CRUD

#### 插入数据

```sh
db.company_list.insert({name: 'one'}) # company_list为collection，不存在则自动创建，然后插入一个数据

for(i=0;i<10;i++) db.company_list.insert({name: i}) #使用js的语法插入10个数据
```

#### 查找数据

```sh
db.company_list.find() #显示该collection的所有数据

db.company_list.find({name: 'one'}) #显示对应条件的数据

db.company_list.find().skip(2).limit(3).sort({name: 1}) #跳过前2个数据，按name排序获取3个数据
```

#### 数据更新

```sh
db.company_list.update({x:1}, {x:1000}) #第一个参数是查找条件，第二个参数是修改后的数据 注意：修改后的完整数据（即{x:1,y:1} => {x:1000}）

db.company_list.update({x:1}, {$set: {x:1000}}) #只修改x字段

db.company_list.update({x:99, {y:99}, true}) #修改一个不存在的数据则插入这个数据

db.company_list.update({x:1}, {y:99}, false, true}) #批量修改多条数据
```

#### 删除数据


```sh
db.company_list.remove({x:1}) #默认删除对应条件的所有数据
dp.company_list.drop() #删除collection
```

## 索引相关

```sh
db.company_list.getIndexes() #列出所有索引
db.company_list.ensureIndex({x:1}) #设置索引
```

#### 索引的类型

- _id索引
- 单键索引
- 多键索引
- 复合索引
- 过期索引
- 全文索引
- 地理位置索引

## 权限相关

#### 创建用户


```sh
db.createUser({
    user: "<name>",
    pwd: "<cleartext password>",
    customData: {<any information},
    roles: [{role: "<role>", db: "<database>"}]
})
```

#### 用户类型：
- read
- readWrite
- dbAdmin
- dbOwner
- userAdmin 
