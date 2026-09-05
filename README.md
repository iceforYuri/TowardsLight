# 拾光集 · Personal Tech Blog

一个基于 **Astro 5** 的个人技术博客与数字个人空间。居中 Hero、悬浮胶囊导航、悬浮主内容卡片、双固定主题(明亮/深色)、内容集合驱动的归档/标签/分类,以及面向技术人员的个人链接目录。

## 特性

- **内容优先**:Markdown 写作,Content Collections + Zod schema 校验,`draft` 字段控制发布
- **双色固定主题**:语义化 CSS 变量,系统偏好探测 + localStorage 持久化,首帧无闪烁,View Transitions 软导航下主题不丢失
- **自动聚合**:归档(按年份)、标签、分类全部由文章自动生成,无需手工维护列表
- **阅读体验**:720px 正文列、中文优化排版、桌面粘性目录 + 移动端目录折叠、阅读进度条、上一篇/下一篇
- **技术链接目录**:分组 + 精选卡片/链接行两级形态,数据集中维护
- **克制的动效**:CSS 过渡 + Astro View Transitions,尊重 `prefers-reduced-motion`,几乎零客户端 JS
- **图片健壮性**:封面可选,支持焦点位置、加载失败自动降级为主题背景
- **Shiki 双主题代码高亮**:github-light / github-dark 随主题自动切换
- **RSS**:`/rss.xml` 自动生成

## 快速开始

```bash
npm install        # 安装依赖
npm run dev        # 开发服务器 http://localhost:4321
npm run build      # astro check + 生产构建 → dist/
npm run preview    # 本地预览构建产物
```

要求 Node.js ≥ 18.17(推荐 22+)。

## 目录结构

```text
├── astro.config.mjs          # Astro 配置(站点 URL、prefetch、Shiki 双主题)
├── src/
│   ├── content.config.ts     # 内容集合 Schema(posts)
│   ├── content/posts/        # 全部文章(Markdown)
│   ├── data/
│   │   ├── site.ts           # 站点配置:名称、简介、导航、Hero、状态、技术栈
│   │   └── links.ts          # 技术链接目录数据
│   ├── layouts/
│   │   └── BaseLayout.astro  # 页面壳层:head、主题初始化、导航、页脚
│   ├── components/           # 24 个职责单一的组件
│   ├── pages/                # 路由:index / archive / tags / categories / links / posts / 404 / rss.xml
│   ├── styles/
│   │   ├── global.css        # 设计变量、双主题、基础排版
│   │   └── prose.css         # 文章正文排版(含代码块双主题)
│   └── utils/posts.ts        # 文章查询、日期格式化、标签/分类聚合
└── public/images/            # Hero 背景、封面、头像、favicon
```

## 写一篇文章

在 `src/content/posts/` 新建 `.md` 文件,frontmatter 遵循以下 schema(`src/content.config.ts`):

```yaml
---
title: 文章标题
description: 摘要,会出现在列表和 meta 里
pubDate: 2026-09-05
updatedDate: 2026-09-06      # 可选
category: 前端               # 任意字符串,自动聚合成分类页
tags: [Astro, 博客]          # 自动聚合成标签页
draft: false                 # true 则不构建
cover: /images/covers/wide.svg  # 可选
coverAlt: 封面描述              # 可选
coverPosition: center 30%       # 可选,object-position 焦点
featured: false                 # 可选
---
```

更详细的说明见站内文章《如何在这个博客上写一篇文章》。

## 配置站点

| 配置项 | 位置 |
| --- | --- |
| 站名、作者、简介、导航、Hero 文案与背景、当前状态、技术栈 | `src/data/site.ts` |
| 技术链接目录(分组、图标、精选、状态) | `src/data/links.ts` |
| 双色主题变量(画布/表面/文字/边框/强调色/阴影) | `src/styles/global.css` 顶部 |
| 部署站点 URL(影响 RSS / canonical) | `astro.config.mjs` 的 `site` |

## 主题机制

只有 **Bright** 与 **Dark** 两套固定主题。主题由 `<html data-theme>` 驱动:

1. 首帧前内联脚本读取 `localStorage.theme`,无则跟随系统偏好——避免闪烁;
2. 切换时仅写 `data-theme` 并持久化,只做过渡色变化,不动布局;
3. View Transitions 软导航时,`astro:before-swap` 把当前主题复制到新文档,保证跨页面不丢失。

## 部署

任意静态托管均可(Vercel / Netlify / Cloudflare Pages / 自有服务器):

```bash
npm run build      # 产物在 dist/
```

记得把 `astro.config.mjs` 里的 `site` 改成真实域名。

## 图标与字体

- 图标:内联 Lucide SVG(`src/components/Icon.astro`,只打包用到的图标,零运行时依赖)
- 字体:Google Fonts(Instrument Serif / Noto Serif SC / Noto Sans SC / Inter / JetBrains Mono),`display=swap` + 系统字体回退

## License

MIT
