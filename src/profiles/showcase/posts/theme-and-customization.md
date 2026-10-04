---
title: 主题系统是怎么工作的,以及如何安全地微调它
description: 两套固定主题、语义化 CSS 变量、无闪烁切换的实现原理,以及想改颜色时应该动哪里、不动哪里。
pubDate: 2026-09-05
category: 博客搭建
tags: [CSS, 主题, 设计系统, 使用说明]
cover: /images/covers/wide.svg
coverAlt: 横向抽象渐变封面
coverPosition: center
draft: false
---

## 只有两套主题,这是故意的

本站不提供调色板、不提供自由配色,只有 Bright 和 Dark。约束的意义在于:每一套主题都被完整设计过——画布、卡片、边框、阴影、强调色在两种模式下都有明确的层次关系,而不是把亮色的变量机械地反相。

## 一切颜色都是语义变量

所有组件只引用语义变量,不写死颜色:

```css
--color-canvas    /* 页面最底层背景 */
--color-surface   /* 卡片、导航的表面 */
--color-surface-raised  /* 卡片内部的次级表面 */
--color-text / --color-muted
--color-border
--color-accent / --color-accent-soft
--color-contrast  /* 第二强调色,用于分类、状态 */
```

两套主题的全部差异,就收敛在 `src/styles/global.css` 顶部的两个声明块里。想换强调色,只需要改 `--color-accent` 和它的 soft 变体,全站自动生效。

## 无闪烁的实现

主题的完整生命周期:

1. **首帧前**:`<head>` 里的内联脚本同步读取 `localStorage.theme`,没有则跟随 `prefers-color-scheme`,在第一次绘制前把 `data-theme` 写到 `<html>` 上;
2. **手动切换**:导航上的切换按钮只改 `data-theme` 并写入 localStorage,过渡只有颜色插值,布局纹丝不动;
3. **软导航**:View Transitions 交换文档时,新文档的 `<html>` 来自服务端、不带主题属性,`astro:before-swap` 事件负责把当前主题复制过去——少了这一步,切页就会掉回默认主题。

## 微调时该动哪里

- **换强调色**:改两个主题块里的 `--color-accent` 系列,注意检查 accent-soft 的透明度在两种底色上都成立;
- **换字体**:改 `--font-display / --font-body / --font-ui / --font-mono`,并在 `BaseLayout.astro` 里同步更新字体加载链接;
- **调字号**:小字一律引用字号阶梯 `--text-xs / --text-sm / --text-md / --text-lg`(12px 是中文小字下限,不要再写散值),辅助小字字重用 `--weight-label`;纯中文标签/分类/状态类小字从 `--text-sm` 起步,`--text-xs` 只留给拉丁/数字;
- **调阴影**:导航和卡片用不同的阴影变量,深色主题下阴影更重,两套都要调;
- **不要动**组件内部——组件里不应该出现任何颜色字面量,如果出现了,那是组件的 bug。

## 代码高亮是独立的一层

代码块不走上面的变量,而是用 Shiki 的双主题(github-light / github-dark),通过 `--shiki-light` / `--shiki-dark` 这对 CSS 变量随主题切换。配置在 `astro.config.mjs` 的 `markdown.shikiConfig` 里,想换配色改那里即可。
