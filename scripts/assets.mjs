#!/usr/bin/env node
// Catalog imagery pipeline.
//
//   node scripts/assets.mjs search            propose a pick per slot -> assets/sources.json
//   node scripts/assets.mjs fetch [slot...]   download + grade exactly what sources.json names
//   node scripts/assets.mjs sheet             contact sheet of everything fetched, for eyeballing
//   node scripts/assets.mjs bump <slot> <n>   take the nth candidate instead, then refetch
//
// WHY TWO PHASES. A one-shot "search and keep whatever came back first" script
// produces a catalog of near-misses that nobody notices until a client does.
// `sources.json` is the artifact: it is committed, it is hand-correctable, and a
// rebuild from it is repeatable. The search phase is throwaway.
//
// WHY GRADE AT ALL. The free image pool is Flickr-tier and wildly inconsistent —
// different cameras, white balances and decades in one grid. One contrast and
// saturation curve across every frame makes a mixed-provenance set read as one
// art-directed set.
//
// Masters stay COLOUR. An earlier pass baked greyscale in, which made the
// monochrome skin look right and every other skin look broken, and undoing it
// cost a full re-download. Desaturation is a look, and a look belongs in the
// --img-filter token where a skin can change its mind for free. --mono is there
// for a client who will never want colour.
//
// PROVIDERS. Openverse first (large pool, licence metadata, aggregates Flickr
// and others), Wikimedia Commons second (higher resolution, thinner pool).
// Neither needs an API key, and both return the licence in the same response —
// which is what makes attribution automatic rather than a TODO.

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(ROOT, 'assets', 'catalog');
const SOURCES = join(ROOT, 'assets', 'sources.json');
const UA = 'j7-commerce-engine/1.0 (catalog asset fetch)';

/** Card art is 4:3, hero art is 16:9. */
const SHAPES = {
  card: { w: 1000, h: 750 },
  hero: { w: 1800, h: 1013 },
  // 1200, not 1400: a banner at 1400 could not be squeezed under the 200 KB
  // page budget without visible artefacts, and a smaller crop is the honest fix.
  wide: { w: 1200, h: 600 },
};

/**
 * Licences we will actually ship. `nc` bars commercial use and `nd` bars the
 * crop and the greyscale grade — both are disqualifying here, and finding that
 * out after a client is live is not the moment to find it out.
 */
const OK_LICENCE = new Set(['cc0', 'pdm', 'by', 'by-sa']);

/** slot -> [search terms, shape]. Terms are tried in order until one lands. */
const SLOTS = {
  'membership-1-month': [['dumbbell rack', 'dumbbells gym', 'dumbbell'], 'card'],
  'membership-3-months': [['barbell squat', 'squat rack', 'barbell'], 'card'],
  'membership-6-months': [['gym interior', 'fitness centre', 'weight room'], 'card'],
  'membership-1-year': [['weight plates', 'barbell plates', 'powerlifting'], 'card'],
  'pt-1-month': [['personal trainer', 'fitness coach', 'gym trainer'], 'card'],
  'pt-3-months': [['weight training coach', 'strength training', 'gym workout'], 'card'],
  'whey-protein': [['protein powder', 'whey protein', 'protein shake'], 'card'],
  creatine: [['creatine', 'supplement powder', 'nutrition supplement'], 'card'],
  oats: [['rolled oats', 'oatmeal bowl', 'oats'], 'card'],
  'peanut-butter': [['peanut butter jar', 'peanut butter'], 'card'],
  multivitamin: [['vitamin tablets', 'supplement pills', 'vitamins'], 'card'],
  shaker: [['shaker bottle', 'water bottle sport', 'sports bottle'], 'card'],
  tee: [['black t-shirt', 'plain t-shirt', 't-shirt'], 'card'],
  'gym-bag': [['duffel bag', 'gym bag', 'sports bag'], 'card'],
  straps: [['lifting straps', 'wrist wraps', 'weightlifting gloves'], 'card'],
  'day-pass': [['treadmill', 'cardio machines', 'running machine'], 'card'],
  workshop: [['group fitness class', 'fitness class', 'group workout'], 'card'],
  hero: [['gym weights dark', 'weight room', 'gym interior'], 'hero'],
  'gym-floor': [['gym equipment', 'fitness equipment', 'weight room'], 'wide'],
  trainer: [['bench press spotter', 'gym coaching', 'strength coach'], 'wide'],
};

