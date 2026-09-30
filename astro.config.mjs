// @ts-check
import { defineConfig } from 'astro/config';

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
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      defaultColor: false,
    },
  },
});
