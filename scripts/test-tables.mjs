/**
 * rehype-tables 的单元测试:真实 remark 管线(from-markdown + GFM 表格 → to-hast → 插件 → to-html),
 * 不依赖 dev server。用法:node scripts/test-tables.mjs
 */
import assert from 'node:assert';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmTable } from 'micromark-extension-gfm-table';
import { gfmTableFromMarkdown } from 'mdast-util-gfm-table';
import { toHast } from 'mdast-util-to-hast';
import { toHtml } from 'hast-util-to-html';
import { rehypeTables } from '../src/plugins/rehype-tables.mjs';

let passed = 0;
function ok(name) {
  passed++;
  console.log(`  ✓ ${name}`);
}

/** 跑一遍真实管线,返回 HTML;times 控制插件执行次数(验证幂等) */
function render(md, times = 1) {
  const mdast = fromMarkdown(md, { extensions: [gfmTable()], mdastExtensions: [gfmTableFromMarkdown()] });
  const hast = toHast(mdast);
  for (let i = 0; i < times; i++) rehypeTables()(hast);
  return toHtml(hast);
}

const TABLE = '| 指标 | 优化前 | 优化后 |\n| --- | ---: | :---: |\n| 帧率 | 12 | 58 |';

// ── 三层包裹,顺序正确 ──
{
  const html = render(TABLE);
  assert.ok(
    html.startsWith('<div class="table-wrap"><div class="table-frame"><div class="table-scroll"><table>'),
    '包裹顺序 wrap > frame > scroll > table',
  );
  assert.ok(html.endsWith('</table></div></div></div>'), '闭合顺序');
  ok('三层包裹');
}

// ── 对齐属性原样保留(prose.css 依赖 align 属性右对齐/居中) ──
{
  const html = render(TABLE);
  assert.ok(html.includes('<td align="right">12</td>'), '右对齐');
  assert.ok(html.includes('<td align="center">58</td>'), '居中');
  ok('对齐属性保留');
}

// ── 幂等:重复执行不套娃 ──
{
  const once = render(TABLE, 1);
  const twice = render(TABLE, 2);
  assert.strictEqual(twice, once, '两次执行结果一致');
  assert.strictEqual((twice.match(/table-wrap/g) ?? []).length, 1, '只有一层 wrap');
  ok('重复执行不重复包裹');
}

// ── 一篇里多张表、嵌套在列表/引用里的表都包裹 ──
{
  const html = render(`${TABLE}\n\n正文\n\n${TABLE}\n\n> ${TABLE.replace(/\n/g, '\n> ')}`);
  assert.strictEqual((html.match(/class="table-wrap"/g) ?? []).length, 3, '三张表各自包裹');
  assert.strictEqual((html.match(/<table>/g) ?? []).length, 3, '表格数量不变');
  ok('多张表与嵌套表');
}

// ── 没有表格时不改动 ──
{
  const md = '# 标题\n\n段落 | 不是表格';
  assert.ok(!render(md).includes('table-wrap'), '无表格不包裹');
  ok('无表格不改动');
}

console.log(`\n全部通过:${passed} 组`);
