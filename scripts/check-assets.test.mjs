import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MAX_IMAGE_BYTES = 200 * 1024;
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);
const SKIP_DIRS = new Set([
  '.git',
  'node_modules',
  'docs',
  'supabase',
  'temporary screenshots',
  // Not ours and never shipped: `_scrape` is the design-scraper's output and
  // deliberately keeps a site's own broken references, `legacy` holds dated
  // snapshots of pages we have replaced. Auditing either one tells you about
  // somebody else's HTML, which is noise this test cannot act on.
  '_scrape',
  'legacy',
]);

/** Working artefacts of choosing imagery: looked at once, regenerated on demand. */
const WORKING_FILES = /^assets\/(contact-sheet|alts-sheet)\.png$/;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(join(dir, entry.name), out);
    } else {
      out.push(join(dir, entry.name));
    }
  }
  return out;
}

const rel = (f) => relative(ROOT, f).split('\\').join('/');

const allFiles = walk(ROOT);
const imageFiles = allFiles.filter((f) => IMAGE_EXT.has(extname(f).toLowerCase()));
const htmlFiles = allFiles.filter((f) => extname(f).toLowerCase() === '.html');

// Every local image path referenced from any HTML file:
// src="x.png", href="x.jpg", url(x.webp). Remote and data: URIs are ignored.
function referencedAssets() {
  const refs = new Set();
  const pattern =
    /(?:src|href)\s*=\s*["']([^"']+?\.(?:png|jpe?g|webp|gif))["']|url\(\s*["']?([^"')]+?\.(?:png|jpe?g|webp|gif))["']?\s*\)/gi;
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    let m;
    while ((m = pattern.exec(html)) !== null) {
      const raw = m[1] ?? m[2];
      if (!raw || /^(https?:)?\/\//.test(raw) || raw.startsWith('data:')) continue;
      refs.add(decodeURIComponent(raw.replace(/^\.?\//, '')));
    }
  }
  return refs;
}

const refs = referencedAssets();

test('every referenced image exists on disk', () => {
  const missing = [...refs].filter((r) => !existsSync(join(ROOT, r)));
  assert.deepEqual(missing, [], `referenced but missing: ${missing.join(', ')}`);
});

test('every image on disk is referenced by some HTML file or by the catalog', () => {
  // Catalog imagery is referenced from the DATABASE, not from any HTML file —
  // that is the whole point of the engine, and this test predates it. So the
  // manifest written by `npm run assets:fetch` counts as a reference, and an
  // image in assets/catalog/ that the manifest does not list is still an orphan.
  const manifest = existsSync(join(ROOT, 'assets/library.json'))
    ? JSON.parse(readFileSync(join(ROOT, 'assets/library.json'), 'utf8')).images
    : [];
  const inManifest = new Set(manifest.flatMap((m) => [m.file, m.thumb]));

  const orphans = imageFiles
    .map(rel)
    // Contact sheets are a working artefact of choosing the imagery — looked at
    // once, regenerated on demand. They are not site assets.
    .filter((r) => !/^assets\/(contact-sheet|alts-sheet)\.png$/.test(r))
    .filter((r) => !refs.has(r) && !inManifest.has(r));

  assert.deepEqual(orphans, [], `unreferenced images: ${orphans.join(', ')}`);
});

test('every catalog image the manifest promises is actually on disk', () => {
  if (!existsSync(join(ROOT, 'assets/library.json'))) return;
  const { images } = JSON.parse(readFileSync(join(ROOT, 'assets/library.json'), 'utf8'));
  const missing = images.flatMap((m) => [m.file, m.thumb]).filter((f) => !existsSync(join(ROOT, f)));
  assert.deepEqual(missing, [], `manifest lists files that do not exist: ${missing.join(', ')}`);
});

test('every catalog image carries a licence and a source', () => {
  // An uncredited stock photo on a client's site is a bill waiting to arrive.
  if (!existsSync(join(ROOT, 'assets/library.json'))) return;
  const { images } = JSON.parse(readFileSync(join(ROOT, 'assets/library.json'), 'utf8'));
  const uncredited = images.filter((m) => !m.licence || !m.page).map((m) => m.slot);
  assert.deepEqual(uncredited, [], `no licence or source recorded for: ${uncredited.join(', ')}`);
});

test('no two images have identical content', () => {
  const byHash = new Map();
  for (const file of imageFiles) {
    const hash = createHash('md5').update(readFileSync(file)).digest('hex');
    if (!byHash.has(hash)) byHash.set(hash, []);
    byHash.get(hash).push(rel(file));
  }
  const dupes = [...byHash.values()].filter((group) => group.length > 1);
  assert.deepEqual(dupes, [], `duplicate images: ${JSON.stringify(dupes)}`);
});

test('every image is at most 200 KB', () => {
  const oversized = imageFiles
    .map((f) => ({ file: rel(f), bytes: statSync(f).size }))
    // Contact sheets are twenty photos in one PNG, looked at once during art
    // direction and never served to anyone. A page budget does not apply.
    .filter((x) => !WORKING_FILES.test(x.file))
    .filter((x) => x.bytes > MAX_IMAGE_BYTES);
  assert.deepEqual(oversized, [], `oversized: ${JSON.stringify(oversized)}`);
});

test('design system does not advertise a price below the current floor', () => {
  const json = JSON.parse(
    readFileSync(join(ROOT, 'gym-design-system-complete.json'), 'utf8')
  );
  const range = json.project?.price_range ?? '';
  assert.ok(
    !/[₹]\s?(8|9|10)[,.]?0{3}/.test(range),
    `stale sub-floor price found in price_range: "${range}"`
  );
});
