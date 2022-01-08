---
title: 如果使用Node.js的Buffers
date: 2017-10-06 17:14:44
tags: 
- Node.js
- Buffers
desc: 
from: https://docs.nodejitsu.com/articles/advanced/buffers/how-to-use-buffers/
toc: true
categories:
- Node.js
---

# 为什么要有Buffers？

在纯`JavaScript`开发中，unicode编码的字符串也够好用的了，并不需要直接处理二进制数据(straight binary data)。在浏览器环境，大部分数据都是字符串的形式，这是足够的。然而，Node.js是服务器环境，必须要处理TCP流还有文件系统的读取和写入流，这就让`JavaScript`需要处理纯二进制数据了。

其实，要解决这个问题直接使用字符串也是可以的，这也是Node.js一开始的做法。然而，这样的做法有许多问题，也很慢。

所以，记住了，别使用二进制字符串(binary strings)，用**buffers**代替它！

<!-- more -->

# 什么是Buffers？

在Node.js里，Buffers是专门设计来处理原始二进制数据的，是Buffer这个类的实例。

每个buffer在V8引擎外都有内存分配。Buffer操作起来和包含数字的数组一样，但是不像数组那样自由设置大小的。并且buffer拥有一系列操作二进制数据的方法。

> 另外，buffer里的“数字”代表的是byte并且限制大小是0到255(2^8-1)

# 在哪里可以看到buffers

一般情况，buffer经常可以在读取二进制数据流的时候看到，比如`fs.createReadStream`

## 用法：

### 创建buffer

有许多方法可以生成新的buffers：

```js
var buffer = new Buffer(8);
```

> 这个buffer是未初始化的，且包含8个字节(bytes)。

```
var buffer = new Buffer([ 8, 6, 7, 5, 3, 0, 9]);
```

这个buffer用一个数组的内容来初始化。记住了，**数组里的数字表示的是字节(bytes)**

```
var buffer = new Buffer("I'm a string!", "utf-8")
```

通过第二个参数来指定编码(默认是utf-8)的字符串来初始化buffer。utf-8是在Node.js里最常用的编码，但是buffer还支持其他编码：

- "ascii"：这个编码方式很快，但是只限制ascii字符集。而且这个编码会将null转换成空格，而不像utf-8编码。
- "ucs2"：一种双字节，小端存储的编码。可以编码一个unicode的子集。
- "base64"：Base64字符串编码。
- "binary"：这个“二进制字符串”前面提到过，这个编码即将被弃用，避免使用这个。

### 写入buffer

#### 创建一个buffer：

```js
> var buffer = new Buffer(16);
```

开始写入字符串：

```
> buffer.write("Hello", "utf-8")
5
```

`buffer.write`的第一个参数是写入buffer的字符串，而第二个参数是这个字符串的编码方式。如果字符串的编码是utf-8，那么这个参数是多余的。

`buffer.write`返回5，这代表我们写入了5个字节到这个buffer。事实上，“Hello“这个字符串也刚好是5个字符。这是因为刚好每个字符都是8位(bits)。这对补全字符串很重要：

```js
> buffer.write(" world!", 5, "utf-8")
7
```

当`buffer.write`有3个参数的时候，第二个参数代表是偏移量，或者说是buffer开始写入的位置。

### 读取buffer

#### toString：

这个方法可能是读取buffer最通用的方法了，因为很多buffer都包含文本：

```js
> buffer.toString('utf-8')
'Hello world!\u0000�k\t'
```

再一次，第一个参数代表编码方式。这里可以看到并没有用完整个buffer。幸运的是，我们知道写入了多少字节到这个buffer，我们可以简单地增加参数去割开这个字符串：

```js
> buffer.toString("utf-8", 0, 12)
'Hello world!'
```

#### 独立字节：

你可以看到用类似数组的语法来设置独立位(individual bits)

```js
> buffer[12] = buffer[11];
33
> buffer[13] = "1".charCodeAt();
49
> buffer[14] = buffer[13];
49
> buffer[15] = 33
33
> buffer.toString("utf-8")
'Hello world!!11!'
```

在这个例子里，手动地设置剩余的字节，这样就代表了“utf-8”编码的“！”和“1“字符了。

## 更多有趣用法

### Buffer.isBuffer(object)

这个方法是检测一个对象是否是buffer，类似于`Array.isArray`

### Buffer.byteLength(string, encoding)

通过这个方法，你可以获取字符串(默认utf-8编码)的字节数。这个长度和字符串的长度(string length)不一样，因为很多字符需要更多的字节，例如：

```js
> var snowman = "☃";
> snowman.length
1
> Buffer.byteLength(snowman)
3
```

这个unicode的雪人只有两个字符，却占了3个字节。

### buffer.length

这个是buffer的长度，也代表分配了多少内存。这个不等于buffer内容的大小，因为buffer有可能是没满的，比如：

```js
> var buffer = new Buffer(16)
> buffer.write(snowman)
3
> buffer.length
16
```

在这个例子里，我们只写入了3个字符，但是长度依然是16，因为这是已经初始化了的。

### buffer.copy(target, targetStart=0, sourceStart=0, sourceEnd=buffer.length)

`buffer.copy`允许拷贝一个buffer的内容到另一个buffer。

第一个参数表示**目标buffer**，就是要写入内容的buffer。

另外一个参数是指定需要拷贝到目标buffer的开始位置。看个例子：

```js
> var frosty = new Buffer(24)
> var snowman = new Buffer("☃", "utf-8")
> frosty.write("Happy birthday! ", "utf-8")
16
> snowman.copy(frosty, 16)
3
> frosty.toString("utf-8", 0, 19)
'Happy birthday! ☃'
```

在这个例子，拷贝了含有3个字节长度的“snowman”buffer到“forsty”buffer。

其中forsty一开始写入了前16个字节，而snowman有3个字节长，因此结果就是19个字节长。

### buffer.slice(start, end=buffer.length)

这个方法的API可以说和`Array.prototype.slice`是一样的。

不过其中一个特别重要的区别是：这个slice方法不是简单地返回一个新的buffer，也不仅仅是内存中子集的引用。这个slice会改变原来的buffer！举例：

```js
> var puddle = frosty.slice(16, 19)
> puddle.toString()
'☃'
> puddle.write("___")
3
> frosty.toString("utf-8", 0, 19)
'Happy birthday! ___'
```

完。



