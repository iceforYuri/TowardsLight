/**
 * 正文宽表的滚动状态:给 .table-wrap 写 data-scroll=start|mid|end,无横向溢出时移除。
 * prose.css 据此显示边缘阴影、冻结首列的分隔影和"左右滑动"提示;
 * 溢出时让滚动区可被键盘聚焦(tabindex=0),否则不进入 Tab 顺序。
 * 由 astro:page-load 驱动,处理过的打 data-scroll-bound 标记,软导航不重复绑定。
 */
export function initTableScroll(): void {
  document.querySelectorAll<HTMLElement>('.prose .table-wrap:not([data-scroll-bound])').forEach((wrap) => {
    const scroller = wrap.querySelector<HTMLElement>('.table-scroll');
    if (!scroller) return;
    wrap.dataset.scrollBound = '1';

    const update = () => {
      const max = scroller.scrollWidth - scroller.clientWidth;
      if (max <= 1) {
        delete wrap.dataset.scroll;
        scroller.removeAttribute('tabindex');
        return;
      }
      wrap.dataset.scroll = scroller.scrollLeft <= 1 ? 'start' : scroller.scrollLeft >= max - 1 ? 'end' : 'mid';
      scroller.tabIndex = 0;
    };

    scroller.addEventListener('scroll', update, { passive: true });
    // 表格自身也要观察:字体加载后列宽变化只改 scrollWidth,不改滚动区尺寸
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    const table = scroller.querySelector('table');
    if (table) observer.observe(table);
    update();
  });
}
