/**
 * 转发层:真实数据在当前档案目录(src/profiles/active)。
 * 默认指向 profiles/showcase(示例);设 SITE_PROFILE_DIR 即整站切换为个人档案。
 * 由 scripts/use-profile.mjs 在 dev/build 前自动维护指向。
 */
export { site } from '../profiles/active/site';
export type { FlipItem, FlipPanel, SiteConfig } from '../profiles/active/site';
