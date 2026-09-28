export interface FlipItem {
  icon: string;
  text: string;
  href?: string;
}

export interface FlipPanel {
  label: string;
  items: FlipItem[];
}

export const site = {
  siteName: '拾光集',
  /** 站点完整 URL(影响 RSS/canonical);部署时可用 SITE_URL 环境变量覆盖 */
  siteUrl: 'https://blog.example.com',
  siteNameEn: 'SHIGUANG',
  author: '拾光捡金',
  bio: '逐梦的年华，于斑驳树影中，窥见细数的曾经',
  shortBio: '写代码，写文字，记录把问题想清楚的过程。',
  avatar: '/images/avatar.svg',
  /** 头像裁切焦点(object-position),竖向人像建议 'center 30%' */
  avatarPosition: 'center',
  email: 'hi@example.com',
  navigation: [
    { label: 'Home', href: '/', icon: 'home' },
    { label: 'Archive', href: '/archive', icon: 'archive' },
    { label: 'Tags', href: '/tags', icon: 'tag' },
    { label: 'Categories', href: '/categories', icon: 'folder' },
    { label: 'Links', href: '/links', icon: 'link' },
  ],
  socialLinks: [
    { label: 'GitHub', href: 'https://github.com', icon: 'github' },
    { label: 'RSS', href: '/rss.xml', icon: 'rss' },
    { label: 'Email', href: 'mailto:hi@example.com', icon: 'mail' },
  ],
  homeHero: {
    greeting: '拾光集',
    tagline: '一名数字守望者的赛博自留地',
    intro:
      '于拾光中窥见昨日的恍惚，那犹豫与今日一致',
    background: '/images/hero-bg.svg',
  },
  pageBackdrops: {
    archive: '',
    tags: '',
    categories: '',
    links: '',
  },
  currentStatus: {
    mode: 'building' as 'writing' | 'building' | 'available' | 'offline',
    text: '正在把这个博客迁到 Astro',
  },
  stack: ['Astro', 'TypeScript', 'Node.js', 'SQLite', 'Tailwind-free CSS'],
  /** 分类视觉配置:图标 + 双色池色调 + 描述;未配置的分类用 folder + accent 兜底 */
  categoryMeta: {
    前端: {
      icon: 'code',
      tone: 'contrast',
      description: '浏览器里发生的事:渲染、性能、框架与交互细节',
    },
    工具: {
      icon: 'wrench',
      tone: 'contrast',
      description: '提升日常效率的软件与工作流',
    },
    随笔: {
      icon: 'pen-line',
      tone: 'accent',
      description: '技术之外，或技术与生活交界处的想法',
    },
    折腾记录: {
      icon: 'rocket',
      tone: 'accent',
      description: '从零到一把某个东西跑起来的过程',
    },
    博客搭建: {
      icon: 'layers',
      tone: 'contrast',
      description: '关于这个博客本身:内容模型、配置与主题系统',
    },
  } as Record<string, { icon: string; tone: 'accent' | 'contrast'; description: string }>,
  /** 首页介绍区底部的翻牌栏:两套内容定时滚换 */
  flipRow: {
    interval: 3000,
    panels: [
      {
        label: 'STACK',
        items: [
          { icon: '', text: 'Astro' },
          { icon: '', text: 'TypeScript' },
          { icon: '', text: 'Node.js' },
          { icon: '', text: 'SQLite' },
          { icon: '', text: 'Tailwind-free CSS' },
        ],
      },
      {
        label: 'CONNECT',
        items: [
          { icon: 'github', text: 'github.com/chenshiguang', href: 'https://github.com' },
          { icon: 'mail', text: 'hi@example.com', href: 'mailto:hi@example.com' },
          { icon: 'map-pin', text: '杭州' },
          { icon: 'rss', text: 'RSS 订阅', href: '/rss.xml' },
        ],
      },
    ] as FlipPanel[],
  },
} as const;

export type SiteConfig = typeof site;
