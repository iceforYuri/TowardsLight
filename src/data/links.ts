export interface TechLink {
  title: string;
  description: string;
  href: string;
  group: string;
  icon?: string;
  external?: boolean;
  featured?: boolean;
  status?: string;
}

export const linkGroups = [
  'Code',
  'Build',
  'Write',
  'Explore',
  'Community',
  'Tools',
  'Elsewhere',
  'Currently Using',
] as const;

export const techLinks: TechLink[] = [
  {
    title: 'GitHub',
    description: '代码、实验和一些开源小项目',
    href: 'https://github.com',
    group: 'Code',
    icon: 'github',
    external: true,
    featured: true,
    status: '每天使用',
  },
  {
    title: 'Codeberg',
    description: '放一些不太想绑在大平台上的仓库',
    href: 'https://codeberg.org',
    group: 'Code',
    icon: 'git-branch',
    external: true,
  },
  {
    title: 'Astro',
    description: '这个博客现在跑在它上面，内容优先，交付的 JS 很少',
    href: 'https://astro.build',
    group: 'Build',
    icon: 'rocket',
    external: true,
    featured: true,
    status: '本站使用',
  },
  {
    title: 'Vite',
    description: '日常项目的默认构建工具，快得理所当然',
    href: 'https://vite.dev',
    group: 'Build',
    icon: 'zap',
    external: true,
  },
  {
    title: 'MDN Web Docs',
    description: '查 Web API 的第一站，比任何二手教程都可靠',
    href: 'https://developer.mozilla.org',
    group: 'Explore',
    icon: 'book-open',
    external: true,
    featured: true,
  },
  {
    title: 'web.dev',
    description: '性能和可用性相关的系统文章，常翻常新',
    href: 'https://web.dev',
    group: 'Explore',
    icon: 'compass',
    external: true,
  },
  {
    title: 'Hacker News',
    description: '每天扫一眼标题，深读靠运气',
    href: 'https://news.ycombinator.com',
    group: 'Community',
    icon: 'message-square',
    external: true,
  },
  {
    title: 'V2EX',
    description: '中文技术社区，看大家折腾什么东西',
    href: 'https://www.v2ex.com',
    group: 'Community',
    icon: 'messages-square',
    external: true,
  },
  {
    title: '少数派',
    description: '写长文时会参考它的排版和节奏',
    href: 'https://sspai.com',
    group: 'Write',
    icon: 'pen-line',
    external: true,
  },
  {
    title: 'Obsidian',
    description: '文章草稿都在本地 Markdown 里，先写好再发布',
    href: 'https://obsidian.md',
    group: 'Write',
    icon: 'notebook-pen',
    external: true,
    status: '主力笔记',
  },
  {
    title: 'Raycast',
    description: '启动器、剪贴板历史、窗口管理，一个顶好几个',
    href: 'https://www.raycast.com',
    group: 'Tools',
    icon: 'command',
    external: true,
  },
  {
    title: 'Excalidraw',
    description: '画架构草图和手示意图，不需要好看，需要快',
    href: 'https://excalidraw.com',
    group: 'Tools',
    icon: 'pen-tool',
    external: true,
  },
  {
    title: 'Mastodon',
    description: '偶尔发一些不成文章的碎片想法',
    href: 'https://mastodon.social',
    group: 'Elsewhere',
    icon: 'at-sign',
    external: true,
  },
  {
    title: 'RSS 阅读器',
    description: '用 RSS 追博客，信息来源自己做主',
    href: 'https://netnewswire.com',
    group: 'Currently Using',
    icon: 'rss',
    external: true,
    status: '在读 40+ 订阅',
  },
];

export function linksByGroup() {
  const map = new Map<string, TechLink[]>();
  for (const group of linkGroups) {
    map.set(group, techLinks.filter((l) => l.group === group));
  }
  return map;
}
