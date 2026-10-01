// @ts-check
import { defineConfig } from 'astro/config';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { remarkImageGuard, viteImageGuard } from './src/plugins/image-guard.mjs';

// 把 fence 的语言写到 <pre data-language> 上,由 CSS 生成右上角语言徽章;
// 未识别语言由 Shiki 自动回退 plaintext(构建期告警),徽章保留作者原写法
/** @type {import('shiki').ShikiTransformer} */
const langBadge = {
  name: 'lang-badge',
  pre(node) {
    node.properties['data-language'] = this.options.lang;
  },
};

// 站点 URL 属于"身份"内容,取自当前档案(siteUrl 字段);
// 部署时可用 SITE_URL / SITE_BASE 环境变量覆盖(如 GitHub Pages 子路径)
let profileSiteUrl = 'https://blog.example.com';
try {
  const mod = await import('./src/profiles/active/site.ts');
  profileSiteUrl = mod.site.siteUrl ?? profileSiteUrl;
} catch {
  // 首次运行且指向未建立时回退到内置档案
  const mod = await import('./src/profiles/showcase/site.ts');
  profileSiteUrl = mod.site.siteUrl ?? profileSiteUrl;
}

export default defineConfig({
  site: process.env.SITE_URL ?? profileSiteUrl,
  base: process.env.SITE_BASE ?? '/',
  vite: {
    // 内容图片解析兜底(先于 astro 内部插件):缓存残留的失效引用喂占位图,不抛 ImageNotFound
    plugins: [viteImageGuard()],
    server: {
      watch: {
        // editor/(扩展,含上万个图标文件)和构建产物与站点渲染无关,
        // 不进 watch,避免 Windows 上多 server 并存时句柄耗尽(EMFILE)
        ignored: ['**/.git/**', '**/node_modules/**', '**/editor/**', '**/dist/**'],
      },
    },
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  markdown: {
    // 公式:remark-math 解析 $..$/$$..$$,rehype-katex 构建期渲染为 HTML(零客户端 JS)
    // remark-image-guard 放在最前:缺席的正文图片换成占位图,避免一张图拖垮全站
    remarkPlugins: [remarkImageGuard, remarkMath],
    rehypePlugins: [rehypeKatex],
    shikiConfig: {
      transformers: [langBadge],
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      defaultColor: false,
    },
  },
});