// ------------------------------------------------------------------ helpers

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Public APIs rate-limit. Back off and retry rather than dying half-way. */
async function get(url, tries = 6) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) return res;
    if (res.status !== 429 && res.status < 500) throw new Error(`HTTP ${res.status}`);
    // upload.wikimedia.org throttles a burst hard and stays throttled for tens
    // of seconds. Linear backoff runs out of patience before it lifts; this
    // doubles, and the last wait is ~30s, which is what actually clears it.
    await sleep(1000 * 2 ** i);
  }
  throw new Error('rate limited');
}

function strip(html) {
  return String(html ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

// ---------------------------------------------------------------- providers

async function openverse(term) {
  const url =
    'https://api.openverse.org/v1/images/?' +
    new URLSearchParams({ q: term, page_size: '20', license: [...OK_LICENCE].join(',') });

  const body = await (await get(url)).json();
  return (body.results ?? [])
    .filter((r) => r.url && (r.width ?? 0) >= 640 && (r.height ?? 0) >= 480)
    .map((r) => ({
      provider: 'openverse',
      title: r.title ?? r.id,
      src: r.url,
      page: r.foreign_landing_url ?? r.url,
      author: r.creator ?? '',
      licence: `CC ${String(r.license).toUpperCase()} ${r.license_version ?? ''}`.trim(),
      width: r.width,
      height: r.height,
    }));
}

async function commons(term) {
  const url =
    'https://commons.wikimedia.org/w/api.php?' +
    new URLSearchParams({
      action: 'query',
      format: 'json',
      generator: 'search',
      gsrsearch: `filetype:bitmap ${term}`,
      gsrnamespace: '6',
      gsrlimit: '12',
      prop: 'imageinfo',
      iiprop: 'url|size|extmetadata',
      iiurlwidth: '1800',
    });

  const body = await (await get(url)).json();
  return Object.values(body?.query?.pages ?? {})
    .map((page) => {
      const info = page.imageinfo?.[0];
      if (!info || info.width < 640) return null;
      const meta = info.extmetadata ?? {};
      return {
        provider: 'commons',
        title: page.title.replace('File:', ''),
        // thumburl is capped at iiurlwidth; `url` is the original, which for a
        // 6000px phone photo is a 12 MB download to make a 1000px card.
        src: info.thumburl || info.url,
        page: info.descriptionurl,
        author: strip(meta.Artist?.value),
        licence: strip(meta.LicenseShortName?.value),
        width: info.width,
        height: info.height,
      };
    })
    .filter(Boolean);
}

/** Every candidate for a slot, best first, across both providers. */
async function candidates(slot, override) {
  const [defaultTerms, shape] = SLOTS[slot];
  const terms = override?.length ? override : defaultTerms;
  const found = [];

  for (const term of terms) {
    for (const provider of [openverse, commons]) {
      try {
        found.push(...(await provider(term)));
      } catch {
        /* one dead provider must not empty the slot */
      }
      await sleep(350);
    }
    if (found.length >= 8) break;
  }

  // Landscape-ish first: cropping a 3:4 portrait into a 4:3 card throws away
  // half the subject no matter how clever the crop is.
  const seen = new Set();
  return found
    .filter((c) => (seen.has(c.src) ? false : seen.add(c.src)))
    .sort((a, b) => score(b, shape) - score(a, shape))
    .map((c) => ({ ...c, shape }));
}

function score(c, shapeName) {
  const want = SHAPES[shapeName].w / SHAPES[shapeName].h;
  const got = c.width / c.height;
  const aspectPenalty = Math.abs(Math.log(got / want)) * 2200;
  return Math.min(c.width, 2000) - aspectPenalty;
}

// -------------------------------------------------------------- downloading

/**
 * The grade. One curve for every image in the catalog.
 *
 * Masters are COLOUR. That is deliberate and it was not always so: an earlier
 * pass baked greyscale into the files, which made the monochrome skin look
 * right and every other skin look broken, and the only way back was a full
 * re-download. Desaturation is a look, and a look belongs in a token —
 * `--img-filter` — where a skin can change its mind for free.
 *
 * linear   — lift contrast, so a flat phone photo does not read as fog
 * modulate — a little saturation, because free stock is usually undercooked
 * gamma    — pull the midtones down a touch for weight
 * sharpen  — a downscale to 1000px always softens; this puts the edge back
 *
 * Pass --mono to bake greyscale in anyway, for a client who will never want
 * colour and would rather not ship the filter.
 */
const MONO = process.argv.includes('--mono');

async function grade(sharp, input, shape) {
  const img = sharp(input).resize(shape.w, shape.h, { fit: 'cover', position: 'attention' });
  if (MONO) return img.greyscale().linear(1.14, -16).gamma(1.08).sharpen({ sigma: 0.7 });
  return img
    .linear(1.08, -8)
    .modulate({ saturation: 1.18 })
    .gamma(1.04)
    .sharpen({ sigma: 0.7 });
}

async function fetchOne(slot, pick) {
  const shape = SHAPES[pick.shape ?? 'card'];
  const input = Buffer.from(await (await get(pick.src)).arrayBuffer());
  const { default: sharp } = await import('sharp');

  await mkdir(OUT, { recursive: true });
  const full = await grade(sharp, input, shape);

  const bytes = await writeUnderBudget(full, join(OUT, `${slot}.webp`));
  await full
    .clone()
    .resize(Math.round(shape.w / 2.5), Math.round(shape.h / 2.5))
    .webp({ quality: 70 })
    .toFile(join(OUT, `${slot}-thumb.webp`));

  return {
    slot,
    file: `assets/catalog/${slot}.webp`,
    thumb: `assets/catalog/${slot}-thumb.webp`,
    bytes,
    width: shape.w,
    height: shape.h,
    title: pick.title,
    author: pick.author,
    licence: pick.licence,
    page: pick.page,
  };
}

/**
 * Encode down until the file fits the page budget.
 *
 * `npm test` fails any image over 200 KB, and a fixed quality does not respect
 * a budget — a busy gym interior at q82 lands at 350 KB while a plain product
 * shot lands at 40 KB. Stepping quality down until it fits is what makes the
 * budget hold for images nobody has looked at yet.
 *
 * Below q52 the artefacts start showing, so it stops there and writes the file
 * anyway rather than silently shipping something ugly — the test then fails,
 * which is the correct outcome: that image needs a smaller crop, not more
 * compression.
 */
async function writeUnderBudget(pipeline, path, budget = 200 * 1024) {
  let bytes = 0;
  for (const quality of [82, 74, 66, 58, 52]) {
    const buf = await pipeline.clone().webp({ quality, effort: 5 }).toBuffer();
    bytes = buf.byteLength;
    if (bytes <= budget || quality === 52) {
      await writeFile(path, buf);
      return bytes;
    }
  }
  return bytes;
}

async function writeManifest(manifest) {
  await writeFile(
    join(ROOT, 'assets', 'library.json'),
    JSON.stringify({ generated: new Date().toISOString().slice(0, 10), images: manifest }, null, 2)
  );

  await writeFile(
    join(ROOT, 'assets', 'CREDITS.md'),
    [
      '# Image credits',
      '',
      'Everything in `assets/catalog/` is reused under the licence named beside it,',
      'cropped and graded to black and white. Regenerate with `npm run assets:fetch`.',
      '',
      '| slot | source | author | licence |',
      '| --- | --- | --- | --- |',
      ...manifest.map((m) => `| ${m.slot} | [${m.title}](${m.page}) | ${m.author || '—'} | ${m.licence || '—'} |`),
      '',
    ].join('\n')
  );
}

const readSources = () => readFile(SOURCES, 'utf8').then(JSON.parse).catch(() => ({}));

const saveSources = async (sources) => {
  await mkdir(join(ROOT, 'assets'), { recursive: true });
  await writeFile(SOURCES, JSON.stringify(sources, null, 2));
};

// --------------------------------------------------------------------- main

const mode = process.argv[2] ?? 'search';
// --mono is a grade flag, not a slot name; leaving it in would make fetch
// look for an image called '--mono'.
const args = process.argv.slice(3).filter((a) => !a.startsWith('--'));

if (mode === 'search') {
  const sources = await readSources();
  const slots = args.length ? args : Object.keys(SLOTS);

  for (const slot of slots) {
    const list = await candidates(slot);
    if (!list.length) {
      console.error(`none  ${slot}`);
      continue;
    }
    // Keep the alternates. `bump` needs them, and re-searching for one bad
    // crop means re-searching everything.
    sources[slot] = { ...list[0], alternates: list.slice(1, 6) };
    console.log(`pick  ${slot.padEnd(22)} ${list[0].licence.padEnd(14)} ${list[0].title.slice(0, 46)}`);
  }

  await saveSources(sources);
  console.log(`\n${Object.keys(sources).length} slots -> assets/sources.json`);
} else if (mode === 'bump') {
  const [slot, nRaw] = args;
  const n = Number(nRaw ?? 1);
  const sources = await readSources();
  const cur = sources[slot];
  if (!cur?.alternates?.length) throw new Error(`no alternates stored for "${slot}" — run search first`);

  const next = cur.alternates[n - 1];
  if (!next) throw new Error(`only ${cur.alternates.length} alternates for "${slot}"`);

  const rest = cur.alternates.filter((_, i) => i !== n - 1);
  sources[slot] = { ...next, shape: cur.shape, alternates: [{ ...cur, alternates: undefined }, ...rest] };
  await saveSources(sources);
  console.log(`${slot} -> ${next.title}`);

  const entry = await fetchOne(slot, sources[slot]);
  const lib = JSON.parse(await readFile(join(ROOT, 'assets', 'library.json'), 'utf8'));
  await writeManifest(lib.images.map((m) => (m.slot === slot ? entry : m)));
  console.log('refetched');
} else if (mode === 'fetch') {
  const sources = await readSources();
  const slots = args.length ? args : Object.keys(sources);
  const existing = await readFile(join(ROOT, 'assets', 'library.json'), 'utf8')
    .then((t) => JSON.parse(t).images)
    .catch(() => []);

  const byslot = new Map(existing.map((m) => [m.slot, m]));

  for (const slot of slots) {
    const pick = sources[slot];
    if (!pick) {
      console.error(`skip  ${slot}: not in sources.json`);
      continue;
    }
    try {
      byslot.set(slot, await fetchOne(slot, pick));
      console.log(`ok    ${slot.padEnd(22)} ${pick.licence}`);
    } catch (err) {
      console.error(`FAIL  ${slot.padEnd(22)} ${err.message}`);
    }
  }

  // Written last, so a half-finished run never leaves the media library
  // pointing at files that were never written.
  await writeManifest(Object.keys(SLOTS).map((s) => byslot.get(s)).filter(Boolean));
  console.log(`\n${byslot.size} images -> assets/catalog/`);
} else if (mode === 'sheet') {
  const { default: sharp } = await import('sharp');
  const lib = JSON.parse(await readFile(join(ROOT, 'assets', 'library.json'), 'utf8'));
  const cols = 5;
  const cw = 320;
  const ch = 240;
  const rows = Math.ceil(lib.images.length / cols);

  const tiles = await Promise.all(
    lib.images.map(async (m, i) => ({
      input: await sharp(join(ROOT, m.file)).resize(cw, ch, { fit: 'cover' }).png().toBuffer(),
      left: (i % cols) * cw,
      top: Math.floor(i / cols) * ch,
    }))
  );

  const path = join(ROOT, 'assets', 'contact-sheet.png');
  await sharp({ create: { width: cols * cw, height: rows * ch, channels: 3, background: '#000' } })
    .composite(tiles)
    .png()
    .toFile(path);

  console.log(lib.images.map((m, i) => `${i + 1}. ${m.slot}`).join('\n'));
  console.log(`\n-> ${path}`);
} else if (mode === 'term') {
  // Re-search one slot with different words. Search rank is not taste: "personal
  // trainer" returned a carnival parade, and no amount of re-ranking fixes a
  // query that was pointing at the wrong thing.
  const [slot, ...terms] = args;
  if (!SLOTS[slot]) throw new Error(`unknown slot "${slot}"`);

  const list = await candidates(slot, terms);
  if (!list.length) throw new Error(`nothing found for "${terms.join(' | ')}"`);

  const sources = await readSources();
  sources[slot] = { ...list[0], alternates: list.slice(1, 6) };
  await saveSources(sources);
  console.log(`${slot} -> ${list[0].title}  (${list.length} candidates)`);
} else if (mode === 'alts') {
  // A contact sheet of the options for a slot, so the pick is made by looking
  // rather than by trusting a search engine's idea of relevance.
  const { default: sharp } = await import('sharp');
  const sources = await readSources();
  const slots = args.length ? args : Object.keys(sources);
  const cw = 300;
  const ch = 225;
  const cols = 6;

  const rows = [];
  for (const slot of slots) {
    const entry = sources[slot];
    if (entry) rows.push([slot, [entry, ...(entry.alternates ?? [])].slice(0, cols)]);
  }

  const tiles = [];
  for (const [r, [slot, picks]] of rows.entries()) {
    for (const [c, pick] of picks.entries()) {
      try {
        const buf = Buffer.from(await (await get(pick.src)).arrayBuffer());
        tiles.push({
          input: await sharp(buf).resize(cw, ch, { fit: 'cover' }).png().toBuffer(),
          left: c * cw,
          top: r * ch,
        });
      } catch {
        /* a dead thumbnail leaves a black cell, which reads as "not an option" */
      }
      await sleep(120);
    }
    console.log(`row ${String(r).padStart(2)}  ${slot}`);
  }

  const path = join(ROOT, 'assets', 'alts-sheet.png');
  await sharp({ create: { width: cols * cw, height: rows.length * ch, channels: 3, background: '#000' } })
    .composite(tiles)
    .png()
    .toFile(path);
  console.log(`\ncolumn 0 is the current pick; column n means \`bump <slot> n\`\n-> ${path}`);
} else {
  console.error('usage: assets.mjs search|fetch|sheet|alts|bump|term');
  process.exit(1);
}
