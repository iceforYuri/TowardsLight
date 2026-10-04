/**
 * mermaid 图/代码切换:工具排单一图标钮切换 data-view(图标随状态换面),
 * 复制键直接拷贝图源。视图构建期已就绪,切换纯显隐,零重算。
 */
export function initMermaidFigures(): void {
  document
    .querySelectorAll<HTMLElement>('.mermaid-figure:not([data-mmd-bound])')
    .forEach((fig) => {
      fig.dataset.mmdBound = '1';

      const toggle = fig.querySelector<HTMLButtonElement>('.mmd-toggle');
      toggle?.addEventListener('click', () => {
        const toCode = fig.dataset.view !== 'code';
        fig.dataset.view = toCode ? 'code' : 'diagram';
        toggle.setAttribute('aria-pressed', String(toCode));
        toggle.setAttribute('aria-label', toCode ? '切换到图' : '切换到代码');
      });

      const copyBtn = fig.querySelector<HTMLButtonElement>('.mmd-copy');
      copyBtn?.addEventListener('click', async () => {
        const src = fig.querySelector('.mermaid-source code')?.textContent ?? '';
        if (!src) return;
        try {
          await navigator.clipboard.writeText(src);
          copyBtn.classList.add('copied');
          copyBtn.setAttribute('aria-label', '已复制');
          window.setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.setAttribute('aria-label', '复制图源');
          }, 1200);
        } catch {
          copyBtn.title = '复制失败,请手动选择';
        }
      });
    });
}
