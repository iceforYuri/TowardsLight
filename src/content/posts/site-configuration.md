---
title: 站点配置都放在哪:site.ts 与 links.ts
description: 站名、简介、导航、Hero、当前状态、技术栈和链接目录,全部集中在两个数据文件里,改内容不需要碰组件。
pubDate: 2026-09-05
category: 博客搭建
tags: [Astro, 配置, 使用说明]
draft: false
---

## 原则

这个博客把「会变的内容」和「不变的组件」分开:站名、简介、导航、链接这些数据集中在 `src/data/` 下的两个文件里,组件只负责渲染。换成你自己的信息,十分钟就能完成。

## site.ts:站点本身

`src/data/site.ts` 维护站点的全部基础信息:

```ts
export const site = {
  siteName: '拾光集',          // 出现在标题、导航、页脚
  author: '陈拾光',
  bio: '...',                  // 首页介绍
  navigation: [...],           // 顶部胶囊导航的项目
  homeHero: {
    greeting: '拾光集',        // Hero 大标题
    tagline: '...',
    intro: '...',
    background: '/images/hero-bg.svg',  // 留空则纯色
  },
  pageBackdrops: { archive: '', tags: '', ... },  // 各页顶部背景,留空即纯色
  currentStatus: {
    mode: 'building',          // writing / building / available / offline
    text: '正在把这个博客迁到 Astro',
  },
  stack: ['Astro', 'TypeScript', ...],   // 首页的技术栈徽章
};
```

几个细节:

- `currentStatus.mode` 决定状态徽章上小圆点的颜色,`text` 支持短句,移动端会自动截断;
- `homeHero.background` 留空字符串,Hero 就是纯主题色背景,构图依然成立;
- `pageBackdrops` 同理,只为需要氛围的页面配置。

## links.ts:技术链接目录

`src/data/links.ts` 是 Links 页的唯一数据来源。每条链接的结构:

```ts
{
  title: 'GitHub',
  description: '代码、实验和一些开源小项目',
  href: 'https://github.com',
  group: 'Code',        // 决定它出现在哪个分组
  icon: 'github',       // 图标名,见 Icon.astro 的图标表
  external: true,       // 新标签页打开 + 外链箭头
  featured: true,       // 精选:卡片形态,且会出现在首页
  status: '每天使用',    // 可选的状态徽章
}
```

分组顺序由文件里的 `linkGroups` 数组决定;首页只展示 `featured: true` 的前三条,所以精选别贪多。

## 图标不够用怎么办

图标是内联的 Lucide SVG,集中登记在 `src/components/Icon.astro` 的 `icons` 表里。需要新图标时,到 lucide.dev 复制路径数据加进表里即可,不会引入任何运行时依赖。
