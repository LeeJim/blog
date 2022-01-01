---
title: 什么是cookie
date: 2017-11-05 18:43:13
tags: cookie
desc: 什么是cookie
---

起源，因为HTTP的无状态，无法知道两个请求是来自同个人。

由NetScape工程师Lou Montulli与1994发表。正式确定于[RFC2109](http://tools.ietf.org/html/rfc2109)，最终演变成[RFC2965](http://tools.ietf.org/html/rfc2965)

## Cookie为何物？

简单说，就是一个简单的纯文本。服务器可根据这个文本来区别每个独立的用户。因此，cookie经常被应用于登录和信息校验。

### 创建

服务器通过`Set-Cookie`的HTTP头来设置：

```
Set-Cookie: <em>value</em>[; expires=<em>date</em>][; domain=<em>domain</em>][; path=<em>path</em>][; secure]
```

客户端将多个cookie通过`Cookie`的HTTP头来返回服务器：

```
Cookie: value1; value2; name1=value1
```

> 多个value直接由一个分号和一个空格分隔开

### value编码

在普遍持有的观念中，value一定要是`URL-endcoed`编码的。

其实这是个谬论，在文档中，明确指出只有`分号、逗号、空格`才需要编码。

### expires

设置过期时间。需要使用GMT格式的时间。


```
Set-Cookie: name=Nicholas; expires=Sat, 02 May 2009 23:38:25 GMT
```

> 若没设置时间，则一个会话周期（即关闭浏览器）就会自动被删除

> 校验的时间是以客户端的时间为准

### domain

指定什么域名请求时需要发送该cookie。

> 采用尾校验，即子域名也会发送(domain=yahoo.com，在my.yahoo.com也会发送)

### path

指定域名下的对应路径的请求才发送cookie。


### secure

有这个标志，cookie只会在HTTPS协议的请求发送该cookie。

## 维护Cookie和周期

修改对应的值，需要保持其他的值不变才能修改成功。不然就等于新增了一个cookie。


### 自动删除

以下三个原因导致cookie被浏览器自动删除：

- 会话结束自动删除
- expires到期自动删除
- 超过上线自动删除相对较旧的cookie

## 其他限制

- HTTP-Only: 这个将使浏览器无法使用JavaScript访问该cookie。


## 参考：

- [HTTP cookies explained](https://www.nczonline.net/blog/2009/05/05/http-cookies-explained/)
- [Cookies and security](https://www.nczonline.net/blog/2009/05/12/cookies-and-security/)
- [Simple cookie framework](https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie/Simple_document.cookie_framework)