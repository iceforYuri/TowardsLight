# 🌇 拾光集 · TowardsLight

![Astro 5](https://img.shields.io/badge/Astro-5-BC52EE?logo=astro&logoColor=white)
![Node.js ≥ 18.17](<https://img.shields.io/badge/node.js-%3E%3D18.17-brightgreen>)
![License MIT](https://img.shields.io/badge/license-MIT-blue)

一处自己的赛博自留地：文章、链接、状态和正在做的事都收在这里。基于 Astro 5，内容与代码完全分离，配套的 [VS Code 扩展](https://github.com/iceforYuri/TowardsLight_extension)负责日常写作。

![首页](docs/screenshots/home-light.png)

## ✨ 为什么选择拾光集

它不只给一套页面，而是把内容组织、搜索发现、阅读体验、图片工程、主题系统和日常写作流程组合成一套完整方案：

| 方向 | 能力 |
| --- | --- |
| 内容组织 | 归档、标签、分类全部由文章自动聚合，草稿构建期隔离；文章、配置、链接、图片收进独立档案目录，一套代码同时产出展示站和你的自留地，模板升级零合并 |
| 搜索发现 | Fuse.js 全文搜索，Ctrl/Cmd+K 或 `/` 唤起，索引首次打开时懒加载，标题、标签、正文一体匹配 |
| 阅读体验 | 目录外挂与玻璃抽屉、阅读进度、图片灯箱、KaTeX 公式、双主题代码高亮、阅读时长与上下篇导航 |
| 图片工程 | 内容图片走资产管线自动优化；remark + vite 双层哨兵——缺图换占位并告警，换档案自动清缓存防交叉污染，一张缺席的图不会让全站 500 |
| 主题系统 | 语义化变量的明亮/深色双主题，首帧无闪烁、软导航不丢主题；[三色池](CONTEXT.md)管身份：褐红=站内主推，青绿=结构状态，钢蓝=链接与技术身份，中性即是灰 |
| 写作流程 | [配套 VS Code 扩展](https://github.com/iceforYuri/TowardsLight_extension)用 AST 就地改写配置（保留格式与注释）,dev server 账本制 + 日志面板，写作和预览不离开编辑器 |
| 交互细节 | 鼓包 Dock 导航、打字机统计行、翻牌状态栏、View Transitions 软导航，全部尊重 prefers-reduced-motion |

## 📸 界面

<p align="center">
  <img src="docs/screenshots/home-dark.png" alt="首页 · 深色" width="49%">
  <img src="docs/screenshots/links-light.png" alt="链接目录 · 亮色" width="49%">
</p>
<p align="center">
  <img src="docs/screenshots/links-dark.png" alt="链接目录 · 深色" width="49%">
  <img src="docs/screenshots/post-light.png" alt="文章页" width="49%">
</p>

## 🚀 快速开始

```bash
npm install        # 安装依赖
npm run dev        # 开发服务器 http://localhost:4321
npm run build      # astro check + 生产构建 → dist/
```

要求 Node.js ≥ 18.17（推荐 22+)。构建出来默认是内置的 showcase 示例档案；换成自己的内容见下面的档案机制。

## 🧩 档案机制

文章、站点配置、链接、图片这些"属于身份"的内容都收在一个**档案目录**里，代码通过 `src/profiles/active` 这个统一指向读取。按优先级解析：

1. `SITE_PROFILE_DIR` 环境变量（或 `.env` 里一行），显式指定
2. `personal/`（项目根目录，已 gitignore)，存在即命中；在里面 `git init` 就是独立的内容仓库，模板库永不跟踪
3. `src/profiles/showcase/`，内置示例，前两者都没有时的默认值

切换是整体替换：档案配错或缺字段会在构建期直接报错，示例内容不会漏进你的站。每次 dev/build 前日志会打印当前档案。

```bash
node scripts/new-profile.mjs                 # 生成档案骨架(默认 ./personal)
SITE_PROFILE_DIR=src/profiles/showcase npm run build   # 显式指定档案
```

档案目录结构（`site.ts`、`links.ts`、`posts/` 必填，`images/` 可选）:

```text
my-blog-data/
├── site.ts      # 站名、作者、简介、Hero、默认主题、状态、分类图标、页面文案与各页背景
├── links.ts     # 链接目录:分组、整组色调、图标、卡片形态、首页展示、状态
├── posts/       # Markdown 文章
│   └── image/   # 文章级图片,按文章名归档,相对路径引用
└── images/      # 站点级图片:头像、Hero/页面背景、共用封面,以 /images/... 引用
```

两个使用注意：

- junction 切换对运行中的 dev server 不生效。切换指向后重启 dev server，否则内容和图片会错位。
- 同一目录同时只能跑一个档案（Astro 的内容缓存路径写死在项目根）。想并排对照两个档案，用 `git worktree` 开第二个工作副本，各自独立。

## 📝 写一篇文章

在档案的 `posts/` 下新建 `.md`:

```yaml
---
title: 文章标题
description: 摘要,会出现在列表和 meta 里
pubDate: 2026-09-05
updatedDate: 2026-09-06      # 可选
category: 前端               # 任意字符串,自动聚合成分类页
tags: [Astro, 博客]          # 自动聚合成标签页
draft: false                 # true 则不构建
cover: /images/covers/wide.svg  # 可选;相对路径(如 image/my-post/cover.jpg)跟着文章走
coverAlt: 封面描述              # 可选
coverPosition: center 30%       # 可选,object-position 焦点
featured: false                 # 可选
---
```

更详细的说明见站内文章《如何在这个博客上写一篇文章》。

## 🎛️ 配置站点

| 配置项                                                                                  | 位置                                                                   |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 站名、作者、简介、导航、Hero 文案与背景、页面文案与各页背景、当前状态、翻牌栏、分类图标 | 档案的`site.ts`                                                      |
| 链接目录（分组、整组色调、图标、卡片形态、首页展示、状态）                              | 档案的`links.ts`(`featured`=大卡片，`home`=首页展示，最多 3 个） |
| 主题变量（画布/表面/文字/边框/强调色/阴影）                                             | `src/styles/global.css` 顶部                                         |
| 站点 URL（影响 RSS / canonical)                                                         | `astro.config.mjs` 的 `site`，或部署时 `SITE_URL` 环境变量       |

主题由 `<html data-theme>` 驱动：首帧前的内联脚本读 `localStorage.theme`，没有就跟随系统；切换只写 `data-theme` 并持久化；软导航时 `astro:before-swap` 把主题复制到新文档。

## ⚡ 命令

| 命令                    | 作用                                              |
| ----------------------- | ------------------------------------------------- |
| `npm run dev`         | 启动开发服务器（localhost:4321)                   |
| `npm run build`       | 类型检查 + 生产构建到`dist/`                    |
| `npm run preview`     | 本地预览构建产物                                  |
| `npm test`            | 图片哨兵的单元测试                                |
| `npm run new-profile` | 生成个人档案骨架                                  |
| `npm run astro ...`   | 运行 Astro CLI（如`astro add`、`astro check`) |

## 🚢 部署

任意静态托管（Vercel / Netlify / Cloudflare Pages / 自有服务器）:`npm run build` 的产物在 `dist/`。域名或子路径有变化时用 `SITE_URL` / `SITE_BASE` 环境变量覆盖，内部链接全部是 base 感知的。

## 🔗 相关项目

- [TowardsLight_extension](https://github.com/iceforYuri/TowardsLight_extension):配套 VS Code 扩展。侧边栏管理文章、分类、链接和站点配置，真实 dev server 一键预览，写作不用离开编辑器

## 🎨 图标与字体

图标是内联 Lucide SVG(`src/components/Icon.astro`，只打包用到的）。字体走 Google Fonts(Playfair Display / Noto Serif SC / Noto Sans SC / Inter / JetBrains Mono),`display=swap` 加系统字体回退。

## 📄 License

MIT
