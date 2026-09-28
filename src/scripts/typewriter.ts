/**
 * 打字机 + 数字翻动。
 * 结构约定:
 *   [data-typewriter]            容器(打字中加 data-typing,打完加 data-done)
 *   ├── [data-typewriter-text]   文本节点 + 数字段(带 data-count-to 的 span)
 *   └── [data-typewriter-caret]  光标(打字时跟随位置,打完由 CSS 淡出)
 *
 * SSR 已输出全文;prefers-reduced-motion 或无 JS 时保持全文,不启动。
 * 数字段在打字光标经过时从 0 快速计数到目标值(ease-out),
 * 不阻塞后续打字——一行里多个数字依次翻动。
 */

export interface TypewriterOptions {
  /** 每个字符的间隔 ms,默认 24 */
  charDelay?: number;
  /** 开始前延迟 ms */
  delay?: number;
  /** 数字翻动时长 ms,默认 460 */
  countDuration?: number;
  signal?: AbortSignal;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) return resolve();
    const t = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(t);
        resolve();
      },
      { once: true },
    );
  });
}

function countUp(
  el: HTMLElement,
  target: number,
  decimals: number,
  duration: number,
  signal?: AbortSignal,
) {
  const start = performance.now();
  const step = (now: number) => {
    if (signal?.aborted) {
      el.textContent = target.toFixed(decimals);
      return;
    }
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = (target * eased).toFixed(decimals);
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = target.toFixed(decimals);
  };
  requestAnimationFrame(step);
}

export async function runTypewriter(
  root: HTMLElement,
  opts: TypewriterOptions = {},
): Promise<void> {
  const textEl = root.querySelector<HTMLElement>('[data-typewriter-text]');
  if (!textEl) return;
  if (!(textEl.textContent ?? '').trim()) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const { signal } = opts;
  if (signal?.aborted) return;

  interface TextSeg {
    node: Text;
    value: string;
  }
  interface NumSeg {
    el: HTMLElement;
    target: number;
    decimals: number;
  }
  const segments: (TextSeg | NumSeg)[] = [];

  for (const node of [...textEl.childNodes]) {
    if (node.nodeType === Node.TEXT_NODE) {
      const value = node.nodeValue ?? '';
      // 模板缩进产生的纯空白节点(含换行)不参与打字
      if (value.trim() === '' && value.includes('\n')) continue;
      segments.push({ node: node as Text, value });
    } else if (node instanceof HTMLElement && node.dataset.countTo !== undefined) {
      segments.push({
        el: node,
        target: Number(node.dataset.countTo) || 0,
        decimals: Number(node.dataset.decimals ?? '0') || 0,
      });
    }
  }
  if (segments.length === 0) return;

  if (opts.delay) await sleep(opts.delay, signal);
  if (signal?.aborted) return;

  // 量出全文尺寸并锁定,打字过程中不抖动、不折行跳动
  const w = textEl.offsetWidth;
  const h = textEl.offsetHeight;
  textEl.style.display = 'inline-block';
  textEl.style.minWidth = `${w}px`;
  textEl.style.minHeight = `${h}px`;
  textEl.style.maxWidth = '100%';
  textEl.style.textAlign = 'left';

  for (const seg of segments) {
    if ('node' in seg) seg.node.nodeValue = '';
    else seg.el.textContent = '';
  }

  const caret = root.querySelector<HTMLElement>('[data-typewriter-caret]');
  root.dataset.typing = 'true';
  const charDelay = opts.charDelay ?? 24;

  for (const seg of segments) {
    if (signal?.aborted) return;
    if ('node' in seg) {
      for (let i = 1; i <= seg.value.length; i++) {
        if (signal?.aborted) return;
        seg.node.nodeValue = seg.value.slice(0, i);
        if (caret) textEl.appendChild(caret);
        await sleep(charDelay, signal);
      }
    } else {
      // 数字段:光标经过即开始翻动,不等待,继续向后打字
      seg.el.textContent = (0).toFixed(seg.decimals);
      if (caret) textEl.appendChild(caret);
      countUp(seg.el, seg.target, seg.decimals, opts.countDuration ?? 460, signal);
    }
  }

  if (caret) textEl.appendChild(caret);
  root.dataset.done = 'true';

  // 光标淡出后撤掉尺寸锁与对齐覆盖,恢复自然排版
  // (多行文本的末行重新居中;窗口缩放时可自然回流)
  window.setTimeout(() => {
    if (signal?.aborted) return;
    textEl.style.display = '';
    textEl.style.minWidth = '';
    textEl.style.minHeight = '';
    textEl.style.maxWidth = '';
    textEl.style.textAlign = '';
  }, 750);
}
