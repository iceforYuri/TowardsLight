/**
 * 档案切换:把 src/profiles/active 与 public/images 指向当前档案目录。
 *
 * - 不设环境变量:默认内置的 profiles/showcase(示例内容,展示站)
 * - 设置 SITE_PROFILE_DIR(或 .env 里同名变量)指向个人档案目录:整站换成个人内容
 *
 * 通过 npm 的 predev/prebuild 钩子自动执行,正常使用无需手动运行。
 * Windows 用 junction(免管理员),其他平台 Node 会自动退化为目录 symlink。
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
// 解析顺序:SITE_PROFILE_DIR 环境变量 > ./personal/(gitignore 的私有档案,约定位置)> 内置 showcase
const conventional = path.join(root, 'personal');
const profileDir = process.env.SITE_PROFILE_DIR
  ? path.resolve(process.env.SITE_PROFILE_DIR)
  : fs.existsSync(path.join(conventional, 'site.ts'))
    ? conventional
    : path.join(root, 'src/profiles/showcase');

// 档案完整性校验:缺件直接报错并给出指引
for (const required of ['site.ts', 'links.ts', 'posts']) {
  if (!fs.existsSync(path.join(profileDir, required))) {
    console.error(`[profile] 档案目录缺少 ${required}: ${profileDir}`);
    console.error('[profile] 可用脚手架生成骨架: node scripts/new-profile.mjs <目标目录>');
    process.exit(1);
  }
}

/** 建立目录指向;已是正确指向则跳过;linkPath 是真实目录则报错保护 */
function linkDir(target, linkPath) {
  try {
    const current = fs.readlinkSync(linkPath);
    if (path.resolve(path.dirname(linkPath), current) === target) return;
  } catch {
    /* 不存在或不是链接,继续 */
  }
  const st = fs.lstatSync(linkPath, { throwIfNoEntry: false });
  if (st) {
    if (st.isSymbolicLink()) {
      fs.unlinkSync(linkPath);
    } else {
      console.error(`[profile] ${linkPath} 是真实目录且被占用,请先手动移除`);
      process.exit(1);
    }
  }
  fs.symlinkSync(target, linkPath, 'junction');
}

/** 图片是可选的:档案没有 images/ 时指到空目录 */
const imagesDir = fs.existsSync(path.join(profileDir, 'images'))
  ? path.join(profileDir, 'images')
  : path.join(root, 'node_modules', '.profile-empty-images');
fs.mkdirSync(imagesDir, { recursive: true });

linkDir(profileDir, path.join(root, 'src/profiles/active'));
linkDir(imagesDir, path.join(root, 'public/images'));

const isShowcase = profileDir === path.join(root, 'src/profiles/showcase');
console.log(
  `[profile] 当前档案: ${isShowcase ? 'showcase(内置示例)' : profileDir}${!isShowcase && !process.env.SITE_PROFILE_DIR ? '(约定位置 personal/ 自动命中)' : ''}`,
);
