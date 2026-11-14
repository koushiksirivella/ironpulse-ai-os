// Row Level Security tests — run against the LIVE project with the PUBLIC anon key.
//
// These are the most important tests in the repo. They do not check that the
// app works; they check that a stranger holding the key that ships in every
// browser cannot read the customer list. Everything else is recoverable.
//
// Network required. Skipped automatically when offline.

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../engine/config.js';

// Every row these tests create carries this name, so the sweep at the bottom
// can find them and nothing else.
const MARKER = 'RLS Test Order';

const H = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
};

const rest = (path, init = {}) =>
  fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { ...H, ...init.headers } });

let online = true;
try {
  const ping = await rest('tenants?select=slug&limit=1');
  online = ping.ok || ping.status < 500;
} catch {
  online = false;
}

const opts = { skip: online ? false : 'no network' };

test('anon CAN read active products', opts, async () => {
  const res = await rest('products?select=name,price,kind&limit=5');
  assert.equal(res.status, 200);
  const rows = await res.json();
  assert.ok(rows.length > 0, 'expected the seeded catalog to be publicly readable');
});

test('anon CAN read tenant branding', opts, async () => {
  const res = await rest('tenants?select=slug,name,brand&slug=eq.j7');
  assert.equal(res.status, 200);
  const rows = await res.json();
  assert.equal(rows.length, 1);
  assert.ok(rows[0].brand?.brand, 'brand tokens should be present');
});

test('every live gym defines every design token', opts, async () => {
  // A missing token still renders — the skin file covers it — but it shows as
  // an empty box in the admin panel, which reads as broken rather than as
  // inherited. Caught here so a new gym is never onboarded with gaps.
  const { TOKENS } = await import('../engine/theme.js');

  // --grain is the one token a gym CANNOT set, and it is the only exclusion.
  // Its value is a `url(data:…)`, which engine/theme.js refuses from the
  // database on purpose so a row can never make a visitor's browser fetch
  // something. It comes from the skin file instead, and requiring it here would
  // amount to asserting that a security control is broken.
  const SKIN_ONLY = new Set(['grain']);
  const settable = TOKENS.filter((t) => !SKIN_ONLY.has(t));

  const rows = await (await rest('tenants?select=slug,brand')).json();
  for (const row of rows) {
    const missing = settable.filter((t) => !(t in (row.brand ?? {})));
    assert.deepEqual(missing, [], `tenant "${row.slug}" is missing brand tokens: ${missing.join(', ')}`);
  }
});

test('anon CANNOT read orders', opts, async () => {
  const res = await rest('orders?select=customer_name,phone');
  const rows = res.ok ? await res.json() : null;
  assert.ok(
    !res.ok || (Array.isArray(rows) && rows.length === 0),
    `orders must never be readable by anon — got ${res.status} with ${JSON.stringify(rows)?.slice(0, 200)}`
  );
});

test('anon CANNOT read coupons', opts, async () => {
  const res = await rest('coupons?select=code,value');
  const rows = res.ok ? await res.json() : null;
  assert.ok(
    !res.ok || (Array.isArray(rows) && rows.length === 0),
    'coupon codes must not be enumerable by anon'
  );
});

test('anon CANNOT update a product price', opts, async () => {
  const res = await rest('products?name=eq.Rolled%20Oats%20-%201%20kg', {
    method: 'PATCH',
    body: JSON.stringify({ price: 1 }),
    headers: { Prefer: 'return=representation' },
  });
  const body = res.ok ? await res.json() : null;
  assert.ok(
    !res.ok || (Array.isArray(body) && body.length === 0),
    'anon must not be able to rewrite prices'
  );
});

test('anon CANNOT delete a tenant', opts, async () => {
  const res = await rest('tenants?slug=eq.j7', {
    method: 'DELETE',
    headers: { Prefer: 'return=representation' },
  });
  const body = res.ok ? await res.json() : null;
  assert.ok(
    !res.ok || (Array.isArray(body) && body.length === 0),
    'anon must not be able to delete tenants'
  );
});

