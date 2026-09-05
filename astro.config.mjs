// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://blog.example.com',
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
