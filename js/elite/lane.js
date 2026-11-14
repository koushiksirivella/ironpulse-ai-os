/* ============================================================
   lane.js — scroll-driven mark lanes.

   The lane's x is a pure function of scrollTop, then damped. That
   is the whole trick: because position is DERIVED from scroll
   rather than accumulated from a delta, scrolling up runs it
   backwards for free, and the damping is what makes the reversal
   read as weight instead of a snap.

   Marks are our own — a generated geometric monogram plus a
   wordmark. No third-party logo is loaded or drawn.

   Contract: no scroll listener, no rAF, no ResizeObserver.
   silk.subscribe for position, silk.onFrame for the damp,
   silk.subscribeViewport for the one measure.
   ============================================================ */
(function () {
  'use strict';
  var silk = window.silk;
  if (!silk) return;
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var NS = 'http://www.w3.org/2000/svg';
  function svgEl(n, a) {
    var e = document.createElementNS(NS, n);
    for (var k in a) e.setAttribute(k, a[k]);
    return e;
  }

  /* six monograms, each a distinct silhouette so the row reads as
     six different companies rather than one shape repeated */
  var GLYPHS = {
    northbank: function (g) {
      g.appendChild(svgEl('circle', { cx: 11, cy: 11, r: 9, fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }));
      g.appendChild(svgEl('rect', { x: 10, y: 0, width: 2, height: 22, fill: 'currentColor' }));
    },
    fieldnote: function (g) {
      g.appendChild(svgEl('path', { d: 'M2 20 L11 2 L20 20 Z', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linejoin': 'round' }));
    },
    marrow: function (g) {
      g.appendChild(svgEl('rect', { x: 2, y: 2, width: 8, height: 18, rx: 2, fill: 'currentColor' }));
      g.appendChild(svgEl('rect', { x: 12, y: 2, width: 8, height: 18, rx: 2, fill: 'currentColor', opacity: '.4' }));
    },
    stanza: function (g) {
      [0, 7, 14].forEach(function (y, i) {
        g.appendChild(svgEl('rect', { x: 2 + i * 2, y: y + 2, width: 18 - i * 4, height: 3, rx: 1.5, fill: 'currentColor' }));
      });
    },
    halcyon: function (g) {
      g.appendChild(svgEl('circle', { cx: 11, cy: 11, r: 9.5, fill: 'currentColor', opacity: '.22' }));
      g.appendChild(svgEl('circle', { cx: 11, cy: 11, r: 4.5, fill: 'currentColor' }));
    },
    verso: function (g) {
      g.appendChild(svgEl('path', { d: 'M11 1 L21 11 L11 21 L1 11 Z', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }));
      g.appendChild(svgEl('path', { d: 'M11 7 L15 11 L11 15 L7 11 Z', fill: 'currentColor' }));
    }
  };

  var MARKS = [
    ['northbank', 'Northbank'],
    ['fieldnote', 'Fieldnote'],
    ['marrow',    'Marrow & Co'],
    ['stanza',    'Stanza'],
    ['halcyon',   'Halcyon'],
    ['verso',     'Verso Studio']
  ];

  function mark(key, label) {
    var a = document.createElement('span');
    a.className = 'mk';
    var s = svgEl('svg', { viewBox: '0 0 22 22', 'aria-hidden': 'true', 'class': 'mk__g' });
    var g = svgEl('g', {});
    GLYPHS[key](g);
    s.appendChild(g);
    a.appendChild(s);
    var t = document.createElement('span');
    t.className = 'mk__t';
    t.textContent = label;
    a.appendChild(t);
    return a;
  }

  /* ---------------------------------------------------------------
     Build every [data-lane] into a track wide enough to slide.
     --------------------------------------------------------------- */
  var lanes = [];

  function build(node) {
    if (node.querySelector('.lane__track')) return;
    var speed = parseFloat(node.getAttribute('data-lane-speed') || '0.12');
    var dir   = node.getAttribute('data-lane-dir') === 'rtl' ? -1 : 1;
    var start = parseInt(node.getAttribute('data-lane-start') || '0', 10);

    var track = document.createElement('div');
    track.className = 'lane__track';

    /* three copies so the strip never runs out of marks either way */
    for (var pass = 0; pass < 3; pass++) {
      for (var i = 0; i < MARKS.length; i++) {
        var m = MARKS[(i + start) % MARKS.length];
        track.appendChild(mark(m[0], m[1]));
      }
    }
    node.appendChild(track);
    lanes.push({ node: node, track: track, speed: speed, dir: dir, cur: 0, tgt: 0, span: 0, anchor: 0 });
  }

  function measure() {
    var st = silk.snapshot ? silk.snapshot.scrollTop : 0;
    for (var i = 0; i < lanes.length; i++) {
      var L = lanes[i];
      /* one third of the track is one full set — wrap on that */
      L.span = L.track.scrollWidth / 3;
      L.anchor = L.node.getBoundingClientRect().top + st;
      L.cur = L.tgt = 0;
    }
  }

  function position(scrollTop) {
    for (var i = 0; i < lanes.length; i++) {
      var L = lanes[i];
      L.tgt = (scrollTop - L.anchor) * L.speed * L.dir;
    }
  }

  function apply(L) {
    if (!L.span) return;
    /* wrap into one set so the strip is endless in both directions */
    var x = -(((L.cur % L.span) + L.span) % L.span);
    L.track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
  }

  function damp(cur, tgt, lerp, dt) { return tgt + (cur - tgt) * Math.exp(-lerp * dt * 60); }

  function boot() {
    document.querySelectorAll('[data-lane]').forEach(build);
    if (!lanes.length) return;
    measure();
    silk.subscribeViewport(measure);
    silk.subscribe(function (s) { position(s.scrollTop); });

    if (RM) {
      /* lands finished: one static offset, no motion */
      for (var i = 0; i < lanes.length; i++) { lanes[i].cur = lanes[i].tgt; apply(lanes[i]); }
      return;
    }
    /* same staleness as iris.js: the anchor is cached, and content
       injected after boot moves it. The scroll limit is the signal. */
    var lastLimit = silk.snapshot ? silk.snapshot.limit : -1;

    silk.onFrame(function (dt) {
      var lim = silk.snapshot ? silk.snapshot.limit : lastLimit;
      if (lim !== lastLimit) {
        lastLimit = lim;
        var st = silk.snapshot ? silk.snapshot.scrollTop : 0;
        for (var k = 0; k < lanes.length; k++) {
          lanes[k].span = lanes[k].track.scrollWidth / 3;
          lanes[k].anchor = lanes[k].node.getBoundingClientRect().top + st;
        }
        position(st);
      }
      for (var i = 0; i < lanes.length; i++) {
        var L = lanes[i];
        L.cur = damp(L.cur, L.tgt, 0.09, dt);
        apply(L);
      }
    });
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); });
  boot();
  window.silkLane = boot;
}());
