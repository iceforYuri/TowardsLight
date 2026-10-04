/**
 * mermaid 代码块构建期渲染(手绘风)。
 *
 * 管线:找 pre > code.language-mermaid → mermaid-isomorphic(playwright chromium)
 * 明暗主题各渲一份 SVG → 包成 figure(图/代码可切换),原代码块保留为「代码」视图
 * (复制按钮与语言徽章由 code-copy 与 langBadge 逻辑自动接管)。
 *
 * 手绘:look: 'handDrawn'(mermaid 内建 roughjs);handDrawnSeed 固定,
 * 保证构建产物可复现、可 diff。
 *
 * 兜底:chromium 不可用(CI 缺依赖等)或图源语法错误 → 保留原代码块并告警,
 * 构建不炸。与 image-guard 同一哲学。
 */
import { createMermaidRenderer } from 'mermaid-isomorphic';

let renderer = null;
let broken = false;
let seq = 0;

const BASE_CONFIG = {
  look: 'handDrawn',
  handDrawnSeed: 42,
  // 无头浏览器不保证有 CJK 手写字体;图形手绘、文字用通用族,避免豆腐块
  fontFamily: 'arial, sans-serif',
};

async function renderDual(source) {
  if (broken) return null;
  try {
    renderer ??= createMermaidRenderer();
    const id = seq++;
    // mermaid-isomorphic 共享浏览器不支持并发调用(结果会丢),明暗两份串行渲
    const light = (await renderer([source], { mermaidConfig: { ...BASE_CONFIG, theme: 'default' }, prefix: `mmd-l${id}-` }))[0];
    const dark = (await renderer([source], { mermaidConfig: { ...BASE_CONFIG, theme: 'dark' }, prefix: `mmd-d${id}-` }))[0];
    if (!light || light.status !== 'fulfilled') throw light?.reason ?? new Error('渲染无结果');
    if (!dark || dark.status !== 'fulfilled') throw dark?.reason ?? new Error('渲染无结果');
    return [light.value.svg, dark.value.svg];
  } catch (e) {
    console.warn('[mermaid] 渲染失败,保留为代码块:', e);
    const msg = (e && (e.message || e.reason?.message)) || String(e);
    // 语法错误只影响单图;浏览器/环境问题直接熔断,后续图不再尝试
    if (/browser|chromium|playwright|Executable|launch/i.test(msg)) broken = true;
    return null;
  }
}

/** 收集 hast 文本节点内容 */
function textOf(node) {
  if (node.type === 'text') return node.value;
  return (node.children ?? []).map(textOf).join('');
}

function isMermaidPre(node) {
  if (node.type !== 'element' || node.tagName !== 'pre') return false;
  // hast 属性是驼峰式:data-language → dataLanguage(langBadge transformer 在 shiki 阶段写入)
  if (node.properties?.dataLanguage === 'mermaid') return true;
  const code = node.children?.find((c) => c.type === 'element' && c.tagName === 'code');
  const cls = code?.properties?.className;
  return Array.isArray(cls) && cls.includes('language-mermaid');
}

function walk(node, fn, parent = null, index = -1) {
  fn(node, parent, index);
  if (Array.isArray(node.children)) {
    node.children.forEach((c, i) => walk(c, fn, node, i));
  }
}

export function rehypeMermaid() {
  return async (tree) => {
    const jobs = [];
    walk(tree, (node, parent, index) => {
      if (parent && isMermaidPre(node)) jobs.push({ node, parent, index });
    });
    if (!jobs.length) return;

    for (const { node, parent, index } of jobs) {
      const code = node.children.find((c) => c.type === 'element' && c.tagName === 'code');
      const source = textOf(code).trim();
      const dual = await renderDual(source);
      if (!dual) continue; // 兜底:原样保留

      // 源码视图:保持 astro-code 结构(hast 属性驼峰式);dataCopyBound 让
      // code-copy 跳过它——复制键收进 figure 的工具排,不在 pre 里重复注入
      node.properties = node.properties || {};
      const existingCls = node.properties.className;
      const clsArr = Array.isArray(existingCls)
        ? existingCls
        : typeof existingCls === 'string'
          ? existingCls.split(/\s+/)
          : [];
      node.properties.className = [...new Set([...clsArr, 'astro-code', 'mermaid-source'])];
      node.properties.dataLanguage = 'mermaid';
      node.properties.dataCopyBound = '1';

      const svgIcon = (paths) => ({
        type: 'raw',
        value: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`,
      });
      const ICON_IMG =
        '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>';
      const ICON_CODE = '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>';
      const ICON_COPY =
        '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>';
      const ICON_CHECK = '<path d="M20 6 9 17l-5-5"/>';

      const iconBtn = (cls, label, icons) => ({
        type: 'element',
        tagName: 'button',
        properties: { type: 'button', className: ['mmd-btn', cls], ariaLabel: label, title: label },
        children: icons.map((i) => ({
          type: 'element',
          tagName: 'span',
          properties: { className: ['mmd-ic', i[1]], ariaHidden: 'true' },
          children: [svgIcon(i[0])],
        })),
      });

      parent.children[index] = {
        type: 'element',
        tagName: 'figure',
        properties: { className: ['mermaid-figure'], dataMermaidFigure: '', dataView: 'diagram' },
        children: [
          {
            type: 'element',
            tagName: 'div',
            properties: { className: ['mermaid-chrome'] },
            children: [
              {
                type: 'element',
                tagName: 'span',
                properties: { className: ['mermaid-badge'] },
                children: [{ type: 'text', value: 'mermaid' }],
              },
              iconBtn('mmd-toggle', '切换图/代码', [
                [ICON_CODE, 'ic-code'],
                [ICON_IMG, 'ic-img'],
              ]),
              iconBtn('mmd-copy', '复制图源', [
                [ICON_COPY, 'ic-copy'],
                [ICON_CHECK, 'ic-check'],
              ]),
            ],
          },
          {
            type: 'element',
            tagName: 'div',
            properties: { className: ['mermaid-canvas'] },
            children: [
              {
                type: 'element',
                tagName: 'div',
                properties: { className: ['mermaid-svg', 'mermaid-svg-light'] },
                children: [{ type: 'raw', value: dual[0] }],
              },
              {
                type: 'element',
                tagName: 'div',
                properties: { className: ['mermaid-svg', 'mermaid-svg-dark'] },
                children: [{ type: 'raw', value: dual[1] }],
              },
            ],
          },
          node, // 代码视图
        ],
      };
    }
  };
}
