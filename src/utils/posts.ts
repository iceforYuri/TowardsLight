import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

export async function getAllPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function readingTime(body: string): number {
  // 中文按字计,英文按词计,混合估算
  const cjk = (body.match(/[一-鿿]/g) || []).length;
  const words = (body.replace(/[一-鿿]/g, ' ').match(/\S+/g) || []).length;
  const minutes = Math.ceil(cjk / 400 + words / 200);
  return Math.max(1, minutes);
}

export function groupPostsByYear(posts: Post[]): Map<number, Post[]> {
  const map = new Map<number, Post[]>();
  for (const post of posts) {
    const year = post.data.pubDate.getFullYear();
    if (!map.has(year)) map.set(year, []);
    map.get(year)!.push(post);
  }
  return map;
}

export function collectTags(posts: Post[]): Map<string, Post[]> {
  const map = new Map<string, Post[]>();
  for (const post of posts) {
    for (const tag of post.data.tags) {
      if (!map.has(tag)) map.set(tag, []);
      map.get(tag)!.push(post);
    }
  }
  return new Map([...map.entries()].sort((a, b) => b[1].length - a[1].length));
}

export function collectCategories(posts: Post[]): Map<string, Post[]> {
  const map = new Map<string, Post[]>();
  for (const post of posts) {
    if (!map.has(post.data.category)) map.set(post.data.category, []);
    map.get(post.data.category)!.push(post);
  }
  return new Map([...map.entries()].sort((a, b) => b[1].length - a[1].length));
}
