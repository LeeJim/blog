---
title: Web 与原生应用的常见通信方式
date: 2016-09-26 18:08:19
tags: 
desc: web与APP的交互,web,iOS,Andriod,addJavascriptInterface,WebViewJavascriptBridge,初始化分支
toc: true
categories:
- [前端基础]
---

在移动`web`开发过程中，一定会遇到`web`端与`APP`端交互的情况。下面就来分析下，`web`端到底是如何与`APP`端实现交互的。

在`APP`端，`iOS`和`Andriod`的实现方式各不一样。

大家都知道，我们的`javascript`大部分是运行在浏览器上的，这时浏览器的环境就是宿主环境(host environment)则给我们的`javascript`提供了`window`,`navigator`等宿主对象。

<!--more-->

### Andriod

在`Android`上，实现的方式就和上面这种方式类似，就是在`webview`上注册一个全局变量，然后我们再`js`直接调用即可。下面即表示在全局环境下定义了一个对象`androidEnv `:

```java
webview.addJavascriptInterface(object, "androidEnv");
```

#### web调用Andriod

`Andriod`在`webview`这个类里面定义的方法，我们在`js`都可以直接调用，这样就实现了`web`到`Andriod`的单向交互了，例如：

```js
AndriodEnv.sayHi(); //注意：sayHi是Andriod定义的方法
```

#### Andriod调用web

然后，如果我们要实现`Andriod`到`web`的单向交互呢，道理也一样。即是`js`定义一个全局的函数，然后`Andriod`就可以直接调用了：

```js
function globalFunc(){
  return 'hello Andriod';
}
```

### iOS

相反在`iOS`上，则没这么方便了，需要用到一个叫`WebViewJavascriptBridge`的桥接中间件。

在`js`上我们需要判断这个`bridge`是否已经注册，如果有就直接拿来使用；否则就监听一下`brideg`的变化，然后再使用。因此我们先封装好一个方法：

```js
function connectWebViewJavascriptBridge(callback) {
    if (window.WebViewJavascriptBridge) {
      callback(WebViewJavascriptBridge);
    }
    else {
      document.addEventListener('WebViewJavascriptBridgeReady', function() {
        callback(WebViewJavascriptBridge);
      }, false);
    };
  }
```

之后我们用一个`callback`来处理这个`bridge`：

```js
connectWebViewJavascriptBridge(function(bridge) {

    bridge.init(function(data, responseCallback) {});
    
});
```

到这个时候，基础工作就做完了，接下来就是`web`与`iOS`之间的交互了。

#### web调用iOS

```js
bridge.callHandler('ObjC Echo', {'key':'value'}, function responseCallback(responseData) {
    console.log("JS received response:", responseData)
})
```

其中，`ObjC Echo`是`iOS`上的对应方法（其实并不是函数，只是一个token），`{'key':'value'}`则是`web`传到`iOS`的参数，`responseData`则是`iOS`回传的数据。

这里还有另外一种方法，就是我们可以直接利用`bridge`的`send`方法，直接将所有东西都`send`过去给`iOS`即可，例如：

```js
var param = {
  "functionName" : "share",
  "params":{
    "title" : opt.title,
    "desc" : opt.desc
  }
};

connectWebViewJavascriptBridge(function(bridge) {

  bridge.send(param);
});

```

`send`可以接受两个参数，第二个参数就是回调函数了：

```js

connectWebViewJavascriptBridge(function(bridge) {

  bridge.send(param, function(data){
    callback(data);
  });

});
```


#### iOS调用web

```js
bridge.registerHandler('JS Echo', function(data, responseCallback) {
    console.log("JS Echo called with:", data)
    responseCallback(data)
})
```

这里的`JS Echo`则是`JS`上注册的一个方法名，当`iOS`执行玩这个方法，我们就可以马上监听到并接受到一些数据`data`，之后我们还可以执行`responseCallback`回调`iOS`告诉它我们的处理情况。

### 说说js代码

知道如何实现了之后，就涉及到软件工程的问题了。要如何编写代码结构，最优化实现我们的需求才是重中之重。首先先贴上一份代码，大家可以先考虑如何优化再往下看。

```js
jAPP = {
  getUserName: function(){
    if(inAPP) {
      if(iOS){
        //...
      }
      if(Andriod){
        //...
      }
    }
    else {
      //...
      console.log('请在APP内打开')
    }
  },

  getUserId: function(){
    if(inAPP) {
      if(iOS){
        //...
      }
      if(Andriod){
        //...
      }
    }
    else {
      //...
      console.log('请在APP内打开')
    }
  }
}
```

**我认为的缺点**：

- 重复判断设备信息，因为设备信息可以理解成`常量`，一经获取就不会更改，所以我们可以用`初始化分支`来优化。

- 重复判断是否在APP内。同样可以采用`初始化分支`来优化，也就是说不在`APP`内的话，调用的方法都不需要初始化了。

- `console.log`没有意义，只有在测试环境下能有，上生产应该去除。

### 优化

```js
var ua = navigator.userAgent().toLowerCase();
var inIOS = !!( ua.indexOf('iphone') > -1 || ua.indexOf('ipad') > -1 );
var inAndriod = !!( ua.indexOf('andriod') > -1 );
var inAPP = !!( ua.indexOf('your APP token') > -1 );
var jAPP = {};

if(inAPP) {
  
  if(inIOS) {
    jAPP.getUserId = function(){
      //..
    };
    jAPP.getUserName = function(){
      //..
    };
  }

  else if(inAndriod) {

    jAPP.getUserId = function(){
      //..
    };

    jAPP.getUserName = function(){
      //..
    };
  }
}
```

`初始化分支`的意思就是说在js脚本开始执行的的时候就确定好分支，而不是每次执行的时候才去确定分支。**好处**在于不用重复判断分支。

如果你有更好的做法，希望你可以在下方给大家分享一下。谢谢。

### 参考

> [JS与WebView交互存在的一些问题](http://www.jianshu.com/p/93cea79a2443)

> [WebViewJavascriptBridge](https://github.com/marcuswestin/WebViewJavascriptBridge)