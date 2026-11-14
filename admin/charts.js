// ===========================================================================
// ELITE GYM — chart primitives.
//
// Hand-rolled SVG. No charting library, on purpose: the four shapes this
// console needs (grouped bars, a sparkline, a donut, a share bar) are about
// two hundred lines between them, and the smallest chart library that draws
// all four is ~90 KB over the wire for a page behind a login. A dependency
// also brings its own colour system, which would immediately break the one
// rule this design has — spring is the only hue.
//
// Every function here returns a detached SVG node. Nothing measures the DOM,
// nothing reads layout, nothing animates from JS: the growth animation is a
// CSS keyframe keyed off a class, so a chart costs one paint whether it holds
// eight bars or ninety.
// ===========================================================================

const NS = 'http://www.w3.org/2000/svg';

/** SVG needs createElementNS; engine/dom.js el() makes HTML elements. */
function s(tag, attrs = {}, children = []) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    node.setAttribute(k, String(v));
  }
  for (const c of [].concat(children)) {
    if (c == null || c === false || c === '') continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
}

/** The one gradient the area charts fill with. Defined once per chart. */
function springFade() {
  return s('defs', {}, s('linearGradient', { id: 'springFade', x1: 0, y1: 0, x2: 0, y2: 1 }, [
    s('stop', { offset: '0%', 'stop-color': '#b1e743', 'stop-opacity': '.34' }),
    s('stop', { offset: '100%', 'stop-color': '#b1e743', 'stop-opacity': '0' }),
  ]));
}

// ------------------------------------------------------------------ tooltip

let tipNode = null;

function tip() {
  if (!tipNode) {
    tipNode = document.createElement('div');
    tipNode.className = 'chart-tip';
    document.body.append(tipNode);
  }
  return tipNode;
}

/**
 * Position is clamped to the viewport so a bar at the right edge does not push
 * a tooltip off screen — the commonest chart bug and the one nobody notices
 * until a demo.
 */
function showTip(evt, lines) {
  const t = tip();
  t.replaceChildren();
  for (const line of lines) {
    const row = document.createElement('div');
    if (line.dot !== undefined) {
      const i = document.createElement('i');
      if (line.dot === 'mute') i.setAttribute('data-mute', '');
      row.append(i);
    }
    if (line.label) row.append(document.createTextNode(line.label + ' '));
    if (line.value != null) {
      const b = document.createElement('b');
      b.textContent = String(line.value);
      row.append(b);
    }
    t.append(row);
  }
  t.classList.add('is-on');
  const pad = 14;
  const w = t.offsetWidth || 140;
  const h = t.offsetHeight || 50;
  let x = evt.clientX + pad;
  let y = evt.clientY - h - pad;
  if (x + w > window.innerWidth - 8) x = evt.clientX - w - pad;
  if (y < 8) y = evt.clientY + pad;
  t.style.left = `${x}px`;
  t.style.top = `${y}px`;
}

function hideTip() { if (tipNode) tipNode.classList.remove('is-on'); }

// --------------------------------------------------------------------- bars

/**
 * The board's main chart: one ghost column per slot with a live column drawn
 * over it, exactly as in the reference.
 *
 * @param {{label:string, value:number, ghost?:number, tip?:Array}[]} data
 * @param {{height?:number, gap?:number, every?:number, format?:Function}} o
 */
