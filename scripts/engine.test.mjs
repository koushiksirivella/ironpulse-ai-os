// Engine logic tests. No network, no browser.
//
// Everything that decides what a customer is charged lives in pure functions
// exactly so it can be tested here in milliseconds.

import test from 'node:test';
import assert from 'node:assert/strict';

import { toPaise, toRupees, formatMoney } from '../engine/money.js';
import { createCart, memoryStorage, lineKey, QTY_LOCKED_KINDS, MAX_QTY } from '../engine/cart.js';
import { validateCheckout, buildOrderPayload, whatsappLink, orderMessage, digitsOf } from '../engine/checkout.js';
import { applyTheme, isSafeValue, sectionEnabled, TOKENS } from '../engine/theme.js';
import { resolveTenant, brandSuspended, isLocalHost } from '../engine/config.js';

const oats = { id: 'p-oats', name: 'Rolled Oats - 1 kg', kind: 'product', price: 249 };
const whey = { id: 'p-whey', name: 'Whey Protein - 1 kg', kind: 'product', price: 2499 };
const member = { id: 'p-mem', name: '1 Month', kind: 'membership', price: 1000 };

const newCart = () => createCart({ storage: memoryStorage(), tenantSlug: 'j7' });

// ------------------------------------------------------------------ money

test('money survives the classic float trap', () => {
  // 0.1 + 0.2 !== 0.3 in floats. In paise it is 10 + 20 === 30.
  assert.equal(toPaise(0.1) + toPaise(0.2), toPaise(0.3));
});

test('prices arriving as PostgREST numeric strings still parse', () => {
  assert.equal(toPaise('249.00'), 24900);
  assert.equal(toRupees(24900), 249);
});

test('a price that is not a number throws instead of becoming NaN paise', () => {
  assert.throws(() => toPaise(undefined), TypeError);
  assert.throws(() => toPaise('free'), TypeError);
});

test('whole rupees format without a decimal tail', () => {
  assert.match(formatMoney(24900, 'INR'), /249/);
  assert.doesNotMatch(formatMoney(24900, 'INR'), /\.00/);
});

// ------------------------------------------------------------------- cart

test('cart sums exactly, with no float drift across many lines', () => {
  const cart = newCart();
  for (let i = 0; i < 9; i++) cart.add({ id: `p${i}`, name: `p${i}`, kind: 'product', price: 0.1 });
  assert.equal(cart.totals().subtotalP, 90);
});

test('adding the same product twice increments quantity, not lines', () => {
  const cart = newCart();
  cart.add(oats).add(oats, { qty: 2 });
  assert.equal(cart.lines().length, 1);
  assert.equal(cart.lines()[0].qty, 3);
  assert.equal(cart.totals().subtotalP, 74700);
});

test('memberships are locked to one, however many times they are added', () => {
  const cart = newCart();
  cart.add(member).add(member).add(member, { qty: 5 });
  assert.equal(cart.lines().length, 1);
  assert.equal(cart.lines()[0].qty, 1);
});

test('every quantity-locked kind is actually locked', () => {
  for (const kind of QTY_LOCKED_KINDS) {
    const cart = newCart();
    cart.add({ id: 'x', name: 'x', kind, price: 500 }, { qty: 4 });
    assert.equal(cart.lines()[0].qty, 1, `${kind} should be locked to 1`);
    cart.setQty(cart.lines()[0].key, 7);
    assert.equal(cart.lines()[0].qty, 1, `${kind} should ignore setQty`);
  }
});

test('same product with different options is two lines, not quantity two', () => {
  const cart = newCart();
  cart.add(member, { options: { start_date: '2026-09-01' } });
  cart.add(member, { options: { start_date: '2026-12-01' } });
  assert.equal(cart.lines().length, 2);
});

test('option order does not change a line key', () => {
  assert.equal(lineKey('p1', { b: '2', a: '1' }), lineKey('p1', { a: '1', b: '2' }));
});

test('empty options are ignored when keying, so a blank select is not a new line', () => {
  assert.equal(lineKey('p1', { slot: '' }), lineKey('p1', {}));
});

test('setting quantity to zero removes the line', () => {
  const cart = newCart();
  cart.add(oats, { qty: 3 });
  cart.setQty(cart.lines()[0].key, 0);
  assert.ok(cart.isEmpty());
});

test('quantity is clamped, so a pasted 999999 cannot become an order', () => {
  const cart = newCart();
  cart.add(oats, { qty: 999999 });
  assert.equal(cart.lines()[0].qty, MAX_QTY);
});

test('callers cannot mutate prices through the lines they are handed', () => {
  const cart = newCart();
  cart.add(whey);
  const stolen = cart.lines();
  stolen[0].priceP = 1;
  assert.equal(cart.totals().subtotalP, 249900);
});

test('cart survives a reload', () => {
  const storage = memoryStorage();
  createCart({ storage, tenantSlug: 'j7' }).add(whey, { qty: 2 });
  const reloaded = createCart({ storage, tenantSlug: 'j7' });
  assert.equal(reloaded.count(), 2);
  assert.equal(reloaded.totals().totalP, 499800);
});

