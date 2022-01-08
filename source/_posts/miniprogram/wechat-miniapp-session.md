---
title: 小程序 Session
date: 2017-07-18 23:26:51
tags:
- 小程序
- Session
desc:
toc: true
categories:
- 小程序
---

最近刚完成了一项小程序的开发任务。彻彻底底地从零开始，其中遇到了不少坑要填，因此来总结一下，希望能帮助到其他人，避免重复踩坑。

<!-- more -->

## 登录态维护

每个人开发小程序，都希望用户能持续使用自己开发的小程序，那么维护用户的登录态就是首要的任务。

### 无cookie

首先，第一个需要踩的坑就是无`cookie`的登录态要如何维护。

微信官方提供了一个流程图，我们可以先看看：

![微信官方登录时序图](https://mp.weixin.qq.com/debug/wxadoc/dev/image/login.png?t=2017712)

简而言之：
1. 在小程序上通过`wx.login()`获取`code`
2. 将`code`传到自己的服务器，然后将小程序的`secret`和`appid`与微信服务器交换`openid`和`session_key`
3. 将`session_key`加上随机数生成`sessionId`，然后`openid`和`session_key`存在`session`里
4. 小程序将`sessionId`存起来，每次访问都带上这个`sessionId`

### 小程序获取code

在小程序的`app.js`文件里，`onLaunch`函数调用我们写好的`login`函数：

```js
wx.login({
  success: function (loginResult) {
    wx.getUserInfo({
      withCredentials: true,
      success: function (userResult) {
        // doLogin 就是将这些数据发送到服务器
        doLogin(null, {
            code: loginResult.code,
            encryptedData: userResult.encryptedData,
            iv: userResult.iv
        })
      }
    })
  }
})
```

服务器接受到这些数据，就可以和微信服务器交换数据了，这时我们拥有的数据就是`openid`和`session_key`。

### 解密用户信息

通过小程序传过来的和`encryptedData`和`iv`，然后还有刚才获取的`session_key`，我们就能解密用户的信息，通过对比解密出来的`openid`和微信交换来的`openid`对比，即可知道用户信息的正确性。

### sessionId生成：

```js
function generateSessionId() {
  return crypto.randomBytes(32).toString('hex')
}
```

按理说，我们生成了`sessionId`，然后将对应的用户信息存在`session`里就大功告成了。

但是这样的话，很容易被伪造的暴力的伪造`sessionId`攻击。因此，需要再进一步，生成另外一个校验数据称为`sessionkey`简称`sKey`，这时就使用到刚获取到的`session_key`：

```js
function generateSkey(sessionKey) {
  const sha1 = (message) => {
      return crypto.createHash('sha1').update(message, 'utf8').digest('hex')
  }

  return sha1(appid + secret + sessionKey)
}
```

此时我们的`session`的`key`就是一个前面随机生成的`sessionId`。`value`则为：

```js
{
  userinfo,
  session_key,
  sKey
}
```

然后每次`sessionId`传递过来的时候，我们获取对应的`session_key`，然后调用`generateSkey`生成`sKey`，然后和`session`里面的`sKey`对比即可。

此时，`session`的生成大功告成了！

### 两个登录态的问题

首先，调用微信生成的code的`login()`函数是有时效的，大概5分钟。

我们生成的`session`也是有时效的。这样就有两个登录态任一出现失效的情况。因此我们需要处理两个的失效问题。

#### 小程序登录态

官方提供了`wx.checkSession()`方法给我们验证登录态是否失效。因此这个失效的话，我们就重新调用之前写好的`login`函数

#### session失效

这个失效的问题就比较麻烦。很有可能就是发送某一个请求的时候发现`session`失效了。

因此我们可以在`app.js`的`onShow()`里发送请求到服务器测试`session`是否过期。过期的话就重新调用`login`函数。
