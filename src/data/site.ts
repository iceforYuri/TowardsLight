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
  author: '陈拾光',
  bio: '一名写代码的普通人,喜欢把事情弄清楚,再把弄清楚的过程写下来。目前在杭州,做全栈开发,关心 Web 性能、开发工具和个人知识管理。',
  shortBio: '写代码,写文字,记录把问题想清楚的过程。',
  avatar: '/images/avatar.svg',
  /** 头像裁切焦点(object-position),竖向人像建议 'center 30%' */
  avatarPosition: 'center',
  email: 'hi@example.com',
  navigation: [
    { label: 'Home', href: '/' },
    { label: 'Archive', href: '/archive' },
    { label: 'Tags', href: '/tags' },
    { label: 'Categories', href: '/categories' },
    { label: 'Links', href: '/links' },
  ],
  socialLinks: [
    { label: 'GitHub', href: 'https://github.com' },
    { label: 'RSS', href: '/rss.xml' },
    { label: 'Email', href: 'mailto:hi@example.com' },
  ],
  homeHero: {
    greeting: '拾光集',
    tagline: '一名全栈工程师的数字自留地',
    intro:
      '在这里记录技术文章、折腾过的工具、读到一半的书,以及一些想清楚了和还没想清楚的事。',
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
