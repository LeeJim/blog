---
title: 当 TDesign 小程序遇上 GitHub Actions
date: 2022-12-10 12:11:49
tags:
- 小程序
categories:
- [小程序]
- 前端工程化
toc: true
---

在微信小程序刚发布那会，要想做自动化，都必须有 hack 开发者工具的能力才能做到，而且在 Linux 系统没有开发者工具，需要使用 windows 或 macOS。好在微信也明白开发者的痛点，在小程序发布了 3 年之后的 2020 年提供了 [CI](https://developers.weixin.qq.com/miniprogram/dev/devtools/ci.html) 的能力。

在 TDesign 正式开源的前半年，我们投入在自动化这些基础实施的人力比较多，可以分享的内容也挺多，这里主要分享小程序相关的自动化，并且是在 GitHub Actions 上的实现。

<!-- more -->

## 自动上传体验版

在 TDesign 小程序组件库的开发中，比较早期做的CI 能力是自动上传体验版，我也封装了一个 GitHub Actions 可以直接使用：[LeeJim/setup-miniprogram](https://github.com/LeeJim/setup-miniprogram)。

我们的发布流程是这样的：

![开发流程](/blog/images/mp-github-action/dev-flow.png)

> 其中生成 CHANGELOG 也是发布的痛点，这个能力主要是 @lucaszzhou 实现的，后面他可能会分享了相关实现，我再补充下链接。大家可以期待一下。

可以看到，整个发布流程，我只需要修改 package.json 的版本号，后面的流程几乎都是自动操作的。

### 上传密钥

其中，**上传小程序** 这块，需要有上传密钥，具体路径：[微信公众平台](https://mp.weixin.qq.com/) - 开发管理 - 开发设置 - 小程序代码上传密钥。

由于密钥是敏感的信息，不能放在代码里明文展示，因此需要使用到 GitHub 的 secret。具体路径：Settings - Secrets - Actions - Repository secrets

![GitHub 密钥路径](/blog/images/mp-github-action/github-secrets.png)

将在微信公众平台下载下来的密钥保存到这里，然后起一个对应的 secret name 即可。使用的时候，在 GitHub Actions 的 `yml` 文件里可以这样使用，以下以 tdesign-miniprogram 举例：

![miniprogram-action](/blog/images/mp-github-action/github-workflows.png)

### 小程序版本关系

小程序的有 3 种版本：开发版、体验版、正式版。体验版和正式版都只有一个，开发版可以有多个，对应的关系是这样的：

![小程序版本关系](/blog/images/mp-github-action/miniprogram-version.png)

这里需要特别提醒的一点是，**开发版是可以覆盖的，体验版的关系也会继承**。这里如何决定哪个版本覆盖哪个版本，取决于上传时的 CI 机器人编号，而开发者工具无法选择，因此开发者工具上传的开发版会一直覆盖。

所以这个流水线的体验版可以自动覆盖，不需要手动选择，也是基于这个原理。

## 自动预览

由于 TDesign 小程序组件库的开发环境依赖许多编译工具，因此在验收开发者提交的 PR 时需要 `执行构建 - 打开开发者工具 - 点击预览` 一系列操作，才能开始扫码体验，较为繁琐。

> 如果是设计师验收的话，还需要搭开发环境，非常不合理。

另外更麻烦是，小程序的开发版二维码有时效限制（开发者工具显示时效 25 min）。因此没有办法像常规 Web 开发那样，在 PR 的各种检测相关流水通过之后构建出一个产物，后续随时可以验收。

### Web 预览方案

作为对比，可以先看一下 TDesign Web Vue 的 PR 流程：

![TDesignWeb 预览流程](/blog/images/mp-github-action/tdesign-web-preview.png)

可以看到每当 PR 创建或者同步时，都会触发构建官网，这样每次都能预览该 PR 最新的代码，用以验收。对应的预览评论如下：

![web预览地址](/blog/images/mp-github-action/github-comment-1.png)

### 小程序预览方案

因为二维码的时效限制，所以小程序的预览不能直接借鉴 Web 的方式，只能在需要验收的时候再构建，这就需要一个触发构建的开关。

我把这个开关定义成：**在 PR 上评论 “预览” 二字** 。

以下是触发的过程：

![小程序预览方案1](/blog/images/mp-github-action/github-comment-2.png)

因为构建需要一定的时间，因此先通过 Comment 告知构建已在进行。等构建成功之后，就会用二维码将这个 Comment 替换掉。

![小程序预览方案2](/blog/images/mp-github-action/github-comment-3.png)

以上就是小程序预览方案的大体过程。

不过在实现这个方案的时候也遇到了不少坑，这里也顺便分享一下。

## GitHub Actions 避坑

### 获取 PR 对应的代码

因为这个功能使用的是 `issue_comment: created` 这个触发事件。因此需要判断这个 comment 是属于 PR ，并需要获取 Comment 对应的 PR 信息。

判断 Comment 是否属于 PR 比较容易，判断这个环境变量是否存在即可：``${{ github.event.pull_request }}``。

#### 获取 PR 信息

但是，可能是因为触发事件的缘故，没法直接通过 ``${{ github.event.pull_request.head.sha }}`` 获取这个 PR 对应的 Commit SHA。

通过搜索，发现了一个 Action 可以通过 GitHub 的 graphQL 获取对应 PR 的信息：[xt0rted/pull-request-comment-branch](https://github.com/xt0rted/pull-request-comment-branch)

但是，这个 Action 又忽略了另外一个重要的问题：**PR 的 base branch 可能是 fork 的仓库**，它没有返回对应的仓库信息。因此我又基于这个 Action 封装了新的 Action：[LeeJim/pull-request-comment-branch](https://github.com/LeeJim/pull-request-comment-branch)

至此，基于 [actions/checkout](https://github.com/actions/checkout) 和 [LeeJim/pull-request-comment-branch](https://github.com/LeeJim/pull-request-comment-branch) 才完成了指定评论对应的 PR 对应的代码克隆工作：

```yml
- uses: LeeJim/pull-request-comment-branch@main
  id: comment-branch
- uses: actions/checkout@v3
  if: success()
  with:
    ref: ${{ steps.comment-branch.outputs.head_ref }}
    repository: ${{ steps.comment-branch.outputs.head_repo_name_with_owner }}
```

### 小程序预览

之前实现小程序发布的时候，因为各种问题也自己实现了一个 Action：[LeeJim/setup-miniprogram](https://github.com/LeeJim/setup-miniprogram)。

因此本次就在这个 Action 的基础上，支持了预览的功能，返回了对应的预览二维码。

### 给评论加图片

因为小程序上传之后，可以选择返回 base64 或 jpg 格式的图片，为了避免图床的问题，因此我就想当然地选择 base64。后来才发现 GitHub 的 MarkDown 因为安全限制的问题，不支持 base64 的图片。因此我需要使用另外的图床。

#### 腾讯云 COS

此时，我的想法也很简单，直接使用腾讯云 COS 发布的 Action 上传就完事。结果在 GitHub 上找到的 Action 都是上传完不返回地址的。于是，我又需要创建
一个新的 Action：[LeeJim/tencent-cos-action](https://github.com/LeeJim/tencent-cos-action)，将上传的地址返回。

### 评论替换

给指定 PR 添加 Comment 使用的 Action：[thollander/actions-comment-pull-request](https://github.com/thollander/actions-comment-pull-request)。

该 Action 提供了 Comment 的功能，但我遇到的坑是文档和版本不一致。所以此刻就觉得 GitHub Actions 设计的巧妙且简单，当遇到问题的时候，可以直接去看对应的代码实现。

替换的功能是通过 `comment_tag` 的参数来实现。原理也很简单，就是如果有传 `comment_tag` 的话，就会查找这个 PR 对应的所有 Comment 是否存在这个 tag，有的话就直接替换，没有就创建一个新的 Comment。

这里有一个技巧就是：将这个 tag 通过 `<!-- ${{tag}} -->` 包装了，因此在 Comment 也看不到这个 tag。

以下是 [TDesign Miniprogram](https://github.com/Tencent/tdesign-miniprogram/blob/develop/.github/workflows/preview.yml) 自动预览功能的完整实现：

```yml
name: PREVIEW

on:
  issue_comment:
    types: [created]

jobs:
  request-preview:
    runs-on: ubuntu-latest
    if: github.event_name == 'issue_comment' &amp;&amp; github.event.issue.pull_request &amp;&amp; github.event.comment.body == '预览'
    steps:
      - run: |
          timestamp=$(date +%s)
          echo "timestamp=${timestamp}" >> $GITHUB_OUTPUT
        id: time
      - name: Comment PR
        uses: thollander/actions-comment-pull-request@v2
        with:
          message: |
            正在构建预览的二维码，请稍等...
          comment_tag: ${{steps.time.outputs.timestamp}}
      - uses: LeeJim/pull-request-comment-branch@main
        id: comment-branch
      - uses: actions/checkout@v3
        if: success()
        with:
          ref: ${{ steps.comment-branch.outputs.head_ref }}
          repository: ${{ steps.comment-branch.outputs.head_repo_name_with_owner }}
      - uses: ./.github/actions/install-dep
      - run: npm run build
        shell: bash
      - name: get preview qrcode
        id: preview
        uses: LeeJim/setup-miniprogram@main
        with:
          project_type: miniProgram
          action_type: preview
          project_path: ./_example
          es6: true
          es7: true
          minify: true
        env:
          MINI_APP_ID: ${{ secrets.TDESIGN_APP_ID }}
          MINI_APP_PRIVATE_KEY: ${{ secrets.TDESIGN_MINI_KEY }}
      - name: Upload qrcode to Tencent COS
        uses: LeeJim/tencent-cos-action@main
        id: cos
        with:
          secretId: ${{ secrets.TENCENT_COS_SECRET_ID }}
          secretKey: ${{ secrets.TENCENT_COS_SECRET_KEY }}
          bucket: mp-qrcode-1255404841
          region: ap-guangzhou
          content: ${{ steps.preview.outputs.preview-qrcode }}
      - name: Comment PR
        uses: thollander/actions-comment-pull-request@v2
        with:
          message: |
            <img alt="qrcode" src="${{ steps.cos.outputs.url }}" width="256" />
          comment_tag: ${{steps.time.outputs.timestamp}}
```


> 最后提醒一下，GitHub Actions 对 Public 的仓库是没有 CI 运行累计时长的限制，而 Private 的仓库只能几千分钟的 CI 累计时长，这个需要注意。



