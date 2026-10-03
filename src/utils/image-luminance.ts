/**
 * 构建期图片亮度采样:为"图上文字模式"提供依据。
 *
 * 文字模式跟图走,不跟主题走:
 * - 图暗 → on-dark(浅字 + 压暗雾)
 * - 图亮 → on-light(深字 + 提亮雾)
 * - 采样失败(SVG 解码失败/远程图/文件缺失)→ null,回退到主题默认遮罩
 *
 * 仅在构建/开发服务端运行,产物是内联的 data 属性与 CSS 变量,运行时零开销。
 */
import path from 'node:path';
import fs from 'node:fs';
import sharp from 'sharp';

export type ImageTextMode = 'on-dark' | 'on-light';

/**
 * 采样结果缓存(path + mtime → 亮度):dev 下同一进程内页面反复渲染时,
 * 不为每张背景图重复解码原图——大图(如 8K JPEG)单次解码可达数百毫秒,
 * 会阻塞 SSR 响应,表现为"点击后过一会才跳转"。文件变更(mtime 变化)自动失效。
 */
const lumCache = new Map<string, { mtimeMs: number; lum: number | null }>();

interface Region {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** 采样带(占图比例):hero 文字垂直居中;stage 文字锚定在视觉区底部 */
const REGIONS: Record<'hero' | 'stage', Region> = {
  hero: { left: 0.25, top: 0.28, width: 0.5, height: 0.37 },
  stage: { left: 0.2, top: 0.52, width: 0.6, height: 0.42 },
};

/** 采样站内图片文字区的中位亮度(0-255)。
 *  支持两类源:public 相对路径(/images/...)与 cwd 相对文件路径(如档案内的文章封面);
 *  远程 URL 不采样,返回 null */
export async function sampleImageLuminance(
  src: string | undefined,
  zone: keyof typeof REGIONS = 'hero',
): Promise<number | null> {
  if (!src || /^https?:\/\//.test(src)) return null;
  const r = REGIONS[zone];
  try {
    const file = src.startsWith('/')
      ? path.join(process.cwd(), 'public', src)
      : path.resolve(process.cwd(), src);
    const { mtimeMs } = fs.statSync(file);
    const key = `${file}:${zone}`;
    const hit = lumCache.get(key);
    if (hit && hit.mtimeMs === mtimeMs) return hit.lum;
    const img = sharp(file);
    const meta = await img.metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;
    let lum: number | null = null;
    if (w && h) {
      // 先缩到 64×48 再在 JS 侧裁区域:避免 extract 强制全尺寸栅格化
      // (SVG 大模糊滤镜下尤其贵);位图也能吃到 shrink-on-load
      const { data } = await img
        .resize(64, 48, { fit: 'fill' })
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      const x0 = Math.floor(64 * r.left);
      const y0 = Math.floor(48 * r.top);
      const rw = Math.max(1, Math.floor(64 * r.width));
      const rh = Math.max(1, Math.floor(48 * r.height));
      const lums: number[] = [];
      for (let y = y0; y < y0 + rh; y++) {
        for (let x = x0; x < x0 + rw; x++) {
          const i = (y * 64 + x) * 3;
          lums.push(0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]);
        }
      }
      lums.sort((a, b) => a - b);
      lum = lums[Math.floor(lums.length / 2)];
    }
    lumCache.set(key, { mtimeMs, lum });
    return lum;
  } catch {
    return null;
  }
}

export interface ImageTreatment {
  /** 亮色主题:文字模式与遮罩强度(雾的方向与图一致——暗图暗雾、亮图亮雾) */
  mode: ImageTextMode;
  scrim: number;
  /**
   * 深色主题:遮罩强度。一律暗雾收暗,按"处理后文字区 ≤85 亮度"反推(0.45~0.68)。
   * 处理后亮度上限 ~94 < 128,故深色主题文字恒为浅色——这是推导结果,不是硬编码。
   */
  scrimDark: number;
}

/** 采样 + 模式解析的合体结果(hero/stage 组件与页面级元素共用,如首页统计行) */
export interface ImgModeResult {
  imgMode: ImageTextMode | null;
  imgScrim: number;
  imgScrimDark: number;
}

/**
 * 背景图 + 手工指定模式 → 图上文字模式与遮罩强度。
 * 手工模式('on-dark'/'on-light')优先;否则按采样亮度推导;采样失败 imgMode 为 null。
 */
export async function resolveImgMode(
  background: string | undefined,
  textMode: string | undefined,
  zone: 'hero' | 'stage' = 'hero',
): Promise<ImgModeResult> {
  const treatment = imageTreatment(await sampleImageLuminance(background, zone));
  const manual = textMode === 'on-dark' || textMode === 'on-light' ? textMode : null;
  return {
    imgMode: manual ?? treatment?.mode ?? null,
    imgScrim: treatment?.scrim ?? 0.35,
    imgScrimDark: treatment?.scrimDark ?? 0.45,
  };
}

/**
 * 图片中位亮度 → 两个主题各自的遮罩处理。
 * 文字色按"处理后"的背景亮度决定;采样失败返回 null,组件回退主题默认遮罩。
 */
export function imageTreatment(lum: number | null): ImageTreatment | null {
  if (lum == null) return null;
  // 亮色主题:保留图的明暗性格
  const mode: ImageTextMode = lum < 128 ? 'on-dark' : 'on-light';
  const s = mode === 'on-dark' ? (lum - 50) / 160 : (205 - lum) / 160;
  const scrim = Math.min(0.55, Math.max(0.15, Math.round(s * 100) / 100));
  // 深色主题:统一收暗;暗图保持明显暗化(0.45),亮图压到文字区 ≤85
  const sd = lum <= 85 ? 0.45 : 1 - (85 - 18) / (lum - 18);
  const scrimDark = Math.round(Math.min(0.68, Math.max(0.45, sd)) * 100) / 100;
  return { mode, scrim, scrimDark };
}