test('a cart from another gym is discarded, not carried across', () => {
  const storage = memoryStorage();
  createCart({ storage, tenantSlug: 'j7' }).add(whey);
  const other = createCart({ storage, tenantSlug: 'ironworks' });
  assert.ok(other.isEmpty(), 'one gym must never inherit another gym is cart');
});

test('corrupted storage is dropped, never thrown', () => {
  const storage = memoryStorage();
  storage.setItem('j7.cart.v1', '{not json');
  assert.doesNotThrow(() => createCart({ storage, tenantSlug: 'j7' }));
  storage.setItem('j7.cart.v1', JSON.stringify({ tenantSlug: 'j7', lines: [{ name: 'x' }] }));
  assert.ok(createCart({ storage, tenantSlug: 'j7' }).isEmpty(), 'malformed lines must be dropped');
});

test('storage that throws does not break the cart', () => {
  const hostile = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
    removeItem() { throw new Error('blocked'); },
  };
  const cart = createCart({ storage: hostile, tenantSlug: 'j7' });
  assert.doesNotThrow(() => cart.add(oats));
  assert.equal(cart.count(), 1);
});

test('subscribers are told when the cart changes', () => {
  const cart = newCart();
  let calls = 0;
  const off = cart.onChange(() => calls++);
  cart.add(oats);
  cart.setQty(cart.lines()[0].key, 2);
  off();
  cart.add(whey);
  assert.equal(calls, 2, 'unsubscribed listeners must stop firing');
});

// --------------------------------------------------------------- checkout

test('checkout validation mirrors every database constraint', () => {
  const base = { customer_name: 'Koushik', phone: '9876543210', fulfilment: 'pickup_at_gym' };

  assert.ok(validateCheckout(base).ok);

  assert.equal(validateCheckout({ ...base, customer_name: '   ' }).ok, false);
  assert.equal(validateCheckout({ ...base, phone: '98765' }).ok, false);
  assert.equal(validateCheckout({ ...base, fulfilment: 'teleport' }).ok, false);

  // constraint delivery_needs_address
  const delivery = validateCheckout({ ...base, fulfilment: 'delivery', address: '' });
  assert.equal(delivery.ok, false);
  assert.ok(delivery.errors.address);
  assert.ok(validateCheckout({ ...base, fulfilment: 'delivery', address: 'Nandigama' }).ok);

  // constraint items_not_empty
  assert.equal(validateCheckout(base, { cartIsEmpty: true }).ok, false);
});

test('formatted phone numbers pass, because customers type spaces and plus signs', () => {
  const base = { customer_name: 'K', fulfilment: 'pickup_at_gym' };
  assert.ok(validateCheckout({ ...base, phone: '+91 98765 43210' }).ok);
  assert.equal(digitsOf('+91 98765 43210'), '919876543210');
});

test('the order payload sends no prices at all', () => {
  const cart = newCart();
  cart.add(oats, { qty: 2 });
  cart.add(member, { options: { start_date: '2026-09-01' } });

  const payload = buildOrderPayload({
    tenantSlug: 'j7',
    form: { customer_name: ' Koushik ', phone: '9876543210', fulfilment: 'pickup_at_gym', note: '' },
    lines: cart.lines(),
  });

  const serialised = JSON.stringify(payload);
  assert.doesNotMatch(serialised, /price/i, 'the server reads prices; sending them is theatre');
  assert.equal(payload.p_customer_name, 'Koushik', 'whitespace must be trimmed like the database does');
  assert.equal(payload.p_note, null, 'an empty note is null, not an empty string');
  assert.equal(payload.p_items.length, 2);
  assert.deepEqual(payload.p_items[1].options, { start_date: '2026-09-01' });
});

test('a pickup order never carries a stale delivery address', () => {
  const payload = buildOrderPayload({
    tenantSlug: 'j7',
    form: { customer_name: 'K', phone: '9876543210', fulfilment: 'pickup_at_gym', address: 'typed then changed mind' },
    lines: [],
  });
  assert.equal(payload.p_address, null);
});

test('a gym with no WhatsApp number gets no broken link', () => {
  assert.equal(whatsappLink(null, 'hi'), null);
  assert.equal(whatsappLink('', 'hi'), null);
  assert.equal(whatsappLink('12345', 'hi'), null);
  assert.equal(whatsappLink('+91 98765 43210', 'hi'), 'https://wa.me/919876543210?text=hi');
});

test('the WhatsApp message carries the order number, the total and the options', () => {
  const cart = newCart();
  cart.add(oats, { qty: 2 });
  cart.add(member, { options: { start_date: '2026-09-01' } });
  const msg = orderMessage({
    gymName: 'J7 Fitness Studio',
    orderNo: 'J7-0007',
    form: { customer_name: 'Koushik', phone: '9876543210', fulfilment: 'pickup_at_gym' },
    lines: cart.lines(),
    totals: cart.totals(),
  });
  assert.match(msg, /J7-0007/);
  assert.match(msg, /Rolled Oats - 1 kg x2/);
  assert.match(msg, /start date: 2026-09-01/);
  assert.match(msg, /1,498/);
});

