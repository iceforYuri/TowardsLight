#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
展示字体子集化:白鸽天行体(首页 hero)、我欲见你何惧春秋(章节页大字)。

两款都是单字重艺术体,全量 7000+ 字形;但使用面只有标题级文案,
按"站点实际用字"子集化到几百字,woff2 后每款约几百 KB。

字符集来源(动态收集,改文案后重跑 npm run fonts:display 即可):
- personal/ 与 showcase 档案的 site.ts、links.ts 全部字符串
- 全部文章的 frontmatter(标题/描述/分类/标签——标签分类名会登上 stage 大字)
- ASCII 可打印字符 + 常用中文标点
"""

import re
import sys
from pathlib import Path

from fontTools import subset

ROOT = Path(__file__).resolve().parent.parent

FONTS = [
    ("fonts-src/baige/字魂白鸽天行体(商用需授权).ttf", "public/fonts/custom/baige-tianxing.woff2"),
    (
        "fonts-src/wyjnhjcq/WoYuJianNiHeJuChunQiu/WoYuJianNiHeJuChunQiu/WoYuJianNiHeJuChunQiu-2.ttf",
        "public/fonts/custom/wo-yu-jian-ni.woff2",
    ),
]

ASCII = "".join(chr(c) for c in range(0x20, 0x7F))
CJK_PUNCT = "。、，；：？！“”‘’（）《》〈〉【】—…·～「」『』％‰℃—―•◦→←↑↓±×÷≈≠≤≥①②③④⑤"


def collect_chars() -> str:
    texts = []
    for pat in ("personal/site.ts", "personal/links.ts", "src/profiles/showcase/site.ts", "src/profiles/showcase/links.ts"):
        p = ROOT / pat
        if p.exists():
            texts.append(p.read_text(encoding="utf-8"))
    for md in list((ROOT / "personal/posts").rglob("*.md")) + list((ROOT / "src/profiles/showcase/posts").rglob("*.md")):
        head = md.read_text(encoding="utf-8")
        fm = re.match(r"^---\n(.*?)\n---", head, re.S)
        texts.append(fm.group(1) if fm else head[:500])
    chars = set(ASCII + CJK_PUNCT)
    for t in texts:
        chars.update(t)
    return "".join(sorted(chars))


def main() -> None:
    chars = collect_chars()
    print(f"字符集 {len(chars)} 字")
    for src, dst in FONTS:
        out = ROOT / dst
        out.parent.mkdir(parents=True, exist_ok=True)
        subset.main(
            [
                str(ROOT / src),
                f"--text={chars}",
                "--flavor=woff2",
                f"--output-file={out}",
                "--layout-features=*",
                "--no-hinting",
            ]
        )
        print(f"{Path(src).name} -> {dst} ({out.stat().st_size // 1024}KB)")


if __name__ == "__main__":
    sys.exit(main())
