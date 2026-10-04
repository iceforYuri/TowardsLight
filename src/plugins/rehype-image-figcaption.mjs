/**
 * 正文图片说明:把独占一段且写了 alt 的图片包成 figure + figcaption。
 *
 * 规则(规格 docs/specs:Q1 正文插图 / Q2 alt 为源 / Q3 无 alt 不显示):
 * - 仅当 img 是 <p> 的唯一内容(独占一行,Markdown 图片的自然形态)才包装;
 *   行内图片、链接里的图片不动;
 * - alt 为空或缺失 → 不显示说明(尊重"没写就是不想配");
 * - alt 是纯时间戳数字(Obsidian 粘贴自动产物,如 1790737185473)→ 视为未写,不显示;
 * - image-guard 的占位图(data:image/svg+xml)→ 永不显示说明(异常态不再配文字);
 * - figcaption 文本即 alt,与灯箱 caption、屏幕阅读器同源。
 */
const PLACEHOLDER_MARK = 'data:image/svg+xml';

/** Obsidian 粘贴的自动文件名(纯时间戳数字)不算有效说明 */
const TIMESTAMP_ALT = /^\d{6,}$/;

function isElement(node, name) {
  return node && node.type === 'element' && node.tagName === name;
}

function isWhitespaceText(node) {
  return node && node.type === 'text' && !node.value.trim();
}

export function rehypeImageFigcaption() {
  return (tree) => {
    const walk = (node) => {
      if (!node || typeof node !== 'object' || !Array.isArray(node.children)) return;
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (isElement(child, 'p')) {
          const meaningful = child.children.filter((c) => !isWhitespaceText(c));
          if (meaningful.length === 1 && isElement(meaningful[0], 'img')) {
            const img = meaningful[0];
            const alt = img.properties?.alt;
            const src = String(img.properties?.src ?? '');
            if (alt && !TIMESTAMP_ALT.test(alt.trim()) && !src.startsWith(PLACEHOLDER_MARK)) {
              node.children[i] = {
                type: 'element',
                tagName: 'figure',
                properties: {},
                children: [
                  img,
                  {
                    type: 'element',
                    tagName: 'figcaption',
                    properties: {},
                    children: [{ type: 'text', value: alt }],
                  },
                ],
              };
              continue; // figure 已成型,无需再深入这个 p
            }
          }
        }
        walk(child);
      }
    };
    walk(tree);
  };
}