export function barChart(data, o = {}) {
  const H = o.height ?? 280;
  const W = 1000;                       // viewBox width; the SVG scales to fit
  const padB = 26;                      // room under the baseline for labels
  const padL = 34;                      // room left of it for the value axis
  const gap = o.gap ?? 6;
  const plotH = H - padB;
  const plotW = W - padL;

  const peak = Math.max(1, ...data.map((d) => Math.max(d.value, d.ghost ?? 0)));
  const slot = plotW / Math.max(1, data.length);
  const bw = Math.max(3, slot - gap);
  const fmt = o.format ?? ((v) => String(v));

  const svg = s('svg', {
    class: 'chart chart--in',
    viewBox: `0 0 ${W} ${H}`,
    preserveAspectRatio: 'none',
    role: 'img',
    'aria-label': o.label ?? 'Bar chart',
  }, springFade());

  // Four gridlines and their labels. More than four turns a chart into graph
  // paper and stops anyone reading the bars.
  for (let i = 0; i <= 4; i += 1) {
    const v = (peak / 4) * i;
    const y = plotH - (v / peak) * plotH;
    svg.append(s('line', { class: 'axis-l', x1: padL, y1: y, x2: W, y2: y }));
    svg.append(s('text', {
      class: 'axis-t', x: padL - 8, y: y + 4, 'text-anchor': 'end',
    }, fmt(Math.round(v))));
  }

  data.forEach((d, i) => {
    const x = padL + i * slot + gap / 2;
    const g = s('g', { class: 'bar-g' });

    const gh = d.ghost ?? d.value;
    const ghH = Math.max(2, (gh / peak) * plotH);
    const lvH = Math.max(2, (d.value / peak) * plotH);

    // The ghost is drawn first and is TALLER — it reads as the ceiling the
    // live value is filling toward. Same delay as its live bar so the pair
    // grows as one column rather than as two racing rectangles.
    g.append(s('rect', {
      class: 'bar-ghost', x, y: plotH - ghH, width: bw, height: ghH,
      rx: Math.min(bw / 2, 5), style: `--d:${i * 14}ms`,
    }));
    g.append(s('rect', {
      class: 'bar-live', x, y: plotH - lvH, width: bw, height: lvH,
      rx: Math.min(bw / 2, 5), style: `--d:${i * 14}ms`,
    }));

    // One transparent hit rectangle spanning the whole slot: aiming at a 6px
    // bar with a mouse is a usability bug, and on a phone it is impossible.
    const hit = s('rect', {
      x: padL + i * slot, y: 0, width: slot, height: plotH, fill: 'transparent',
    });
    hit.addEventListener('pointerenter', (e) => showTip(e, d.tip ?? [
      { label: d.label, value: fmt(d.value), dot: true },
    ]));
    hit.addEventListener('pointermove', (e) => showTip(e, d.tip ?? [
      { label: d.label, value: fmt(d.value), dot: true },
    ]));
    hit.addEventListener('pointerleave', hideTip);
    g.append(hit);
    svg.append(g);
  });

  // Label every nth slot. Thirty dates written under thirty bars is a smear;
  // the caller passes `every` so a 7-day and a 90-day chart both stay legible.
  const every = o.every ?? Math.ceil(data.length / 10);
  data.forEach((d, i) => {
    if (i % every !== 0 && i !== data.length - 1) return;
    svg.append(s('text', {
      class: 'axis-t',
      x: padL + i * slot + slot / 2,
      y: H - 8,
      'text-anchor': 'middle',
    }, d.label));
  });

  return svg;
}

// --------------------------------------------------------------- sparkline

