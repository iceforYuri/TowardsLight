/**
 * 环绕描边:为 .card-trace 里的 path 按实际卡片尺寸生成圆角矩形路径。
 * 路径从顶部中心开始,顺时针绕一圈再回到顶部中心,使用 pathLength=100 归一化动画。
 * 写入时暂时关闭 transition,避免首次测量/尺寸变化误播描边动画。
 */

let observers: ResizeObserver[] = [];

export function initCardTrace() {
  observers.forEach((o) => o.disconnect());
  observers = [];
  document.querySelectorAll<SVGSVGElement>('svg.card-trace').forEach((svg) => {
    const path = svg.querySelector('path');
    if (!path) return;

    const measure = () => {
      const box = svg.getBoundingClientRect();
      const width = Math.max(0, box.width);
      const height = Math.max(0, box.height);
      const inset = 1;
      const radius = Math.max(0, Math.min(15.5, (width - inset * 2) / 2, (height - inset * 2) / 2));
      const right = width - inset;
      const bottom = height - inset;
      const center = width / 2;
      const d = [
        `M ${center} ${inset}`,
        `H ${right - radius}`,
        `A ${radius} ${radius} 0 0 1 ${right} ${inset + radius}`,
        `V ${bottom - radius}`,
        `A ${radius} ${radius} 0 0 1 ${right - radius} ${bottom}`,
        `H ${inset + radius}`,
        `A ${radius} ${radius} 0 0 1 ${inset} ${bottom - radius}`,
        `V ${inset + radius}`,
        `A ${radius} ${radius} 0 0 1 ${inset + radius} ${inset}`,
        `H ${center}`,
      ].join(' ');

      path.style.transition = 'none';
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      path.setAttribute('d', d);
      void path.getBoundingClientRect();
      path.style.transition = '';
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
