/**
 * remark 图片哨兵:把「引用 exists 检查」从 astro:assets 手里前移。
 *
 * 背景:Astro 会把所有内容集合里的正文图片收进 .astro/content-assets.mjs,
 * 任何一张相对路径图片文件缺失(草稿也算),resolveId 直接抛 ImageNotFound,
 * dev 下全站 500、build 整个失败——一张图缺席不该有这种破坏力。
 *
 * 做法:同步阶段遍历 image 节点与 definition 节点(引用式图片),
 * 本地相对路径(resolve 后)不存在就把 url 换成占位 SVG data URI 并告警,
 * 让 astro:assets 永远只看到拿得到的文件。
 *
 * 注意:内容层按文件缓存渲染结果——图片补齐后,重新保存一次文章(或重启 dev)即恢复。
 */
import fs from 'node:fs';
import path from 'node:path';

/** 占位 SVG:中性灰虚线框 + 原路径,明暗主题下都不刺眼 */
function placeholderSrc(ref) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <rect width="799" height="449" x="0.5" y="0.5" rx="12" fill="none" stroke="#9aa096" stroke-width="2" stroke-dasharray="8 6" opacity="0.55"/>
  <text x="400" y="215" text-anchor="middle" font-family="ui-monospace, monospace" font-size="20" fill="#9aa096">图片缺失</text>
  <text x="400" y="250" text-anchor="middle" font-family="ui-monospace, monospace" font-size="14" fill="#9aa096" opacity="0.8">${ref
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')}</text>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** 本地相对引用才需要守护;http(s)、/ 开头(public)、data: 原样放行 */
function isLocalRelative(src) {
  return !!src && !/^(?:https?:)?\/\//.test(src) && !src.startsWith('/') && !src.startsWith('data:');
}

export function remarkImageGuard() {
  return (tree, file) => {
    const dir = file.dirname ?? (file.path ? path.dirname(file.path) : null);
    if (!dir) return;
    const article = file.path ? path.basename(file.path) : '(未知文章)';

    const guard = (node) => {
      const src = node.url;
      if (!isLocalRelative(src)) return;
      let decoded = src;
      try {
        decoded = decodeURIComponent(src);
      } catch {
        /* 含未编码字符时按原样解析 */
      }
      if (fs.existsSync(path.resolve(dir, decoded))) return;
      console.warn(`[image-guard] 图片缺失,已替换为占位图:${src}(${article})。补齐后重新保存文章即恢复`);
      node.url = placeholderSrc(src);
    };

    const walk = (node) => {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'image' || node.type === 'definition') guard(node);
      if (Array.isArray(node.children)) node.children.forEach(walk);
    };
    walk(tree);
  };
}
