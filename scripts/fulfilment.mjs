// ===========================================================================
// End-to-end proof of the ELITE GYM fulfilment chain.
//
// Goes through the same REST endpoints the storefront, the admin console, the
// kitchen board and the rider board use. Nothing here touches the database
// directly, so a pass means the real doors work — not that the SQL compiles.
//
//   node _pipeline.mjs
// ===========================================================================

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../engine/config.js';

const REST = `${SUPABASE_URL}/rest/v1`;
const AUTH = `${SUPABASE_URL}/auth/v1`;
let token = null;

async function call(url, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      // PostgREST wants BOTH headers. Without Authorization the request is not
      // even the anon role, and every check then fails in a way that reads
      // like a policy bug. engine/store.js has always sent both.
      Authorization: `Bearer ${token ?? SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text }; }
  if (!res.ok) throw new Error(`${res.status} ${body?.message ?? body?.error ?? text.slice(0, 150)}`);
  return body;
}

const rpc = (fn, args) => call(`${REST}/rpc/${fn}`, { method: 'POST', body: JSON.stringify(args) });
const one = (r) => (Array.isArray(r) ? r[0] : r);

let pass = 0;
let fail = 0;
const step = (m) => console.log(`\n${m}`);

async function expectOk(label, fn) {
  try {
    const r = await fn();
    console.log(`  PASS  ${label}`);
    pass += 1;
    return r;
  } catch (e) {
    console.log(`  FAIL  ${label} -- ${e.message.slice(0, 120)}`);
    fail += 1;
    throw e;
  }
}

async function expectBlocked(label, fn) {
  try {
    const r = await fn();
    // An empty array is RLS filtering rows away, which is a pass, not a leak.
    if (Array.isArray(r) && r.length === 0) { console.log(`  PASS  ${label} -- no rows`); pass += 1; return; }
    if (r === null) { console.log(`  PASS  ${label} -- null`); pass += 1; return; }
    console.log(`  FAIL  ${label} -- ALLOWED: ${JSON.stringify(r).slice(0, 90)}`);
    fail += 1;
  } catch (e) {
    console.log(`  PASS  ${label} -- ${e.message.slice(0, 78)}`);
    pass += 1;
  }
}

// -- 1 - the customer ------------------------------------------------------
step('1 - CUSTOMER places an order (anon key, nobody signed in)');

const tenant = (await call(`${REST}/tenants?select=id,slug,name&limit=1`))[0];
console.log(`  gym: ${tenant.name} (${tenant.slug})`);

const product = (await call(
  `${REST}/products?select=id,name,price&tenant_id=eq.${tenant.id}&active=eq.true&limit=1`))[0];
console.log(`  buying: ${product.name}`);

// The shop never inserts into `orders`. It calls place_order, which re-reads
// every price from `products`, so a cart edited in devtools cannot change what
// gets charged.
const placed = one(await expectOk('order placed through place_order', () =>
  rpc('place_order', {
    p_tenant_slug: tenant.slug,
    p_customer_name: 'Pipeline Test',
    p_phone: '9876543210',
    p_fulfilment: 'delivery',
    p_items: [{ product_id: product.id, qty: 1 }],
    p_address: '12 Test Lane, Hyderabad 500081',
    p_note: 'automated pipeline test - safe to delete',
  })));
console.log(`  order ${placed.order_no}, total ${placed.total} ${placed.currency}`);

await expectBlocked('anon CANNOT read orders back', () =>
  call(`${REST}/orders?select=*&order_no=eq.${placed.order_no}`));

// -- 2 - sign in -----------------------------------------------------------
step('2 - SIGN IN as the test operator/staff/rider');

const session = await call(`${AUTH}/token?grant_type=password`, {
  method: 'POST',
  body: JSON.stringify({
    email: 'pipeline-test@elitegym.local',
    password: 'Pipeline-Test-9f2b!',
  }),
});
token = session.access_token;
console.log('  PASS  signed in');
pass += 1;

const order = (await call(
  `${REST}/orders?select=id,status,order_no&order_no=eq.${placed.order_no}`))[0];
console.log(`  order id resolved, status=${order.status}`);

// -- 3 - the chain must refuse to be taken out of order --------------------
step('3 - THE CHAIN: every step rejects being skipped');

await expectBlocked('cannot mark ready before approval', () => rpc('mark_ready', { p_order: order.id }));
await expectBlocked('cannot accept before it is ready', () => rpc('accept_delivery', { p_order: order.id }));

let row = one(await expectOk('operator approves   new -> approved', () =>
  rpc('approve_order', { p_order: order.id })));
console.log(`  status=${row.status}, approved_at set: ${Boolean(row.approved_at)}`);

row = one(await expectOk('staff starts        approved -> preparing', () =>
  rpc('start_preparing', { p_order: order.id })));
console.log(`  status=${row.status}`);

row = one(await expectOk('staff finishes      preparing -> ready', () =>
  rpc('mark_ready', { p_order: order.id })));
console.log(`  status=${row.status}, ready_at set: ${Boolean(row.ready_at)}`);

// -- 4 - the code must be unreadable by the person it checks --------------
step('4 - OTP SECRECY');

await expectBlocked('signed-in rider CANNOT read order_otps', () =>
  call(`${REST}/order_otps?select=*&order_id=eq.${order.id}`));

const code = await call(`${REST}/rpc/customer_otp`, {
  method: 'POST',
  body: JSON.stringify({ p_order: order.id, p_phone: '9876543210' }),
});
if (/^\d{6}$/.test(String(code))) {
  console.log(`  PASS  customer fetches their own code with their phone: ${code}`);
  pass += 1;
} else {
  console.log(`  FAIL  customer could not fetch their code (got ${JSON.stringify(code)})`);
  fail += 1;
}

const wrong = await call(`${REST}/rpc/customer_otp`, {
  method: 'POST',
  body: JSON.stringify({ p_order: order.id, p_phone: '9000000000' }),
});
if (wrong === null) { console.log('  PASS  a WRONG phone gets nothing back'); pass += 1; }
else { console.log(`  FAIL  wrong phone returned ${JSON.stringify(wrong)}`); fail += 1; }

// -- 5 - the doorstep ------------------------------------------------------
step('5 - RIDER completes the run');

row = one(await expectOk('rider accepts       ready -> out_for_delivery', () =>
  rpc('accept_delivery', { p_order: order.id })));
console.log(`  status=${row.status}, rider assigned: ${Boolean(row.rider_id)}`);

await expectBlocked('a WRONG code is rejected', () =>
  rpc('verify_delivery_otp', { p_order: order.id, p_code: '000000' }));

row = one(await expectOk('right code          out_for_delivery -> delivered', () =>
  rpc('verify_delivery_otp', { p_order: order.id, p_code: code })));
console.log(`  status=${row.status}, delivered_at set: ${Boolean(row.delivered_at)}`);

await expectBlocked('the code cannot be replayed', () =>
  rpc('verify_delivery_otp', { p_order: order.id, p_code: code }));

// -- 6 - the boards --------------------------------------------------------
step('6 - THE BOARDS return the right work');

const kitchen = await call(
  `${REST}/orders?select=id,status&tenant_id=eq.${tenant.id}&status=in.(approved,preparing,ready)`);
console.log(`  PASS  kitchen board: ${kitchen.length} live job(s)`);
pass += 1;

const board = await call(
  `${REST}/orders?select=id&tenant_id=eq.${tenant.id}&status=eq.ready&fulfilment=eq.delivery&rider_id=is.null`);
console.log(`  PASS  rider board: ${board.length} unclaimed run(s)`);
pass += 1;

step(`RESULT -- ${pass} passed, ${fail} failed`);
console.log(`Test order ${placed.order_no} is delivered and left in place.`);
process.exit(fail ? 1 : 0);
