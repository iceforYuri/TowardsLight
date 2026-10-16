/**
 * 图片揭示调度:
 * - 转场中(软导航):无过渡直奔最终态(见 revealInstant)——0.6s 淡入会被
 *   定格在 opacity≈0 拍进新页快照,图像比同帧元素(如羽化幕布)晚一整拍;
 *   缓存图首帧即有像素,在途图字节到达后直接呈现(快照撤下时已在场),
 *   平滑统一交给转场自身的交叉淡化
 * - 硬加载:decode 后 0.6s 淡入,避免生硬的瞬间弹出;图未就绪则等
 *   load + decode + 转场播完(vt.finished),位图 ready 淡入才是真的
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
 * 转场中的同步揭示:直奔最终态。强制重排提交样式,供新页快照捕获。
 */
function revealInstant(el: HTMLElement) {
  el.style.transition = 'none';
  el.classList.add('is-loaded');
  void el.offsetWidth;
  el.style.transition = '';
}

/**
 * 硬加载路径的揭示 = 位图可绘制(decode)+ 转场播完:
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
      // 转场中:直奔最终态进快照(不依赖新建 img 的 complete——内存缓存图
      // 的首帧渲染本就带像素,而 complete/load 事件时机赶不上快照捕获)
      if (activeTransition) {
        revealInstant(el);
        return;
      }
      // 容器级:揭示对象是整个背景容器(图+遮罩一起淡入),触发源是其中的 img
      const img = el instanceof HTMLImageElement ? el : el.querySelector('img');
      if (!img) {
        el.classList.add('is-loaded');
        return;
      }
      if (img.complete && img.naturalWidth > 0) {
        reveal(el, img, false); // 已就绪:decode 后即淡入
      } else {
        img.addEventListener('load', () => reveal(el, img, true), { once: true });
      }
    });
}
