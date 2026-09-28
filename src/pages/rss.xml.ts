import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getAllPosts } from '../utils/posts';
import { site } from '../data/site';

export async function GET(context: APIContext) {
  const posts = await getAllPosts();
  // link 需带上部署 base(BASE_URL 以 / 结尾),否则子路径部署时 RSS 链接丢前缀
  const base = import.meta.env.BASE_URL;
  return rss({
    title: site.siteName,
    description: site.bio,
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `${base}posts/${post.id}`,
    })),
  });
}
