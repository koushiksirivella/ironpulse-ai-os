/* site.js — behaviour. One bus, one raf. Never a scroll listener. */
(function () {
  'use strict';

  var silk = window.silk || (window.SilkScroll && window.SilkScroll.init({ container: '.silk-viewport', lerp: 0.1 }));
  window.silk = silk;

  /* ---- procedural grain, generated once, no asset shipped ---- */
  function makeGrain() {
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180">' +
        '<filter id="n">' +
          '<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/>' +
          '<feColorMatrix type="saturate" values="0"/>' +
        '</filter>' +
        '<rect width="180" height="180" filter="url(#n)" opacity="0.55"/>' +
      '</svg>';
    document.documentElement.style.setProperty(
      '--grain-src', 'url("data:image/svg+xml;utf8,' + encodeURIComponent(svg) + '")');
  }
  makeGrain();

  /* ---- anchors: native #id is dead under the silk contract ----

         Damping that feels right for a nudge is motion sickness over a
         distance. The shop runs about eighteen thousand pixels tall, so
         "Checkout" from the top of the catalogue was a three-second ride
         past every product on the page -- long enough to read as broken.

         So: anything under two and a half screens still eases, because that
         is the bit that reads as craft. Anything longer cuts most of the
         distance instantly and eases only the last screen and a half, which
         is the part anyone actually perceives. Same landing, same easing
         into it, without the tour. */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var el = document.querySelector(a.getAttribute('href'));
    if (!el) return;
    e.preventDefault();
    jumpTo(el, -88);
  });

  var correcting = 0;

  function jumpTo(el, offset) {
    var snap = silk.snapshot;
    var vh = snap.viewportHeight || window.innerHeight || 900;

    var y = measureTop(el);
    var dist = Math.abs(y - snap.scrollTop);

    if (dist > vh * 2.5) {
      var lead = vh * 1.5;
      silk.scrollTo(y > snap.scrollTop ? y - lead : y + lead, { immediate: true });
    }
    var aimed = y + offset;
    silk.scrollTo(aimed);

    /* Cutting most of the distance instantly means we land in a part of the
       page whose images have not been decoded yet, and every one that lands
       moves the target out from under the scroll that is chasing it -- we
       arrived about two hundred pixels short, with the button half off the
       bottom edge for a beat.

       So: one correction, four hundred milliseconds later, re-measured. Not
       a loop and not a frame callback. It stands down if the reader has
       taken over in the meantime, because a page that yanks itself back
       while someone is already scrolling is worse than one that lands a
       little low. */
    clearTimeout(correcting);
    correcting = setTimeout(function () {
      var fresh = measureTop(el) + offset;
      var now = silk.snapshot.scrollTop;
      if (Math.abs(fresh - aimed) < 8) return;      // nothing moved
      if (Math.abs(now - aimed) > vh * 0.5) return; // reader took over
      silk.scrollTo(fresh);
    }, 400);
  }

  /* Measured on a click or a timer, never inside a frame callback. */
  function measureTop(el) {
    var vp = silk.element;
    return el.getBoundingClientRect().top - vp.getBoundingClientRect().top + vp.scrollTop;
  }

  window.EliteJumpTo = jumpTo;

}());

/* ---- reveal wiring.

       NOT an IntersectionObserver. IO only fires when it samples a frame in
       which an element is intersecting — so anything the user scrolls PAST
       faster than the sample rate, or jumps over via an anchor, or lands
       below on a refresh, never gets its callback and stays at opacity 0
       forever. That is what made whole bands of this page render blank.

       Instead: cache each element's absolute Y once (on the viewport bus,
       never in a frame), then compare against scrollTop on every snapshot.
       Pure arithmetic, no layout reads while scrolling, and an element that
       is already above the trigger line at any sample gets revealed — so a
       teleport, a flick, or a deep link all land correctly.

       Deterministic stagger, never Math.random(). ---- */
