/**
 * 环绕描边:为 .card-trace 里的 rect 实测周长,写入 --trace-len 供 dasharray/offset 使用。
 * 不依赖 pathLength(Chromium 的 pathLength 只对 <path> 生效,对 rect 无效)。
 * 周长公式:圆角矩形 = 2(W+H) − 8r + 2πr;W/H 为 rect 实际宽高,r 取 15.5 与半宽半高的小者。
 * 写入时用内联 transition:none 把 dashoffset 瞬移到目标位(否则初始化/resize 会误播描边动画),
 * 强制 reflow 后归还过渡定义,再标记 data-trace-ready 显示。
 */

let observers: ResizeObserver[] = [];

export function initCardTrace() {
  observers.forEach((o) => o.disconnect());
  observers = [];
  document.querySelectorAll<SVGSVGElement>('svg.card-trace').forEach((svg) => {
    const rect = svg.querySelector('rect');
    if (!rect) return;
    const measure = () => {
      const box = svg.getBoundingClientRect();
      const w = Math.max(0, box.width - 1);
      const h = Math.max(0, box.height - 1);
      const r = Math.max(0, Math.min(15.5, w / 2, h / 2));
      const p = 2 * (w + h) - 8 * r + 2 * Math.PI * r;
      rect.style.transition = 'none';
      rect.style.setProperty('--trace-len', p.toFixed(1));
      void rect.getBoundingClientRect();
      rect.style.transition = '';
      svg.setAttribute('data-trace-ready', '');
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(svg);
    observers.push(ro);
  });
}

document.addEventListener('astro:page-load', initCardTrace);
document.addEventListener('astro:before-swap', () => {
  observers.forEach((o) => o.disconnect());
  observers = [];
});
