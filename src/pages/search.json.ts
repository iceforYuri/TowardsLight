/**
 * 搜索索引端点:把当前档案的全部已发布文章导出为 JSON。
 * 跟随内容集合(即 personal/ 或 showcase 档案),dev 与 build 都可用;
 * 客户端首次打开搜索时懒加载,模块级缓存。
 *
 * body 是纯文本化的 Markdown:剥语法符号、保留代码内容与公式标识符。
 */
import { getAllPosts } from '../utils/posts';

/** Markdown → 纯文本:去语法符号,保留代码标识符与数学内容(均可被搜索) */
function plainText(md: string): string {
  return (
    md
      // 代码块:去掉围栏与语言标记,保留代码本体(可搜 fetchpriority 之类的标识符)
      .replace(/```(\w*)\n?([\s\S]*?)```/g, '$2')
      .replace(/`([^`]*)`/g, '$1')
      // 图片留 alt,链接留文字
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      // 标题、引用、列表记号
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^>\s?/gm, '')
      .replace(/^[-*+]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')
      // 表格与分隔线
      .replace(/\|/g, ' ')
      .replace(/^[\s\-:]+$/gm, '')
      // HTML 标签、强调/数学定界符
      .replace(/<[^>]+>/g, ' ')
      .replace(/\$\$?/g, ' ')
      .replace(/[*_~]/g, '')
      // 折叠空白:软换行合并,句子边界由标点决定(见搜索端的句级片段提取)
      .replace(/\s+/g, ' ')
      .trim()
  );
}

export async function GET() {
  const posts = await getAllPosts();
  const docs = posts.map((post) => ({
    slug: post.id,
    title: post.data.title,
    description: post.data.description,
    category: post.data.category,
    tags: post.data.tags,
    pubDate: post.data.pubDate.toISOString().slice(0, 10),
    body: plainText(post.body ?? ''),
  }));
  return new Response(JSON.stringify(docs), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
