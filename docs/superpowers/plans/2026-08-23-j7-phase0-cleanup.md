# J7 Phase 0 — Clean The Ground · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the duplicate site copy and 11 duplicate image files, shrink the two real images to a web budget, correct a stale price claim, and produce `AUDIT-J7.md` — the ranked defect list that briefs the future redesign.

**Architecture:** No application code changes. A single Node test file (`scripts/check-assets.test.mjs`) encodes the asset rules and is written *first*, failing. Each cleanup task moves it closer to green. The test stays in the repo permanently as a regression guard, so the repo cannot silently re-accumulate duplicates.

**Tech Stack:** Node 24 built-in test runner (`node --test`) — no framework install. `sharp` as a dev dependency for image compression. No build step, matching the repo's stack rule.

**Spec:** `docs/superpowers/specs/2026-08-23-j7-commerce-engine-design.md` (§16 Phase 0, §18 Risks)

## Global Constraints

- Stack is vanilla HTML + CSS + JS. **No build step. No React. No Tailwind config.**
- No file under `engine/` contains a hex colour, `rgb()`, or a font name. *(Not exercised in Phase 0 — `engine/` does not exist yet — but the check script is written to survive into Phase 1.)*
- Images committed to the repo must be **≤ 200 KB each**.
- No secrets in any file or commit, ever.
- Every commit message uses Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`).
- Do not restyle or rewrite the existing skin. Record taste problems in `AUDIT-J7.md`; fix only defects.

## Verified Starting Facts

Established by measurement on 2026-08-23, not assumption:

| Fact | Value |
|---|---|
| Image files on disk | 14 |
| Unique images (by md5) | 3 |
| Images referenced by `index.html` | 2 — `john.jpeg`, `logo-new.png` |
| Total image bytes | ~6.4 MB |
| Useful image bytes | ~1.17 MB |
| References to `J7 Fitness/` anywhere | **0** |
| `index.html` vs `J7 Fitness/index.html` | genuinely differ (2541 vs 2497 lines) |

md5 groups:

- `139a01e9d3a20dfc324061506c3f288f` (1,124,294 B) — `logo.png`, `logo-new.png`, `WhatsApp Image 2026-03-06 at 8.47.png`, plus 2 copies inside `J7 Fitness/`
- `67057c64d701174e355c8b62febfd70e` (100,812 B) — `coach.jpg`, `john.jpeg`, `WhatsApp Image 2026-03-11 at 11.46.26 AM.jpeg`, plus 2 copies inside `J7 Fitness/`
- `fb6033fd626a9c5241f4920c079b40cc` (151,998 B) — `poster.jpg`, `WhatsApp Image 2026-03-11 at 10.32.18 AM.jpeg`, plus 2 copies inside `J7 Fitness/` — **referenced by nothing**

---

## File Structure

| Path | Responsibility | Action |
|---|---|---|
| `scripts/check-assets.test.mjs` | Asserts every referenced asset exists, every image is referenced, no duplicate hashes, every image ≤ 200 KB | Create |
| `package.json` | Add `test` script and the `sharp` dev dependency | Modify |
| `J7 Fitness/` | Orphaned older snapshot of the whole site | Delete |
| `logo.png`, `poster.jpg`, `coach.jpg`, 3 WhatsApp files | Duplicate or unreferenced images | Delete |
| `logo-new.png`, `john.jpeg` | The two live images | Compress in place |
| `gym-design-system-complete.json` | Design spec; `project.price_range` is stale and below the current price floor | Modify |
| `AUDIT-J7.md` | Ranked defect + slop findings; the brief for the future redesign | Create |

---

### Task 1: Encode the asset rules as a failing test

**Files:**
- Create: `scripts/check-assets.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: nothing
- Produces: `npm test` runs `node --test "scripts/**/*.test.mjs"`. Later tasks and all of Phase 1 rely on this command existing and passing.

- [ ] **Step 1: Write the failing test**