(function () {
  var silk = window.silk;
  if (!silk) return;

  /* FNV-1a -> mulberry32. Same string always gets the same delay, so a
     re-render never reshuffles the page. A pure ramp is a left-to-right
     wipe and reads as the most obvious AI text animation there is. */
  function hash(str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rand(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  window.silkStagger = function (el, i, total, base) {
    base = base || 90;
    var r = rand(hash((el.textContent || '') + i))();
    var ramp = total > 1 ? i / (total - 1) : 0;
    return Math.round(base * (ramp * total * 0.70 + r * 0.35));
  };

  var SEL = '.mask, .rise, .plate, .timeline__rule, [data-reveal]';
  var tracked = [];          /* { el, y }  y = absolute offset in the scroller */
  var scroller = document.querySelector('.silk-viewport');

  /* Measure on the viewport bus only. Never during a scroll frame. */
  function measure() {
    var st = scroller ? scroller.scrollTop : 0;
    tracked = [];
    document.querySelectorAll(SEL).forEach(function (el) {
      if (el.classList.contains('is-in')) return;
      tracked.push({ el: el, y: el.getBoundingClientRect().top + st });
    });
    check(st, scroller ? scroller.clientHeight : window.innerHeight);
  }

  /* Arithmetic only. Reveals everything already past the line, which is what
     makes fast scrolls and jumps safe. */
  function check(scrollTop, vh) {
    if (!tracked.length) return;
    var line = scrollTop + vh * 0.88;
    var remaining = [];
    for (var i = 0; i < tracked.length; i++) {
      if (tracked[i].y < line) tracked[i].el.classList.add('is-in');
      else remaining.push(tracked[i]);
    }
    tracked = remaining;
  }

  silk.subscribeViewport(measure);
  silk.subscribe(function (s) { check(s.scrollTop, s.viewportHeight || 900); });

  /* re-measure after fonts settle, since text reflow moves every offset */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  window.silkObserve = measure;
  measure();
}());

/* ---- COMPONENT 2 — header dropdown ---- */
(function () {
  var trigger = document.getElementById('nav-product');
  var dd      = document.getElementById('dd-product');
  var overlay = document.getElementById('hdr-overlay');
  if (!trigger || !dd) return;
  var open = false;

  function set(state) {
    open = state;
    dd.classList.toggle('is-open', open);
    overlay.classList.toggle('is-open', open);
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  trigger.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); set(!open); });
  trigger.addEventListener('mouseenter', function () { set(true); });

  document.querySelector('.header__left').addEventListener('mouseleave', function () { set(false); });
  overlay.addEventListener('click', function () { set(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) set(false); });
}());

/* ---- header lifts off the top edge once the page moves.
       Reads the shared snapshot — no scroll listener. ---- */
(function () {
  var silk = window.silk, hdr = document.querySelector('.header');
  if (!silk || !hdr) return;
  var was = false;
  silk.subscribe(function (s) {
    var on = s.scrollTop > 24;
    if (on === was) return;
    was = on;
    hdr.classList.toggle('is-stuck', on);
  });
}());

/* ---- COMPONENT 11 — gallery carousel.
       Horizontal scroll inside its own container, so it never fights
       the silk viewport. No scroll listener; the track is native. ---- */
(function () {
  var track = document.getElementById('gc-track');
  if (!track) return;
  document.querySelectorAll('[data-gc]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var dir = +btn.getAttribute('data-gc');
      var item = track.querySelector('.gc__item');
      var step = item ? item.getBoundingClientRect().width + 22 : 340;
      track.scrollBy({ left: dir * step, behavior: 'smooth' });
    });
  });
}());

/* ---- observe anything injected after first paint ---- */
window.silkObserve();

/* ---- ACCORDIONS (the reference uses Radix disclosures with
       aria-expanded + data-state; this is the same contract without
       the dependency). Height animates via grid-template-rows so
       nothing has to be measured. ---- */
(function () {
  var groups = {};
  document.querySelectorAll('.acc__trigger').forEach(function (btn) {
    var group = btn.closest('.fs__right, .bh__acc') || document;
    var key = group === document ? 'doc' : (group.className || 'g');
    (groups[key] = groups[key] || []).push(btn);

    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      /* one open at a time within a group, like the scrape */
      groups[key].forEach(function (o) {
        o.setAttribute('aria-expanded', 'false');
        o.setAttribute('data-state', 'closed');
      });
      if (!open) {
        btn.setAttribute('aria-expanded', 'true');
        btn.setAttribute('data-state', 'open');
      }
    });

    btn.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      var list = groups[key], i = list.indexOf(btn);
      var next = list[(i + (e.key === 'ArrowDown' ? 1 : list.length - 1)) % list.length];
      if (next) next.focus();
    });
  });
}());

/* ---- CUSTOM CURSOR — a dot that tracks exactly and a ring that
       lags. Both damped on silk's single raf, never its own. ---- */
