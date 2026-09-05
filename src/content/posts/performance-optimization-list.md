---
title: 一次真实的性能优化:把列表页的首屏时间砍掉一半
description: 从一个具体的慢页面出发,记录定位、分析和修复的完整过程,包含代码和压测数据。
pubDate: 2026-05-17
updatedDate: 2026-05-24
category: 前端
tags: [性能优化, React, 渲染]
draft: false
---

## 问题页面

项目里有一个订单列表页,数据量一大就明显卡顿。打开 Performance 面板录了一段,长任务密密麻麻,全部指向同一个组件。

## 定位过程

先看渲染次数。用 Profiler 一看,每次输入筛选条件,整个列表五百行全部重渲染:

```tsx
// 问题写法:每次 render 都创建新引用
function OrderList({ orders }: { orders: Order[] }) {
  const sorted = orders.sort((a, b) => b.createdAt - a.createdAt);
  return (
    <ul>
      {sorted.map((o) => (
        <Row key={o.id} data={o} onSelect={() => select(o.id)} />
      ))}
    </ul>
  );
}
```

`sort` 原地修改了数组,`onSelect` 每次生成新函数,`Row` 的 `memo` 完全失效。

## 修复之后

```tsx
const sorted = useMemo(
  () => [...orders].sort((a, b) => b.createdAt - a.createdAt),
  [orders],
);
const handleSelect = useCallback((id: string) => select(id), [select]);
```

排序改成非原地操作,回调收进 `useCallback`,行组件参数从闭包改成显式传 `id`。改完再录一次,长任务基本消失。

## 数据对比

| 指标 | 优化前 | 优化后 |
| ---- | ------ | ------ |
| 筛选输入帧率 | 12 fps | 58 fps |
| 长任务数量 | 23 个 | 2 个 |
| 首屏 LCP | 3.1s | 1.4s |

## 一点感想

性能问题很少是玄学。正如那句话:

> 先测量,再优化。没有 profile 的优化,只是猜测。

大部分卡顿都能在一小时内的 profile 里找到答案[^1]。

[^1]: 前提是你要知道 Performance 面板的录制按钮在哪,很多人工作三年没点开过。
