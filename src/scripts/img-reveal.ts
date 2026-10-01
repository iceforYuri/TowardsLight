/**
 * 图片揭示调度:
 * - 已就绪(缓存)的图:decode 后立即亮,赶上转场快照,无缝
 * - 未加载完的图:load + decode + 转场播完(vt.finished)后才淡入——
 *   位图 ready 淡入才是真的,且不会在快照覆盖下空播
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

/**
 * 揭示 = 位图可绘制(decode)+ 转场播完。两者都满足才开始淡入:
 * - decode:等位图解码/光栅化完成,淡入开始时图层 ready,避免"透明度在走、画面还没图"的空淡入
 * - vt.finished:避免淡入在转场快照覆盖下空播(闪入)
 * 小图 decode 几乎瞬时,等效于"快图立即淡入";大图自动变成"好了再淡"。
 */
async function reveal(el: HTMLElement, img: HTMLImageElement, waitForTransition: boolean) {
  try {
    await img.decode();
  } catch {
    return; // 解码失败交给 onerror 路径(移除背景),这里不亮
  }
  const vt = waitForTransition ? activeTransition : null;
  if (vt) {
    try {
      await vt.finished;
    } catch {
      // 转场中止也照常淡入
    }
  }
  el.classList.add('is-loaded');
}

export function initImgReveal() {
  document
    .querySelectorAll<HTMLElement>('.img-reveal:not([data-reveal-bound])')
    .forEach((el) => {
      el.dataset.revealBound = '1';
      // 容器级:揭示对象是整个背景容器(图+遮罩一起淡入),触发源是其中的 img
      const img = el instanceof HTMLImageElement ? el : el.querySelector('img');
      if (!img) {
        el.classList.add('is-loaded');
        return;
      }
      if (img.complete && img.naturalWidth > 0) {
        reveal(el, img, false); // 已就绪:立即亮(赶上转场快照)
      } else {
        img.addEventListener('load', () => reveal(el, img, true), { once: true });
      }
    });
}