Create `scripts/check-assets.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MAX_IMAGE_BYTES = 200 * 1024;
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);
const SKIP_DIRS = new Set(['.git', 'node_modules', 'docs']);

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

const allFiles = walk(ROOT);

const imageFiles = allFiles.filter((f) =>
  IMAGE_EXT.has(extname(f).toLowerCase())
);

const htmlFiles = allFiles.filter((f) => extname(f).toLowerCase() === '.html');

// Collect every asset path referenced from any HTML file:
// src="x.png", href="x.jpg", url(x.webp), and srcset entries.
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

test('every image on disk is referenced by some HTML file', () => {
  const orphans = imageFiles
    .map((f) => relative(ROOT, f).split('\\').join('/'))
    .filter((rel) => !refs.has(rel));
  assert.deepEqual(orphans, [], `unreferenced images: ${orphans.join(', ')}`);
});

test('no two images have identical content', () => {
  const byHash = new Map();
  for (const file of imageFiles) {
    const hash = createHash('md5').update(readFileSync(file)).digest('hex');
    const rel = relative(ROOT, file).split('\\').join('/');
    if (!byHash.has(hash)) byHash.set(hash, []);
    byHash.get(hash).push(rel);
  }
  const dupes = [...byHash.values()].filter((group) => group.length > 1);
  assert.deepEqual(dupes, [], `duplicate images: ${JSON.stringify(dupes)}`);
});

test('every image is at most 200 KB', () => {
  const oversized = imageFiles
    .map((f) => ({
      file: relative(ROOT, f).split('\\').join('/'),
      bytes: statSync(f).size,
    }))
    .filter((x) => x.bytes > MAX_IMAGE_BYTES);
  assert.deepEqual(oversized, [], `oversized: ${JSON.stringify(oversized)}`);
});
```

- [ ] **Step 2: Add the test script to package.json**

Replace the contents of `package.json` with:

```json
{
  "name": "j7-commerce-engine",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test \"scripts/**/*.test.mjs\"",
    "serve": "node serve.mjs"
  },
  "devDependencies": {
    "puppeteer": "^24.37.5"
  }
}
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test`

Expected: **FAIL**. Four failures, specifically:
- `every image on disk is referenced` — lists ~12 orphans including the whole `J7 Fitness/` folder
- `no two images have identical content` — lists three duplicate groups
- `every image is at most 200 KB` — lists the five 1.12 MB copies

`every referenced image exists on disk` should already **pass**.

- [ ] **Step 4: Commit the failing test**

```bash
git add scripts/check-assets.test.mjs package.json
git commit -m "test: add asset integrity and size budget checks"
```

---

### Task 2: Delete the orphaned site copy

**Files:**
- Delete: `J7 Fitness/` (entire directory, 7 files)

**Interfaces:**
- Consumes: `npm test` from Task 1
- Produces: a repo with exactly one `index.html`

- [ ] **Step 1: Prove the folder is orphaned and holds nothing unique**

```bash
grep -rn "J7 Fitness" --include="*.html" --include="*.mjs" --include="*.json" --include="*.css" . | grep -v "^./docs/"
```

Expected: no output. Anything printed means something depends on it — stop and report instead of deleting.

- [ ] **Step 2: Confirm the root file is the newer of the two**

```bash
git log --oneline -1 -- index.html
git log --oneline -1 -- "J7 Fitness/index.html"
```

Expected: root `index.html` has the later commit. If the subfolder is newer, stop and report — the wrong file may be deploying.

- [ ] **Step 3: Delete the folder**

```bash
git rm -r "J7 Fitness"
```

- [ ] **Step 4: Run the tests**

Run: `npm test`

Expected: still FAIL, but the orphan and duplicate lists are now much shorter — no `J7 Fitness/` entries remain.

- [ ] **Step 5: Commit**

```bash
git commit -m "chore: remove orphaned duplicate site copy"
```

---

### Task 3: Delete duplicate and unreferenced images

**Files:**
- Delete: `logo.png`, `coach.jpg`, `poster.jpg`, `WhatsApp Image 2026-03-06 at 8.47.png`, `WhatsApp Image 2026-03-11 at 10.32.18 AM.jpeg`, `WhatsApp Image 2026-03-11 at 11.46.26 AM.jpeg`
- Keep: `logo-new.png`, `john.jpeg`

**Interfaces:**
- Consumes: `npm test` from Task 1
- Produces: exactly two image files in the repo, both referenced

- [ ] **Step 1: Confirm which images the site actually uses**

```bash
grep -oE '(src|href)="[^"]+\.(png|jpe?g|webp)"' index.html | sort -u
```

Expected exactly: `src="john.jpeg"` and `src="logo-new.png"`.

