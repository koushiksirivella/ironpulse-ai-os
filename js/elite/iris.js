/* ============================================================
   iris.js — the cursor-reactive iridescence.

   The reference ships this as a hue-rotate: its bundle carries
   @keyframes { 0% hue-rotate(0deg) -> 100% hue-rotate(360deg) }
   and a hue-rotate(160deg) stop. A keyframe loop rotates on a
   clock and ignores you; driving the same filter from pointer
   position makes it REACT, which is what it looks like on the
   live site.

   Contract, same as every other module here:
     - no scroll listener      (absolute Y cached, compared to
                                silk.snapshot.scrollTop)
     - no requestAnimationFrame (silk.onFrame)
     - no ResizeObserver        (silk.subscribeViewport)
     - no layout read inside a frame callback
   ============================================================ */
(function () {
  'use strict';
  var silk = window.silk;
  if (!silk) return;

  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COARSE = window.matchMedia('(pointer: coarse)').matches;
  if (RM || COARSE) return;            /* decoration: absent is its finished state */

  var HUE_MAX = 160;                   /* the reference's own stop */
  var FALLOFF = 190;                   /* px beyond the box that still lights it */

  var items = [];
  var px = -9999, py = -9999;

  /* A real element, not a pseudo. `.frame` already owns BOTH ::before
     (the plate gradient) and ::after (the halftone dots) in site.css, so
     an [data-iris]::before was competing at equal specificity for a slot
     that was already in use — it silently never painted, and overriding
     ::after would have killed the halftone. An injected child collides
     with nothing. */
  function layer(el) {
    var n = el.querySelector(':scope > .iris');
    if (!n) {
      n = document.createElement('i');
      n.className = 'iris';
      n.setAttribute('aria-hidden', 'true');
      el.appendChild(n);
    }
    return n;
  }

  function measure() {
    var st = silk.snapshot ? silk.snapshot.scrollTop : 0;
    items = [];
    document.querySelectorAll('[data-iris]').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      items.push({
        el: el, fx: layer(el),
        x: r.left, y: r.top + st, w: r.width, h: r.height,
        a: 0, hx: 0, hy: 0, hue: 0
      });
    });
  }

  /* one passive pointer listener. site.js already owns two (the custom
     cursor and the magnetic buttons); consolidating all three onto a
     single shared pointer bus is the obvious next tidy-up. */
  window.addEventListener('pointermove', function (e) {
    px = e.clientX; py = e.clientY;
  }, { passive: true });

  window.addEventListener('pointerleave', function () { px = py = -9999; }, { passive: true });

  function damp(cur, tgt, lerp, dt) { return tgt + (cur - tgt) * Math.exp(-lerp * dt * 60); }

  function boot() {
    measure();
    silk.subscribeViewport(measure);

    /* Cached Y goes stale when the CONTENT grows, not just when the
       viewport resizes: chrome.js injects ~90 nodes per plate and the
       story panels take their min-height after boot, which pushed the
       feature cards 1396px below where they were measured — so the
       pointer never found them and nothing ever lit.

       subscribeViewport does not fire for that. silk's scroll limit does
       change, and comparing one integer per frame is free, so the limit
       is the signal that a re-measure is owed. */
    var lastLimit = silk.snapshot ? silk.snapshot.limit : -1;

    silk.onFrame(function (dt) {
      var st = silk.snapshot ? silk.snapshot.scrollTop : 0;

      var lim = silk.snapshot ? silk.snapshot.limit : lastLimit;
      if (lim !== lastLimit) { lastLimit = lim; measure(); }

      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var top = it.y - st;                     /* screen Y, no layout read */

        /* cheap reject: off screen entirely */
        var target = 0, lx = 50, ly = 50;
        if (top < window.innerHeight + FALLOFF && top + it.h > -FALLOFF) {
          /* distance from the pointer to the box, 0 when inside */
          var dx = px < it.x ? it.x - px : (px > it.x + it.w ? px - (it.x + it.w) : 0);
          var dy = py < top  ? top  - py : (py > top  + it.h ? py - (top  + it.h) : 0);
          var d  = Math.sqrt(dx * dx + dy * dy);
          if (d < FALLOFF) {
            target = 1 - d / FALLOFF;
            target *= target;                    /* tighten the falloff */
            lx = ((px - it.x) / it.w) * 100;
            ly = ((py - top)  / it.h) * 100;
            if (lx < -40) lx = -40; else if (lx > 140) lx = 140;
            if (ly < -40) ly = -40; else if (ly > 140) ly = 140;
          }
        }

        it.a = damp(it.a, target, 0.11, dt);
        if (it.a < 0.002 && target === 0) {
          if (it.lastA !== 0) {
            it.fx.style.setProperty('--iris-a', '0');
            it.lastA = 0;
          }
          continue;
        }

        it.hx = damp(it.hx, lx, 0.16, dt);
        it.hy = damp(it.hy, ly, 0.16, dt);

        /* hue tracks the pointer across the surface: left edge 0deg,
           right edge the reference's 160deg stop, with the vertical
           axis adding a smaller second component so a diagonal sweep
           does not read as a flat wipe */
        var hue = (it.hx / 100) * HUE_MAX + (it.hy / 100) * (HUE_MAX * 0.35);
        it.hue = damp(it.hue, hue, 0.18, dt);

        var s = it.fx.style;
        s.setProperty('--iris-a', it.a.toFixed(3));
        s.setProperty('--iris-x', it.hx.toFixed(1) + '%');
        s.setProperty('--iris-y', it.hy.toFixed(1) + '%');
        s.setProperty('--iris-h', it.hue.toFixed(1));
        it.lastA = it.a;
      }
    });
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  boot();
  window.silkIris = measure;
}());
