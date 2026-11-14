// Presets are values destined for `tenants.brand`, so they have to pass exactly
// the checks the engine applies to that column at runtime. A preset that names
// an unknown token, or one the engine would reject, is a button in the admin
// panel that silently does nothing — the worst kind of broken, because it looks
// like it worked.

import test from 'node:test';
import assert from 'node:assert/strict';

import { PRESETS, presetById } from '../admin/presets.js';
import { TOKENS, COLOUR_TOKENS, isSafeValue, applyTheme } from '../engine/theme.js';

// --grain is the one token a preset may never carry: its value is a url(), and
// the engine refuses url() from the database so a row can never make a
// visitor's browser fetch something. It comes from the skin file instead.
const NOT_SETTABLE = new Set(['grain']);
const SETTABLE = TOKENS.filter((t) => !NOT_SETTABLE.has(t));

test('there is at least one preset and every id is unique', () => {
  assert.ok(PRESETS.length > 0);
  const ids = PRESETS.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate preset id');
});

for (const preset of PRESETS) {
  test(`preset "${preset.id}" names only tokens the engine reads`, () => {
    const unknown = Object.keys(preset.tokens).filter((k) => !TOKENS.includes(k));
    assert.deepEqual(unknown, [], `not in engine/theme.js TOKENS: ${unknown.join(', ')}`);
  });

  test(`preset "${preset.id}" sets every settable token`, () => {
    const missing = SETTABLE.filter((t) => !(t in preset.tokens));
    assert.deepEqual(missing, [], `a gap shows as an empty box in the admin panel: ${missing.join(', ')}`);
  });

  test(`preset "${preset.id}" never sets --grain`, () => {
    assert.ok(!('grain' in preset.tokens), 'grain is a url() and the engine refuses it from the database');
  });

  test(`preset "${preset.id}" survives isSafeValue on every value`, () => {
    const unsafe = Object.entries(preset.tokens)
      .filter(([, v]) => !isSafeValue(v))
      .map(([k]) => k);
    assert.deepEqual(unsafe, [], `the engine would drop these: ${unsafe.join(', ')}`);
  });

  test(`preset "${preset.id}" gives every colour token something a picker can round-trip`, () => {
    // The admin panel offers <input type="color"> on these, and that control can
    // only hold #rrggbb. A named colour or an rgb() here would silently reset
    // the picker to black the moment an operator opened the tab.
    const bad = COLOUR_TOKENS.filter((t) => !/^#[0-9a-f]{6}$/i.test(preset.tokens[t]));
    assert.deepEqual(bad, [], `not a 6-digit hex: ${bad.join(', ')}`);
  });

  test(`preset "${preset.id}" actually applies through the real engine path`, () => {
    // Not a re-implementation of the check: this drives applyTheme itself, so
    // if the engine's rules tighten, this fails rather than drifting.
    const style = new Map();
    const fake = { style: { setProperty: (k, v) => style.set(k, v) } };
    const applied = applyTheme(preset.tokens, fake);
    assert.equal(applied.length, Object.keys(preset.tokens).length, 'the engine dropped a token');
  });
}

test('the monochrome presets contain no hue at all', () => {
  // The whole claim of a monochrome skin is checkable, so it is checked. Any
  // neutral must be R=G=B exactly — a "slightly blue black" is the way a hue
  // creeps back into a black-and-white system six months later.
  for (const id of ['studio', 'mono']) {
    const preset = presetById(id);
    assert.ok(preset, `missing preset ${id}`);
    for (const [token, value] of Object.entries(preset.tokens)) {
      for (const [, r, g, b] of String(value).matchAll(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/gi)) {
        assert.ok(
          r.toLowerCase() === g.toLowerCase() && g.toLowerCase() === b.toLowerCase(),
          `${id} --${token} carries a hue: #${r}${g}${b}`
        );
      }
      for (const [, r, g, b] of String(value).matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/gi)) {
        assert.ok(r === g && g === b, `${id} --${token} carries a hue: rgb(${r},${g},${b})`);
      }
    }
  }
});

test('presetById returns null for an unknown id rather than throwing', () => {
  assert.equal(presetById('nope'), null);
});