- [ ] **Step 2: Delete the six unused files**

```bash
git rm "logo.png" "coach.jpg" "poster.jpg" \
  "WhatsApp Image 2026-03-06 at 8.47.png" \
  "WhatsApp Image 2026-03-11 at 10.32.18 AM.jpeg" \
  "WhatsApp Image 2026-03-11 at 11.46.26 AM.jpeg"
```

- [ ] **Step 3: Run the tests**

Run: `npm test`

Expected: `every image on disk is referenced` now **PASSES**. `no two images have identical content` now **PASSES**. `every image is at most 200 KB` still **FAILS** on `logo-new.png` (1,124,294 B).

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: remove duplicate and unreferenced images"
```

---

### Task 4: Compress the two surviving images

**Files:**
- Modify: `logo-new.png` (1,124,294 B → target ≤ 200 KB)
- Modify: `john.jpeg` (100,812 B → already under budget; re-encode only if it stays visually identical)
- Modify: `package.json` (add `sharp` dev dependency)
- Create: `scripts/compress-images.mjs`

**Interfaces:**
- Consumes: `npm test` from Task 1
- Produces: all four asset tests green

- [ ] **Step 1: Install sharp as a dev dependency**

```bash
npm install --save-dev sharp
```

- [ ] **Step 2: Check the rendered size before resizing**

```bash
grep -n -B3 -A3 'logo-new.png' index.html
```

Read the surrounding CSS/attributes to find the largest size the logo is ever displayed at. Resize to **twice** that width (for retina screens), never smaller. Record the number found — it is the `TARGET_WIDTH` used in the next step.

- [ ] **Step 3: Write the compression script**

Create `scripts/compress-images.mjs`. Replace `TARGET_WIDTH` with the number found in Step 2:

```js
import sharp from 'sharp';
import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TARGET_WIDTH = 600; // <-- replace with 2x the largest rendered width

const logo = join(ROOT, 'logo-new.png');
const before = statSync(logo).size;

await sharp(logo)
  .resize({ width: TARGET_WIDTH, withoutEnlargement: true })
  .png({ compressionLevel: 9, palette: true, quality: 90 })
  .toFile(logo + '.tmp');

const after = statSync(logo + '.tmp').size;
console.log(`logo-new.png: ${before} -> ${after} bytes`);
```

- [ ] **Step 4: Run it and inspect the result before overwriting**

```bash
node scripts/compress-images.mjs
```

Expected: printed `after` size is under 204800. Open `logo-new.png.tmp` and confirm the logo is still sharp and its transparency is intact. **If it looks degraded, raise `TARGET_WIDTH` and re-run — do not ship a blurry logo to hit a number.**

- [ ] **Step 5: Replace the original**

```bash
mv logo-new.png.tmp logo-new.png
```

- [ ] **Step 6: Run the tests**

Run: `npm test`

Expected: **all four tests PASS.**

- [ ] **Step 7: Visually verify the live page**

```bash
node serve.mjs &
node screenshot.mjs http://localhost:3000 phase0-after
```

Open the screenshot. The logo and the coach photo must both render, at the same visual quality as before.

- [ ] **Step 8: Commit**

```bash
git add logo-new.png package.json package-lock.json scripts/compress-images.mjs
git commit -m "perf: compress logo from 1.1MB to under 200KB"
```

---

### Task 5: Correct the stale price claim

**Files:**
- Modify: `gym-design-system-complete.json` — `project.price_range`
- Modify: `scripts/check-assets.test.mjs` — add one test

**Interfaces:**
- Consumes: `npm test`
- Produces: a design spec that no longer advertises a price below the current floor

- [ ] **Step 1: Find the stale value**

```bash
grep -n "price_range" gym-design-system-complete.json
```

Expected: `"price_range": "₹8,000 - ₹10,000 per sale"`.

- [ ] **Step 2: Write the failing test**

Append to `scripts/check-assets.test.mjs`:

```js
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
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npm test`

Expected: FAIL — `stale sub-floor price found in price_range: "₹8,000 - ₹10,000 per sale"`.

- [ ] **Step 4: Correct the value**

Change `project.price_range` to:

```json
"price_range": "₹14,999 - ₹49,999 setup, plus monthly. See pitch/ for the current ladder."
```

- [ ] **Step 5: Verify the JSON still parses and the test passes**

```bash
node -e "JSON.parse(require('fs').readFileSync('gym-design-system-complete.json','utf8')); console.log('valid json')"
npm test
```

Expected: `valid json`, then all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add gym-design-system-complete.json scripts/check-assets.test.mjs
git commit -m "fix: correct stale sub-floor price claim in design system"
```

