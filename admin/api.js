// Admin data layer — auth, reads, writes, uploads.
//
// Separate from engine/store.js on purpose. The engine talks to the database
// as an anonymous stranger and can barely do anything. This talks as the
// operator and can do everything, so it lives behind a login and never ships
// inside the storefront bundle.
//
// The session is kept in sessionStorage: it survives a reload and dies when
// the tab closes. An admin token left in localStorage outlives the person
// using the machine.

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../engine/config.js';

const AUTH = `${SUPABASE_URL}/auth/v1`;
const REST = `${SUPABASE_URL}/rest/v1`;
const STORAGE = `${SUPABASE_URL}/storage/v1`;
const BUCKET = 'gym-media';
const SESSION_KEY = 'j7.admin.session';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// ------------------------------------------------------------------ session

let session = readSession();

function readSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null');
  } catch {
    return null;
  }
}

function writeSession(next) {
  session = next;
  try {
    if (next) sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage disabled — the session simply will not survive a reload */
  }
}

export const currentUser = () => session?.user ?? null;
export const isSignedIn = () => Boolean(session?.access_token);

export async function signIn(email, password) {
  const res = await fetch(`${AUTH}/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(body.error_description || body.msg || 'Sign in failed', res.status);
  }
  writeSession(body);
  return body.user;
}

/**
 * Send the browser to Google, then back here.
 *
 * Requires the Google provider to be configured in the Supabase dashboard
 * (Authentication -> Sign In / Providers -> Google) with a client ID and secret
 * from Google Cloud. Until that is done this redirects to an error page — the
 * button says so rather than pretending.
 */
export function signInWithGoogle(redirectTo = location.href.split('#')[0]) {
  const url = new URL(`${AUTH}/authorize`);
  url.searchParams.set('provider', 'google');
  url.searchParams.set('redirect_to', redirectTo);
  location.assign(url.toString());
}

/**
 * Supabase hands OAuth tokens back in the URL fragment. Read them, store the
 * session, and strip the fragment.
 *
 * The strip is not cosmetic: while those tokens sit in the address bar they are
 * in the browser history, in any screenshot, and in anything the user pastes
 * when asking for help.
 *
 * @returns the signed-in user, or null when this was not an OAuth return
 */
export async function captureOAuthRedirect() {
  const raw = location.hash.slice(1);
  if (!raw) return null;

  const params = new URLSearchParams(raw);
  const clean = () => history.replaceState(null, '', location.pathname + location.search);

  const error = params.get('error_description') || params.get('error');
  if (error) {
    clean();
    throw new ApiError(decodeURIComponent(error).replace(/\+/g, ' '), 400);
  }

  const access_token = params.get('access_token');
  if (!access_token) return null;
  const refresh_token = params.get('refresh_token');
  clean();

  // The fragment carries no user object, unlike the password grant.
  const res = await fetch(`${AUTH}/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${access_token}` },
  });
  const user = res.ok ? await res.json() : null;

  writeSession({ access_token, refresh_token, user });
  return user;
}

/**
 * Is this account actually allowed to do anything?
 *
 * Signing in only proves who you are. `is_operator()` is what proves you are
 * trusted — see supabase/policies.sql. Without this check the panel would sign
 * someone in successfully and then show them an empty, silently-filtered
 * database, which reads as "the app is broken" rather than "you lack access".
 *
 * @returns {Promise<boolean|null>} null when the function does not exist yet,
 *          i.e. HARDEN-AND-BOOTSTRAP.sql has not been run
 */
export async function amOperator() {
  try {
    const result = await rest('rpc/is_operator', { method: 'POST', body: '{}' });
    return result === true;
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

export async function signOut() {
  if (session?.access_token) {
    // Best effort. A failed logout must not trap someone in a signed-in UI.
    await fetch(`${AUTH}/logout`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${session.access_token}` },
    }).catch(() => {});
  }
  writeSession(null);
}

/** Swap the refresh token for a new access token. Returns false if it is dead. */
async function refresh() {
  if (!session?.refresh_token) return false;
  const res = await fetch(`${AUTH}/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  if (!res.ok) {
    writeSession(null);
    return false;
  }
  writeSession(await res.json());
  return true;
}

// --------------------------------------------------------------------- REST

async function authed(url, init = {}, retry = true) {
  if (!session?.access_token) throw new ApiError('Not signed in', 401);

  const res = await fetch(url, {
    ...init,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.access_token}`,
      ...init.headers,
    },
  });

  // An access token lasts an hour. Refreshing once and replaying the request
  // is the difference between a long editing session and being logged out
  // mid-sentence.
  if (res.status === 401 && retry && (await refresh())) {
    return authed(url, init, false);
  }

  const text = await res.text();
  const body = text ? safeJson(text) : null;
  if (!res.ok) {
    throw new ApiError(body?.message || body?.error || `Request failed (${res.status})`, res.status);
  }
  return body;
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { message: text.slice(0, 300) };
  }
}

