---
title: 代码块高亮全景:主流语言、语言徽章与未知语言兜底
description: 一次看全这个博客的代码渲染:常见语言高亮、右上角语言徽章,以及写了不存在的语言时的兜底行为。文末顺带演示六级标题。
pubDate: 2026-09-08
category: 博客搭建
tags: [Shiki, Markdown, 代码高亮, 排版]
draft: false
featured: false
---

代码高亮由 Shiki 驱动,TextMate 语法体系,内置 200 多种语言,亮暗双主题随站点切换。每个代码块右上角有语言徽章,写的是作者标注的原始语言名。

## 常见语言

### TypeScript

```ts
interface Post {
  title: string;
  tags: string[];
  draft: boolean;
}

export function publish(post: Post): Post {
  return { ...post, draft: false };
}
```

### Python

```python
def word_count(text: str) -> int:
    """中文字符 + 英文单词的混合计数"""
    return sum(1 for ch in text if not ch.isspace())
```

### Rust

```rust
fn main() {
    let days = vec!["Mon", "Tue", "Wed"];
    for (i, day) in days.iter().enumerate() {
        println!("{i}: {day}");
    }
}
```

### SQL 与 YAML

```sql
SELECT date_trunc('month', pub_date) AS month, count(*)
FROM posts
WHERE draft = false
GROUP BY 1
ORDER BY 1 DESC;
```

```yaml
deploy:
  strategy: rolling
  healthcheck:
    path: /rss.xml
    interval: 30s
```

### diff 也不在话下

```diff
- const theme = 'light';
+ const theme = document.documentElement.dataset.theme;
```

## 未知语言的兜底

写了一门不存在的语言时,构建期会打印一条告警,然后按纯文本渲染,版式和徽章保持不变:

```some-future-lang
fnord publish --draft=false --tags=a,b,c
```

## 附录:六级标题长什么样

### 三级标题(展示衬线,小节)

正文段落,用于对比标题与正文的字号差。

#### 四级标题(无衬线 + 强调色竖条,条目级)

适合列表前的小引题。

##### 五级标题(无衬线小号 + 强调色文字,小注级)

适合给一组细节起名字。

###### 六级标题(等宽大写,标注级)

最接近元数据的一层,比如 CHANGELOG 里的版本段。

## 实现说明

语言徽章来自一个 5 行的 Shiki transformer,把 fence 语言写到 `<pre data-language>` 上,样式由 CSS `attr()` 生成,不引入任何运行时。
