// Skin presets — a whole look, applied in one click.
//
// WHY THIS FILE IS IN admin/ AND NOT engine/
// It is nothing but colour, and engine/ may not contain colour (CLAUDE.md §1,
// enforced by scripts/design-contract.test.mjs). It is not in skins/ either,
// because a skin is a stylesheet the BROWSER reads as a fallback, while these
// are values written into `tenants.brand` in the DATABASE — row 3 of the
// cascade, the one that beats every stylesheet. Same numbers, different layer.
//
// A preset is therefore not "the skin". It is the skin's values copied into
// the one place that wins, so a gym looks like the design whether or not the
// deploy happens to link that skin file.
//
// Keys are token names without the leading `--`, exactly as engine/theme.js
// expects them, and every value must survive theme.isSafeValue(): no url(),
// no semicolons, 400 characters max. That rules out --grain by construction,
// which is why no preset sets it.

/** Merged under every preset so no token is ever left blank. A gap shows in the
 *  admin panel as an empty box, which reads as broken rather than inherited. */
const SHAPE = {
  ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
  'dur-1': '180ms',
  'dur-2': '320ms',
  'dur-3': '620ms',
};

export const PRESETS = [
  {
    id: 'studio',
    name: 'Studio',
    blurb: 'Light monochrome, editorial. Black ink on paper, large soft radii, product photos forced to greyscale.',
    tokens: {
      ...SHAPE,
      bg: '#fafafa',
      surface: '#ffffff',
      'surface-2': '#f0f0f0',
      border: '#e4e4e4',
      brand: '#0f0f0f',
      'brand-hover': '#2e2e2e',
      'brand-glow': '#0f0f0f',
      'brand-text': '#fafafa',
      text: '#0f0f0f',
      'text-muted': '#6b6b6b',
      danger: '#000000',
      radius: '14px',
      'radius-lg': '24px',
      'font-display': 'Inter Tight, Inter, system-ui, sans-serif',
      'font-body': 'Inter, system-ui, -apple-system, sans-serif',
      'surface-fill': 'linear-gradient(180deg, #ffffff 0%, #f7f7f7 100%)',
      rim: 'inset 0 1px 0 #ffffff, inset 0 0 0 1px rgba(15, 15, 15, 0.04)',
      shadow: '0 18px 44px -28px rgba(15, 15, 15, 0.28), 0 2px 6px -3px rgba(15, 15, 15, 0.06)',
      glow: '0 0 0 4px rgba(15, 15, 15, 0.08)',
      field: 'radial-gradient(120% 75% at 50% -12%, rgba(15, 15, 15, 0.05) 0%, transparent 60%)',
      'grain-opacity': '0',
      'img-filter': 'grayscale(1) contrast(1.04)',
      'img-filter-hover': 'grayscale(1) contrast(1.12)',
      'dur-1': '200ms',
      'dur-2': '340ms',
      'dur-3': '720ms',
    },
  },
  {
    id: 'j7',
    name: 'J7 Red',
    blurb: 'The original. Neon red on near-black, hard edges, warm-graded photos.',
    tokens: {
      ...SHAPE,
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
      'font-display': 'Playfair Display, ui-serif, Georgia, serif',
      'font-body': 'Inter, system-ui, sans-serif',
      'surface-fill': 'linear-gradient(180deg, #1f1f1d 0%, #171817 100%)',
      rim: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
      shadow: '0 14px 34px -22px rgba(0, 0, 0, 0.95)',
      glow: '0 0 26px rgba(255, 39, 56, 0.22)',
      field: 'radial-gradient(120% 80% at 50% -20%, rgba(255, 39, 56, 0.07) 0%, transparent 58%)',
      'grain-opacity': '0',
      'img-filter': 'contrast(1.08) sepia(0.08)',
      'img-filter-hover': 'contrast(1.15) sepia(0.04)',
      'dur-1': '150ms',
      'dur-2': '240ms',
      'dur-3': '560ms',
    },
  },
  {
    id: 'mono',
    name: 'Mono Glass',
    blurb: 'Dark monochrome. White is the accent, cards are glass, the page carries a gradient field.',
    tokens: {
      ...SHAPE,
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
      'font-display': 'Syne, Playfair Display, Georgia, serif',
      'font-body': 'Inter, system-ui, sans-serif',
      'surface-fill':
        'linear-gradient(160deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.022) 42%, rgba(255,255,255,0.012) 100%)',
      rim: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(255, 255, 255, 0.02)',
      shadow: '0 18px 40px -24px rgba(0, 0, 0, 0.9)',
      glow: '0 0 34px rgba(255, 255, 255, 0.12)',
      field: 'radial-gradient(120% 80% at 50% -20%, rgba(255, 255, 255, 0.06) 0%, transparent 60%)',
      'grain-opacity': '0.025',
      'img-filter': 'grayscale(1) contrast(1.06)',
      'img-filter-hover': 'grayscale(1) contrast(1.12)',
    },
  },
  {
    id: 'daylight',
    name: 'Daylight',
    blurb: 'Light paper with a green accent, serif display, warm duotone photos.',
    tokens: {
      ...SHAPE,
      bg: '#f7f6f3',
      surface: '#ffffff',
      'surface-2': '#f1efe9',
      border: '#dcd8cf',
      brand: '#1f6f4a',
      'brand-hover': '#17563a',
      'brand-glow': '#2f9e6b',
      'brand-text': '#ffffff',
      text: '#17181a',
      'text-muted': '#6b6b70',
      danger: '#b4232a',
      radius: '14px',
      'radius-lg': '20px',
      'font-display': 'Iowan Old Style, ui-serif, Georgia, serif',
      'font-body': 'ui-sans-serif, system-ui, sans-serif',
      'surface-fill': 'linear-gradient(180deg, #ffffff 0%, #fbfaf7 100%)',
      rim: 'inset 0 1px 0 #ffffff',
      shadow: '0 12px 28px -18px rgba(23, 24, 26, 0.35)',
      glow: '0 0 0 4px rgba(47, 158, 107, 0.14)',
      field: 'radial-gradient(110% 70% at 8% -10%, rgba(31, 111, 74, 0.05) 0%, transparent 62%)',
      'grain-opacity': '0',
      'img-filter': 'grayscale(0.35) sepia(0.12) contrast(1.02)',
      'img-filter-hover': 'grayscale(0.1) sepia(0.05) contrast(1.05)',
      'dur-1': '160ms',
      'dur-2': '280ms',
      'dur-3': '520ms',
    },
  },
];

export function presetById(id) {
  return PRESETS.find((p) => p.id === id) ?? null;
}
