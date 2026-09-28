/**
 * 个人档案脚手架:node scripts/new-profile.mjs <目标目录>
 * 生成一套可直接编辑的档案骨架(site.ts / links.ts / posts / images),
 * site.ts 与 links.ts 复制自内置 showcase 档案,作为字段参考。
 */
import fs from 'node:fs';
import path from 'node:path';

const target = process.argv[2];
if (!target) {
  console.error('用法: node scripts/new-profile.mjs <目标目录>');
  console.error('例:   node scripts/new-profile.mjs ../my-blog-data');
  process.exit(1);
}

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

console.log(`档案骨架已生成: ${dest}`);
console.log('');
console.log('接下来:');
console.log('  1. 编辑 site.ts(站点名/作者/bio/翻牌栏/分类配置)和 links.ts');
console.log('  2. 把 _模板.md 复制改名开始写,draft 改 false 即发布');
console.log('  3. 头像/封面图放进 images/,以 /images/... 引用');
console.log(`  4. 预览: SITE_PROFILE_DIR=${dest} npm run dev`);
