/**
 * 图片揭示调度:img-reveal 的淡入在两个条件都满足后才开始——
 * 位图可绘制(img.decode())+ 进行中的转场播完(vt.finished)。
 * 快图几乎瞬时满足,等效立即淡入;大图自动"好了再淡",
 * 避免透明度动画跑在还没光栅化好的图层上(闪入/空淡入)。
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
async function reveal(img: HTMLImageElement) {
  try {
    await img.decode();
  } catch {
    return; // 解码失败交给 onerror 路径(移除背景),这里不亮
  }
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
        reveal(img); // 已下载:decode 立即 resolve
      } else {
        img.addEventListener('load', () => reveal(img), { once: true });
      }
    });
}
