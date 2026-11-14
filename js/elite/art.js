/* ============================================================
   art.js — generated artwork.

   The frames were flat grey rectangles and the page read empty
   because of it. Every visual in here is drawn from scratch:
   waveforms, timeline lanes with a moving playhead, scopes,
   film strips and simulated footage. No imagery is loaded from
   anywhere — it is all procedural, monochrome, and animated on
   silk's single raf.
   ============================================================ */
(function () {
  'use strict';
  var silk = window.silk;
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* deterministic PRNG so a reload draws the identical artwork */
  function hash(s) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  var NS = 'http://www.w3.org/2000/svg';
  function el(n, a) {
    var e = document.createElementNS(NS, n);
    for (var k in a) e.setAttribute(k, a[k]);
    return e;
  }

  /* ---------------------------------------------------------------
     SCENE — simulated footage. Layered shapes behind a soft haze,
     so a plate reads as a frame of something rather than a swatch.
     --------------------------------------------------------------- */
  function scene(svg, r, w, h, dark) {
    var ink = dark ? '#ededed' : '#0f0f0f';
    var g = el('g', {});

    /* horizon + ground */
    var hy = h * (0.52 + r() * 0.12);
    g.appendChild(el('rect', { x: 0, y: hy, width: w, height: h - hy,
      fill: ink, opacity: dark ? 0.10 : 0.07 }));

    /* A soft sun/keylight disc. Radius is off min(w,h), never h alone:
       the story panels are 1404px tall and 600 wide, and scaling a disc
       by height there blows it clean past the frame. */
    var m = Math.min(w, h);
    var cx = w * (0.18 + r() * 0.64), cy = hy * (0.36 + r() * 0.3), rad = m * (0.10 + r() * 0.08);
    var defs = el('defs', {});
    var gid = 'sun' + Math.floor(r() * 1e9);
    var rg = el('radialGradient', { id: gid });
    rg.appendChild(el('stop', { offset: '0%', 'stop-color': dark ? '#ededed' : '#ffffff', 'stop-opacity': dark ? 0.5 : 0.95 }));
    rg.appendChild(el('stop', { offset: '100%', 'stop-color': dark ? '#ededed' : '#ffffff', 'stop-opacity': '0' }));
    defs.appendChild(rg);
    g.appendChild(defs);
    g.appendChild(el('circle', { cx: cx, cy: cy, r: rad * 3.2, fill: 'url(#' + gid + ')' }));
    g.appendChild(el('circle', { cx: cx, cy: cy, r: rad, fill: dark ? '#ededed' : '#ffffff', opacity: dark ? 0.5 : 0.9 }));

    /* silhouette bands — buildings / hills / a figure, varied by seed */
    var kind = Math.floor(r() * 3);
    if (kind === 0) {                                   /* skyline */
      var x = -10;
      while (x < w + 10) {
        var bw = w * (0.05 + r() * 0.09), bh = m * (0.10 + r() * 0.30);
        g.appendChild(el('rect', { x: x, y: hy - bh, width: bw - 3, height: bh,
          fill: ink, opacity: 0.15 + r() * 0.15 }));
        x += bw;
      }
    } else if (kind === 1) {                            /* ridges */
      for (var i = 0; i < 3; i++) {
        var pts = [], n = 7, amp = m * (0.10 + r() * 0.10), base = hy - i * m * 0.05;
        for (var j = 0; j <= n; j++) pts.push((j / n * w).toFixed(1) + ',' + (base - Math.sin(j * 1.3 + i) * amp * r()).toFixed(1));
        g.appendChild(el('polygon', { points: pts.join(' ') + ' ' + w + ',' + h + ' 0,' + h,
          fill: ink, opacity: 0.10 + i * 0.06 }));
      }
    } else {                                            /* figure + floor */
      var fx = w * (0.3 + r() * 0.4), fh = m * 0.30;
      g.appendChild(el('ellipse', { cx: fx, cy: hy - fh, rx: fh * 0.17, ry: fh * 0.19, fill: ink, opacity: 0.30 }));
      g.appendChild(el('rect', { x: fx - fh * 0.17, y: hy - fh * 0.66, width: fh * 0.34, height: fh * 0.66,
        rx: fh * 0.14, fill: ink, opacity: 0.30 }));
      g.appendChild(el('ellipse', { cx: fx, cy: hy + 5, rx: fh * 0.42, ry: 5, fill: ink, opacity: 0.14 }));
    }
    svg.appendChild(g);
  }

  /* ---------------------------------------------------------------
     WAVEFORM — mirrored audio bars.
     --------------------------------------------------------------- */
  function waveform(svg, r, w, h, dark, y0, hh) {
    var ink = dark ? '#ededed' : '#0f0f0f';
    var g = el('g', {}), n = Math.floor(w / 4), mid = y0 + hh / 2;
    for (var i = 0; i < n; i++) {
      var env = Math.sin(i / n * Math.PI * 3.1) * 0.5 + 0.5;
      var a = (0.18 + r() * 0.82) * env * hh * 0.46 + 1;
      g.appendChild(el('rect', { x: i * 4, y: mid - a, width: 2, height: a * 2, rx: 1,
        fill: ink, opacity: 0.30 + env * 0.30 }));
    }
    svg.appendChild(g);
  }

  /* ---------------------------------------------------------------
     LANES — timeline clips with a playhead that actually moves.
     --------------------------------------------------------------- */
  function lanes(svg, r, w, h, dark, y0, hh, seedName) {
    var ink = dark ? '#ededed' : '#0f0f0f';
    var g = el('g', {});
    var rows = 3, rh = hh / rows;
    for (var i = 0; i < rows; i++) {
      var x = 2;
      while (x < w - 8) {
        var cw = w * (0.08 + r() * 0.20);
        if (x + cw > w - 4) cw = w - 4 - x;
        if (cw > 8 && r() > 0.18) {
          g.appendChild(el('rect', { x: x, y: y0 + i * rh + 2, width: cw - 4, height: rh - 5, rx: 3,
            fill: ink, opacity: 0.12 + r() * 0.16 }));
        }
        x += cw;
      }
    }
    /* the playhead */
    var ph = el('rect', { x: 0, y: y0, width: 1.5, height: hh, fill: dark ? '#ededed' : '#0f0f0f', opacity: 0.85 });
    ph.setAttribute('class', 'art-playhead');
    g.appendChild(ph);
    svg.appendChild(g);
    return ph;
  }

  /* ---------------------------------------------------------------
     Build one plate.
     --------------------------------------------------------------- */
  var playheads = [];

  function build(node) {
    if (node.querySelector('svg.art')) return;
    var dark = !!node.closest('.frame--dark, .ui, .bh__media');
    var box = node.getBoundingClientRect();
    var w = Math.max(120, Math.round(box.width)) || 320;
    var h = Math.max(90, Math.round(box.height)) || 200;
    var seedName = (node.getAttribute('data-art') || '') + (node.textContent || '') + w + 'x' + h;
    var r = rng(hash(seedName));

    var svg = el('svg', {
      'class': 'art', viewBox: '0 0 ' + w + ' ' + h,
      preserveAspectRatio: 'xMidYMid slice', 'aria-hidden': 'true'
    });

    var mode = node.getAttribute('data-art') || 'scene';

    if (mode === 'scene' || mode === 'full') {
      scene(svg, r, w, h, dark);
    }
    if (mode === 'wave') {
      waveform(svg, r, w, h, dark, h * 0.18, h * 0.64);
    }
    if (mode === 'lanes') {
      playheads.push({ el: lanes(svg, r, w, h, dark, h * 0.12, h * 0.76, seedName), w: w, off: r() });
    }
    if (mode === 'full') {
      /* footage on top, a waveform strip and lanes underneath */
      waveform(svg, r, w, h, dark, h * 0.70, h * 0.12);
      playheads.push({ el: lanes(svg, r, w, h, dark, h * 0.84, h * 0.14, seedName), w: w, off: r() });
    }

    /* a thin frame rule so the plate has an edge of its own */
    svg.appendChild(el('rect', { x: 0.5, y: 0.5, width: w - 1, height: h - 1,
      fill: 'none', stroke: dark ? '#ededed' : '#0f0f0f', 'stroke-opacity': dark ? 0.10 : 0.08 }));

    node.insertBefore(svg, node.firstChild);
  }

  function buildAll() {
    document.querySelectorAll('.frame, [data-art]').forEach(build);
  }

  /* one shared raf drives every playhead on the page */
  if (silk && silk.onFrame && !RM) {
    var t = 0;
    silk.onFrame(function (dt) {
      t += dt;
      for (var i = 0; i < playheads.length; i++) {
        var p = playheads[i];
        var u = ((t * 0.085) + p.off) % 1;
        p.el.setAttribute('x', (u * p.w).toFixed(1));
      }
    });
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(buildAll);
  buildAll();
  window.silkArt = buildAll;
}());
