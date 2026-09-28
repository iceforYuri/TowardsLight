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
  siteNameEn: 'SHIGUANG',
  author: '拾光捡金',
  bio: '逐梦的年华，于斑驳树影中，窥见细数的曾经',
  shortBio: '写代码,写文字,记录把问题想清楚的过程。',
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