(function () {
  var silk = window.silk;
  var dot = document.querySelector('.cursor');
  var ring = document.querySelector('.cursor-ring');
  if (!silk || !dot || !ring) return;
  if (window.matchMedia('(pointer: coarse)').matches) return;

  var root = document.documentElement;
  var tx = window.innerWidth / 2, ty = window.innerHeight / 2;
  var dx = tx, dy = ty, rx = tx, ry = ty;

  window.addEventListener('pointermove', function (e) {
    tx = e.clientX; ty = e.clientY;
    if (!root.classList.contains('has-cursor')) root.classList.add('has-cursor');

    /* hot over anything clickable, dark over the dark panels */
    var el = e.target;
    var hot = !!(el.closest && el.closest('a, button, .gc__item, .fc__card, .tblock'));
    var dark = !!(el.closest && el.closest('.ui, .bh__media, .frame--dark, .btn'));
    root.classList.toggle('cursor-hot', hot);
    root.classList.toggle('cursor-dark', dark);
  }, { passive: true });

  document.addEventListener('pointerleave', function () { root.classList.remove('has-cursor'); });

  function damp(cur, tgt, lerp, dt) {
    return tgt + (cur - tgt) * Math.exp(-lerp * dt * 60);
  }

  silk.onFrame(function (dt) {
    dx = damp(dx, tx, 0.35, dt);  dy = damp(dy, ty, 0.35, dt);
    rx = damp(rx, tx, 0.11, dt);  ry = damp(ry, ty, 0.11, dt);
    dot.style.transform  = 'translate3d(' + dx.toFixed(2) + 'px,' + dy.toFixed(2) + 'px,0)';
    ring.style.transform = 'translate3d(' + rx.toFixed(2) + 'px,' + ry.toFixed(2) + 'px,0)';
  });
}());

/* ---- MOBILE MENU ---- */
(function () {
  var btn = document.querySelector('.menu-toggle');
  var panel = document.getElementById('menu-panel');
  if (!btn || !panel) return;
  function set(open) {
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    panel.classList.toggle('is-open', open);
  }
  btn.addEventListener('click', function () {
    set(btn.getAttribute('aria-expanded') !== 'true');
  });
  panel.addEventListener('click', function (e) { if (e.target.tagName === 'A') set(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
}());

/* ---- MAGNETIC BUTTONS — one distinctive interaction, damped on the
       shared raf. Offsets are cached per element, never measured in
       the frame callback. ---- */
(function () {
  var silk = window.silk;
  if (!silk || window.matchMedia('(pointer: coarse)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var mags = [];
  function collect() {
    mags = [];
    document.querySelectorAll('.btn, .gc__nav button').forEach(function (el) {
      mags.push({ el: el, cx: 0, cy: 0, w: 0, h: 0, tx: 0, ty: 0, x: 0, y: 0, on: false });
    });
    measure();
  }
  function measure() {
    mags.forEach(function (m) {
      var r = m.el.getBoundingClientRect();
      m.cx = r.left + r.width / 2; m.cy = r.top + r.height / 2;
      m.w = r.width; m.h = r.height;
    });
  }
  silk.subscribeViewport(measure);
  silk.subscribe(measure);          /* rects move as the page scrolls */

  window.addEventListener('pointermove', function (e) {
    for (var i = 0; i < mags.length; i++) {
      var m = mags[i];
      var dx = e.clientX - m.cx, dy = e.clientY - m.cy;
      var near = Math.abs(dx) < m.w / 2 + 46 && Math.abs(dy) < m.h / 2 + 46;
      m.on = near;
      m.tx = near ? dx * 0.28 : 0;
      m.ty = near ? dy * 0.34 : 0;
    }
  }, { passive: true });

  function damp(cur, tgt, lerp, dt) {
    return tgt + (cur - tgt) * Math.exp(-lerp * dt * 60);
  }
  silk.onFrame(function (dt) {
    for (var i = 0; i < mags.length; i++) {
      var m = mags[i];
      m.x = damp(m.x, m.tx, 0.14, dt);
      m.y = damp(m.y, m.ty, 0.14, dt);
      if (Math.abs(m.x) < 0.05 && Math.abs(m.y) < 0.05 && !m.on) { m.el.style.transform = ''; continue; }
      m.el.style.transform = 'translate3d(' + m.x.toFixed(2) + 'px,' + m.y.toFixed(2) + 'px,0)';
    }
  });

  collect();
}());
