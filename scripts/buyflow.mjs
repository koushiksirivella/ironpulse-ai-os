// Click-through proof that a stranger can actually buy something.
//
// The lesson that produced this file: probing the DOM said the cart and the
// checkout were "visible, opacity 1" while they sat four thousand pixels below
// the last thing anyone would scroll to. Visible is not reachable. Every
// assertion here is about REACHING a control, not about it existing.
import puppeteer from 'puppeteer';

const BASE = 'http://localhost:3000/';
let pass = 0, fail = 0;
const ok = (name, cond, detail) => {
  if (cond) { pass++; console.log('  PASS  ' + name + (detail ? '  -- ' + detail : '')); }
  else { fail++; console.log('  FAIL  ' + name + (detail ? '  -- ' + detail : '')); }
};

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });

const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));

console.log('\n1 - THE SHOP LOADS');
await page.goto(BASE, { waitUntil: 'networkidle0' });
await page.waitForSelector('[data-j7-mount="catalog"] .j7-btn', { timeout: 20000 });
const cards = await page.$$eval('[data-j7-mount="catalog"] .j7-card', (n) => n.length);
ok('catalog rendered from the database', cards > 0, cards + ' products');

console.log('\n2 - ADD ONE THING');
await page.$$eval('[data-j7-mount="catalog"] .j7-btn', (b) => b[0].click());
await new Promise((r) => setTimeout(r, 600));
const barOn = await page.$eval('#cart-jump', (n) => n.classList.contains('is-on'));
ok('the cart bar appears the moment the cart fills', barOn);
const barReach = await page.$eval('#cart-jump', (n) => {
  const r = n.getBoundingClientRect();
  return r.bottom > 0 && r.top < innerHeight && r.width > 0;
});
ok('and it is ON SCREEN, not merely in the DOM', barReach);

console.log('\n3 - THE BAR ACTUALLY GETS YOU THERE');
await page.click('#cart-jump');
await new Promise((r) => setTimeout(r, 1800));
const submitReach = await page.evaluate(() => {
  const btns = [...document.querySelectorAll('[data-j7-mount="checkout"] button[type="submit"]')];
  if (!btns.length) return { found: false };
  const r = btns[0].getBoundingClientRect();
  return { found: true, top: Math.round(r.top), onScreen: r.top < innerHeight && r.bottom > 0 };
});
ok('"Place order" is reachable after one click', submitReach.found && submitReach.onScreen,
   submitReach.found ? 'top=' + submitReach.top + 'px of 800' : 'no submit button at all');
const barOff = await page.$eval('#cart-jump', (n) => !n.classList.contains('is-on'));
ok('the bar hides once you are at the checkout', barOff);

console.log('\n4 - THE NUMBER IS RIGHT');
const totals = await page.evaluate(() => ({
  cart: document.querySelector('[data-j7-mount="cart"] .j7-grand')?.textContent?.trim() ?? null,
  checkout: document.querySelector('[data-j7-checkout-total]')?.textContent?.trim() ?? null,
}));
ok('the checkout total tracks the cart', totals.cart === totals.checkout,
   'cart ' + totals.cart + ' / checkout ' + totals.checkout);
ok('and it is not zero', totals.checkout !== null && !/^.0$/.test(totals.checkout), totals.checkout);

console.log('\n5 - TYPED INPUT SURVIVES A CART CHANGE');
await page.type('#j7-name', 'Buyflow Check');
await page.type('#j7-phone', '9876500011');
await page.$$eval('[data-j7-mount="catalog"] .j7-btn', (b) => b[1].click());
await new Promise((r) => setTimeout(r, 500));
const kept = await page.evaluate(() => ({
  name: document.querySelector('#j7-name')?.value,
  phone: document.querySelector('#j7-phone')?.value,
  total: document.querySelector('[data-j7-checkout-total]')?.textContent?.trim(),
}));
ok('the name is still there after adding a second item', kept.name === 'Buyflow Check', kept.name);
ok('the phone is still there', kept.phone === '9876500011', kept.phone);
ok('and the total moved', kept.total !== totals.checkout, totals.checkout + ' -> ' + kept.total);

console.log('\n6 - PLACE IT');
await page.$eval('[data-j7-mount="checkout"] button[type="submit"]', (b) => b.click());
await page.waitForFunction(
  () => /J7-\d+/.test(document.querySelector('[data-j7-mount="checkout"]')?.textContent ?? ''),
  { timeout: 25000 }
).catch(() => {});
const confirm = await page.evaluate(() => {
  const n = document.querySelector('[data-j7-mount="checkout"]');
  const t = n?.textContent ?? '';
  const link = [...(n?.querySelectorAll('a') ?? [])].find((a) => /track/i.test(a.textContent));
  return { text: t.replace(/\s+/g, ' ').slice(0, 160), no: (t.match(/J7-\d+/) ?? [null])[0], track: link?.getAttribute('href') ?? null };
});
ok('the order went in', !!confirm.no, confirm.no ?? confirm.text);
ok('the confirmation says Elite Gym', /Elite Gym/i.test(confirm.text));
ok('there is a track link, since the code is only minted at "ready"', !!confirm.track, confirm.track ?? '');

console.log('\n7 - THE TRACK LINK WORKS');
if (confirm.track) {
  await page.goto(new URL(confirm.track, BASE).href, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1200));
  const track = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 200));
  ok('the tracking page finds the order', new RegExp(confirm.no).test(track), track.slice(0, 90));
  ok('and shows no handover code yet (status is new)', !/\b\d{6}\b/.test(track.replace(/J7-\d+/g, '')));
}

console.log('\n8 - NOTHING THREW');
ok('no console errors on the whole run', errors.length === 0, errors.slice(0, 3).join(' | '));

console.log('\nRESULT -- ' + pass + ' passed, ' + fail + ' failed');
await browser.close();
process.exit(fail ? 1 : 0);
