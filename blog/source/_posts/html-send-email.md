---
title: 使用html发送邮件
date: 2016-09-12 12:25:25
tags:
---

最近项目上的需求是在HTML上直接调用系统的邮件系统发邮件，并添加收件人，标题等信息。看似简单，其实开发过程中也遇到了一些问题，现在来总结一下。

<!--more-->

### 使用方法

- 直接用`a`标签，然后`href`属性设置协议为`mailto`即可。然后后面可以跟一些参数

```html
  <a href="mailto:xxx@qq.com?subject=这是标题&cc=这是抄送&body=这是正文内容">发送邮件</a>
```

- 其实和上面的方法差不多，不过是换了提交的方式，就是使用`form`表单，然后在`form`的`action`属性设置协议`mailto`即可。

```html
  <form action="mailto:xxx@qq.com" method="get">
    <input type="text" name="cc" value="这是抄送">
    <input type="text" name="subject" value="这是标题">
    <textarea name="body" cols="30" rows="10">这是内容</textarea>
    <button type="submit">发送邮件</button>
  </form>
```

- 如果需要多个收件人则只需要在邮箱地址之间加个逗号，比如：

```html
  <a href="mailto:xxx@qq.com,yyy@qq.com">发送邮件</a>
```

### 存在的问题

很多时候到这里本就应该结束的，但是生活就像心电图，不能一帆风顺，否则你就挂了。

由于需求的问题，需要自由输入邮件的内容，所有就没使用`a`标签（因为不想自己拼链接）。于是使用表单提交的方式，于是就出现了一下问题：

1. 在`textarea`的内容格式提交到邮件系统就乱了（换行什么的丢失了）

2. 在`ios`上出现的问题：点击发送的时候，safari浏览器提示“这是一张不安全的表单”。

**分析**：

出现问题1：是因为表单提交的时候没有编码，导致换行的信息丢失，使用`encodeURIComponent`
编码一下`textarea`的内容即可。

出现问题2：则是因为在生产上，我们是使用`https`协议的，如果表单提交到`mailto`这个协议，则是安全级别下降（猜测的），于是safari就提示不安全了。针对这个问题，我的解决办法是禁掉`form`表单的提交，自己使用`location.href`跳转（与此同时编码一下`textarea`的内容，则完美解决以上两个问题），这时就类似`a`标签的方式了。（其实这个时候倒不如使用`a`标签提交）

### 无法解决的问题

- 在微信上无法唤起邮件系统，因为被微信禁掉了（反而在QQ上正常唤起）




### 参考

- [HTML的电子邮件链接标签mailto用法详解](http://www.5icool.org/a/201003/308.html)