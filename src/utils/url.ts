/**
 * 内部路径拼接部署 base;非 "/" 开头的外链/锚点原样返回。
 * 构建静态站时由 import.meta.env.BASE_URL 注入,默认 '/' 时零开销。
 */
export function u(path: string): string {
  if (!path.startsWith('/')) return path;
  const base = import.meta.env.BASE_URL;
  return base === '/' ? path : base.replace(/\/$/, '') + path;
}
