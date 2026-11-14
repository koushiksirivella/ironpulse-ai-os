// Theme — turns a database row into CSS custom properties.
//
// This file is the hinge the whole product turns on. `tenants.brand` is a small
// jsonb object of token names and values; this writes them onto the root
// element as `--token: value`. engine.css reads those tokens and nothing else.
//
// Result: changing a gym's entire look is an UPDATE statement, not a deploy.
//
// It contains no colour itself — it only moves colours that came from
// elsewhere. See CLAUDE.md §1.

/**
 * Colour tokens. The admin panel gives each of these a colour picker, so every
 * value here has to be something `<input type="color">` can round-trip.
 */
export const COLOUR_TOKENS = [
  'bg',
  'surface',
  'surface-2',
  'border',
  'brand',
  'brand-hover',
  'brand-glow',
  'brand-text',
  'text',
  'text-muted',
  'danger',
];

/**
 * Everything else the engine reads: shape, type, material, texture, motion.
 *
 * Free-text values — a gradient, a shadow list, a filter, a duration. These are
 * what make a reskin a redesign rather than a recolour. Without them, "make the
 * cards glass" or "make the photos black and white" would mean editing
 * engine.css, and the engine would stop being swappable.
 */
export const STRUCTURE_TOKENS = [
  'radius',
  'radius-lg',
  'font-display',
  'font-body',
  'surface-fill',
  'rim',
  'shadow',
  'glow',
  'field',
  'grain',
  'grain-opacity',
  'img-filter',
  'img-filter-hover',
  'ease',
  'dur-1',
  'dur-2',
  'dur-3',
];

/** Tokens the engine reads. Anything outside this list is ignored on purpose. */
export const TOKENS = [...COLOUR_TOKENS, ...STRUCTURE_TOKENS];

const NAME_OK = /^[a-z][a-z0-9-]*$/;

/**
 * A brand value is written into a stylesheet, so it has to be treated as
 * untrusted even though an operator typed it. `;` and `}` would let a value
 * escape its declaration; `url(` and `expression(` would let it fetch or
 * execute. Rejecting is safer than escaping — a dropped token falls back to
 * the skin default and the page still renders.
 */
export function isSafeValue(value) {
  const v = String(value);
  // 400, not 200: a layered gradient for --field is legitimately ~250
  // characters, and the old cap silently rejected exactly the token that makes
  // a shop look designed. Length was never the protection here — the character
  // blacklist below is, and it is unchanged.
  if (v.length > 400) return false;
  return !/[;{}<>]|url\s*\(|expression\s*\(|@import|javascript:/i.test(v);
}

/**
 * @param {object} brand   tenants.brand
 * @param {Element} root   defaults to <html>
 * @returns {string[]} the token names actually applied — useful in tests and
 *          when an operator wonders why their typo did nothing
 */
export function applyTheme(brand, root) {
  const el = root ?? (typeof document !== 'undefined' ? document.documentElement : null);
  if (!el || !brand) return [];

  const applied = [];
  for (const [key, value] of Object.entries(brand)) {
    const name = String(key).trim().replace(/^--/, '');
    if (!NAME_OK.test(name)) continue;
    if (!TOKENS.includes(name)) continue;
    if (!isSafeValue(value)) continue;
    el.style.setProperty(`--${name}`, String(value));
    applied.push(name);
  }
  return applied;
}

/** Read the tokens currently in force. Used by the admin panel's live preview. */
export function readTheme(root) {
  const el = root ?? (typeof document !== 'undefined' ? document.documentElement : null);
  if (!el || typeof getComputedStyle !== 'function') return {};
  const styles = getComputedStyle(el);
  const out = {};
  for (const name of TOKENS) {
    const v = styles.getPropertyValue(`--${name}`).trim();
    if (v) out[name] = v;
  }
  return out;
}

/**
 * Which page sections this gym shows. Unknown keys default to ON, because a
 * gym that has not been configured yet should look complete, not empty.
 */
export function sectionEnabled(sections, name) {
  if (!sections || !(name in sections)) return true;
  return sections[name] !== false;
}
