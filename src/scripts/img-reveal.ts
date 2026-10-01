/**
 * 图片揭示调度:img-reveal 的淡入等待进行中的页面转场结束后再开始,
 * 避免淡入在转场快照覆盖下悄悄播完、看起来像"闪入"。
 * 无转场(首次加载/直接访问)时立即淡入。
 */

type VT = { finished: Promise<unknown> };

let activeTransition: VT | null = null;

// 包一层 startViewTransition 以跟踪进行中的转场(只包装一次)
if (typeof document !== 'undefined' && document.startViewTransition) {
  const orig = document.startViewTransition.bind(document);
  document.startViewTransition = ((cb: () => void) => {
    const vt = orig(cb) as VT;
    activeTransition = vt;
    vt.finished
      .catch(() => {})
      .finally(() => {
        if (activeTransition === vt) activeTransition = null;
      });
    return vt;
  }) as typeof document.startViewTransition;
}

async function reveal(img: HTMLImageElement) {
  const vt = activeTransition;
  if (vt) {
    try {
      await vt.finished;
    } catch {
      // 转场中止也照常淡入
    }
  }
  img.classList.add('is-loaded');
}

export function initImgReveal() {
  document
    .querySelectorAll<HTMLImageElement>('img.img-reveal:not([data-reveal-bound])')
    .forEach((img) => {
      img.dataset.revealBound = '1';
      if (img.complete && img.naturalWidth > 0) {
        // 已缓存:转场结束后再亮(快照里已有图,视觉无差)
        reveal(img);
      } else {
        img.addEventListener('load', () => reveal(img), { once: true });
      }
    });
}
