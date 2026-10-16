import { chromium, firefox, webkit } from 'playwright';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, mkdir } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// 构建真实生产页面再操作真实鼠标，不以 element.click() 绕过命中测试。
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const artifacts = await mkdtemp(join(tmpdir(), 'towardslight-nav-test-'));
const engine = process.env.NAV_TEST_BROWSER || 'chromium';
let server;
let browser;
let base = process.env.NAV_TEST_BASE_URL;
const errors = [];
const knownEmail404s = [];
let passed = 0;

function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', (chunk) => (output += chunk));
    child.stderr.on('data', (chunk) => (output += chunk));
    child.on('error', reject);
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(output)));
  });
}

async function clickAt(locator, hold = 0) {
  const box = await locator.boundingBox();
  assert.ok(box, '目标必须可见');
  const page = locator.page();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  if (hold) await page.waitForTimeout(hold);
  await page.mouse.up();
}

async function arm(page) {
  await page.evaluate(() => {
    window.__navTest = { header: document.querySelector('.site-header'), moves: [] };
    if (window.__navTestBound) return;
    window.__navTestBound = true;
    document.addEventListener('mousemove', (event) => {
      window.__navTest.moves.push(event.target.closest?.('.dock-nav-item')?.getAttribute('href'));
    }, true);
    const original = document.startViewTransition.bind(document);
    document.startViewTransition = (...args) => {
      const state = window.__navTest;
      const transition = original(...args);
      transition.ready.then(() => (state.ready = true), () => {});
      transition.finished.then(() => (state.finished = true), () => {});
      return transition;
    };
  });
}

async function duringTransition(page) {
  await page.waitForFunction(() => window.__navTest.ready);
  assert.equal(await page.evaluate(() => !!window.__navTest.finished), false, '必须在转场结束前检测');
}

async function selected(page, href) {
  // popstate 先改地址，Astro 随后才取回并替换页面；等当前页语义同步，而非只等 URL。
  await page.waitForFunction((value) => document.querySelector('.dock-nav-item[aria-current="page"]')?.getAttribute('href') === value, href);
  assert.equal(await page.locator('.dock-nav-item[aria-current="page"]').getAttribute('href'), href);
  assert.equal(await page.locator('.mobile-link[aria-current="page"]').getAttribute('href'), href);
  assert.equal(await page.evaluate(() => window.__navTest.header === document.querySelector('.site-header')), true, '导航节点不能重建');
}

async function test(name, fn, options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...options });
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const url = message.location().url;
    // 当前个人档案已有裸邮箱 href（缺 mailto:），全站预取会请求该地址；不在本次改动中修配置。
    const resource = new URL(url || base, base);
    if (message.text().includes('status of 404') && resource.origin === new URL(base).origin && /^\/[^/]+@[^/]+$/.test(decodeURIComponent(resource.pathname))) {
      knownEmail404s.push(url);
    } else errors.push(message.text() + ' ' + url);
  });
  await page.goto(base, { waitUntil: 'networkidle' });
  assert.ok(await page.locator('main').isVisible());
  assert.equal(await page.locator('astro-dev-overlay, nextjs-portal').count(), 0);
  try {
    await fn(page);
    console.log(`  ✓ ${name}`);
    passed++;
  } finally {
    await context.close();
  }
}

