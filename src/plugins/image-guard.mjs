/**
 * 正文图片哨兵:双层防护,让「一张图缺席」永远不可能拖垮全站。
 *
 * 背景:Astro 会把所有内容集合里的正文图片(草稿也算)收进
 * .astro/content-assets.mjs 统一 import;任一相对路径解析不到文件,
 * vite-plugin-content-assets 的 resolveId 直接抛 ImageNotFound,
 * dev 下全站 500、build 整个失败。两类触发源:
 *
 * 1. 当前文章引用的图片文件真的不在(粘贴跑偏、先写引用后补图)
 * 2. 跨档案缓存污染:内容存储只增不剪,换档案(junction 换指向)后,
 *    store 里残留另一档案的条目,importer 路径在新指向下根本不存在
 *
 * 本模块提供两层:
 * - remarkImageGuard(同步期):检查磁盘上真实存在的 md 引用,缺文件即换
 *   占位 SVG 并告警,带文件名,指向具体文章。
 * - viteImageGuard(解析期):enforce pre 抢在 astro 之前拦截
 *   astroContentImageFlag 解析,文件不存在就喂占位模块——兜住缓存残留等
 *   一切 remark 层看不到的脏东西。
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

function safeDecode(src) {
  try {
    return decodeURIComponent(src);
  } catch {
    return src;
  }
}

export function remarkImageGuard() {
  return (tree, file) => {
    const dir = file.dirname ?? (file.path ? path.dirname(file.path) : null);
    if (!dir) return;
    const article = file.path ? path.basename(file.path) : '(未知文章)';

    const guard = (node) => {
      const src = node.url;
      if (!isLocalRelative(src)) return;
      if (fs.existsSync(path.resolve(dir, safeDecode(src)))) return;
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

const MISSING_PREFIX = '\0towardslight:missing-content-image:';

/** 判定一条内容图片引用能否解析到真实文件(importer 是 config.root 相对路径) */
function contentImageResolvable(root, base, importerParam) {
  const importerPath = path.resolve(root, safeDecode(importerParam));
  return fs.existsSync(path.resolve(path.dirname(importerPath), safeDecode(base)));
}

const IMPORT_RE = /^import\s+([\w$]+)\s+from\s+"([^"]+)";$/gm;

/**
 * vite 层兜底。astro 内部 pre 插件先于用户 pre 插件执行,resolveId 拦截
 * 抢不过它的 throw——所以主防线是净化 content-assets.mjs 的 load:
 * 该模块由内容层生成,静态 import 全部条目图片;缓存被污染(跨档案残留)时,
 * 把解析不到的 import 整条摘掉再交给 Vite,坏引用根本进不了模块图。
 * resolveId 钩子作为补充(能跑到就喂占位模块)。
 * @returns {import('vite').Plugin}
 */
export function viteImageGuard() {
  let root = process.cwd();
  const dropped = [];
  return {
    name: 'towardslight:content-image-guard',
    enforce: 'pre',
    configResolved(config) {
      root = config.root;
    },
    resolveId(id) {
      if (!id.includes('astroContentImageFlag')) return null;
      const [base, query] = id.split('?');
      const importerParam = new URLSearchParams(query ?? '').get('importer');
      if (!importerParam) return null;
      if (contentImageResolvable(root, base, importerParam)) return null;
      console.warn(`[image-guard] 内容图片无法解析,已替换为占位图:${base}(importer: ${importerParam})。换档案后重启 dev 可彻底恢复`);
      return MISSING_PREFIX + encodeURIComponent(base);
    },
    load(id) {
      if (id.startsWith(MISSING_PREFIX)) {
        return `export default ${JSON.stringify(placeholderSrc(safeDecode(id.slice(MISSING_PREFIX.length))))}`;
      }
      if (!id.includes('content-assets.mjs')) return null;
      const file = id.split('?')[0].replace(/^\/(?=[A-Za-z]:)/, '');
      let src;
      try {
        src = fs.readFileSync(file, 'utf8');
      } catch {
        return null;
      }

      const imports = [...src.matchAll(IMPORT_RE)];
      if (!imports.length) return null;
      const kept = [];
      for (const [, varName, importId] of imports) {
        const [base, query] = importId.split('?');
        const importerParam = new URLSearchParams(query ?? '').get('importer');
        if (importerParam && !contentImageResolvable(root, base, importerParam)) {
          dropped.push(base);
          continue;
        }
        kept.push([varName, importId]);
      }
      if (dropped.length === 0) return null; // 没有坏条目,原样交给 Vite
      for (const base of dropped.splice(0)) {
        console.warn(`[image-guard] 内容缓存中的失效图片引用已摘除:${base}(多为换档案残留,重启 dev 后彻底干净)`);
      }
      const importLines = kept.map(([v, i]) => `import ${v} from "${i}";`).join('\n');
      const entries = kept.map(([v, i]) => `[${JSON.stringify(i)}, ${v}]`).join(', ');
      return `${importLines}\nexport default new Map([${entries}]);`;
    },
  };
}