const rest = (path, init = {}) =>
  authed(`${REST}/${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });

const q = encodeURIComponent;
const RETURN = { Prefer: 'return=representation' };

// ------------------------------------------------------------------ tenants

export const listTenants = () =>
  rest('tenants?select=*&order=name.asc');

export const updateTenant = (id, patch) =>
  rest(`tenants?id=eq.${q(id)}`, { method: 'PATCH', headers: RETURN, body: JSON.stringify(patch) });

export const createTenant = (row) =>
  rest('tenants', { method: 'POST', headers: RETURN, body: JSON.stringify(row) });

// --------------------------------------------------------------- categories

export const listCategories = (tenantId) =>
  rest(`categories?select=*&tenant_id=eq.${q(tenantId)}&order=sort.asc`);

export const createCategory = (row) =>
  rest('categories', { method: 'POST', headers: RETURN, body: JSON.stringify(row) });

export const updateCategory = (id, patch) =>
  rest(`categories?id=eq.${q(id)}`, { method: 'PATCH', headers: RETURN, body: JSON.stringify(patch) });

// ----------------------------------------------------------------- products

export const listProducts = (tenantId) =>
  rest(`products?select=*&tenant_id=eq.${q(tenantId)}&order=sort.asc,name.asc`);

export const createProduct = (row) =>
  rest('products', { method: 'POST', headers: RETURN, body: JSON.stringify(row) });

export const updateProduct = (id, patch) =>
  rest(`products?id=eq.${q(id)}`, { method: 'PATCH', headers: RETURN, body: JSON.stringify(patch) });

/**
 * Products are deactivated, never deleted. A deleted product leaves every past
 * order pointing at nothing; `active = false` hides it from the shop and keeps
 * the history readable.
 */
export const archiveProduct = (id) => updateProduct(id, { active: false });

// ------------------------------------------------------------------- orders

export const listOrders = (tenantId, { status, limit = 100 } = {}) =>
  rest(
    `orders?select=*&tenant_id=eq.${q(tenantId)}` +
      (status ? `&status=eq.${q(status)}` : '') +
      `&order=created_at.desc&limit=${Number(limit)}`
  );

export const setOrderStatus = (id, status) =>
  rest(`orders?id=eq.${q(id)}`, { method: 'PATCH', headers: RETURN, body: JSON.stringify({ status }) });

export const countOrdersByStatus = async (tenantId) => {
  const rows = await rest(`orders?select=status&tenant_id=eq.${q(tenantId)}`);
  const counts = {};
  for (const r of rows) counts[r.status] = (counts[r.status] ?? 0) + 1;
  return counts;
};

// ------------------------------------------------------------------ storage

/**
 * Upload an image and return its public URL.
 * Path is `<tenant-slug>/<timestamp>-<safe-name>` so two gyms never collide
 * and re-uploading the same filename never silently replaces a live photo.
 */
export async function uploadImage(file, tenantSlug) {
  const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-|-$/g, '');
  const path = `${tenantSlug}/${Date.now()}-${safe}`;

  await authed(`${STORAGE}/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  });

  return publicUrl(path);
}

export const publicUrl = (path) => `${STORAGE}/object/public/${BUCKET}/${path}`;

/**
 * Everything this gym has uploaded.
 *
 * Scoped to the tenant's own folder, not the whole bucket: an operator who runs
 * two gyms should not be shown one gym's photos while editing the other, and a
 * flat list of every file on the platform stops being usable at about fifty.
 *
 * Storage list is a POST with a JSON body — it is not a GET with query params,
 * which is the first thing everyone tries.
 */