/** The small trend line inside a KPI tile. */
export function sparkline(values, o = {}) {
  const W = o.width ?? 190;
  const H = o.height ?? 62;
  const pad = 4;
  const vals = values.length ? values : [0, 0];
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const span = hi - lo || 1;
  const stepX = (W - pad * 2) / Math.max(1, vals.length - 1);

  const pt = (v, i) => [
    pad + i * stepX,
    pad + (H - pad * 2) * (1 - (v - lo) / span),
  ];

  const pts = vals.map(pt);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${(pad + (vals.length - 1) * stepX).toFixed(1)},${H - pad} L${pad},${H - pad} Z`;

  const svg = s('svg', {
    class: 'chart', viewBox: `0 0 ${W} ${H}`, width: W, height: H,
    role: 'img', 'aria-label': o.label ?? 'Trend',
  }, springFade());

  svg.append(s('path', { class: 'spark-area', d: area }));
  svg.append(s('path', { class: 'spark-line', d: line }));

  const [lx, ly] = pts[pts.length - 1];
  svg.append(s('circle', { class: 'spark-dot', cx: lx, cy: ly, r: 3.6 }));
  return svg;
}

// ------------------------------------------------------------------- donut

/**
 * Two-part split, drawn as one ring with a dash offset. The reference draws
 * the minority slice as a separate small disc; a single ring reads the same
 * and is one element instead of two overlapping ones.
 */
export function donut(pct, o = {}) {
  const size = o.size ?? 92;
  const sw = o.stroke ?? 16;
  const r = (size - sw) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const on = (Math.max(0, Math.min(100, pct)) / 100) * circ;

  const svg = s('svg', {
    class: 'chart', viewBox: `0 0 ${size} ${size}`, width: size, height: size,
    role: 'img', 'aria-label': o.label ?? `${Math.round(pct)} percent`,
  });

  svg.append(s('circle', { class: 'donut-track', cx: c, cy: c, r, 'stroke-width': sw }));
  svg.append(s('circle', {
    class: 'donut-live', cx: c, cy: c, r, 'stroke-width': sw,
    'stroke-dasharray': `${circ} ${circ}`,
    'stroke-dashoffset': circ,
    transform: `rotate(-90 ${c} ${c})`,
  }));

  // Offset is set on the next frame so the browser has a start value to
  // transition FROM. Setting it inline renders the finished ring with no
  // animation at all — a classic and entirely invisible bug.
  requestAnimationFrame(() => {
    const live = svg.querySelector('.donut-live');
    if (live) live.setAttribute('stroke-dashoffset', String(circ - on));
  });

  if (o.center !== false) {
    svg.append(s('text', {
      x: c, y: c + 5, 'text-anchor': 'middle',
      style: 'font:700 19px/1 Figtree,system-ui,sans-serif;fill:#22201f',
    }, `${Math.round(pct)}%`));
  }
  return svg;
}

// -------------------------------------------------------------- misc utils

/** Bucket rows into N day-slots ending today. Returns oldest-first. */
export function byDay(rows, days, pick = () => 1) {
  const out = [];
  const now = new Date();
  now.setHours(23, 59, 59, 999);

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    out.push({ date: d, value: 0, count: 0 });
  }

  const first = new Date(now);
  first.setDate(first.getDate() - (days - 1));
  first.setHours(0, 0, 0, 0);

  for (const row of rows) {
    const t = new Date(row.created_at);
    if (t < first) continue;
    // Day index from the calendar difference, not from ms/86400000 — the
    // second is wrong twice a year in any zone that observes DST, and wrong
    // by a whole column, which is exactly the kind of error nobody spots.
    const idx = Math.floor((new Date(t).setHours(0, 0, 0, 0) - first.getTime()) / 86400000);
    if (idx < 0 || idx >= out.length) continue;
    out[idx].value += Number(pick(row)) || 0;
    out[idx].count += 1;
  }
  return out;
}

export const dayLabel = (d) =>
  d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

/** Percentage change, with the "was zero" case answered rather than Infinity. */
export function delta(now, was) {
  if (!was) return { pct: now ? 100 : 0, dir: now ? 'up' : 'flat' };
  const pct = ((now - was) / was) * 100;
  return { pct, dir: pct > 0.5 ? 'up' : pct < -0.5 ? 'down' : 'flat' };
}

export const fmtDelta = (d) =>
  `${d.dir === 'down' ? '' : '+'}${d.pct.toFixed(d.pct % 1 === 0 ? 0 : 1)}%`;

/** Compact money for an axis label: 12400 -> ₹12.4k */
export function compact(n) {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1e7) return `${(v / 1e7).toFixed(1)}Cr`;
  if (Math.abs(v) >= 1e5) return `${(v / 1e5).toFixed(1)}L`;
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(Math.round(v));
}

export { hideTip };
