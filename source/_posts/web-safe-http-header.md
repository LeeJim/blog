---
title: web安全相关-HTTP头部
date: 2016-05-9 21:02:49
tags:
- 网络安全
- HTTP
desc: web safe,web安全,网络安全,http,http安全头部
---

Security - Elephant in the room，指显而易见而又被忽略的事实。用这个短语形容`web`安全，不能更生动形象。最近项目涉及到一些`web`安全的东西，就来总结一下相关的HTTP安全头部。

<!--more-->

## [Content-Security-Policy](http://content-security-policy.com/)

**作用**：防止的内容注入（减缓了`XSS`攻击，恶意`iframe`注入）

**不足**：目前只支持现代浏览器，对浏览器有要求，要求如下：

header | Chrome | FireFox | Safari |  Internet Explorer
---|---|---|---|---|
Content-Security-Policy `CSP Level 2` | 40+ Full January 2015 | 31+ PartialJuly 2014 | - | -
Content-Security-Policy `CSP 1.0` | 25+ | 23+ | 7+ | Edge 12 build 10240+

**分析**：
1. 由于HTML的`img`、`script`、`css`是可以跨域的，这就导致了XSS缺陷。CSP可以设置`default-src`、`script-src`、`img-src`等等来限制HTML资源的加载

2. `script-src`可以设置两个特殊的值（`unsafe-inline`、`unsafe-eval`）。`unsafe-inline`代表不能执行内`script`，这就对`XSS`增添了一次防御，不过这样对开发人员有一定的规范。`unsafe-eval`则是代表不能执行`eval`方法(这是一个比较BUG级的函数，它会把传入的参数全部当做`JS`代码解释并且执行)
3. `sandbox`沙盒则适用于同源策略的`webapp`，可以限制新标签页面打开等等。
4. `report-uri`这个属性可以设置一个`URL`，然后会把`CSP`的失败信息`POST`到这个`URL`。我们则可以记录这个有用的信息用来安全性分析。


## [Strict Transport Security](https://developer.mozilla.org/en-US/docs/Web/Security/HTTP_strict_transport_security)

```
Strict-Transport-Security: max-age=expireTime [; includeSubDomains] [; preload]
```
**作用**：告诉浏览器接下来的一定时间内（自己设置）只能用`HTTPS`访问。这个只会让用`HTTPS`访问的用户继续使用`HTTPS`。而HTTP访问的则无效。

**分析**：研究了一下alipay.com的做法。用户输入的时候，绝大部分都不会手动输入`HTTPS`。所以第一次访问的时候，都是以`HTTP`访问，这时负载服务器就应该返回一个`301`跳转给客户端，让客户端跳转到`HTTPS`的服务下。由于有了`HSTS`的头部，下次用户再次以`HTTP`访问的时候，浏览器会自己做`307`跳转到`HTTPS`请求。

**实际开发遇到的问题**：

由于公司使用阿里云的`SLB`负载均衡，无法实现`301`跳转，于是使用了`node`再开启一个服务，用于接受来自`SLB`80端口的请求，然后返回一个`301`状态码并在`Location`头部加上`HTTPS`的地址。真正的`node`服务只接受`SLB`443接口的请求。

## [X-Content-Type-Options](https://msdn.microsoft.com/en-us/library/gg622941.aspx)
```
X-Content-Type-Options: nosniff
```
**作用**：互联网上的资源有各种类型，通常浏览器会根据响应头的`Content-Type`字段来分辨它们的类型。例如：`text/html`代表html文档，`image/png`是PNG图片，`text/css`是CSS样式文档。然而，有些资源的`Content-Type`是错的或者未定义。这时，某些浏览器会启用`MIME-sniffing`来猜测该资源的类型，解析内容并执行。

例如，我们即使给一个`html`文档指定`Content-Type`为`text/plain`，在`IE8`中这个文档依然会被当做`html`来解析。利用浏览器的这个特性，攻击者甚至可以让原本应该解析为图片的请求被解析为`JavaScript`。

**实际开发遇到的问题**：

在IE下图片验证码不能显示。  
分析后得出，是因为图片验证码返回的时候没有返回`content-type`这个文件类型的头部。所以`IE`不能识别文件类型。  
解决办法是修改图片验证码插件在返回图片是增加头部`content-type`：`image/jpg`

## 参考：

- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)

- [Express.js官方的安全性最佳实践指导](http://expressjs.com/en/advanced/best-practice-security.html)

- [xss攻击入门](http://www.cnblogs.com/bangerlee/archive/2013/04/06/3002142.html)
