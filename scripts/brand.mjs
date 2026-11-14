#!/usr/bin/env node
// Push a named skin's token values into `tenants.brand` for one gym.
//
//   node scripts/brand.mjs j7 vibrant
//   node scripts/brand.mjs j7 mono
//   node scripts/brand.mjs j7 red
//
// WHY THIS EXISTS. A skin file is a default; `tenants.brand` is what actually
// renders, because engine/theme.js writes it inline on <html> and inline beats
// every stylesheet. So a gym whose brand row still holds red will look red no
// matter which skin file the page links, and the skin swap appears broken.
//
// `--grain` is deliberately absent from every preset here: its value is a
// `url(data:…)`, which engine/theme.js rejects on purpose so a database row can
// never make the browser fetch something. Grain therefore comes from the skin
// file only, and a gym on the mono look wants skins/mono.css linked as well.

import { runSql } from './sql.mjs';

const PRESETS = {
  // The default. Mirrors skins/vibrant.css — keep the two in step, or a gym
  // whose row says one thing and whose stylesheet says another will look
  // correct until someone clears the brand row and it silently changes.
  vibrant: {
    bg: '#08090b',
    surface: '#16171a',
    'surface-2': '#1e2024',
    border: '#33363d',
    brand: '#ff2738',
    'brand-hover': '#ff5340',
    'brand-glow': '#ff4d4d',
    'brand-text': '#ffffff',
    text: '#ffffff',
    'text-muted': '#a9adb8',
    danger: '#ff6b6b',
    radius: '8px',
    'radius-lg': '16px',
    'font-display': '"Playfair Display", ui-serif, Georgia, serif',
    'font-body': '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif',
    'surface-fill':
      'linear-gradient(158deg, rgba(255,255,255,0.07) 0%, rgba(255,39,56,0.045) 46%, rgba(255,255,255,0.014) 100%)',
    rim: 'inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(255,39,56,0.06)',
    shadow: '0 22px 48px -26px rgba(0,0,0,0.95)',
    glow: '0 0 42px rgba(255,45,63,0.26)',
    field:
      'radial-gradient(90% 60% at 8% -6%, rgba(255,39,56,0.16) 0%, transparent 58%), radial-gradient(80% 55% at 100% 12%, rgba(40,120,220,0.10) 0%, transparent 55%), radial-gradient(120% 90% at 50% 108%, rgba(255,77,77,0.08) 0%, transparent 60%)',
    'grain-opacity': '0.03',
    'img-filter': 'saturate(1.12) contrast(1.05) brightness(0.97)',
    'img-filter-hover': 'saturate(1.28) contrast(1.10) brightness(1.02)',
    ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
    'dur-1': '160ms',
    'dur-2': '260ms',
    'dur-3': '640ms',
  },

  mono: {
    bg: '#050505',
    surface: '#101010',
    'surface-2': '#161616',
    border: '#262626',
    brand: '#ffffff',
    'brand-hover': '#e8e8e8',
    'brand-glow': '#ffffff',
    'brand-text': '#050505',
    text: '#f5f5f5',
    'text-muted': '#9e9e9e',
    danger: '#ffffff',
    radius: '10px',
    'radius-lg': '14px',
    'font-display': '"Syne", "Playfair Display", Georgia, serif',
    'font-body': '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif',
    'surface-fill':
      'linear-gradient(160deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.022) 42%, rgba(255,255,255,0.012) 100%)',
    rim: 'inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(255,255,255,0.02)',
    shadow: '0 18px 40px -24px rgba(0,0,0,0.9)',
    glow: '0 0 34px rgba(255,255,255,0.12)',
    field:
      'radial-gradient(120% 80% at 12% -10%, rgba(255,255,255,0.035) 0%, transparent 60%), radial-gradient(90% 60% at 100% 0%, rgba(255,255,255,0.022) 0%, transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.018) 0%, transparent 40%)',
    'grain-opacity': '0.025',
    'img-filter': 'grayscale(1) contrast(1.06) brightness(0.94)',
    'img-filter-hover': 'grayscale(1) contrast(1.12) brightness(1)',
    ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
    'dur-1': '180ms',
    'dur-2': '260ms',
    'dur-3': '700ms',
  },

  // The look verified against the live index.html on 2026-08-23. Kept so the
  // red site is one command away, not a rewrite.
  red: {
    bg: '#0a0d0e',
    surface: '#1b1b19',
    'surface-2': '#1a2123',
    border: '#2c2f31',
    brand: '#ff2738',
    'brand-hover': '#b21212',
    'brand-glow': '#ff4d4d',
    'brand-text': '#ffffff',
    text: '#ffffff',
    'text-muted': '#b8b8b8',
    danger: '#ff6b6b',
    radius: '4px',
    'radius-lg': '6px',
    'font-display': '"Playfair Display", ui-serif, Georgia, serif',
    'font-body': '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif',
    'surface-fill': 'linear-gradient(180deg, #1f1f1d 0%, #171817 100%)',
    rim: 'inset 0 1px 0 rgba(255,255,255,0.06)',
    shadow: '0 14px 34px -22px rgba(0,0,0,0.95)',
    glow: '0 0 26px rgba(255,39,56,0.22)',
    field: 'radial-gradient(120% 80% at 50% -20%, rgba(255,39,56,0.07) 0%, transparent 58%)',
    'grain-opacity': '0.03',
    'img-filter': 'contrast(1.08) sepia(0.08)',
    'img-filter-hover': 'contrast(1.15) sepia(0.04)',
    ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
    'dur-1': '150ms',
    'dur-2': '240ms',
    'dur-3': '560ms',
  },
};

const [slug, preset] = process.argv.slice(2);
if (!slug || !PRESETS[preset]) {
  console.error(`usage: brand.mjs <tenant-slug> <${Object.keys(PRESETS).join('|')}>`);
  process.exit(1);
}

// Verified against the engine's own contract rather than assumed: a token the
// engine ignores would sit in the row looking applied and never render.
const { TOKENS, isSafeValue } = await import('../engine/theme.js');
const rejected = Object.entries(PRESETS[preset]).filter(
  ([k, v]) => !TOKENS.includes(k) || !isSafeValue(v)
);
if (rejected.length) {
  console.error('these would be silently dropped by engine/theme.js:');
  for (const [k] of rejected) console.error(`  --${k}`);
  process.exit(1);
}

const json = JSON.stringify(PRESETS[preset]).replace(/'/g, "''");
const safeSlug = String(slug).replace(/'/g, "''");
const rows = await runSql(
  `update public.tenants set brand = '${json}'::jsonb where slug = '${safeSlug}' returning slug;`
);

if (!rows.length) {
  console.error(`no gym with slug "${slug}"`);
  process.exit(1);
}
console.log(`${slug} -> ${preset} (${Object.keys(PRESETS[preset]).length} tokens)`);