try {
  if (!base) {
    const dist = join(artifacts, 'dist');
    await mkdir(dist);
    await run(['node_modules/astro/astro.js', 'build', '--outDir', dist]);
    const socket = createServer();
    socket.listen(0, '127.0.0.1');
    await once(socket, 'listening');
    const port = socket.address().port;
    await new Promise((resolve) => socket.close(resolve));
    base = `http://127.0.0.1:${port}/`;
    server = spawn(process.execPath, ['node_modules/astro/astro.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--outDir', dist], { cwd: root, stdio: 'ignore' });
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try { ready = (await fetch(base)).ok; } catch {}
      if (ready) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.ok(ready, '生产预览服务必须就绪');
  }
  const browserType = { chromium, firefox, webkit }[engine];
  assert.ok(browserType, `未知浏览器: ${engine}`);
  browser = await browserType.launch({ headless: true });

  await test('鼠标静止跨页:节点、放大宽度和液体轮廓全程保留，真实移出后才收回', async (page) => {
    await arm(page);
    const link = page.locator('.dock-nav-item[href="/links"]');
    await link.hover();
    await page.waitForTimeout(450);
    await page.evaluate(() => {
      const zone = document.querySelector('[data-dock-zone]');
      const link = zone.querySelector('.dock-nav-item[href="/links"]');
      const sample = () => ({ t: performance.now(), grow: +link.style.getPropertyValue('--grow'), width: link.getBoundingClientRect().width, depth: zone.querySelector('[data-pill-path]').getBBox().height - 56 });
      const state = window.__stillDock = { before: sample(), events: [], frames: [] };
      for (const event of ['mouseleave', 'mouseenter']) zone.addEventListener(event, (e) => state.events.push({ event, related: e.relatedTarget?.tagName, x: e.clientX, y: e.clientY, ...sample() }));
      for (const event of ['astro:before-swap', 'astro:after-swap', 'astro:page-load']) document.addEventListener(event, () => state.events.push({ event, ...sample() }));
      function frame() { state.frames.push(sample()); if (!state.stop) requestAnimationFrame(frame); }
      requestAnimationFrame(frame);
    });
    // 不再移动鼠标：只按下/松开，不能由测试里的 hover() 帮实现恢复动效。
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForURL('**/links');
    await page.waitForTimeout(800);
    const state = await page.evaluate(() => { window.__stillDock.stop = true; return window.__stillDock; });
    console.log('  静止指针记录:', JSON.stringify({ before: state.before, minWidth: Math.min(...state.frames.map(f => f.width)), minGrow: Math.min(...state.frames.map(f => f.grow)), minDepth: Math.min(...state.frames.map(f => f.depth)), events: state.events }));
    assert.ok(state.before.width > 54 && state.before.depth > 12, '切页前必须已伸出');
    assert.ok(state.frames.every(f => f.grow >= state.before.grow - 0.02), '不能因页面交换把 --grow 重置为 0');
    assert.ok(state.frames.every(f => f.width >= state.before.width - 1), '切页期间按钮不能缩回');
    assert.ok(state.frames.every(f => f.depth >= state.before.depth - 1), '切页期间液体轮廓不能变平');
    await selected(page, '/links');
    await page.screenshot({ path: join(artifacts, 'stationary-after-transition.png') });
    await page.mouse.move(1200, 300);
    await page.waitForTimeout(450);
    assert.equal(await link.evaluate(el => el.style.getPropertyValue('--grow')), '0');
    assert.ok(await link.evaluate(el => el.getBoundingClientRect().width < 39));
  });
  await test('转场尚未结束时真实移出，水波纹仍应收回而非被冻结', async (page) => {
    await arm(page);
    const link = page.locator('.dock-nav-item[href="/links"]');
    await link.hover();
    await page.waitForTimeout(450);
    await page.mouse.down();
    await page.mouse.up();
    await duringTransition(page);
    await page.mouse.move(1200, 300);
    await page.evaluate(() => new Promise(requestAnimationFrame));
    assert.equal(await page.evaluate(() => !!window.__navTest.finished), false);
    assert.equal(await link.evaluate(el => el.style.getPropertyValue('--grow')), '0');
    await page.waitForTimeout(450);
    assert.ok(await link.evaluate(el => el.getBoundingClientRect().width < 39));
  });

  await test('按钮伸出胶囊边界的部分仍属于悬停区，移开才收回', async (page) => {
    await arm(page);
    const link = page.locator('.dock-nav-item[href="/links"]');
    await link.hover();
    await page.waitForTimeout(450);
    const box = await link.boundingBox();
    const zone = await page.locator('[data-dock-zone]').boundingBox();
    const x = box.x + box.width / 2;
    const y = box.y + box.height - 3;
    assert.ok(y > zone.y + zone.height, '必须覆盖按钮伸出胶囊底部的区域');
    await page.mouse.move(x, y);
    await page.waitForTimeout(120);
    assert.ok(await link.evaluate(el => +el.style.getPropertyValue('--grow') > 0.9));
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForURL('**/links');
    await page.waitForTimeout(650);
    assert.ok(await link.evaluate(el => +el.style.getPropertyValue('--grow') > 0.9));
    await selected(page, '/links');
    await page.mouse.move(1200, 300);
    await page.waitForTimeout(450);
    assert.equal(await link.evaluate(el => el.style.getPropertyValue('--grow')), '0');
  });
  for (const hold of [0, 350]) {
    await test(`${hold ? '长按后松开' : '快速点松'}:转场中命中、悬停、连续导航`, async (page) => {
      await arm(page);
      await clickAt(page.locator('.dock-nav-item[href="/links"]'), hold);
      await duringTransition(page);
      const target = page.locator('.dock-nav-item[href="/categories"]');
      const box = await target.boundingBox();
      const hit = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('.dock-nav-item')?.getAttribute('href'), { x: box.x + box.width / 2, y: box.y + box.height / 2 });
      assert.equal(hit, '/categories', '转场中必须命中真实图标，不能落到 HTML');
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.evaluate(() => new Promise(requestAnimationFrame));
      assert.ok(await page.evaluate(() => window.__navTest.moves.includes('/categories')));
      await selected(page, '/links');
      assert.equal(await page.evaluate(() => !!window.__navTest.finished), false);
      await page.mouse.down();
      await page.mouse.up();
      await page.waitForURL('**/categories');
      await selected(page, '/categories');
      await page.waitForTimeout(550);
    });
  }

  await test('按下不导航，拖出后松开取消；键盘 Enter 正常激活', async (page) => {
    await arm(page);
    const link = page.locator('.dock-nav-item[href="/links"]');
    const box = await link.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(80);
    assert.equal(new URL(page.url()).pathname, '/');
    assert.equal(await page.locator('.dock-nav-item.active').getAttribute('href'), '/');
    await page.mouse.move(1200, 300);
    await page.mouse.up();
    await page.waitForTimeout(100);
    assert.equal(new URL(page.url()).pathname, '/');
    await link.focus();
    await page.keyboard.press('Enter');
    await page.waitForURL('**/links');
    await selected(page, '/links');
  });

  await test('前进后退同步选中态且只保留一份导航/遮罩', async (page) => {
    await arm(page);
    for (const href of ['/links', '/archive']) {
      await clickAt(page.locator(`.dock-nav-item[href="${href}"]`));
      await page.waitForURL(`**${href}`);
      await page.waitForTimeout(550);
    }
    await page.goBack();
    await page.waitForURL('**/links');
    await selected(page, '/links');
    await page.waitForTimeout(550);
    await page.goForward();
    await page.waitForURL('**/archive');
    await selected(page, '/archive');
    assert.equal(await page.locator('.site-header').count(), 1);
    assert.equal(await page.locator('#live-nav-mask').count(), 1);
    assert.equal(await page.locator('#live-nav-mask').getAttribute('x'), '0');
    assert.equal(await page.locator('#live-nav-mask').getAttribute('y'), '0');
  });

  for (const theme of ['light', 'dark']) {
    await test(`${theme}:转场中导航未被背景覆盖、主题按钮仍响应`, async (page) => {
      await page.evaluate((value) => { localStorage.setItem('theme', value); document.documentElement.dataset.theme = value; }, theme);
      await arm(page);
      await clickAt(page.locator('.dock-nav-item[href="/links"]'));
      await duringTransition(page);
      const box = await page.locator('.nav-pill').boundingBox();
      const expected = await page.locator('[data-pill-path]').evaluate((path) => getComputedStyle(path).fill.match(/[\d.]+/g).slice(0, 3).map(Number));
      const screenshot = await page.screenshot({ path: join(artifacts, `transition-${theme}.png`) });
      const actual = await page.evaluate(async ({ image, x, y }) => {
        const img = new Image(); img.src = image; await img.decode();
        const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0);
        return [...ctx.getImageData(x, y, 1, 1).data].slice(0, 3);
      }, { image: `data:image/png;base64,${screenshot.toString('base64')}`, x: Math.round(box.x + 60), y: Math.round(box.y + 10) });
      assert.ok(actual.every((v, i) => Math.abs(v - expected[i]) < 12), `导航颜色被转场污染: ${actual} / ${expected}`);
      const toggle = page.locator('.nav-actions [data-theme-toggle]');
      await clickAt(toggle);
      assert.equal(await page.locator('html').getAttribute('data-theme'), theme === 'light' ? 'dark' : 'light');
    });
  }

  await test('移动端:转场中菜单可打开，导航后关闭，快速重开不被旧定时器隐藏', async (page) => {
    await arm(page);
    const menu = page.locator('[data-menu-button]');
    await clickAt(menu);
    await page.locator('.mobile-link[href="/links"]').click();
    await duringTransition(page);
    assert.equal(await menu.getAttribute('aria-expanded'), 'false');
    await clickAt(menu);
    assert.equal(await menu.getAttribute('aria-expanded'), 'true');
    assert.equal(await page.evaluate(() => !!window.__navTest.finished), false);
    await page.waitForTimeout(250);
    await page.screenshot({ path: join(artifacts, 'transition-mobile.png') });
    await clickAt(menu);
    await page.waitForTimeout(40);
    await clickAt(menu);
    await page.waitForTimeout(250);
    assert.equal(await page.locator('[data-mobile-panel]').evaluate((el) => el.hidden), false);
    await page.locator('.mobile-link[href="/archive"]').click();
    await page.waitForURL('**/archive');
    await selected(page, '/archive');
    assert.equal(await menu.getAttribute('aria-expanded'), 'false');
  }, { viewport: { width: 390, height: 844 }, isMobile: engine !== 'firefox', hasTouch: true });

  await test('移动端启动后切桌面，Dock 和尺寸重算仍然工作', async (page) => {
    await arm(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(120);
    const link = page.locator('.dock-nav-item[href="/links"]');
    await link.hover();
    await page.waitForTimeout(300);
    assert.ok(await link.evaluate((el) => parseFloat(el.style.getPropertyValue('--grow')) > 0.7));
    assert.ok(await page.locator('.nav-pill').evaluate((el) => el.classList.contains('has-skin')));
    await clickAt(link);
    await page.waitForURL('**/links');
    await page.waitForTimeout(550);
    await page.mouse.move(1200, 300);
    await page.waitForTimeout(300);
    await page.setViewportSize({ width: 1050, height: 800 });
    await page.waitForTimeout(150);
    const sizes = await page.locator('.nav-pill').evaluate((el) => ({ width: el.offsetWidth, path: el.querySelector('[data-pill-path]').getBBox().width }));
    assert.ok(Math.abs(sizes.width - sizes.path) < 2);
  }, { viewport: { width: 390, height: 844 } });

  await test('减少动态偏好:导航、菜单与选中态正常', async (page) => {
    await arm(page);
    await clickAt(page.locator('.dock-nav-item[href="/links"]'));
    await page.waitForURL('**/links');
    await selected(page, '/links');
    assert.equal(await page.locator('.nav-pill').evaluate((el) => el.classList.contains('has-skin')), false);
  }, { reducedMotion: 'reduce' });

  await test('转场期间打开搜索，输入和关闭仍可用', async (page) => {
    await arm(page);
    await clickAt(page.locator('.dock-nav-item[href="/links"]'));
    await duringTransition(page);
    await clickAt(page.locator('.nav-actions [data-search-trigger]'));
    await page.locator('[data-search-input]').fill('Agent');
    assert.equal(await page.locator('html').getAttribute('data-search-open'), '1');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(250);
    assert.equal(await page.locator('html').getAttribute('data-search-open'), null);
  });

  await test('慢请求进度条显示，导航结束后计时器和遮罩清理', async (page) => {
    await arm(page);
    await page.route('**/links', async (route) => {
      if (route.request().resourceType() === 'fetch') await new Promise((resolve) => setTimeout(resolve, 600));
      await route.continue();
    });
    await clickAt(page.locator('.dock-nav-item[href="/links"]'));
    await page.waitForFunction(() => !!document.getElementById('nav-progress'));
    assert.equal(new URL(page.url()).pathname, '/');
    const progress = await page.locator('#nav-progress').boundingBox();
    assert.ok(progress.height > 0);
    await page.waitForURL('**/links');
    await page.waitForTimeout(850);
    assert.equal(await page.locator('#nav-progress').count(), 0);
    assert.equal(await page.locator('html').evaluate((el) => el.style.getPropertyValue('--live-nav-mask')), '');
  });

  await test('125% 布局缩放和高像素密度下命中与遮罩坐标一致', async (page) => {
    await page.evaluate(() => {
      const apply = (doc) => { const style = doc.createElement('style'); style.textContent = 'html { zoom: 1.25; }'; doc.head.append(style); };
      apply(document);
      document.addEventListener('astro:before-swap', (event) => apply(event.newDocument));
    });
    await arm(page);
    await clickAt(page.locator('.dock-nav-item[href="/links"]'));
    await duringTransition(page);
    const box = await page.locator('.dock-nav-item[href="/categories"]').boundingBox();
    const href = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('.dock-nav-item')?.getAttribute('href'), { x: box.x + box.width / 2, y: box.y + box.height / 2 });
    assert.equal(href, '/categories');
    assert.equal(await page.locator('html').evaluate((el) => getComputedStyle(el).zoom), '1.25');
    const alignment = await page.locator('.nav-pill').evaluate((pill) => {
      const matrix = pill.querySelector('[data-pill-path]').getScreenCTM();
      const expected = `matrix(${matrix.a} ${matrix.b} ${matrix.c} ${matrix.d} ${matrix.e} ${matrix.f})`;
      return { expected, actual: document.querySelector('[data-mask-skin]').getAttribute('transform') };
    });
    assert.equal(alignment.actual, alignment.expected);
    await page.screenshot({ path: join(artifacts, 'transition-zoom.png') });
  }, { deviceScaleFactor: 2 });

  await test('无原生 View Transition 时仍可导航并同步状态', async (page) => {
    await page.addInitScript(() => { document.startViewTransition = undefined; });
    await page.reload({ waitUntil: 'networkidle' });
    await page.evaluate(() => { window.__navTest = { header: document.querySelector('.site-header') }; });
    await clickAt(page.locator('.dock-nav-item[href="/links"]'));
    await page.waitForURL('**/links');
    await selected(page, '/links');
    assert.equal(await page.locator('#live-nav-mask').count(), 0);
  });
  await test('真实触摸路径:转场中重开菜单并点其他页面', async (page) => {
    await arm(page);
    await page.locator('[data-menu-button]').tap();
    await page.locator('.mobile-link[href="/links"]').tap();
    await duringTransition(page);
    await page.locator('[data-menu-button]').tap();
    assert.equal(await page.locator('[data-menu-button]').getAttribute('aria-expanded'), 'true');
    await page.locator('.mobile-link[href="/categories"]').tap();
    await page.waitForURL('**/categories');
    await selected(page, '/categories');
    await page.waitForTimeout(300);
    const hidden = await page.locator('[data-mobile-panel]').evaluate((el) => ({ hidden: el.hidden, display: getComputedStyle(el).display }));
    assert.equal(hidden.hidden, true);
    assert.equal(hidden.display, 'none');
    assert.equal(await page.locator('.mobile-actions .dock-tooltip').evaluate((el) => getComputedStyle(el).display), 'none');
  }, { viewport: { width: 390, height: 844 }, isMobile: engine !== 'firefox', hasTouch: true });

  await test('运行时切换减少动态偏好后可停止并重新启用 Dock', async (page) => {
    await arm(page);
    const link = page.locator('.dock-nav-item[href="/links"]');
    await link.hover();
    await page.waitForTimeout(250);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(50);
    assert.equal(await page.locator('.nav-pill').evaluate((el) => el.classList.contains('has-skin')), false);
    assert.equal(await link.evaluate((el) => el.style.getPropertyValue('--grow')), '0');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForTimeout(50);
    await page.mouse.move(1200, 300);
    await link.hover();
    assert.ok(await link.evaluate((el) => +el.style.getPropertyValue('--grow') > 0.7));
    await clickAt(link);
    await page.waitForURL('**/links');
    await selected(page, '/links');
  });
  assert.deepEqual(errors, [], '不能产生浏览器运行时错误');
  if (knownEmail404s.length) console.log(`已记录既有档案问题: ${knownEmail404s.length} 次裸邮箱 href 的预取 404，未修改个人配置。`);
  console.log(`\n${passed} 项导航回归通过 (${engine})。截图: ${artifacts}`);
} finally {
  console.log(`测试产物: ${artifacts}`);
  await browser?.close();
  server?.kill();
}
