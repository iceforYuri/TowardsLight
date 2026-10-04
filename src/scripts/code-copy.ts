/**
 * 代码块复制按钮:每个 pre.astro-code 右上角注入,点击拷贝代码文本。
 * 依赖结构:Shiki 的 pre 已是 relative(语言徽章挂在 ::before),按钮放徽章左侧。
 * 由 astro:page-load 驱动,处理过的打 data-copy-bound 标记,软导航不重复注入。
 */
const COPY_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
const CHECK_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

export function initCodeCopy(): void {
  document.querySelectorAll<HTMLElement>('.prose pre.astro-code:not([data-copy-bound])').forEach((pre) => {
    pre.dataset.copyBound = '1';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'code-copy-btn';
    btn.setAttribute('aria-label', '复制代码');
    btn.title = '复制';
    btn.innerHTML = COPY_ICON;
    btn.addEventListener('click', async () => {
      const code = pre.querySelector('code');
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code.innerText);
        btn.classList.add('copied');
        btn.innerHTML = CHECK_ICON;
        btn.setAttribute('aria-label', '已复制');
        window.setTimeout(() => {
          btn.classList.remove('copied');
          btn.innerHTML = COPY_ICON;
          btn.setAttribute('aria-label', '复制代码');
        }, 1200);
      } catch {
        btn.title = '复制失败,请手动选择';
      }
    });
    pre.appendChild(btn);
  });
}
