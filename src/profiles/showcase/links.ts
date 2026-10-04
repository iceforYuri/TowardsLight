/** 链接分组的整色色调:不配=中性;配了整组浸染为该色。纪律:彩色分组不超过 3 个 */
export type LinkGroupTone = 'accent' | 'contrast' | 'steel';

export interface LinkGroupDef {
  /** 供链接的 group 字段引用,构建期类型校验 */
  id: string;
  /** 页面显示名 */
  label: string;
  description: string;
  tone?: LinkGroupTone;
}

/** 链接分组:id 供链接的 group 字段引用,label 为页面显示名;tone 给整组浸染色调 */
export const linkGroups = [
  { id: 'code', label: 'Code', description: '代码托管与开源项目', tone: 'steel' },
  { id: 'build', label: 'Build', description: '构建本站与日常项目的工具链',
      tone: 'accent'
},
  { id: 'write', label: 'Write', description: '写作平台与笔记工具',
      tone: 'contrast'
},
  { id: 'explore', label: 'Explore', description: '学习与查证的去处'
},
  { id: 'community', label: 'Community', description: '常逛的社区', tone: 'contrast' },
  { id: 'tools', label: 'Tools', description: '日常在用的软件' },
  { id: 'elsewhere', label: 'Elsewhere', description: '其他地方也能找到我' },
  { id: 'currently-using', label: 'Currently Using', description: '当前正在用的服务' },
] as const satisfies readonly LinkGroupDef[];

export type LinkGroupId = (typeof linkGroups)[number]['id'];

export interface TechLink {
  title: string;
  description: string;
  href: string;
  /** 必须是 linkGroups 里声明过的 id;拼错会在类型检查和构建期同时报错 */
  group: LinkGroupId;
  icon?: string;
  external?: boolean;
  featured?: boolean;
  /** 首页「常用去处」展示,与 featured 独立;最多 3 个,超出构建期只取前 3 */
  home?: boolean;
  status?: string;
}

export const techLinks: TechLink[] = [
  {
    title: 'GitHub',
    description: '代码、实验和一些开源小项目',
    href: 'https://github.com',
    group: 'code',
    icon: 'github',
    external: true,
    featured: true,
    home: true,
    status: '每天使用',
  },
  {
    title: 'Codeberg',
    description: '放一些不太想绑在大平台上的仓库',
    href: 'https://codeberg.org',
    group: 'code',
    icon: 'git-branch',
    external: true,
  },
  {
    title: 'Astro',
    description: '这个博客现在跑在它上面，内容优先，交付的 JS 很少',
    href: 'https://astro.build',
    group: 'build',
    icon: 'rocket',
    external: true,
    featured: true,
    home: true,
    status: '本站使用',
  },
  {
    title: 'Vite',
    description: '日常项目的默认构建工具，快得理所当然',
    href: 'https://vite.dev',
    group: 'build',
    icon: 'zap',
    external: true,
  },
  {
    title: 'MDN Web Docs',
    description: '查 Web API 的第一站，比任何二手教程都可靠',
    href: 'https://developer.mozilla.org',
    group: 'explore',
    icon: 'book-open',
    external: true,
    featured: true,
    home: true,
  },
  {
    title: 'web.dev',
    description: '性能和可用性相关的系统文章，常翻常新',
    href: 'https://web.dev',
    group: 'explore',
    icon: 'compass',
    external: true,
  },
  {
    title: 'Hacker News',
    description: '每天扫一眼标题，深读靠运气',
    href: 'https://news.ycombinator.com',
    group: 'community',
    icon: 'message-square',
    external: true,
  },
  {
    title: 'V2EX',
    description: '中文技术社区，看大家折腾什么东西',
    href: 'https://www.v2ex.com',
    group: 'community',
    icon: 'messages-square',
    external: true,
  },
  {
    title: '少数派',
    description: '写长文时会参考它的排版和节奏',
    href: 'https://sspai.com',
    group: 'write',
    icon: 'pen-line',
    external: true,
  },
  {
    title: 'Obsidian',
    description: '文章草稿都在本地 Markdown 里，先写好再发布',
    href: 'https://obsidian.md',
    group: 'write',
    icon: 'notebook-pen',
    external: true,
    status: '主力笔记',
  },
  {
    title: 'Raycast',
    description: '启动器、剪贴板历史、窗口管理，一个顶好几个',
    href: 'https://www.raycast.com',
    group: 'tools',
    icon: 'command',
    external: true,
  },
  {
    title: 'Excalidraw',
    description: '画架构草图和手示意图，不需要好看，需要快',
    href: 'https://excalidraw.com',
    group: 'tools',
    icon: 'pen-tool',
    external: true,
  },
  {
    title: 'Mastodon',
    description: '偶尔发一些不成文章的碎片想法',
    href: 'https://mastodon.social',
    group: 'elsewhere',
    icon: 'at-sign',
    external: true,
  },
  {
    title: 'RSS 阅读器',
    description: '用 RSS 追博客，信息来源自己做主',
    href: 'https://netnewswire.com',
    group: 'currently-using',
    icon: 'rss',
    external: true,
    status: '在读 40+ 订阅',
  },
];

// 构建期校验:group 引用了未声明的分组 id 时直接报错,避免链接静默消失
const declaredGroups = new Set<string>(linkGroups.map((g) => g.id));
for (const link of techLinks) {
  if (!declaredGroups.has(link.group)) {
    throw new Error(`[links] "${link.title}" 的 group "${link.group}" 未在 linkGroups 中声明`);
  }
}

export function linksByGroup() {
  return linkGroups.map((g) => ({ ...g, links: techLinks.filter((l) => l.group === g.id) }));
}
