/**
 * 构建期图片优化入口:public/images 下的大图由 scripts/optimize-images.mjs
 * 预生成 .webp,这里按清单把原路径换到 webp;未收录(小图/未跑脚本)原样返回。
 * 仅处理 / 开头的站内 public 路径,外链与相对路径不动。
 */
import manifest from '../generated/optimized-images.json';

export function optImage(src: string): string {
  if (!src.startsWith('/')) return src;
  return (manifest as Record<string, string>)[src] ?? src;
}