// ------------------------------------------------------------------ theme

test('a brand value cannot break out of its declaration', () => {
  assert.equal(isSafeValue('#FF2738'), true);
  assert.equal(isSafeValue('Inter, system-ui, sans-serif'), true);
  assert.equal(isSafeValue('red; background: url(https://evil.test/x)'), false);
  assert.equal(isSafeValue('url(javascript:alert(1))'), false);
  assert.equal(isSafeValue('}html{display:none'), false);
  // The cap is 400, raised from 200 once --field started carrying a layered
  // gradient that legitimately runs to ~250 characters.
  assert.equal(isSafeValue('x'.repeat(300)), true);
  assert.equal(isSafeValue('x'.repeat(500)), false);
});

test('applyTheme writes known tokens and silently drops the rest', () => {
  const applied = [];
  const fake = { style: { setProperty: (k, v) => applied.push([k, v]) } };
  const used = applyTheme(
    {
      brand: '#FF2738',
      '--text': '#FFFFFF',
      nonsense: '#000000',
      'Evil Key': '#000000',
      bg: 'red; }*{display:none',
    },
    fake
  );
  assert.deepEqual(used.sort(), ['brand', 'text']);
  assert.deepEqual(applied.sort(), [['--brand', '#FF2738'], ['--text', '#FFFFFF']]);
});

test('every token the CSS reads is a token the theme is allowed to set', async () => {
  const { readFileSync } = await import('node:fs');
  const css = readFileSync(new URL('../engine/engine.css', import.meta.url), 'utf8');
  const used = new Set([...css.matchAll(/var\(--([a-z0-9-]+)\)/g)].map((m) => m[1]));
  const missing = [...used].filter((t) => !TOKENS.includes(t));
  assert.deepEqual(missing, [], 'engine.css reads a token the admin panel cannot set');
});

test('sections default to on, so an unconfigured gym looks complete', () => {
  assert.equal(sectionEnabled({}, 'shop'), true);
  assert.equal(sectionEnabled(null, 'shop'), true);
  assert.equal(sectionEnabled({ testimonials: false }, 'testimonials'), false);
});

// ----------------------------------------------------------- which gym

test('tenant resolution follows the documented order', () => {
  const at = (hostname, search = '') => resolveTenant({ hostname, search });

  assert.deepEqual(at('anything.test', '?gym=ironworks'), { by: 'slug', value: 'ironworks' });
  assert.deepEqual(at('localhost'), { by: 'slug', value: 'j7' });
  assert.deepEqual(at('j7fitness.com'), { by: 'domain', value: 'j7fitness.com' });
  assert.deepEqual(at('www.j7fitness.com'), { by: 'domain', value: 'j7fitness.com' });

  const hosts = ['gymengine.app'];
  assert.deepEqual(resolveTenant({ hostname: 'ironworks.gymengine.app', search: '' }, hosts), {
    by: 'slug',
    value: 'ironworks',
  });
  assert.deepEqual(resolveTenant({ hostname: 'www.gymengine.app', search: '' }, hosts), {
    by: 'slug',
    value: 'j7',
  });
});

// ------------------------------------------------- brand preview (?brand=off)

test('?brand=off suspends the database brand on a dev machine', () => {
  assert.equal(brandSuspended({ hostname: 'localhost', search: '?brand=off' }), true);
  assert.equal(brandSuspended({ hostname: '127.0.0.1', search: '?brand=off&gym=j7' }), true);
});

test('a stranger cannot restyle a real gym by typing a URL', () => {
  // The whole point of the host gate. If this ever passes on a live domain,
  // any visitor can strip a paying client's branding off their own shop.
  assert.equal(brandSuspended({ hostname: 'j7fitness.com', search: '?brand=off' }), false);
  assert.equal(brandSuspended({ hostname: 'j7.vercel.app', search: '?brand=off' }), false);
  assert.equal(brandSuspended({ hostname: 'localhost.evil.com', search: '?brand=off' }), false);
});

test('the brand applies normally when nothing asks it not to', () => {
  assert.equal(brandSuspended({ hostname: 'localhost', search: '' }), false);
  assert.equal(brandSuspended({ hostname: 'localhost', search: '?gym=j7' }), false);
  assert.equal(brandSuspended({ hostname: 'localhost', search: '?brand=on' }), false);
});

test('brandSuspended survives a location with nothing on it', () => {
  assert.equal(brandSuspended({}), false);
  assert.equal(brandSuspended(undefined), false);
});

test('one definition of local, shared with tenant resolution', () => {
  // These two used to be written out separately. Same inputs, same answer.
  for (const host of ['localhost', '127.0.0.1', 'gym.local', 'j7fitness.com', '']) {
    const local = isLocalHost(host);
    const resolved = resolveTenant({ hostname: host, search: '' }, ['vercel.app']);
    if (local) assert.equal(resolved.value, 'j7', `${host} should resolve to the default tenant`);
  }
});
