/**
 * GitHub 风格提示块(Alerts):把带标记的引用块转成带图标、标题和类型配色的提示块。
 *
 * 语法(对齐 GitHub 五型,兼收 Obsidian 两个扩展):
 *   > [!NOTE]           五种类型:note / tip / important / warning / caution(大小写不敏感)
 *   > [!TIP] 自定义标题  标记同行剩余文字作为标题(纯文本,覆盖默认英文标题)
 *   > [!WARNING]-       可折叠,默认收起(原生 details/summary,零客户端 JS)
 *   > [!WARNING]+       可折叠,默认展开
 *
 * 规则:
 * - 只识别引用块第一段的行首标记;没有标记的引用块保持原样;
 * - 未知类型不转换——与 GitHub 的退化行为一致(渲染为普通引用块);
 * - 标记行被剥离后若第一段为空,整段移除,标题之后直接是正文内容;
 * - 转换后标签从 blockquote 换成 div/details,不再走 .prose blockquote 的引用样式。
 */

const LABELS = {
  note: 'NOTE',
  tip: 'TIP',
  important: 'IMPORTANT',
  warning: 'WARNING',
  caution: 'CAUTION',
};

/* 图标路径取自 Lucide(https://lucide.dev, ISC License),与 Icon.astro 同一套视觉 */
const ICONS = {
  note: [
    ['circle', { cx: '12', cy: '12', r: '10' }],
    ['path', { d: 'M12 16v-4' }],
    ['path', { d: 'M12 8h.01' }],
  ],
  tip: [
    [
      'path',
      {
        d: 'M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5',
      },
    ],
    ['path', { d: 'M9 18h6' }],
    ['path', { d: 'M10 22h4' }],
  ],
  important: [
    ['circle', { cx: '12', cy: '12', r: '10' }],
    ['line', { x1: '12', y1: '8', x2: '12', y2: '12' }],
    ['line', { x1: '12', y1: '16', x2: '12.01', y2: '16' }],
  ],
  warning: [
    ['path', { d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3' }],
    ['path', { d: 'M12 9v4' }],
    ['path', { d: 'M12 17h.01' }],
  ],
  caution: [
    ['path', { d: 'M12 16h.01' }],
    ['path', { d: 'M12 8v4' }],
    [
      'path',
      {
        d: 'M15.312 2a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586l-4.688-4.688A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414L7.274 2.586A2 2 0 0 1 8.688 2z',
      },
    ],
  ],
  chevron: [['path', { d: 'm6 9 6 6 6-6' }]],
};

/* 标记行:类型 + 可选折叠符 + 可选同行标题,到换行或段尾为止 */
const MARKER = /^\[!(note|tip|important|warning|caution)\]([+-])?[ \t]*([^\n]*?)[ \t]*(\n|$)/i;

function isElement(node, name) {
  return node && node.type === 'element' && node.tagName === name;
}

function isWhitespaceText(node) {
  return node && node.type === 'text' && !node.value.trim();
}

function svg(parts, className) {
  return {
    type: 'element',
    tagName: 'svg',
    properties: {
      xmlns: 'http://www.w3.org/2000/svg',
      width: 15,
      height: 15,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      className: [className],
      'aria-hidden': 'true',
    },
    children: parts.map(([tag, attrs]) => ({ type: 'element', tagName: tag, properties: attrs, children: [] })),
  };
}

/** 命中标记的引用块转换为提示块;不命中返回 null */
function transformQuote(quote) {
  const first = quote.children.find((child) => !isWhitespaceText(child));
  if (!isElement(first, 'p')) return null;
  const firstChild = first.children[0];
  if (!firstChild || firstChild.type !== 'text') return null;

  const match = MARKER.exec(firstChild.value);
  if (!match) return null;
  const type = match[1].toLowerCase();
  const fold = match[2] ?? null;
  const customTitle = match[3]?.trim();

  // 剥离标记行:先截文本,空文本节点和空段落顺势移除
  firstChild.value = firstChild.value.slice(match[0].length);
  if (!firstChild.value) first.children.shift();
  if (!first.children.length) {
    quote.children.splice(quote.children.indexOf(first), 1);
  }

  const titleChildren = [
    svg(ICONS[type], 'alert-icon'),
    { type: 'element', tagName: 'span', properties: {}, children: [{ type: 'text', value: customTitle || LABELS[type] }] },
  ];

  if (fold) {
    // 折叠形态:details + summary,chevron 指示开合方向
    titleChildren.push(svg(ICONS.chevron, 'alert-chevron'));
    return {
      type: 'element',
      tagName: 'details',
      properties: {
        className: ['alert', `alert-${type}`, 'alert-fold'],
        ...(fold === '+' ? { open: true } : {}),
      },
      children: [
        { type: 'element', tagName: 'summary', properties: { className: ['alert-title'] }, children: titleChildren },
        { type: 'element', tagName: 'div', properties: { className: ['alert-body'] }, children: quote.children },
      ],
    };
  }

  return {
    type: 'element',
    tagName: 'div',
    properties: { className: ['alert', `alert-${type}`] },
    children: [
      { type: 'element', tagName: 'p', properties: { className: ['alert-title'] }, children: titleChildren },
      ...quote.children,
    ],
  };
}

export function rehypeAlerts() {
  return (tree) => {
    const walk = (node) => {
      if (!node || typeof node !== 'object' || !Array.isArray(node.children)) return;
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (isElement(child, 'blockquote')) {
          const replacement = transformQuote(child);
          if (replacement) {
            node.children[i] = replacement;
            walk(replacement); // 提示块内部还可能嵌套引用块
            continue;
          }
        }
        walk(child);
      }
    };
    walk(tree);
  };
}
