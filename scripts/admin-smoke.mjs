#!/usr/bin/env node
// Browser smoke test for the admin panel.
//
//   OPERATOR_EMAIL=... OPERATOR_PASSWORD=... node scripts/admin-smoke.mjs
//
// Signs in, walks all three tabs, edits a price and puts it back, and confirms
// the live-preview iframe actually re-themes. Screenshots go to
// "temporary screenshots/".

import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import puppeteer from 'puppeteer';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = 3180;
const BASE = `http://localhost:${PORT}`;
const SHOT_DIR = join(ROOT, 'temporary screenshots');

const EMAIL = process.env.OPERATOR_EMAIL;
const PASSWORD = process.env.OPERATOR_PASSWORD;
if (!EMAIL || !PASSWORD) {
  console.error('set OPERATOR_EMAIL and OPERATOR_PASSWORD');
  process.exit(1);
}

const fail = [];
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? `  ${detail}` : ''}`);
  if (!ok) fail.push(label);
};

const server = spawn(process.execPath, [join(ROOT, 'serve.mjs')], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: 'ignore',
});

async function waitForServer() {
  for (let i = 0; i < 40; i++) {
    try {
      if ((await fetch(`${BASE}/admin/`)).ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error('dev server never came up');
}

let browser;
try {
  await waitForServer();
  mkdirSync(SHOT_DIR, { recursive: true });

  browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1360, height: 1100 });

  const IGNORE = /favicon\.ico/;
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message)));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const where = m.location?.()?.url ?? '';
    if (IGNORE.test(m.text()) || IGNORE.test(where)) return;
    errors.push(where ? `${m.text()} <- ${where}` : m.text());
  });

  await page.goto(`${BASE}/admin/`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.login input[type="email"]');
  check(true, 'login screen shown to a signed-out visitor');

  // A wrong password must be refused, and must say so.
  await page.type('.login input[type="email"]', EMAIL);
  await page.type('.login input[type="password"]', 'definitely-not-the-password');
  await page.click('.login button[type="submit"]');
  await page.waitForSelector('.notice[data-kind="stop"]', { timeout: 10000 });
  check(true, 'a wrong password is refused');

  await page.type('.login input[type="email"]', EMAIL);
  await page.type('.login input[type="password"]', PASSWORD);
  await page.click('.login button[type="submit"]');
  await page.waitForSelector('#topbar', { timeout: 15000 });
  check(true, 'signed in');

  // The failed sign-in above is a real 400 from the auth endpoint, caused on
  // purpose two steps ago. Everything logged from here on is unexpected.
  errors.length = 0;

  const gym = await page.$eval('#topbar select', (s) => s.options[s.selectedIndex].text);
  check(gym.includes('J7'), 'tenant switcher populated', gym);

  // Orders tab
  await page.waitForSelector('#view .card h2');
  const ordersHeading = await page.$eval('#view .card h2', (n) => n.textContent);
  check(ordersHeading === 'Orders', 'orders tab is the landing tab', ordersHeading);
  await page.screenshot({ path: join(SHOT_DIR, 'admin-orders.png'), fullPage: true });

  // Products tab
  await page.evaluate(() => [...document.querySelectorAll('.tab')].find((t) => t.textContent.startsWith('Products')).click());
  await page.waitForSelector('#view table tbody tr');
  const productRows = await page.$$eval('#view table tbody tr', (r) => r.length);
  check(productRows === 17, 'every seeded product is listed', `${productRows} rows`);

  // Edit a price, save, reload, confirm it stuck, then put it back.
  const priceSel = '#view table tbody tr:first-child td.num input';
  const original = await page.$eval(priceSel, (n) => n.value);
  await page.$eval(priceSel, (n) => { n.value = '1234'; });
  await page.evaluate(() => {
    const row = document.querySelector('#view table tbody tr');
    [...row.querySelectorAll('button')].find((b) => b.textContent === 'Save').click();
  });
  await page.waitForSelector('.toast', { timeout: 10000 });

  await page.reload({ waitUntil: 'networkidle0' });
  await page.evaluate(() => [...document.querySelectorAll('.tab')].find((t) => t.textContent.startsWith('Products')).click());
  await page.waitForSelector(priceSel);
  const saved = await page.$eval(priceSel, (n) => n.value);
  check(saved === '1234', 'a price edit persisted to the database', saved);

  await page.$eval(priceSel, (n, v) => { n.value = v; }, original);
  await page.evaluate(() => {
    const row = document.querySelector('#view table tbody tr');
    [...row.querySelectorAll('button')].find((b) => b.textContent === 'Save').click();
  });
  await page.waitForSelector('.toast', { timeout: 10000 });
  console.log(`ok   price restored to ${original}`);
  await page.screenshot({ path: join(SHOT_DIR, 'admin-products.png'), fullPage: true });

  // Settings tab — the live preview is the claim worth checking.
  await page.evaluate(() => [...document.querySelectorAll('.tab')].find((t) => t.textContent.startsWith('Settings')).click());
  await page.waitForSelector('.swatches input[type="color"]');
  const swatchCount = await page.$$eval('.swatches .swatch', (n) => n.length);
  check(swatchCount >= 10, 'every design token is editable', `${swatchCount} tokens`);

  await page.waitForSelector('.preview iframe');
  const frame = await (await page.$('.preview iframe')).contentFrame();
  await frame.waitForSelector('.j7-btn-primary', { timeout: 15000 });

  await page.evaluate(() => {
    const brandRow = [...document.querySelectorAll('.swatch')].find((s) => s.textContent.includes('--brand'));
    const text = brandRow.querySelector('input[type="text"]');
    text.value = '#00A3FF';
    text.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await frame.waitForFunction(
    () => document.documentElement.style.getPropertyValue('--brand').toUpperCase() === '#00A3FF',
    { timeout: 5000 }
  );
  check(true, 'editing a token re-themes the live preview without saving');
  await page.screenshot({ path: join(SHOT_DIR, 'admin-settings.png'), fullPage: true });

  check(errors.length === 0, 'no console errors', errors.join(' | '));
  console.log(`\nscreenshots -> ${SHOT_DIR}`);
} finally {
  await browser?.close();
  server.kill();
}

if (fail.length) {
  console.error(`\n${fail.length} check(s) failed: ${fail.join(', ')}`);
  process.exit(1);
}
console.log('\nall checks passed');
