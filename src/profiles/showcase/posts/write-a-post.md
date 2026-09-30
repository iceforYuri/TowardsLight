---
title: 如何在这个博客上写一篇文章
description: 本站的内容模型说明:新建一个 Markdown 文件,填好 frontmatter,剩下的归档、标签、分类、RSS 全部自动生成。
pubDate: 2026-09-05
category: 博客搭建
tags: [Astro, 写作, 内容模型, 使用说明]
draft: false
featured: true
---

## 新建文章

在 `src/content/posts/` 目录下新建一个 `.md` 文件,文件名就是文章的 URL。例如 `write-a-post.md` 对应 `/posts/write-a-post`。建议用英文小写加连字符命名,中文文件名也能工作,但 URL 会被编码,不够好看。

## frontmatter 字段

每篇文章顶部的元数据由 `src/content.config.ts` 里的 schema 校验,写错字段名会在构建时直接报错:

```yaml
---
title: 文章标题
description: 一句话摘要,出现在列表、文章头部和 RSS 里
pubDate: 2026-09-05        # 发布日期,决定归档和排序
updatedDate: 2026-09-06    # 可选,更新日期
category: 博客搭建          # 一个字符串,同名自动归入同一分类
tags: [Astro, 写作]        # 数组,同名自动归入同一标签
draft: false               # true 时整篇不进入构建
cover: /images/covers/wide.svg  # 可选封面
coverAlt: 封面的描述文字          # 有封面时建议填写
coverPosition: center 30%       # 可选,裁切焦点
featured: false                 # 可选,预留的精选标记
---
```

## 关于封面

封面是可选的,没有封面的文章照样完整——文章页顶部会退化为一块较矮的纯色区域。封面有两种放法:

1. **跟着文章走(推荐)**:图片放进 `posts/image/<文章名>/`,frontmatter 里写相对路径,例如 `cover: image/my-post/cover.jpg`。图片和文章在同一棵子树下,删文章时图片一起走;
2. **站点级图床**:图片放进档案的 `images/covers/`,用绝对路径引用,例如 `cover: /images/covers/wide.svg`。适合多篇文章共用一张封面。

两种方式都以 `/` 开头与否区分,可以混用。另外还有两点:

- 横向图最稳妥;竖向图只显示中间一段,用 `coverPosition` 调整焦点位置;
- 图片加载失败时页面会自动降级为纯色背景,不会出现裂图。

正文插图同理:直接粘贴或把图片放进 `posts/image/<文章名>/`,用相对路径引用,例如 `![描述](image/my-post/benchmark.png)`。相对路径的图片会经过 Astro 的资产优化管线。

## 草稿与发布

写作中的文章把 `draft` 设为 `true`,它不会出现在构建产物里,也不会进入归档、标签和 RSS。写完后改成 `false`,执行:

```bash
npm run build
```

归档页、标签页、分类页、首页的近期文章列表都会自动更新,不需要手工维护任何索引。

## 排版约定

- 正文从 `##` 开始分节,`##` 和 `###` 会进入右侧目录;
- 代码块标注语言,例如 ` ```ts `,高亮主题会随全站明暗自动切换;
- 表格、脚注、引用都已被样式覆盖,直接用 Markdown 写即可;
- 摘要尽量控制在两句话以内,超长摘要系统也能消化,但列表里会被截断。
