/**
 * 正文表格包裹:<table> → div.table-wrap > div.table-frame > div.table-scroll > table
 *
 * 圆角外框、横向滚动、滚动边缘阴影不能同时挂在 table 上(table 要保持 display:table
 * 才能铺满列宽、让列宽按内容分配),所以拆成三层:
 * - table-wrap:外边距与表号(prose.css 的 TABLE 01 计数器);
 * - table-frame:圆角、外框、左右边缘阴影;
 * - table-scroll:横向滚动容器(scripts/table-scroll.ts 据此写 data-scroll)。
 * 已包裹过的表格不重复包裹(插件幂等)。
 */
function isElement(node, name) {
  return node && node.type === 'element' && node.tagName === name;
}

function hasClass(node, cls) {
  const c = node.properties?.className;
  return Array.isArray(c) ? c.includes(cls) : c === cls;
}

function div(className, children) {
  return { type: 'element', tagName: 'div', properties: { className: [className] }, children };
}

export function rehypeTables() {
  return (tree) => {
    const walk = (node) => {
      if (!node || !Array.isArray(node.children)) return;
      if (node.type === 'element' && hasClass(node, 'table-scroll')) return;
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (isElement(child, 'table')) {
          node.children[i] = div('table-wrap', [div('table-frame', [div('table-scroll', [child])])]);
        } else {
          walk(child);
        }
      }
    };
    walk(tree);
  };
}
