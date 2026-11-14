#!/usr/bin/env node
// Screenshot a page from the dev server.
//
//   node scripts/shot.mjs /demo/ demo.png            full page
//   node scripts/shot.mjs /demo/ demo.png 1400 900   viewport only
//
// Exists because a computed-style probe passes on a page whose fonts silently
// died, whose images 404ed into empty boxes, or whose glass composited as a
// transparent hole. The only check that catches those is looking at it.

import puppeteer from 'puppeteer';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const [pathRaw = 'demo/', out = 'shot.png', wRaw, hRaw] = process.argv.slice(2);
const clipToViewport = Boolean(wRaw && hRaw);

// Git Bash rewrites a leading-slash argument into a Windows path before node
// ever sees it, so `/demo/` arrives as `C:/Program Files/Git/demo/`. Take the
// path without the slash and rebuild it here.
const path = '/' + String(pathRaw).replace(/^([A-Za-z]:)?[\\/].*?[\\/]Git[\\/]/, '').replace(/^\/+/, '');

const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: Number(wRaw) || 1440, height: Number(hRaw) || 1000, deviceScaleFactor: 1 });

const problems = [];
page.on('console', (m) => m.type() === 'error' && problems.push(`console: ${m.text()}`));
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('requestfailed', (r) => problems.push(`failed: ${r.url().slice(0, 100)}`));
page.on('response', (r) => r.status() >= 400 && problems.push(`${r.status()}: ${r.url().slice(0, 100)}`));

await page.goto(`http://localhost:8123${path}`, { waitUntil: 'networkidle0', timeout: 45000 });

// Reveals fire on intersection, so anything below the fold is still hidden at
// screenshot time. Scroll the page once to trip every observer, then come back.
await page.evaluate(async () => {
  const step = window.innerHeight * 0.8;
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 90));
  }
  window.scrollTo(0, 0);
});
await new Promise((r) => setTimeout(r, 900));

await page.screenshot({ path: join(ROOT, out), fullPage: !clipToViewport });

// Fonts are the classic silent failure: the page renders, just in Times.
const fonts = await page.evaluate(() => {
  const pick = (sel) => {
    const el = document.querySelector(sel);
    return el ? getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '') : null;
  };
  return { display: pick('.j7-cat-title'), body: pick('.j7-card-desc, .j7-card-title') };
});

const imgs = await page.evaluate(() =>
  [...document.querySelectorAll('.j7-card-img')].map((i) => (i.naturalWidth ? 'ok' : 'BROKEN'))
);

console.log(`fonts: display=${fonts.display} body=${fonts.body}`);
console.log(`images: ${imgs.filter((s) => s === 'ok').length}/${imgs.length} loaded`);
if (problems.length) console.log('problems:\n  ' + [...new Set(problems)].slice(0, 12).join('\n  '));

await browser.close();
