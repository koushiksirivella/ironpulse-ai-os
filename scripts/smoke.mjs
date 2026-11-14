#!/usr/bin/env node
// End-to-end smoke test in a real browser.
//
// The unit tests prove the maths. This proves the page actually paints — a
// computed-style probe passes on a page whose script died, so this one also
// counts rendered cards and saves a screenshot to look at.
//
//   node scripts/smoke.mjs            headless, writes a screenshot
//   node scripts/smoke.mjs --order    also places a real order, then deletes it
//
// Starts and stops its own server.

import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import puppeteer from 'puppeteer';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = 3179; // not 3000, so it never fights a server already running
const BASE = `http://localhost:${PORT}`;
const PLACE_ORDER = process.argv.includes('--order');
const SHOT_DIR = join(ROOT, 'temporary screenshots');

const fail = [];
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? `  ${detail}` : ''}`);
  if (!ok) fail.push(label);
};

const server = spawn(process.execPath, [join(ROOT, 'serve.mjs')], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: 'ignore',
});

async function waitForServer(tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(`${BASE}/demo/`);
      if (res.ok) return;
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
  await page.setViewport({ width: 1280, height: 1400, deviceScaleFactor: 1 });

  // The harness page has no favicon, and Chrome logs that as a console error.
  // Filtered by name so a real 404 still fails the run.
  const IGNORE = /favicon\.ico/;
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e.message)));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    // A failed-resource console message carries the URL in location(), not in
    // text() — text() is only "Failed to load resource: ... 404".
    const where = m.location?.()?.url ?? '';
    if (IGNORE.test(m.text()) || IGNORE.test(where)) return;
    consoleErrors.push(where ? `${m.text()} <- ${where}` : m.text());
  });
  page.on('response', (r) => {
    if (r.status() >= 400 && !IGNORE.test(r.url())) consoleErrors.push(`${r.status()} ${r.url()}`);
  });

  await page.goto(`${BASE}/demo/?gym=j7`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.j7-card', { timeout: 10000 });

  const cards = await page.$$eval('.j7-card', (n) => n.length);
  check(cards >= 17, 'catalog painted', `${cards} product cards`);

  const gymName = await page.$eval('[data-j7-mount="gym-name"]', (n) => n.textContent.trim());
  check(gymName === 'J7 Fitness Studio', 'tenant name filled from the database', gymName);

  // The brand tokens came out of tenants.brand, not out of any stylesheet.
  const brand = await page.evaluate(() =>
    document.documentElement.style.getPropertyValue('--brand').trim()
  );
  check(/^#/.test(brand), 'brand token injected inline from the database', brand);

  // Add a product and a membership to one cart — the mixed-cart claim.
  await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('.j7-card')];
    const pick = (kind) => buttons.find((c) => c.dataset.kind === kind);
    pick('product')?.querySelector('.j7-btn-primary')?.click();
    pick('membership')?.querySelector('.j7-btn-primary')?.click();
  });
  await page.waitForFunction(() => document.querySelectorAll('.j7-line').length === 2);

  const count = await page.$eval('[data-j7-mount="cart-count"]', (n) => n.textContent);
  check(count === '2', 'cart badge updated', count);

  const total = await page.$eval('.j7-grand', (n) => n.textContent.trim());
  check(/\d/.test(total), 'total rendered', total);

  // Reload: the cart must still be there.
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('.j7-line');
  const afterReload = await page.$$eval('.j7-line', (n) => n.length);
  check(afterReload === 2, 'cart survived a reload', `${afterReload} lines`);

  // Empty required fields must not reach the network.
  await page.click('.j7-form button[type="submit"]');
  await page.waitForSelector('.j7-error');
  const errors = await page.$$eval('.j7-error', (n) => n.map((e) => e.textContent));
  check(errors.length >= 2, 'checkout blocks an incomplete form', errors.join(' | '));

  await page.screenshot({ path: join(SHOT_DIR, 'engine-demo-j7.png'), fullPage: true });

  // Same engine, different skin: switch and confirm the tokens actually moved.
  //
  // Asserted on the BUTTON, not on body background. Body has no transition, so
  // it flips instantly and a screenshot taken on that signal catches every
  // animated element mid-fade — which is how a correct skin swap first looked
  // like a half-broken one. The button is the slowest thing to settle, so
  // waiting for it means everything else has already arrived.
  const DAYLIGHT_BRAND = 'rgb(31, 111, 74)';
  await page.select('#pick-skin', '../skins/daylight.css');
  await page.click('#toggle-brand'); // drop the database brand so the skin shows
  await page.waitForFunction(
    (want) => getComputedStyle(document.querySelector('.j7-btn-primary')).backgroundColor === want,
    { timeout: 5000 },
    DAYLIGHT_BRAND
  );

  const skinned = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    return {
      bg: getComputedStyle(document.body).backgroundColor,
      radius: getComputedStyle(document.querySelector('.j7-card')).borderRadius,
      // What the skin SAYS a large surface should be. Read from the page rather
      // than hardcoded, so this check survives a designer changing the value.
      wantRadius: root.getPropertyValue('--radius-lg').trim(),
      smallRadius: root.getPropertyValue('--radius').trim(),
      inline: document.documentElement.style.getPropertyValue('--brand'),
    };
  });
  check(skinned.bg === 'rgb(247, 246, 243)', 'skin swap repainted every element', JSON.stringify(skinned));

  // Asserts the RELATIONSHIP, not a number. The previous version pinned this to
  // a literal 14px, so when a card was moved from --radius to --radius-lg the
  // test failed on a change that was correct — a card is a large surface and is
  // meant to take the large radius. Pinning it also meant the check only ever
  // proved "the card is 14px", which stops being about the skin at all. The two
  // tokens must differ for this to prove anything, so that is checked too.
  check(
    skinned.wantRadius !== skinned.smallRadius,
    'the skin distinguishes large surfaces from small ones',
    `--radius ${skinned.smallRadius} vs --radius-lg ${skinned.wantRadius}`
  );
  check(
    skinned.radius === skinned.wantRadius,
    'skin swap changed shape as well as colour',
    `card ${skinned.radius}, skin says ${skinned.wantRadius}`
  );
  check(skinned.inline === '', 'database brand cleanly removable, skin shows through');
  await page.screenshot({ path: join(SHOT_DIR, 'engine-demo-daylight.png'), fullPage: true });

  if (PLACE_ORDER) {
    await page.select('#pick-skin', '../skins/j7.css');
    await page.type('#j7-name', 'Smoke Test');
    await page.type('#j7-phone', '9999999999');
    await page.click('.j7-form button[type="submit"]');
    await page.waitForSelector('.j7-confirm', { timeout: 15000 });
    const orderNo = await page.$eval('.j7-confirm-no strong', (n) => n.textContent.trim());
    check(/^J7-\d{4}$/.test(orderNo), 'order placed end to end', orderNo);

    const emptied = await page.$eval('[data-j7-mount="cart"]', (n) => n.textContent.includes('empty'));
    check(emptied, 'cart cleared only after the order saved');

    const { runSql } = await import('./sql.mjs');
    await runSql(`delete from public.orders where customer_name = 'Smoke Test';`);
    console.log('ok   test order deleted');
  }

  check(consoleErrors.length === 0, 'no console errors', consoleErrors.join(' | '));
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
