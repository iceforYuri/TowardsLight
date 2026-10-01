/**
 * image-guard 的 vite 层单元测试:直接驱动插件钩子,不依赖 dev server。
 * 用法:node scripts/test-image-guard.mjs
 */
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { remarkImageGuard, viteImageGuard } from '../src/plugins/image-guard.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tl-image-guard-'));

let passed = 0;
function ok(name) {
  passed++;
  console.log(`  ✓ ${name}`);
}

// ── vite 层:load 净化 content-assets.mjs ──
const postsDir = path.join(tmp, 'src', 'profiles', 'active', 'posts');
fs.mkdirSync(path.join(postsDir, 'image', 'a'), { recursive: true });
fs.writeFileSync(path.join(postsDir, 'ok.md'), 'x');
fs.writeFileSync(path.join(postsDir, 'image', 'a', 'real.png'), 'png');

const goodId = 'image/a/real.png?astroContentImageFlag=&importer=src%2Fprofiles%2Factive%2Fposts%2Fok.md';
const badId = 'image/ghost/missing.png?astroContentImageFlag=&importer=src%2Fprofiles%2Factive%2Fposts%2Fgone.md';
const assetsFile = path.join(tmp, 'content-assets.mjs');
fs.writeFileSync(
  assetsFile,
  `import __GOOD__ from "${goodId}";\nimport __BAD__ from "${badId}";\nexport default new Map([[${JSON.stringify(goodId)}, __GOOD__], [${JSON.stringify(badId)}, __BAD__]]);\n`,
);

const warnings = [];
const origWarn = console.warn;
console.warn = (...args) => warnings.push(args.join(' '));

const plugin = viteImageGuard();
plugin.configResolved({ root: tmp });
const out = plugin.load(assetsFile);

console.warn = origWarn;
assert.ok(out, '有坏条目时 load 返回净化后的模块');
assert.ok(out.includes('__GOOD__'), '好条目保留');
assert.ok(!out.includes('__BAD__'), '坏条目被摘除');
assert.ok(!out.includes('ghost'), '坏引用不出现在输出里');
assert.ok(warnings.some((w) => w.includes('image-guard') && w.includes('ghost')), '摘除时打出告警');
ok('load 净化 content-assets.mjs(摘坏留好 + 告警)');

// 干净模块原样放行(返回 null)
const cleanFile = path.join(tmp, 'clean-assets.mjs');
fs.writeFileSync(cleanFile, `import __G__ from "${goodId}";\nexport default new Map([[${JSON.stringify(goodId)}, __G__]]);\n`);
assert.equal(plugin.load(cleanFile), null, '干净模块不干预');
ok('干净模块原样放行');

// resolveId:能解析的放行,不能解析的喂占位模块
assert.equal(plugin.resolveId(goodId), null, '可解析引用放行');
const missing = plugin.resolveId(badId);
assert.ok(missing?.startsWith('\0towardslight:missing-content-image:'), '坏引用走占位模块');
const mod = plugin.load(missing);
assert.ok(mod.includes('data:image/svg+xml'), '占位模块导出 SVG data URI');
ok('resolveId 兜底 + 占位模块');

// ── remark 层:缺失引用换占位,存在的引用不动 ──
function mdast(url) {
  return { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'image', url, alt: 'a' }] }] };
}
const file = { dirname: postsDir, path: path.join(postsDir, 'ok.md') };
const missingTree = mdast('image/a/not-there.png');
remarkImageGuard()(missingTree, file);
assert.ok(missingTree.children[0].children[0].url.startsWith('data:image/svg+xml'), '缺失图换占位');
const okTree = mdast('image/a/real.png');
remarkImageGuard()(okTree, file);
assert.equal(okTree.children[0].children[0].url, 'image/a/real.png', '存在的图不动');
const remoteTree = mdast('https://example.com/x.png');
remarkImageGuard()(remoteTree, file);
assert.equal(remoteTree.children[0].children[0].url, 'https://example.com/x.png', '远程图不动');
ok('remark 层:缺失换占位 / 存在不动 / 远程不动');

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n全部通过:${passed} 组`);