const testOrder = (tenantId) =>
  JSON.stringify({
    tenant_id: tenantId,
    customer_name: MARKER,
    phone: '9999999999',
    fulfilment: 'pickup_at_gym',
    items: [{ name: 'Rolled Oats - 1 kg', price: 249, qty: 1, kind: 'product' }],
    subtotal: 249,
    total: 249,
  });

test('anon CANNOT ask for the order row back after inserting', opts, async () => {
  // `Prefer: return=representation` makes Postgres RETURNING the new row, which
  // needs SELECT on orders — deliberately not granted. Checkout must therefore
  // insert with return=minimal and get its order number from an RPC instead.
  const tenant = await (await rest('tenants?select=id&slug=eq.j7')).json();
  const res = await rest('orders', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: testOrder(tenant[0].id),
  });
  assert.equal(
    res.status,
    401,
    'asking for the row back must be refused — otherwise anon has a read path into orders'
  );
});

test('anon CAN place an order, and still cannot read it back', opts, async () => {
  const tenant = await (await rest('tenants?select=id&slug=eq.j7')).json();
  const tenantId = tenant[0].id;

  const res = await rest('orders', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: testOrder(tenantId),
  });

  assert.equal(res.status, 201, `order insert should succeed, got ${res.status}`);

  // The insert worked. Reading it back must still be impossible.
  const readBack = await rest(`orders?select=customer_name&customer_name=eq.${encodeURIComponent(MARKER)}`);
  const rows = readBack.ok ? await readBack.json() : null;
  assert.ok(
    !readBack.ok || (Array.isArray(rows) && rows.length === 0),
    'an order must not be readable by the anon role even immediately after inserting it'
  );
});

// ---------------------------------------------------------- place_order
// The RPC is the path the engine actually uses. Its job is to make the
// browser's opinion about prices irrelevant.

const rpc = (body) =>
  rest('rpc/place_order', { method: 'POST', body: JSON.stringify(body) });

const rpcOrder = (extra = {}) => ({
  p_tenant_slug: 'j7',
  p_customer_name: MARKER,
  p_phone: '9999999999',
  p_fulfilment: 'pickup_at_gym',
  p_items: [],
  ...extra,
});

async function twoProducts() {
  const res = await rest('products?select=id,name,price,kind&order=price.asc');
  const rows = await res.json();
  return {
    cheap: rows.find((p) => p.kind === 'product'),
    membership: rows.find((p) => p.kind === 'membership'),
  };
}

test('place_order ignores a price sent by the browser', opts, async () => {
  const { cheap } = await twoProducts();
  const res = await rpc(rpcOrder({ p_items: [{ product_id: cheap.id, qty: 2, price: 1 }] }));
  const body = await res.text(); // read once; a Response body cannot be consumed twice
  assert.equal(res.status, 200, body);
  const [row] = JSON.parse(body);
  assert.equal(
    Number(row.total),
    Number(cheap.price) * 2,
    'the total must come from the products table, never from the request body'
  );
});

test('place_order forces quantity 1 on memberships even when the browser asks for 9', opts, async () => {
  const { membership } = await twoProducts();
  const res = await rpc(rpcOrder({ p_items: [{ product_id: membership.id, qty: 9 }] }));
  assert.equal(res.status, 200);
  const [row] = await res.json();
  assert.equal(Number(row.total), Number(membership.price));
});

test('place_order returns an order number, and nothing else about the order', opts, async () => {
  const { cheap } = await twoProducts();
  const res = await rpc(rpcOrder({ p_items: [{ product_id: cheap.id, qty: 1 }] }));
  const [row] = await res.json();
  assert.match(row.order_no, /^J7-\d{4}$/);
  assert.deepEqual(
    Object.keys(row).sort(),
    ['currency', 'order_no', 'total'],
    'the function must not become a read path into orders'
  );
});

