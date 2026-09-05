import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getAllPosts } from '../utils/posts';
import { site } from '../data/site';

export async function GET(context: APIContext) {
  const posts = await getAllPosts();
  return rss({
    title: site.siteName,
    description: site.bio,
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/posts/${post.id}`,
    })),
  });
}
