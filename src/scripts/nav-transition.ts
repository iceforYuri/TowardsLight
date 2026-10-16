import type { TransitionBeforeSwapEvent } from 'astro:transitions/client';

/** 原生转场画在普通 DOM 上方。只让画面避开实时导航，鼠标仍由真实链接接收。 */
export function initNavTransition(header: HTMLElement) {
  if (!document.startViewTransition || header.querySelector('#live-nav-mask')) return;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  Object.assign(svg.style, { position: 'absolute', pointerEvents: 'none' });
  svg.innerHTML = `<defs>
    <filter id="live-nav-shadow" x="-50%" y="-150%" width="200%" height="400%">
      <feGaussianBlur stdDeviation="8" />
    </filter>
    <mask id="live-nav-mask" x="0" y="0" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" style="mask-type:luminance">
      <rect data-mask-canvas fill="white" />
      <g data-mask-skin fill="black">
        <use href="#live-nav-shape" filter="url(#live-nav-shadow)" opacity="0.08" />
        <path id="live-nav-shape" stroke="black" stroke-width="1" />
      </g>
      <g data-mask-panels fill="black" />
      <rect data-mask-progress fill="black" />
    </mask>
  </defs>`;
  header.append(svg);
  const mask = svg.querySelector('mask')!;
  const canvas = svg.querySelector('[data-mask-canvas]')!;
  const skin = svg.querySelector('[data-mask-skin]')!;
  const shape = svg.querySelector('#live-nav-shape')!;
  const progress = svg.querySelector('[data-mask-progress]')!;
  const panels = svg.querySelector('[data-mask-panels]')!;
  const pill = header.querySelector<HTMLElement>('[data-dock-zone]')!;
  const path = pill.querySelector<SVGPathElement>('[data-pill-path]')!;

  // 实际 tooltip/移动菜单的圆角轮廓，不用一整块矩形挖空背景。
  const cutouts = [...header.querySelectorAll<HTMLElement>('.dock-tooltip, [data-mobile-panel]')].map((element) => {
    const group = document.createElementNS(ns, 'g');
    const shadow = document.createElementNS(ns, 'rect');
    shadow.setAttribute('filter', 'url(#live-nav-shadow)');
    shadow.setAttribute('opacity', '0.08');
    const face = document.createElementNS(ns, 'rect');
    group.append(shadow, face);
    panels.append(group);
    return { element, group, rects: [shadow, face] };
  });

  function rect(element: Element, box: DOMRect, radius = 0) {
    for (const [key, value] of Object.entries({ x: box.x, y: box.y, width: box.width, height: box.height, rx: radius })) {
      element.setAttribute(key, String(value));
    }
  }

  function refresh() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    for (const element of [mask, canvas]) {
      element.setAttribute('width', String(width));
      element.setAttribute('height', String(height));
    }
    const matrix = path.getScreenCTM();
    if (pill.classList.contains('has-skin') && matrix) {
      shape.setAttribute('d', path.getAttribute('d') ?? '');
      skin.setAttribute('transform', `matrix(${matrix.a} ${matrix.b} ${matrix.c} ${matrix.d} ${matrix.e} ${matrix.f})`);
    } else {
      const box = pill.getBoundingClientRect();
      const r = box.height / 2;
      shape.setAttribute('d', `M${r} 0H${box.width - r}Q${box.width} 0 ${box.width} ${r}V${box.height - r}Q${box.width} ${box.height} ${box.width - r} ${box.height}H${r}Q0 ${box.height} 0 ${box.height - r}V${r}Q0 0 ${r} 0Z`);
      skin.setAttribute('transform', `translate(${box.x} ${box.y})`);
    }
    for (const { element, group, rects } of cutouts) {
      const style = getComputedStyle(element);
      const opacity = element.hidden || style.display === 'none' ? 0 : Number(style.opacity);
      group.setAttribute('opacity', String(opacity));
      if (!opacity) continue;
      const box = element.getBoundingClientRect();
      const radius = Math.min(parseFloat(style.borderTopLeftRadius) || 0, box.height / 2, box.width / 2);
      for (const item of rects) rect(item, box, radius);
    }
    const bar = document.getElementById('nav-progress');
    if (bar) {
      rect(progress, bar.getBoundingClientRect());
      progress.setAttribute('opacity', getComputedStyle(bar).opacity);
    } else {
      progress.setAttribute('width', '0');
    }
    // 写在文档上，避免外部 CSS 的 url(#id) 被解析成样式文件 URL。
    const url = `url("${new URL('#live-nav-mask', location.href).href}")`;
    if (document.documentElement.style.getPropertyValue('--live-nav-mask') !== url) {
      document.documentElement.style.setProperty('--live-nav-mask', url);
    }
  }

  let active: ViewTransition | undefined;
  let frame = 0;
  function tick() {
    refresh();
    if (active) frame = requestAnimationFrame(tick);
  }
  document.addEventListener('astro:before-swap', (event) => {
    const transition = (event as TransitionBeforeSwapEvent).viewTransition;
    active = transition;
    cancelAnimationFrame(frame);
    tick();
    const finish = () => {
      // 连续导航时，旧转场结束不能清理新转场的遮罩。
      if (active !== transition) return;
      active = undefined;
      cancelAnimationFrame(frame);
      document.documentElement.style.removeProperty('--live-nav-mask');
    };
    transition.finished.then(finish, finish);
  });
  document.addEventListener('astro:after-swap', () => {
    // Astro 会替换 html 属性；新页捕获前恢复遮罩 URL 与当前几何。
    if (active) refresh();
  });
}