---

### Task 6: Write AUDIT-J7.md

**Files:**
- Create: `AUDIT-J7.md`

**Interfaces:**
- Consumes: nothing
- Produces: the ranked defect list that briefs the future redesign. Referenced by `CLAUDE.md` §5 and the spec §16.

This task produces a document, not code, so it has no test cycle. Its deliverable is judged by the rule below.

- [ ] **Step 1: Audit `index.html` against a fixed checklist**

Read `index.html` in full and record findings in these six categories:

1. **Factual defects** — claims the site makes that cannot be substantiated: invented member counts, fabricated testimonials with stock photos, awards, "certified" claims, years-in-business figures
2. **Broken or missing states** — clickable elements without hover, `focus-visible`, or active styling; forms with no validation; links going nowhere
3. **Accessibility** — images without `alt`, heading levels skipping, colour contrast below 4.5:1 for body text, no keyboard path through the page
4. **Performance** — render-blocking CDN scripts, Three.js payload, unthrottled scroll handlers, layout thrash
5. **AI-slop patterns** — check specifically against the banned list: floating glass-pill nav with backdrop-blur, mesh-gradient blob backgrounds, bento grids, four-step "how it works" card rows, counter animations on stats, marquee bands of feature names, sticky-scroll phone mockups, generic stat strips
6. **Copy** — sentences that could appear on any gym's website, superlatives with nothing behind them, calls to action that do not name the next step

- [ ] **Step 2: Write the document**

Create `AUDIT-J7.md` with this exact structure:

```markdown
# AUDIT-J7 — Defect and Slop Findings

Audited: 2026-08-23 · File: index.html (2541 lines) · Auditor: Claude

## How to read this
Severity 1 = ships a lie or breaks for a real user. Severity 2 = visibly cheap.
Severity 3 = taste. Severity 1 items are fixed now; 2 and 3 brief the redesign.

## Findings

| # | Sev | Category | Line | Finding | What replaces it |
|---|-----|----------|------|---------|------------------|

## What this means for the redesign
[3-5 sentences: the pattern behind the findings, not a restatement of them.]

## What is genuinely good and should survive
[Anything worth keeping. If the answer is nothing, say nothing — but look first.]
```

Fill the table with **every** finding, one row each, each carrying a real line number from `index.html`.

- [ ] **Step 3: Apply the honesty rule**

Every row's "What replaces it" column must name a concrete replacement, not a criticism. `"Fake testimonial from a stock photo"` → `"Remove until a real member gives a quote; leave the section out rather than filling it"`. A row that only complains is not finished.

- [ ] **Step 4: Verify no severity-1 item is left unfixed**

Any severity-1 finding that is a factual lie on a live public page gets fixed in this task, not deferred. List what was fixed at the bottom of the file under `## Fixed during audit`.

- [ ] **Step 5: Commit**

```bash
git add AUDIT-J7.md index.html
git commit -m "docs: add J7 defect and slop audit"
```

---

## Definition of Done — Phase 0

- [ ] `npm test` passes, all five tests green
- [ ] Exactly one `index.html` in the repo
- [ ] Exactly two image files, both referenced, both ≤ 200 KB
- [ ] `gym-design-system-complete.json` parses and advertises no sub-floor price
- [ ] `AUDIT-J7.md` exists with at least one row per category that had findings
- [ ] The page still renders correctly in a screenshot — logo and coach photo both visible
- [ ] Six commits, one per task, Conventional Commits format

**Not done until the screenshot is looked at.** A passing size check on a page whose images silently failed to load is a green test over a broken site.

---

## Notes for the executor

- **Nothing here needs Supabase.** Phase 0 is entirely local and can run before the database exists.
- **Do not restyle anything.** Severity 2 and 3 findings are written down, not fixed. The redesign is a separate project.
- **If a delete step's verification prints unexpected output, stop and report.** Deletions in this plan are safe only because the verification steps proved them safe.
