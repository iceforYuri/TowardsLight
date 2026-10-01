---
title: 给博客加上公式渲染:KaTeX 的构建期方案
description: 行内公式、块级公式、标题里的公式,一次配好。构建期渲染成 HTML,不往浏览器多送一个字节的 JS。
pubDate: 2026-09-07
category: 博客搭建
tags: [Astro, KaTeX, Markdown, 排版]
cover: image/math-typesetting/wide.svg
coverAlt: 横向抽象渐变封面
coverPosition: center
draft: false
featured: false
---

技术文章绕不开公式。这个博客的方案是 `remark-math` 负责解析、`rehype-katex` 在构建期把公式渲染成 HTML,浏览器端零脚本。

## 行内与块级

行内公式用单个美元符号包裹,比如质能方程 $E = mc^2$,或者欧拉恒等式 $e^{i\pi} + 1 = 0$,都直接混排在文字里。

块级公式用双美元符号独占一段,比如标准正态分布的概率密度:

$$
f(x) = \frac{1}{\sigma\sqrt{2\pi}} \, e^{-\frac{(x-\mu)^2}{2\sigma^2}}
$$

再来一个求和式,记录一下博客的字数统计口径:

$$
\text{总字数} = \sum_{i=1}^{n} \text{len}(\text{post}_i)
$$

## 标题里也能放公式吗

可以。这一节的标题不含公式,但目录里那一节「附录:$\LaTeX$ 语法速查」是含的——目录目前显示的是公式源码,这是一个已知的取舍。

## 附录:$\LaTeX$ 语法速查

常用的就这几样:上下标 `x^2`、`x_i`,分数 `\frac{a}{b}`,根号 `\sqrt{x}`,求和 `\sum_{i=1}^{n}`,希腊字母 `\pi`、`\sigma`。KaTeX 支持的完整列表见其官方文档。

## 配图与点击放大

正文里的图片现在有柔和的光影层次,点击可以放大查看原图,按 ESC 或点击任意处关闭:

![横向抽象渐变封面示例](/images/covers/wide.svg)

## 实现要点

```js
// astro.config.mjs
markdown: {
  remarkPlugins: [remarkMath],
  rehypePlugins: [rehypeKatex],
}
```

KaTeX 的 CSS 和字体走 Vite 资产管线,首屏只加载一次。长公式在窄屏上横向滚动,不会撑破版心。
