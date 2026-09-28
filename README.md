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

## 档案机制(展示站 / 个人站)

全站所有"属于身份"的内容——站点配置、技术链接、文章、图片——都收在**档案目录**里，代码通过 `src/profiles/active` 这个统一指向读取。档案按以下优先级解析：

1. **`SITE_PROFILE_DIR`**（环境变量或 `.env` 里一行）——显式指定，优先级最高
2. **`personal/`**（项目根目录，已 gitignore)——存在即自动命中；在里面 `git init` 就是独立的私有仓库，模板库永不跟踪
3. **`src/profiles/showcase/`**——内置示例，前两者都没有时的默认值，构建出来就是展示站

切换是整体替换而非字段合并——个人档案配错或缺字段会在构建期直接报错，示例数据没有机会漏进个人站。每次 dev/build 前日志会打印当前档案，不会静默切错。

```bash
node scripts/new-profile.mjs                 # 生成个人档案骨架(默认 ./personal)
npm run dev                                  # personal/ 存在即预览个人站
SITE_PROFILE_DIR=src/profiles/showcase npm run build   # 显式回切展示站
npm run build:personal                        # 个人站 → dist-personal/
```

档案目录结构(`site.ts`、`links.ts`、`posts/` 必填,`images/` 可选):

```text
my-blog-data/
├── site.ts      # 站名、作者、bio、Hero、状态、翻牌栏、分类图标配置
├── links.ts     # 技术链接目录
├── posts/       # Markdown 文章(draft: true 不发布)
└── images/      # 头像、封面、Hero 背景,以 /images/... 引用
```

个人档案可以放本地私有目录，也可以是独立私有仓库——它只含数据，模板更新由构建时拉取最新代码自动获得，无需合并。

## 目录结构

```text
├── astro.config.mjs          # Astro 配置(站点 URL、prefetch、Shiki 双主题)
├── scripts/
│   ├── use-profile.mjs       # 档案切换:维护 profiles/active 与 public/images 指向
│   └── new-profile.mjs       # 个人档案骨架脚手架
├── src/
│   ├── content.config.ts     # 内容集合 Schema(posts,源指向 profiles/active/posts)
│   ├── profiles/
│   │   ├── showcase/         # 内置示例档案(site/links/posts/images)
│   │   └── active -> ...     # 当前档案指向(junction,gitignore)
│   ├── data/
│   │   ├── site.ts           # 转发层:profiles/active/site
│   │   └── links.ts          # 转发层:profiles/active/links
│   ├── layouts/
│   │   └── BaseLayout.astro  # 页面壳层:head、主题初始化、导航、页脚
│   ├── components/           # 职责单一的组件
│   ├── pages/                # 路由:index / archive / tags / categories / links / posts / 404 / rss.xml
│   ├── styles/
│   │   ├── global.css        # 设计变量、双主题、基础排版
│   │   └── prose.css         # 文章正文排版(含代码块双主题)
│   └── utils/posts.ts        # 文章查询、日期格式化、标签/分类聚合
└── public/images -> ...      # 指向当前档案的 images/(junction,gitignore)
```

## 写一篇文章

在当前档案的 `posts/` 目录新建 `.md` 文件(默认为 `src/profiles/showcase/posts/`),frontmatter 遵循以下 schema(`src/content.config.ts`):

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
| 站名、作者、简介、导航、Hero 文案与背景、当前状态、翻牌栏、分类图标 | 当前档案的 `site.ts`(默认为 `src/profiles/showcase/site.ts`) |
| 技术链接目录(分组、图标、精选、状态) | 当前档案的 `links.ts` |
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

### GitHub Pages 双站自动化(推荐)

仓库内置两条流水线，覆盖"模板更新 + 内容更新"的全自动双站部署：

- **模板库** `.github/workflows/showcase.yml`:push 到 main → 构建展示站(内置 showcase 档案)→ 部署 Pages
- **个人库** `.github/workflows/deploy.yml`(`new-profile` 脚手架自动生成):push 文章/配置 → 拉模板库最新 main 构建个人站；另有每天定时同步模板 + 手动触发

个人库只含数据，模板永远在构建时现场拉取，所以**模板更新对个人库完全透明，无需任何合并/拉取动作**。

首次启用需要在两个仓库各自点一次：Settings → Pages → Source 选 **GitHub Actions**。之后全部自动。

| 部署相关变量 | 作用 | 默认值 |
| --- | --- | --- |
| `SITE_URL`(仓库 Variables) | 站点完整 URL,影响 RSS/canonical | 该库的 Pages 地址 |
| `SITE_BASE`(仓库 Variables) | 部署子路径(如 `/TowardsLight_context/`) | 项目页子路径 |

绑定自定义域名时把 `SITE_URL` 改为域名、`SITE_BASE` 改为 `/` 即可，内部链接全部是 base 感知的。

## 图标与字体

- 图标:内联 Lucide SVG(`src/components/Icon.astro`,只打包用到的图标,零运行时依赖)
- 字体:Google Fonts(Playfair Display / Noto Serif SC / Noto Sans SC / Inter / JetBrains Mono),`display=swap` + 系统字体回退

## License

MIT
