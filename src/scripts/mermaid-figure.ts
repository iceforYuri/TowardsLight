/**
 * mermaid 图/代码切换:工具栏按钮切换 figure 的 data-view。
 * 图与代码在构建期已渲染/保留,切换纯显隐,零重算。
 */
export function initMermaidFigures(): void {
  document
    .querySelectorAll<HTMLElement>('.mermaid-figure:not([data-mmd-bound])')
    .forEach((fig) => {
      fig.dataset.mmdBound = '1';
      fig.querySelectorAll<HTMLButtonElement>('[data-mermaid-view]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const view = btn.dataset.mermaidView ?? 'diagram';
          fig.dataset.view = view;
          fig.querySelectorAll('[data-mermaid-view]').forEach((b) =>
            b.setAttribute('aria-pressed', String(b === btn)),
          );
        });
      });
    });
}
