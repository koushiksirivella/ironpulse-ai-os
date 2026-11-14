// Store — every database call the storefront makes, in one file.
//
// Nothing else in engine/ is allowed to call fetch(). When Supabase is one day
// swapped for something else, this is the only file that changes.
//
// No colour, no font, no DOM. See CLAUDE.md §1.

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const REST = `${SUPABASE_URL}/rest/v1`;

export class GymNotFoundError extends Error {
  constructor(what) {
    super(`no gym found for ${what}`);
    this.name = 'GymNotFoundError';
  }
}

export class StoreError extends Error {
  constructor(message, status, options) {
    super(message, options);
    this.name = 'StoreError';
    this.status = status;
  }
}

function headers(extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function request(path, init = {}) {
  let res;
  try {
    res = await fetch(`${REST}/${path}`, { ...init, headers: headers(init.headers) });
  } catch (cause) {
    // Offline, DNS, blocked — the caller needs a sentence a human can read,
    // not "TypeError: Failed to fetch".
    throw new StoreError('could not reach the server — check your connection', 0, { cause });
  }
  const text = await res.text();
  const body = text ? safeJson(text) : null;
  if (!res.ok) {
    const message = body?.message || body?.error || `request failed (${res.status})`;
    throw new StoreError(message, res.status);
  }
  return body;
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { message: text.slice(0, 200) };
  }
}

const q = encodeURIComponent;

const TENANT_FIELDS =
  'id,slug,name,currency,whatsapp_number,enquiry_email,address,hours,brand,logo_url,sections';

/**
 * @param {{by:'slug'|'domain', value:string}} ref from resolveTenant()
 * @returns the tenant row
 * @throws {GymNotFoundError} unknown slug or domain — callers render a clean
 *         "gym not found" page rather than a broken one (spec §6)
 */
export async function fetchTenant(ref) {
  const column = ref.by === 'domain' ? 'domain' : 'slug';
  const rows = await request(
    `tenants?select=${TENANT_FIELDS}&${column}=eq.${q(ref.value)}&active=is.true&limit=1`
  );
  if (!rows?.length) throw new GymNotFoundError(`${column} "${ref.value}"`);
  return rows[0];
}

/**
 * Categories and products for one gym, in display order, in two round trips.
 * Products are grouped under their category; anything uncategorised lands in a
 * trailing "More" group rather than vanishing.
 */
export async function fetchCatalog(tenantId) {
  const [categories, products] = await Promise.all([
    request(`categories?select=id,name,slug,sort&tenant_id=eq.${q(tenantId)}&active=is.true&order=sort.asc`),
    request(
      `products?select=id,category_id,kind,name,description,price,image_url,meta,sort` +
        `&tenant_id=eq.${q(tenantId)}&active=is.true&order=sort.asc,name.asc`
    ),
  ]);

  const groups = categories.map((c) => ({ ...c, products: [] }));
  const byId = new Map(groups.map((g) => [g.id, g]));
  const loose = [];

  for (const p of products) {
    const group = p.category_id ? byId.get(p.category_id) : null;
    (group ? group.products : loose).push(p);
  }
  if (loose.length) groups.push({ id: null, name: 'More', slug: 'more', sort: 9999, products: loose });

  return { categories: groups.filter((g) => g.products.length), products };
}

/**
 * Place an order.
 *
 * Calls the `place_order` database function, not a table insert. The function
 * re-reads every price from `products`, so a tampered cart in the browser
 * cannot change what gets charged. See supabase/functions.sql.
 *
 * @returns {{order_no:string, total:number, currency:string}}
 */
export async function placeOrder(payload) {
  const rows = await request('rpc/place_order', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const row = Array.isArray(rows) ? rows[0] : rows;
  if (!row?.order_no) throw new StoreError('the order did not save — nothing was charged', 500);
  return row;
}