export async function listUploads(tenantSlug, { limit = 100 } = {}) {
  const rows = await authed(`${STORAGE}/object/list/${BUCKET}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prefix: `${tenantSlug}/`,
      limit,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    }),
  });

  // A folder placeholder comes back with a null id. Rendering it produces a
  // broken thumbnail that looks like a failed upload.
  return (rows ?? [])
    .filter((r) => r.id)
    .map((r) => ({
      name: r.name,
      path: `${tenantSlug}/${r.name}`,
      url: publicUrl(`${tenantSlug}/${r.name}`),
      size: r.metadata?.size ?? null,
      created_at: r.created_at,
    }));
}

/** Remove an uploaded file. Products pointing at it are left alone — see below. */
export const deleteUpload = (path) =>
  authed(`${STORAGE}/object/${BUCKET}/${path}`, { method: 'DELETE' });

/**
 * The images that ship with the engine.
 *
 * Written by `npm run assets:fetch` into assets/library.json and served as a
 * static file, so this needs no auth and no database. It is fetched relative to
 * the admin page, which means the admin panel and the site have to be served
 * from the same origin — they are, and if they ever are not, this returns an
 * empty library rather than throwing and taking the tab down with it.
 */
export async function listBuiltIn() {
  try {
    const res = await fetch(new URL('../assets/library.json', import.meta.url));
    if (!res.ok) return [];
    const body = await res.json();
    return (body.images ?? []).map((m) => ({
      name: m.slot,
      url: '/' + m.file,
      thumb: '/' + m.thumb,
      credit: [m.author, m.licence].filter(Boolean).join(' · '),
      page: m.page,
    }));
  } catch {
    return [];
  }
}

// =========================================================================
// FULFILMENT — the chain from an approved order to a delivered one.
//
// Every status change below is an RPC, never a PATCH on `orders`. This is
// deliberate and it is the security boundary: a PATCH that is allowed to set
// `status` is allowed to set it to ANY value, so a rider holding the anon key
// could mark an order delivered without leaving the gym. The functions in
// supabase/fulfilment.sql each accept exactly one transition, from exactly
// one prior state, for exactly one role — which is what makes the ORDER of
// the pipeline enforceable instead of advisory.
// =========================================================================

const rpc = (fn, args = {}) =>
  rest(`rpc/${fn}`, { method: 'POST', body: JSON.stringify(args) });

/** operator: new|confirmed -> approved */
export const approveOrder = (id) => rpc('approve_order', { p_order: id });

/** staff: approved -> preparing */
export const startPreparing = (id) => rpc('start_preparing', { p_order: id });

/** staff: preparing -> ready. Mints the customer's six-digit code. */
export const markReady = (id) => rpc('mark_ready', { p_order: id });

/** rider: ready -> out_for_delivery. Loses the race if another rider was first. */
export const acceptDelivery = (id) => rpc('accept_delivery', { p_order: id });

/**
 * rider: out_for_delivery -> delivered.
 *
 * The code is never fetched to the rider's device and compared here — that
 * would put the answer on the screen of the person being checked. It is sent
 * to the server and compared there. Six wrong guesses locks the order.
 */
export const verifyDeliveryOtp = (id, code) =>
  rpc('verify_delivery_otp', { p_order: id, p_code: String(code).trim() });

/** operator: anything except delivered -> cancelled */
export const cancelOrder = (id, reason = null) =>
  rpc('cancel_order', { p_order: id, p_reason: reason });

// ------------------------------------------------------------------- roles

/**
 * Which hats this signed-in person wears. Drives which pages they may open.
 * Returns [] for someone who is signed in but is not staff at all — which is
 * a different state from "signed out" and the pages say so.
 */
export async function myRoles() {
  const rows = await rest('operators?select=roles');
  return rows?.[0]?.roles ?? [];
}

// ------------------------------------------------------------- work queues

/** Staff page: everything approved but not yet handed to a rider. */
export const listKitchenQueue = (tenantId) =>
  rest(
    `orders?select=*&tenant_id=eq.${q(tenantId)}` +
      `&status=in.(approved,preparing,ready)&order=created_at.asc`
  );

/** Rider page, the open job board: ready, for delivery, unclaimed. */
export const listRiderBoard = (tenantId) =>
  rest(
    `orders?select=*&tenant_id=eq.${q(tenantId)}` +
      `&status=eq.ready&fulfilment=eq.delivery&rider_id=is.null&order=ready_at.asc`
  );

/** Rider page, their own runs. RLS already scopes this to them. */
export const listMyRuns = (tenantId, userId) =>
  rest(
    `orders?select=*&tenant_id=eq.${q(tenantId)}` +
      `&rider_id=eq.${q(userId)}&order=accepted_at.desc&limit=50`
  );

// ------------------------------------------------------------ the graph board

/**
 * Every order in a window, trimmed to the fields a chart needs.
 *
 * Aggregated in the browser rather than in SQL on purpose: the admin already
 * holds the full order list for the Orders tab, the row count for one gym over
 * ninety days is in the hundreds, and a second round trip to compute a sum
 * that costs a millisecond locally is a round trip for nothing. Swap to an RPC
 * the day one tenant crosses ~20k orders in the window.
 */
export const ordersSince = (tenantId, sinceISO) =>
  rest(
    `orders?select=id,total,status,created_at,fulfilment,customer_name,phone,items` +
      `&tenant_id=eq.${q(tenantId)}&created_at=gte.${q(sinceISO)}` +
      `&order=created_at.asc&limit=5000`
  );

/**
 * staff/operator: ready -> delivered, for a PICKUP order.
 *
 * A pickup has no rider, so without this it would sit at 'ready' forever. Same
 * six digits, same server-side comparison — the customer reads the code out at
 * the counter instead of at their door.
 */
export const verifyPickupOtp = (id, code) =>
  rpc('verify_pickup_otp', { p_order: id, p_code: String(code).trim() });
