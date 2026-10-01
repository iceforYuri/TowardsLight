/**
 * 正文图片统一异步解码:markdown 渲染出的所有 <img> 自动加 decoding="async",
 * 大图解码不阻塞主线程(页面转场动画期尤为明显)。与 image-guard 互补:
 * 一个管"图在不在",一个管"图怎么解码"。
 */
export function rehypeImageDecoding() {
  return (tree) => {
    const walk = (node) => {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'element' && node.tagName === 'img') {
        node.properties = { ...node.properties, decoding: 'async' };
      }
      if (Array.isArray(node.children)) node.children.forEach(walk);
    };
    walk(tree);
  };
}
