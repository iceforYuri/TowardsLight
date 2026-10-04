/**
 * frontmatter 校验:扫当前档案的所有文章,笔误在 CI 阶段就拦住,
 * 不等 dev server 崩或部署后才发现(如 draft: flase 这种字符串)。
 *
 * 校验项:必填字段存在且类型正确;日期可解析;cover 引用的文件存在。
 * 用法:npm run frontmatter:check(档案解析顺序与 use-profile 一致)
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

const root = process.cwd();
const profileDir = process.env.SITE_PROFILE_DIR
  ? path.resolve(process.env.SITE_PROFILE_DIR)
  : fs.existsSync(path.join(root, 'personal', 'site.ts'))
    ? path.join(root, 'personal')
    : path.join(root, 'src', 'profiles', 'showcase');

const postsDir = path.join(profileDir, 'posts');

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.name.endsWith('.md')) yield p;
  }
}

function checkPost(file) {
  const rel = path.relative(postsDir, file);
  const errors = [];
  const text = fs.readFileSync(file, 'utf8');
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return [`${rel}: 缺少 frontmatter 块`];
  let fm;
  try {
    fm = parse(m[1]);
  } catch (e) {
    return [`${rel}: frontmatter YAML 解析失败:${e.message.split('\n')[0]}`];
  }
  if (!fm || typeof fm !== 'object') return [`${rel}: frontmatter 不是键值对`];

  for (const key of ['title', 'description', 'category']) {
    if (typeof fm[key] !== 'string' || !fm[key].trim()) errors.push(`${rel}: ${key} 缺失或不是非空字符串`);
  }
  if (!fm.pubDate || Number.isNaN(Date.parse(fm.pubDate instanceof Date ? fm.pubDate.toISOString() : String(fm.pubDate)))) {
    errors.push(`${rel}: pubDate 不是可解析的日期(收到 ${JSON.stringify(fm.pubDate)})`);
  }
  if (fm.updatedDate !== undefined && Number.isNaN(Date.parse(String(fm.updatedDate)))) {
    errors.push(`${rel}: updatedDate 不是可解析的日期`);
  }
  if (fm.draft !== undefined && typeof fm.draft !== 'boolean') {
    errors.push(`${rel}: draft 必须是布尔值 true/false(收到 ${JSON.stringify(fm.draft)},注意拼写)`);
  }
  if (fm.featured !== undefined && typeof fm.featured !== 'boolean') {
    errors.push(`${rel}: featured 必须是布尔值`);
  }
  if (fm.tags !== undefined && (!Array.isArray(fm.tags) || fm.tags.some((t) => typeof t !== 'string'))) {
    errors.push(`${rel}: tags 必须是字符串数组`);
  }
  if (fm.cover !== undefined) {
    if (typeof fm.cover !== 'string' || !fm.cover.trim()) {
      errors.push(`${rel}: cover 必须是路径字符串`);
    } else if (!/^https?:\/\//.test(fm.cover)) {
      const abs = fm.cover.startsWith('/')
        ? path.join(profileDir, 'images', fm.cover.replace(/^\/images\//, ''))
        : path.resolve(path.dirname(file), fm.cover);
      if (!fs.existsSync(abs)) errors.push(`${rel}: cover 文件不存在:${fm.cover}`);
    }
  }
  return errors;
}

const files = fs.existsSync(postsDir) ? [...walk(postsDir)] : [];
const all = files.flatMap(checkPost);
if (all.length) {
  console.error(`frontmatter 校验未通过(${all.length} 处):\n`);
  for (const e of all) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log(`frontmatter 校验通过:${files.length} 篇文章(${path.basename(profileDir)})`);
