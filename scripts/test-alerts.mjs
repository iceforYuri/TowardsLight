/**
 * rehype-alerts 的单元测试:真实 remark 管线(from-markdown → to-hast → 插件 → to-html),
 * 不依赖 dev server。用法:node scripts/test-alerts.mjs
 */
import assert from 'node:assert';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toHast } from 'mdast-util-to-hast';
import { toHtml } from 'hast-util-to-html';
import { rehypeAlerts } from '../src/plugins/rehype-alerts.mjs';

let passed = 0;
function ok(name) {
  passed++;
  console.log(`  ✓ ${name}`);
}

/** 跑一遍真实管线,返回 HTML */
function render(md) {
  const mdast = fromMarkdown(md);
  const hast = toHast(mdast);
  rehypeAlerts()(hast);
  return toHtml(hast);
}

// ── 五种类型都识别,标记被剥离 ──
for (const type of ['note', 'tip', 'important', 'warning', 'caution']) {
  const html = render(`> [!${type}]\n> 正文内容`);
  assert.ok(html.includes(`class="alert alert-${type}"`), `${type} 类型类名`);
  assert.ok(html.includes(`<span>${type.toUpperCase()}</span>`), `${type} 默认英文标题`);
  assert.ok(!html.includes('[!'), `${type} 标记字面量被剥离`);
  assert.ok(html.includes('正文内容'), `${type} 正文保留`);
  assert.ok(!html.includes('<blockquote'), `${type} 不再是 blockquote`);
}
ok('五种类型:转换 + 默认标题 + 标记剥离');

// ── 大小写不敏感 ──
assert.ok(render('> [!Tip]\n> x').includes('alert-tip'), '混合大小写识别');
ok('大小写不敏感');

// ── 自定义标题:标记同行剩余文字替换默认标题 ──
{
  const html = render('> [!TIP] 迁移前必读\n> 内容');
  assert.ok(html.includes('<span>迁移前必读</span>'), '自定义标题生效');
  assert.ok(!html.includes('>TIP<'), '默认标题被替换');
  ok('自定义标题');
}

// ── 折叠:- 默认收起 / + 默认展开,内容包进 alert-body ──
{
  const folded = render('> [!WARNING]-\n> 长说明');
  assert.ok(folded.includes('<details class="alert alert-warning alert-fold">'), '- 无 open');
  assert.ok(folded.includes('<summary class="alert-title">'), 'summary 标题行');
  assert.ok(folded.includes('class="alert-body"'), '内容包裹层');
  assert.ok(folded.includes('alert-chevron'), '开合指示箭头');
  const expanded = render('> [!WARNING]+\n> 长说明');
  assert.ok(expanded.includes(' open>'), '+ 带 open');
  ok('折叠形态(- 收起 / + 展开)');
}

// ── 折叠 + 自定义标题共存 ──
{
  const html = render('> [!NOTE]- 折叠的备注\n> 内容');
  assert.ok(html.includes('<span>折叠的备注</span>'), '折叠时自定义标题仍生效');
  ok('折叠 + 自定义标题共存');
}

// ── 仅有标记没有正文:只剩标题,不产出空段落 ──
{
  const html = render('> [!NOTE]');
  assert.ok(html.includes('alert-note'), '转换生效');
  assert.ok(!html.includes('<p></p>') && !html.includes('<p>&#xA;</p>'), '无空段落残留');
  ok('空内容提示块');
}

// ── 未知类型不动(GitHub 退化语义:普通引用块) ──
{
  const html = render('> [!FOO]\n> 内容');
  assert.ok(html.includes('<blockquote'), '未知类型保持 blockquote');
  assert.ok(html.includes('[!FOO]'), '标记字面量保留');
  ok('未知类型不转换');
}

// ── 无标记引用块不动 ──
{
  const html = render('> 普通引用');
  assert.ok(html.includes('<blockquote'), '普通引用保持原样');
  assert.ok(!html.includes('alert'), '不沾染 alert 类');
  ok('无标记引用块不转换');
}

// ── 标记不在第一段不动 ──
{
  const html = render('> 先说点别的\n>\n> [!NOTE]\n> 内容');
  assert.ok(html.includes('<blockquote'), '第二段的标记不识别');
  ok('标记必须在第一段行首');
}

// ── 多段内容完整保留 ──
{
  const html = render('> [!NOTE]\n> 第一段\n>\n> 第二段\n>\n> - 列表项');
  assert.ok(html.includes('第一段') && html.includes('第二段') && html.includes('<li>列表项</li>'), '段落与列表都在');
  ok('多段与列表内容保留');
}

// ── 嵌套:提示块里的引用块继续识别 ──
{
  const html = render('> [!NOTE]\n> 外层\n>\n> > [!TIP]\n> > 内层');
  assert.ok(html.includes('alert-note') && html.includes('alert-tip'), '嵌套两层都转换');
  ok('嵌套提示块');
}

console.log(`\n全部通过:${passed} 组`);
