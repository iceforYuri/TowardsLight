/**
 * 字体自托管:抓 Google Fonts css2 → 下载全部 woff2 子集到 public/fonts/,
 * 族名改写为 TL 别名,生成 public/fonts/fonts.css。
 *
 * 为什么别名:本机若装有同名可变字体(NotoSansSC-VF 等),Chrome 的字重匹配
 * 会劫持到本地 Thin 实例,全站中文发虚。别名族名让本地字体永远匹配不上。
 *
 * 用法:npm run fonts(一次性;字体内容不变就不用再跑)
 */
import fs from 'node:fs';
import path from 'node:path';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** alias → [Google family 参数, 输出子目录] */
const FAMILIES = [
  ['TL Display', 'Playfair+Display:ital,wght@0,500;0,600;0,700;1,500', 'tl-display'],
  ['TL UI', 'Inter:wght@400;500;600', 'tl-ui'],
  ['TL Mono', 'JetBrains+Mono:wght@400;500', 'tl-mono'],
  ['TL Sans', 'Noto+Sans+SC:wght@400;500;700', 'tl-sans'],
  ['TL Serif', 'Noto+Serif+SC:wght@600;700', 'tl-serif'],
];

const OUT = path.join(process.cwd(), 'public', 'fonts');
const CONCURRENCY = 8;

const fetchText = async (url) => {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
};

/** 解析 css2 响应为 @font-face 块列表(拉丁子集带命名注释,CJK 大量块无注释,用序号兜底) */
function parseFaces(css) {
  const faces = [];
  const re = /(?:\/\* \[?([\w-]+)]? \*\/\s*)?@font-face \{([^}]+)}/g;
  let i = 0;
  for (const m of css.matchAll(re)) {
    const body = m[2];
    const pick = (k) => body.match(new RegExp(`${k}: ([^;]+);`))?.[1].trim();
    const src = body.match(/src: url\(([^)]+)\)/)?.[1];
    faces.push({
      subset: m[1] ?? String(i),
      style: pick('font-style'),
      weight: pick('font-weight'),
      range: pick('unicode-range'),
      url: src,
    });
    i++;
  }
  return faces;
}

async function main() {
  const jobs = []; // { url, file }
  const cssOut = [
    '/* 自托管字体(scripts/fetch-fonts.mjs 生成,勿手改)——别名族名防本地同名字体劫持 */',
  ];

  for (const [alias, familyParam, dir] of FAMILIES) {
    const css = await fetchText(
      `https://fonts.googleapis.com/css2?family=${familyParam}&display=swap`,
    );
    const faces = parseFaces(css);
    if (!faces.length) throw new Error(`没解析到 @font-face: ${familyParam}`);
    const targetDir = path.join(OUT, dir);
    fs.mkdirSync(targetDir, { recursive: true });

    for (const face of faces) {
      const file = `${face.subset}-${face.weight}${face.style === 'italic' ? 'i' : ''}.woff2`;
      jobs.push({ url: face.url, file: path.join(targetDir, file) });
      cssOut.push(`/* ${alias} ${face.weight}${face.style === 'italic' ? ' italic' : ''} [${face.subset}] */
@font-face {
  font-family: '${alias}';
  font-style: ${face.style};
  font-weight: ${face.weight};
  font-display: swap;
  src: url(./${dir}/${file}) format('woff2');
  unicode-range: ${face.range};
}`);
    }
    console.log(`${alias}: ${faces.length} 个子集`);
  }

  let done = 0;
  const worker = async () => {
    while (jobs.length) {
      const job = jobs.shift();
      if (fs.existsSync(job.file)) {
        done++;
        continue;
      }
      const res = await fetch(job.url, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(`${res.status} ${job.url}`);
      fs.writeFileSync(job.file, Buffer.from(await res.arrayBuffer()));
      done++;
      if (done % 50 === 0) console.log(`下载 ${done} 个…`);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  fs.writeFileSync(path.join(OUT, 'fonts.css'), cssOut.join('\n\n') + '\n');
  console.log(`完成:${done} 个 woff2 → public/fonts/,fonts.css 已生成`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
