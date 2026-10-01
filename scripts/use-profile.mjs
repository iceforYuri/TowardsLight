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

const sleep = (ms) => Atomics.wait(new Int32Array(1), 0, 0, ms);

/** 读回校验:链接存在且指向 target */
function linkPointsTo(target, linkPath) {
  try {
    return path.resolve(path.dirname(linkPath), fs.readlinkSync(linkPath)) === target;
  } catch {
    return false;
  }
}

/**
 * 建立目录指向;已是正确指向则跳过;linkPath 是真实目录则报错保护。返回是否发生了重指向。
 * 加固:unlink+symlink 不是原子的,并发跑两个 use-profile(终端 + 扩展同时起 dev)
 * 可能互相拆掉对方的链接留下残骸——失败时先读回(也许对方已经建好了),再重试一次。
 */
function linkDir(target, linkPath) {
  if (linkPointsTo(target, linkPath)) return false;
  const st = fs.lstatSync(linkPath, { throwIfNoEntry: false });
  if (st) {
    if (st.isSymbolicLink()) {
      fs.unlinkSync(linkPath);
    } else {
      console.error(`[profile] ${linkPath} 是真实目录且被占用,请先手动移除`);
      process.exit(1);
    }
  }
  for (let attempt = 1; ; attempt++) {
    try {
      fs.symlinkSync(target, linkPath, 'junction');
      break;
    } catch (e) {
      if (linkPointsTo(target, linkPath)) return false; // 并发对家已建好,结果正确即可
      if (attempt >= 2) throw e;
      sleep(150);
    }
  }
  if (!linkPointsTo(target, linkPath)) {
    console.error(`[profile] ${linkPath} 创建后读回校验失败,请手动检查该路径`);
    process.exit(1);
  }
  return true;
}

/** 图片是可选的:档案没有 images/ 时指到空目录 */
const imagesDir = fs.existsSync(path.join(profileDir, 'images'))
  ? path.join(profileDir, 'images')
  : path.join(root, 'node_modules', '.profile-empty-images');
fs.mkdirSync(imagesDir, { recursive: true });

const relinkedActive = linkDir(profileDir, path.join(root, 'src/profiles/active'));
const relinkedImages = linkDir(imagesDir, path.join(root, 'public/images'));
const relinked = relinkedActive || relinkedImages;

// 内容层存储(.astro/data-store.json 等)只增不剪:换档案后旧档案的条目会残留,
// 其图片 import 在新指向下解析不到文件,ImageNotFound 一拖垮全站。
// 指向一旦变化就清掉内容缓存,下次 dev/build 冷同步重建(astro 会自动重新生成)。
if (relinked) {
  for (const f of ['data-store.json', 'content-assets.mjs', 'content-modules.mjs']) {
    fs.rmSync(path.join(root, '.astro', f), { force: true });
  }
  console.log('[profile] 档案指向已变化,内容缓存已清理(下次启动冷同步)');
}

const isShowcase = profileDir === path.join(root, 'src/profiles/showcase');
console.log(
  `[profile] 当前档案: ${isShowcase ? 'showcase(内置示例)' : profileDir}${!isShowcase && !process.env.SITE_PROFILE_DIR ? '(约定位置 personal/ 自动命中)' : ''}`,
);
