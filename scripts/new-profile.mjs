/**
 * 个人档案脚手架:node scripts/new-profile.mjs <目标目录>
 * 生成一套可直接编辑的档案骨架(site.ts / links.ts / posts / images),
 * site.ts 与 links.ts 复制自内置 showcase 档案,作为字段参考。
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const target = process.argv[2] ?? 'personal';
const dest = path.resolve(target);
if (fs.existsSync(dest) && fs.readdirSync(dest).length > 0) {
  console.error(`目标目录不为空: ${dest}`);
  process.exit(1);
}

const showcase = path.join(process.cwd(), 'src/profiles/showcase');
fs.mkdirSync(dest, { recursive: true });
fs.copyFileSync(path.join(showcase, 'site.ts'), path.join(dest, 'site.ts'));
fs.copyFileSync(path.join(showcase, 'links.ts'), path.join(dest, 'links.ts'));
fs.mkdirSync(path.join(dest, 'posts'));
fs.mkdirSync(path.join(dest, 'images'));

const templatePost = `---
title: '我的第一篇文章'
description: '一句话摘要,显示在文章列表和分享卡片里'
pubDate: ${new Date().toISOString().slice(0, 10)}
category: '随笔'
tags: ['标签一', '标签二']
# 没有封面就不写 cover;竖图可加 coverPosition: 'center 30%'
# cover: '/images/covers/example.png'
# coverAlt: '封面描述'
draft: true
---

从这里开始写正文。

\`draft: true\` 表示草稿,不会出现在任何页面;改成 \`false\` 才会发布。

分类(category)直接写新名字即可创建新分类;
想给它配图标和颜色,在 site.ts 的 categoryMeta 里加一条即可(不配则用默认样式)。
`;
fs.writeFileSync(path.join(dest, 'posts', '_模板.md'), templatePost);

// 部署流水线:从模板库的 git remote 解析 owner/repo,写入档案的 workflow
let templateRepo = '你的用户名/模板库名';
try {
  const url = execSync('git config --get remote.origin.url', { encoding: 'utf-8' }).trim();
  const m = url.match(/[:/]([^/:]+\/[^/]+?)(?:\.git)?$/);
  if (m) templateRepo = m[1];
} catch {
  /* 无 remote 时用占位符,用户自行替换 */
}
const deployYaml = `# 个人站流水线:本仓库只有数据,模板在构建时拉取公开库最新 main
name: 构建并部署个人站

on:
  push:
    branches: [main]
  schedule:
    - cron: '23 19 * * *' # 每天 UTC 19:23 同步模板最新代码
  workflow_dispatch:

permissions:
  pages: write
  id-token: write

concurrency:
  group: pages-personal
  cancel-in-progress: true

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          path: data
      - uses: actions/checkout@v4
        with:
          repository: ${templateRepo}
          path: site
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: site/package-lock.json
      - run: cd site && npm ci
      - name: 构建(数据目录指向本仓库)
        run: cd site && npm run build
        env:
          SITE_PROFILE_DIR: \${{ github.workspace }}/data
          SITE_URL: \${{ vars.SITE_URL || 'https://example.github.io/改成你的域名' }}
          SITE_BASE: \${{ vars.SITE_BASE || '/' }}
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: site/dist
      - uses: actions/deploy-pages@v4
`;
const workflowDir = path.join(dest, '.github', 'workflows');
fs.mkdirSync(workflowDir, { recursive: true });
fs.writeFileSync(path.join(workflowDir, 'deploy.yml'), deployYaml);

console.log(`档案骨架已生成: ${dest}`);
console.log('');
console.log('接下来:');
console.log('  1. 编辑 site.ts(站点名/作者/bio/翻牌栏/分类配置)和 links.ts');
console.log('  2. 把 _模板.md 复制改名开始写,draft 改 false 即发布');
console.log('  3. 头像/封面图放进 images/,以 /images/... 引用');
if (path.dirname(dest) === process.cwd()) {
  console.log('  4. 该目录在项目内且已被 gitignore;作为独立仓库维护:');
  console.log('     cd personal && git init && git remote add origin <你的私有库地址>');
  console.log('  5. dev/build 会自动命中 personal/,无需环境变量');
} else {
  console.log(`  4. 预览: SITE_PROFILE_DIR=${dest} npm run dev`);
}
