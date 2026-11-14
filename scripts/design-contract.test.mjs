// The design contract, enforced.
//
// The product's entire claim is "swap the look without touching the shop".
// That claim survives exactly as long as no colour, font or hardcoded gym name
// leaks into engine/. A rule nobody checks is a rule that lasts one busy
// afternoon, so it is checked here on every `npm test`.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

// fileURLToPath, not URL.pathname — the repo lives under a folder with a space
// in its name and .pathname hands back "Koushik%20AI%20Automation".
const ENGINE = fileURLToPath(new URL('../engine/', import.meta.url));
const SKINS = fileURLToPath(new URL('../skins/', import.meta.url));

function filesIn(dir) {
  return readdirSync(dir)
    .map((name) => join(dir, name))
    .filter((p) => statSync(p).isFile());
}

function scan(dir, pattern) {
  const hits = [];
  for (const file of filesIn(dir)) {
    const lines = readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, i) => {
      if (pattern.test(line)) hits.push(`${file.split(/[\\/]/).pop()}:${i + 1}  ${line.trim()}`);
    });
  }
  return hits;
}

test('no file in engine/ contains a colour', () => {
  const hits = scan(ENGINE, /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/);
  assert.deepEqual(
    hits,
    [],
    'a colour in engine/ means the look can no longer be swapped from the database:\n' + hits.join('\n')
  );
});

test('no file in engine/ names a font', () => {
  // The lookahead goes AFTER the colon, not after \s* — `\s*` backtracks to
  // zero width and every `font-family: var(...)` matches a negative lookahead
  // placed behind it.
  const hits = scan(ENGINE, /font-family\s*:(?!\s*var\()/i);
  assert.deepEqual(hits, [], 'engine/ must read --font-body and --font-display, never name a face:\n' + hits.join('\n'));
});

test('no file in engine/ names a specific gym', () => {
  // "j7" as a CSS class prefix, storage key or mount attribute is structure.
  // "J7 Fitness" as displayed copy is a gym leaking into the engine.
  const hits = scan(ENGINE, /J7 Fitness|Fitness Studio|Nandigama|Nalini/i);
  assert.deepEqual(hits, [], 'the engine must not know which gym it is serving:\n' + hits.join('\n'));
});

test('engine/ never builds markup from strings', () => {
  // innerHTML with interpolated product names is the one XSS this codebase
  // could plausibly grow. engine/dom.js makes the safe path the easy path.
  const hits = scan(ENGINE, /\.innerHTML\s*=|insertAdjacentHTML|document\.write/);
  assert.deepEqual(hits, [], 'build nodes with el() instead:\n' + hits.join('\n'));
});

test('store.js is the only file in engine/ that talks to the network', () => {
  const offenders = filesIn(ENGINE)
    .filter((p) => !/store\.js$/.test(p))
    .filter((p) => /\bfetch\s*\(|XMLHttpRequest|navigator\.sendBeacon/.test(readFileSync(p, 'utf8')))
    .map((p) => p.split(/[\\/]/).pop());
  assert.deepEqual(offenders, [], 'all database access belongs in store.js');
});

test('every skin defines every token the engine reads', async () => {
  const { TOKENS } = await import('../engine/theme.js');
  const css = readFileSync(join(ENGINE, 'engine.css'), 'utf8');
  const used = new Set([...css.matchAll(/var\(--([a-z0-9-]+)\)/g)].map((m) => m[1]));
  const base = readFileSync(join(SKINS, 'base.css'), 'utf8');

  for (const token of used) {
    assert.ok(TOKENS.includes(token), `--${token} is read by engine.css but is not a known token`);
    assert.match(
      base,
      new RegExp(`--${token}\\s*:`),
      `skins/base.css must define --${token} — it is the fallback when a gym has not set it`
    );
  }
});

test('skins are allowed colours, and actually have them', () => {
  // The mirror of the first test. If a skin had no colour, the tokens would be
  // undefined and the storefront would render as unstyled text.
  const hits = scan(SKINS, /#[0-9a-fA-F]{3,8}\b/);
  assert.ok(hits.length > 0, 'skins/ is where colour lives');
});
