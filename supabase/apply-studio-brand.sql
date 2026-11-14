-- Switch the J7 tenant to the Studio look.
--
-- WHY THIS FILE EXISTS SEPARATELY FROM seed.sql
-- seed.sql opens with `delete from public.tenants where slug = 'j7'` and
-- rebuilds the tenant and its whole catalog. That is correct for seeding and
-- wrong for a restyle: it would drop live product rows and any edit an operator
-- has made from the admin panel. This file changes one column on one row and
-- touches nothing else.
--
-- YOU PROBABLY DO NOT NEED THIS FILE.
-- The admin panel does the same thing in one click: Settings -> Look -> Studio
-- -> Save. This is the same values for when it is easier to run SQL than to
-- open a browser.
--
-- ORDER OF OPERATIONS — this is the part that bites.
-- `tenants.brand` is written inline onto <html> by engine/theme.js at runtime,
-- so it beats BOTH stylesheets. That means this UPDATE takes effect on the
-- LIVE site the moment it is committed, with no deploy. If the new index.html
-- has not been deployed yet, running this paints Studio tokens onto the OLD
-- red markup — light text on light ground in places, and a site that looks
-- broken rather than restyled.
--
--   Deploy index.html + skins/studio.css FIRST. Run this SECOND.
--
-- Reversible: the "J7 Red" preset in the admin panel puts the old values back,
-- or set brand to '{}'::jsonb to fall through to whichever skin file is linked.

begin;

update public.tenants
set brand = jsonb_build_object(
  -- surfaces: light, and every neutral R=G=B exactly
  'bg',              '#fafafa',
  'surface',         '#ffffff',
  'surface-2',       '#f0f0f0',
  'border',          '#e4e4e4',

  -- brand: on a light ground the accent IS near-black
  'brand',           '#0f0f0f',
  'brand-hover',     '#2e2e2e',
  'brand-glow',      '#0f0f0f',
  'brand-text',      '#fafafa',   -- type sitting ON the brand fill

  -- type. --text-muted is deliberately darker than the reference's own
  -- decorative grey, which fails contrast as body copy on this ground.
  'text',            '#0f0f0f',
  'text-muted',      '#6b6b6b',
  'danger',          '#000000',   -- status as a brightness rank, not a hue

  'radius',          '14px',
  'radius-lg',       '24px',
  'font-display',    'Inter Tight, Inter, system-ui, sans-serif',
  'font-body',       'Inter, system-ui, -apple-system, sans-serif',

  -- material: paper, not glass
  'surface-fill',    'linear-gradient(180deg, #ffffff 0%, #f7f7f7 100%)',
  'rim',             'inset 0 1px 0 #ffffff, inset 0 0 0 1px rgba(15, 15, 15, 0.04)',
  'shadow',          '0 18px 44px -28px rgba(15, 15, 15, 0.28), 0 2px 6px -3px rgba(15, 15, 15, 0.06)',
  'glow',            '0 0 0 4px rgba(15, 15, 15, 0.08)',
  'field',           'radial-gradient(120% 75% at 50% -12%, rgba(15, 15, 15, 0.05) 0%, transparent 60%)',
  'grain-opacity',   '0',

  -- the token that makes the shop actually black and white rather than a
  -- monochrome frame around colour photographs
  'img-filter',      'grayscale(1) contrast(1.04)',
  'img-filter-hover','grayscale(1) contrast(1.12)',

  'ease',            'cubic-bezier(0.16, 1, 0.3, 1)',
  'dur-1',           '200ms',
  'dur-2',           '340ms',
  'dur-3',           '720ms'
)
where slug = 'j7';

-- --grain is absent on purpose: its value is a url(), and engine/theme.js
-- refuses url() from the database so a row can never make a visitor's browser
-- fetch something. It comes from the skin file or not at all.

commit;