test('place_order refuses an unknown gym', opts, async () => {
  const { cheap } = await twoProducts();
  const res = await rpc(rpcOrder({ p_tenant_slug: 'not-a-gym', p_items: [{ product_id: cheap.id }] }));
  assert.equal(res.ok, false);
});

test('place_order refuses an empty cart', opts, async () => {
  const res = await rpc(rpcOrder({ p_items: [] }));
  assert.equal(res.ok, false);
});

test('place_order refuses a product id from a different gym or a fake one', opts, async () => {
  const res = await rpc(
    rpcOrder({ p_items: [{ product_id: '00000000-0000-0000-0000-000000000000', qty: 1 }] })
  );
  assert.equal(res.ok, false);
});

test('place_order refuses delivery with no address, same as the table constraint', opts, async () => {
  const { cheap } = await twoProducts();
  const res = await rpc(
    rpcOrder({ p_fulfilment: 'delivery', p_address: '   ', p_items: [{ product_id: cheap.id, qty: 1 }] })
  );
  assert.equal(res.ok, false);
});

// ------------------------------------------- signed in is not trusted
//
// The bug these cover, found 2026-08-24: every policy said
// `to authenticated using (true)`, and Supabase ships with public signup ON.
// One signup with the key from the page source read every customer's name and
// phone number, for every gym. The old suite never caught it because it only
// ever tested the `anon` role.

test('public signup is disabled', opts, async () => {
  // A 1-character password can never create a user, so this probes the setting
  // without leaving an account behind. If signup were open the answer would be
  // "weak_password"; when it is closed the request is refused outright.
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `probe-${Date.now()}@example.com`, password: 'x' }),
  });
  const body = await res.text();
  assert.ok(
    /signup.*disabled|not allowed|Signups not allowed/i.test(body),
    'anyone can create an account on this project — turn off ' +
      'Authentication > Sign In / Providers > Email > "Allow new users". ' +
      `Got: ${body.slice(0, 200)}`
  );
});

test('a signed-in stranger who is not an operator cannot read orders', opts, async () => {
  // Belt and braces: even if signup is re-enabled by accident, the policies
  // must still refuse. Skipped unless a throwaway account is supplied.
  const email = process.env.STRANGER_EMAIL;
  const password = process.env.STRANGER_PASSWORD;
  if (!email || !password) return; // nothing to test with; the probe above stands

  const auth = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  assert.ok(auth.ok, 'the stranger account should be able to sign in');
  const { access_token } = await auth.json();

  const asStranger = (path) =>
    fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${access_token}` },
    });

  for (const table of ['orders', 'coupons', 'operators']) {
    const res = await asStranger(`${table}?select=*`);
    const rows = res.ok ? await res.json() : null;
    assert.ok(
      !res.ok || (Array.isArray(rows) && rows.length === 0),
      `a signed-in non-operator read ${table} — being authenticated is not being trusted`
    );
  }

  const write = await fetch(`${SUPABASE_URL}/rest/v1/products?name=eq.Rolled%20Oats%20-%201%20kg`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ price: 1 }),
  });
  const changed = write.ok ? await write.json() : null;
  assert.ok(
    !write.ok || (Array.isArray(changed) && changed.length === 0),
    'a signed-in non-operator rewrote a price'
  );
});

// ------------------------------------------------------------- cleanup
// These tests write real rows. Leaving them behind would put fake orders on
// the operator's board and shift every real order number.
after(async () => {
  if (!online) return;
  try {
    const { runSql } = await import('./sql.mjs');
    await runSql(`delete from public.orders where customer_name = '${MARKER}';`);
  } catch (err) {
    console.warn(`\n  could not clean test orders: ${err.message}`);
    console.warn(`  remove them by hand: delete from orders where customer_name = '${MARKER}';\n`);
  }
});
