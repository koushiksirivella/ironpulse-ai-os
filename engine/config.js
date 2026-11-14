// J7 Commerce Engine — configuration and tenant resolution.
//
// The anon key below is PUBLIC BY DESIGN. It ships in every visitor's browser
// and grants only what Row Level Security allows: reading active products of
// active tenants, and inserting an order. It cannot read orders. See
// supabase/policies.sql.
//
// This file contains no colour and no font. It never will — see CLAUDE.md §1.

export const SUPABASE_URL = 'https://srvrovmapaysccsbwdvx.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNydnJvdm1hcGF5c2Njc2J3ZHZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0ODk1MTUsImV4cCI6MjEwMzA2NTUxNX0.pct7LYcmnyrFU4mit-lOMe5q-_kcOPD0KntccKuHFwM';

export const DEFAULT_TENANT_SLUG = 'j7';

/**
 * Work out which gym this page is for.
 *
 * Resolution order, first match wins (spec §6):
 *   1. custom domain   j7fitness.com        -> matched against tenants.domain
 *   2. subdomain       j7.example.com       -> slug is the subdomain
 *   3. query parameter ?gym=j7              -> slug is the parameter
 *
 * Returns { by, value }. `by: 'domain'` means the caller must look the value up
 * against tenants.domain; the other two carry a slug directly.
 *
 * @param {{hostname: string, search: string}} location
 * @param {string[]} platformHosts hosts that are ours, not a client's domain
 */
/**
 * Is this page being served from a development machine?
 *
 * One definition, used by both tenant resolution and the brand preview below,
 * so the two can never drift into disagreeing about what "local" means.
 *
 * @param {string} hostname
 */
export function isLocalHost(hostname) {
  const h = String(hostname || '').toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h.endsWith('.local');
}

/**
 * Should this page load skip `tenants.brand` and let the linked skin show?
 *
 * The brand row is written inline onto <html>, so it beats every stylesheet.
 * That is right in production and backwards while designing: a new skin could
 * not be seen on the real page until it had already been saved to the live
 * row — you had to ship a look to find out whether you wanted it. `?brand=off`
 * suspends the row for one page load.
 *
 * Development hosts only. On a gym's own domain their brand is not optional,
 * and a URL a stranger can type must never restyle their shop.
 *
 * @param {{hostname: string, search: string}} location
 */
export function brandSuspended(location) {
  if (!isLocalHost(location?.hostname)) return false;
  return new URLSearchParams(location?.search || '').get('brand') === 'off';
}

export function resolveTenant(location, platformHosts = []) {
  const hostname = (location.hostname || '').toLowerCase();
  const params = new URLSearchParams(location.search || '');

  const fromQuery = params.get('gym');
  if (fromQuery) return { by: 'slug', value: fromQuery.toLowerCase() };

  if (isLocalHost(hostname)) return { by: 'slug', value: DEFAULT_TENANT_SLUG };

  const platformHost = platformHosts.find(
    (h) => hostname === h || hostname.endsWith('.' + h)
  );
  if (platformHost) {
    const sub = hostname.slice(0, -(platformHost.length + 1));
    // "j7" resolves; "www" and a bare platform host do not
    if (sub && sub !== 'www' && !sub.includes('.')) {
      return { by: 'slug', value: sub };
    }
    return { by: 'slug', value: DEFAULT_TENANT_SLUG };
  }

  return { by: 'domain', value: hostname.replace(/^www\./, '') };
}
