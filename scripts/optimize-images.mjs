/**
 * 图片优化:扫描 public/images/ 下的位图(png/jpg/jpeg),生成 .webp 变体,
 * 并输出 src/generated/optimized-images.json 映射(原路径 → webp 路径)。
 *
 * - 只处理超过阈值(150KB)的图;小图转换无收益
 * - webp 已存在且新于源文件时跳过(增量)
 * - 页面侧用 utils/opt-image.ts 的 optImage() 在构建期把 src 换到 webp;
 *   清单未收录(没跑过脚本/图不够大)时原样返回,永远安全
 *
 * 由 predev/prebuild/precheck 钩子自动执行(在 use-profile 之后)。
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const IMAGES_DIR = path.join(ROOT, 'public', 'images');
const MANIFEST = path.join(ROOT, 'src', 'generated', 'optimized-images.json');
const MIN_BYTES = 150 * 1024;
const MAX_WIDTH = 2400;
const QUALITY = 82;

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else if (/\.(png|jpe?g)$/i.test(entry.name)) yield p;
  }
}

async function main() {
  const manifest = {};
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
    fs.writeFileSync(MANIFEST, '{}\n');
    return;
  }
  let made = 0;
  for (const file of walk(IMAGES_DIR)) {
    const stat = fs.statSync(file);
    const webp = file.replace(/\.(png|jpe?g)$/i, '.webp');
    if (stat.size < MIN_BYTES) continue;
    if (
      fs.existsSync(webp) &&
      fs.statSync(webp).mtimeMs >= stat.mtimeMs &&
      fs.statSync(webp).size > 0
    ) {
      // 已是最新,仍要进清单
    } else {
      const img = sharp(file).rotate(); // 尊重 EXIF 方向
      const meta = await img.metadata();
      if (meta.width > MAX_WIDTH) img.resize({ width: MAX_WIDTH });
      await img.webp({ quality: QUALITY }).toFile(webp);
      made++;
      console.log(
        `[images] ${path.basename(file)} ${(stat.size / 1024).toFixed(0)}KB → ${(fs.statSync(webp).size / 1024).toFixed(0)}KB`,
      );
    }
    const pub = '/' + path.relative(path.join(ROOT, 'public'), file).split(path.sep).join('/');
    manifest[pub] = pub.replace(/\.(png|jpe?g)$/i, '.webp');
  }
  fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1) + '\n');
  console.log(`[images] 清单 ${Object.keys(manifest).length} 条,本轮新转 ${made} 个`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
