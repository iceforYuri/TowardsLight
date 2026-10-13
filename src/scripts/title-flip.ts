/**
 * 标题中英翻滚调度(见 TitleFlip.astro):
 * - 每 5s 滚换一次;页面隐藏时暂停,回到前台立刻翻一次再续上节奏;
 * - 英文层字号校准:以中文层的油墨高度(actualBoundingBox)为准,
 *   让行书的拉丁字面与中文艺术体视觉等高;
 * - 减少动态偏好:CSS 已隐藏英文层,脚本直接不启动;
 * - astro:before-swap 时全部清理(组件会随换页重建)。
 */

const INTERVAL = 5000;

let canvasCtx: CanvasRenderingContext2D | null = null;

/** 文字油墨高度:上沿到下沿,排除行盒差异 */
function inkHeight(font: string, text: string): number {
  canvasCtx ??= document.createElement('canvas').getContext('2d')!;
  canvasCtx.font = font;
  const m = canvasCtx.measureText(text);
  return m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
}

async function calibrate(flip: HTMLElement) {
  const zh = flip.querySelector<HTMLElement>('.tf-zh');
  const en = flip.querySelector<HTMLElement>('[data-tf-en]');
  if (!zh || !en) return;
  try {
    await document.fonts.ready;
  } catch {
    /* 字体就绪失败也能跑,只是按未校准比例 */
  }
  const zhCs = getComputedStyle(zh);
  const enCs = getComputedStyle(en);
  const zhH = inkHeight(`${zhCs.fontWeight} ${zhCs.fontSize} ${zhCs.fontFamily}`, zh.textContent ?? '');
  const enH = inkHeight(`${enCs.fontWeight} ${enCs.fontSize} ${enCs.fontFamily}`, en.textContent ?? '');
  if (zhH > 0 && enH > 0) {
    const scale = zhH / enH;
    if (Math.abs(scale - 1) > 0.03) en.style.fontSize = `${scale.toFixed(3)}em`;
  }
}

export function initTitleFlip() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document
    .querySelectorAll<HTMLElement>('[data-title-flip]:not([data-flip-bound])')
    .forEach((flip) => {
      flip.dataset.flipBound = '1';
      calibrate(flip);
      let timer = 0;
      const tick = () => flip.classList.toggle('show-en');
      const start = () => {
        stop();
        timer = window.setInterval(tick, INTERVAL);
      };
      const stop = () => window.clearInterval(timer);
      const onVisible = () => {
        if (document.visibilityState === 'visible') {
          tick(); // 回到前台立刻翻一次
          start();
        } else {
          stop();
        }
      };
      document.addEventListener('visibilitychange', onVisible);
      start();
      document.addEventListener(
        'astro:before-swap',
        () => {
          stop();
          document.removeEventListener('visibilitychange', onVisible);
        },
        { once: true },
      );
    });
}

// 模块顶层:astro:page-load 在每次软导航后触发
if (typeof document !== 'undefined') {
  document.addEventListener('astro:page-load', initTitleFlip);
}
