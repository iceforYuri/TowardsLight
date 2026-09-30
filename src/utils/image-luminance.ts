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
import sharp from 'sharp';

export type ImageTextMode = 'on-dark' | 'on-light';

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

/** 采样站内图片(public 相对路径,如 /images/hero-bg.png)文字区的中位亮度(0-255) */
export async function sampleImageLuminance(
  src: string | undefined,
  zone: keyof typeof REGIONS = 'hero',
): Promise<number | null> {
  if (!src || !src.startsWith('/')) return null;
  const r = REGIONS[zone];
  try {
    const img = sharp(path.join(process.cwd(), 'public', src));
    const meta = await img.metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;
    if (!w || !h) return null;
    const { data } = await img
      .extract({
        left: Math.floor(w * r.left),
        top: Math.floor(h * r.top),
        width: Math.max(1, Math.floor(w * r.width)),
        height: Math.max(1, Math.floor(h * r.height)),
      })
      .resize(64, 48, { fit: 'fill' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const lums: number[] = [];
    for (let i = 0; i + 2 < data.length; i += 3) {
      lums.push(0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]);
    }
    lums.sort((a, b) => a - b);
    return lums[Math.floor(lums.length / 2)];
  } catch {
    return null;
  }
}

/** 中位亮度 → 图上文字模式;阈值取 128,采样失败返回 null */
export function imageTextMode(lum: number | null): ImageTextMode | null {
  if (lum == null) return null;
  return lum < 128 ? 'on-dark' : 'on-light';
}

/**
 * 亮度 → 文字区遮罩强度(0.15~0.55)。
 * 图本身已够暗(on-dark)或够亮(on-light)时只需轻雾;越接近中调越需要强遮罩。
 */
export function scrimStrength(lum: number | null, mode: ImageTextMode | null): number {
  if (lum == null || mode == null) return 0.35;
  const t = mode === 'on-dark' ? (lum - 50) / 160 : (205 - lum) / 160;
  return Math.min(0.55, Math.max(0.15, Math.round(t * 100) / 100));
}
