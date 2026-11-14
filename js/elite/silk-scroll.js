/* =========================================================================
   SILK SCROLL v1.0 - one bus, one raf, zero jank.
   Vanilla. Zero dependencies.

   The doctrine (why this file exists):
     1. ONE scroll source of truth. Not N scroll listeners.
     2. ONE requestAnimationFrame for the whole page. Not one per feature.
     3. READ then WRITE, never interleaved. Layout thrash is the jank.
     4. Snapshots notify only when a value ACTUALLY changed.
     5. Rects are cached. Measuring in the frame loop is the other jank.
     6. Frame-rate independent damping. 144Hz must feel like 60Hz.

   Usage:
     const silk = SilkScroll.init({ container: '#scroll' });
     silk.onFrame((dt, t) => renderer.render());        // your WebGL here
     silk.track(el, {}, p => { ... });
     silk.stage(el, { stages: 8 }, (i, p, changed) => { ... });
     SilkScroll.reveal('.headline');
   ========================================================================= */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SilkScroll = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var RM = typeof matchMedia === 'function' &&
           matchMedia('(prefers-reduced-motion: reduce)').matches;

  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerpN = function (a, b, t) { return a + (b - a) * t; };

  /* Frame-rate independent exponential damping.
     `lerp` is expressed as "fraction closed per 60Hz frame", so a 144Hz
     display converges over the same wall-clock time, not 2.4x faster. */
  function damp(current, target, lerp, dt) {
    if (lerp >= 1) return target;
    var t = 1 - Math.pow(1 - lerp, dt * 60);
    return lerpN(current, target, t);
  }

  /* ---------------------------------------------------------------- BUS */
  /* A snapshot store. Subscribers are notified only when the snapshot
     actually differs - this is what stops a resize storm from rerunning
     every consumer 40 times. */
  function makeBus(initial, equal) {
    var snap = initial;
    var subs = new Set();
    return {
      get: function () { return snap; },
      set: function (next) {
        if (equal(snap, next)) return;
        snap = next;
        subs.forEach(function (fn) { fn(snap); });
      },
      subscribe: function (fn) {
        subs.add(fn);
        return function () { subs.delete(fn); };
      }
    };
  }

  /* ----------------------------------------------------- VIEWPORT BUS */
  var vpEqual = function (a, b) {
    return a.width === b.width && a.height === b.height &&
           a.vvh === b.vvh && a.dpr === b.dpr;
  };
  var viewport = makeBus(
    { width: 1, height: 1, vvh: 1, dpr: 1, orientation: 'portrait' },
    vpEqual
  );
  function readViewport() {
    var w = Math.max(1, window.innerWidth || 1);
    var h = Math.max(1, window.innerHeight || 1);
    var vv = window.visualViewport;
    return {
      width: w,
      height: h,
      vvh: Math.max(1, (vv && vv.height) || h),
      dpr: Math.max(1, window.devicePixelRatio || 1),
      orientation: w >= h ? 'landscape' : 'portrait'
    };
  }
  var vpBound = false;
  function bindViewport() {
    if (vpBound) return;
    vpBound = true;
    var push = function () { viewport.set(readViewport()); };
    addEventListener('resize', push, { passive: true });
    addEventListener('orientationchange', push, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', push, { passive: true });
    }
    push();
  }

  /* ------------------------------------------------------- SCROLL BUS */
  var scEqual = function (a, b) {
    return a.scrollTop === b.scrollTop && a.limit === b.limit &&
           a.velocity === b.velocity && a.viewportHeight === b.viewportHeight;
  };
  var scroll = makeBus(
    { scrollTop: 0, limit: 1, progress: 0, velocity: 0, direction: 0, viewportHeight: 1 },
    scEqual
  );

  /* --------------------------------------------------------- INSTANCE */
  var instance = null;

  function init(opts) {
    if (instance) return instance;
    opts = opts || {};

    var el = typeof opts.container === 'string'
      ? document.querySelector(opts.container)
      : (opts.container || null);

    /* No container -> drive the document. Container -> drive that element.
       Container mode is what lets a fixed WebGL layer and a fixed overlay
       never repaint while the content scrolls above them. */
    var isWin = !el;
    var lerp = opts.lerp == null ? 0.1 : opts.lerp;
    var wheelMul = opts.wheelMultiplier == null ? 1 : opts.wheelMultiplier;
    var touchMul = opts.touchMultiplier == null ? 1.6 : opts.touchMultiplier;
    var smooth = RM ? false : (opts.smooth !== false);

    var target = 0, current = 0, limit = 1, velocity = 0, direction = 0;
    var lastT = 0, raf = 0, running = false;
    var frameCbs = [];
    var tracked = [];
    var dirtyRects = true;

    var scroller = function () { return isWin ? document.scrollingElement : el; };
    var vh = function () { return isWin ? viewport.get().height : Math.max(1, el.clientHeight); };

    function measureLimit() {
      var s = scroller();
      limit = Math.max(1, s.scrollHeight - (isWin ? viewport.get().height : el.clientHeight));
    }

    /* Rect cache. Measured on resize + limit change, never per frame. */
    function measureRects() {
      var offset = isWin ? 0 : el.getBoundingClientRect().top;
      for (var i = 0; i < tracked.length; i++) {
        var t = tracked[i];
        var r = t.el.getBoundingClientRect();
        t.top = r.top + current - offset;
        t.height = r.height;
      }
      dirtyRects = false;
    }

    function publish() {
      scroll.set({
        scrollTop: current,
        limit: limit,
        progress: clamp(current / limit, 0, 1),
        velocity: velocity,
        direction: direction,
        viewportHeight: vh()
      });
    }

    /* ---- the single frame loop ------------------------------------- */
    function frame(now) {
      raf = requestAnimationFrame(frame);
      var dt = lastT ? Math.min(0.064, (now - lastT) / 1000) : 0.016;
      lastT = now;

      /* READ PHASE ------------------------------------------------- */
      if (smooth) {
        var prev = current;
        current = damp(current, target, lerp, dt);
        if (Math.abs(target - current) < 0.08) current = target;
        velocity = (current - prev) / Math.max(dt, 1e-6);
      } else {
        var raw = scroller().scrollTop;
        velocity = (raw - current) / Math.max(dt, 1e-6);
        current = target = raw;
      }
      direction = velocity > 0.5 ? 1 : velocity < -0.5 ? -1 : 0;

      if (dirtyRects && tracked.length) measureRects();

      /* WRITE PHASE ------------------------------------------------ */
      if (smooth) scroller().scrollTop = current;
      publish();

      var h = vh();
      for (var i = 0; i < tracked.length; i++) {
        var t = tracked[i];
        var s0 = t.start(t, h);
        var span = Math.max(1, t.end(t, h) - s0);
        var p = clamp((current - s0) / span, 0, 1);
        if (p !== t.last) { t.last = p; t.cb(p, t); }
      }

      for (var j = 0; j < frameCbs.length; j++) frameCbs[j](dt, now / 1000);
    }

    function start() {
      if (running) return;
      running = true; lastT = 0;
      raf = requestAnimationFrame(frame);
    }
    function stop() { running = false; cancelAnimationFrame(raf); }

    /* ---- input ------------------------------------------------------ */
    function onWheel(e) {
      if (!smooth) return;
      if (e.ctrlKey) return;                    // pinch-zoom is the OS's job
      e.preventDefault();
      var d = e.deltaMode === 1 ? e.deltaY * 16
            : e.deltaMode === 2 ? e.deltaY * vh()
            : e.deltaY;
      target = clamp(target + d * wheelMul, 0, limit);
    }
    var touchY = 0;
    function onTouchStart(e) { touchY = e.touches[0].clientY; }
    function onTouchMove(e) {
      if (!smooth) return;
      var y = e.touches[0].clientY;
      target = clamp(target + (touchY - y) * touchMul, 0, limit);
      touchY = y;
    }
    function onKey(e) {
      var tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' ||
          (e.target && e.target.isContentEditable)) return;
      var h = vh(), d = null;
      if (e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) d = h * 0.9;
      else if (e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) d = -h * 0.9;
      else if (e.key === 'ArrowDown') d = 90;
      else if (e.key === 'ArrowUp') d = -90;
      else if (e.key === 'Home') d = -limit;
      else if (e.key === 'End') d = limit;
      if (d === null) return;
      e.preventDefault();
      target = clamp(target + d, 0, limit);
    }

    var host = isWin ? window : el;
    host.addEventListener('wheel', onWheel, { passive: false });
    host.addEventListener('touchstart', onTouchStart, { passive: true });
    host.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('keydown', onKey);

    bindViewport();
    viewport.subscribe(function () { measureLimit(); dirtyRects = true; });

    var ro = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(function () { measureLimit(); dirtyRects = true; });
      ro.observe(isWin ? document.documentElement : el);
      if (!isWin && el.firstElementChild) ro.observe(el.firstElementChild);
    }

    measureLimit();
    current = target = scroller().scrollTop || 0;
    start();

    instance = {
      /* the single frame loop everything shares */
      onFrame: function (cb) {
        frameCbs.push(cb);
        return function () {
          var i = frameCbs.indexOf(cb);
          if (i > -1) frameCbs.splice(i, 1);
        };
      },

      /* scroll-linked progress for one element, 0..1, rect-cached */
      track: function (element, cfg, cb) {
        cfg = cfg || {};
        var rec = {
          el: element, cb: cb, last: -1, top: 0, height: 0,
          start: cfg.start || function (t, h) { return t.top - h; },
          end: cfg.end || function (t) { return t.top + t.height; }
        };
        tracked.push(rec);
        dirtyRects = true;
        return function () {
          var i = tracked.indexOf(rec);
          if (i > -1) tracked.splice(i, 1);
        };
      },

      /* Integer stage machine. The continuous value stays in the frame
         loop; only the integer crossing is flagged to your callback. This
         is what keeps a tall pinned section from rerendering 3000 times. */
      stage: function (element, cfg, cb) {
        var n = (cfg && cfg.stages) || 4;
        var lastIdx = -1;
        return this.track(element, {
          start: function (t) { return t.top; },
          end: function (t) { return t.top + t.height; }
        }, function (p, t) {
          var idx = clamp(Math.floor(p * n), 0, n - 1);
          var per = 1 / n;
          var inner = clamp((p - idx * per) / per, 0, 1);
          var changed = idx !== lastIdx;
          if (changed) lastIdx = idx;
          cb(idx, inner, changed, t);
        });
      },

      scrollTo: function (to, o) {
        o = o || {};
        var y = typeof to === 'number' ? to
              : (typeof to === 'string' ? document.querySelector(to) : to);
        if (typeof y !== 'number') {
          if (!y) return;
          var r = y.getBoundingClientRect();
          y = r.top + current - (isWin ? 0 : el.getBoundingClientRect().top);
        }
        y = clamp(y + (o.offset || 0), 0, limit);
        target = y;
        if (o.immediate || !smooth) { current = y; scroller().scrollTop = y; }
      },

      resize: function () { measureLimit(); dirtyRects = true; },
      get snapshot() { return scroll.get(); },
      get viewport() { return viewport.get(); },
      subscribe: scroll.subscribe,
      subscribeViewport: viewport.subscribe,
      element: el,
      start: start,
      stop: stop,
      destroy: function () {
        stop();
        host.removeEventListener('wheel', onWheel);
        host.removeEventListener('touchstart', onTouchStart);
        host.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('keydown', onKey);
        if (ro) ro.disconnect();
        instance = null;
      }
    };
    return instance;
  }

  /* ------------------------------------------------------------ REVEAL */
  /* Deterministic per-character stagger.

     The delay for each character is derived from a hash of the text, not
     from Math.random(). Same string always yields the same rhythm - so a
     server render and a client render agree, and a re-mount does not
     re-shuffle. Delay = an even ramp (70%) plus seeded jitter (35%),
     capped at the spread. The jitter is what stops it reading as a
     mechanical left-to-right wipe. */
  function fnv1a(str, salt) {
    var h = 0x811c9dc5;
    var s = salt ? str + ' ' + salt : str;
    for (var i = 0; i < s.length; i++) {
      h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
    }
    return h >>> 0;
  }
  function mulberry(seed) {
    return function () {
      seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var delayCache = new Map();
  function delaysFor(text, spread, salt) {
    var key = text + ' ' + spread + ' ' + (salt || '');
    var hit = delayCache.get(key);
    if (hit) return hit;
    var n = Array.from(text).length;
    var rnd = mulberry(fnv1a(text, salt));
    var out;
    if (n <= 0) out = [];
    else if (n === 1) out = [0];
    else out = Array.from({ length: n }, function (_, i) {
      var ramp = (i / (n - 1)) * spread * 0.7;
      var jit = rnd() * spread * 0.35;
      return Math.min(spread, ramp + jit);
    });
    delayCache.set(key, out);
    return out;
  }

  function revealEl(el, o) {
    o = o || {};
    var out = o.out === true;
    if (!out && el.dataset.silkRevealed === '1' && !o.force) return;
    var text = el.dataset.silkText != null ? el.dataset.silkText : el.textContent;
    el.dataset.silkText = text;
    var spread = o.spread == null ? 290 : o.spread;
    var dur = o.duration == null ? 0.23 : o.duration;
    var group = o.groupDelay || 0;
    var d = delaysFor(text, spread, out ? 'out' : '');
    var chars = Array.from(text);
    var frag = document.createDocumentFragment();

    /* Characters are wrapped per WORD, not loose in the parent.
       `.silk-char` is inline-block, and a run of loose inline-blocks lets
       the browser break a line between any two of them - which shreds
       words mid-syllable the moment a line is tight. The word wrapper is
       nowrap, so breaks can only happen at the real spaces between them. */
    var word = null;
    for (var i = 0; i < chars.length; i++) {
      if (chars[i] === ' ') {
        word = null;
        frag.appendChild(document.createTextNode(' '));
        continue;
      }
      if (!word) {
        word = document.createElement('span');
        word.className = 'silk-word';
        frag.appendChild(word);
      }
      var s = document.createElement('span');
      s.className = 'silk-char';
      s.textContent = chars[i];
      s.style.opacity = out ? '1' : '0';
      s.style.animation = (out ? 'silkFadeOut ' : 'silkFadeIn ') + dur + 's linear ' +
                          ((d[i] + group) / 1000) + 's forwards';
      word.appendChild(s);
    }
    el.textContent = '';
    el.appendChild(frag);
    el.dataset.silkRevealed = out ? '0' : '1';
  }

  function reveal(target, o) {
    o = o || {};
    var list = typeof target === 'string'
      ? document.querySelectorAll(target)
      : (target.length != null ? target : [target]);
    var step = o.groupDelay == null ? 100 : o.groupDelay;
    Array.prototype.forEach.call(list, function (el, i) {
      var opt = {};
      for (var k in o) opt[k] = o[k];
      opt.groupDelay = step * i;
      revealEl(el, opt);
    });
  }

  /* Reveal when the element first crosses into view. One shared
     IntersectionObserver per threshold, not one per element. */
  var observers = new Map();
  function revealOnEnter(target, o) {
    o = o || {};
    var th = o.threshold == null ? 0.25 : o.threshold;
    var key = th + '|' + (o.rootMargin || '') + '|' + (o.root ? '1' : '0');
    var obs = observers.get(key);
    if (!obs) {
      obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) {
            if (e.target._silkRepeat) e.target.dataset.silkRevealed = '0';
            return;
          }
          revealEl(e.target, e.target._silkOpts || {});
          if (!e.target._silkRepeat) obs.unobserve(e.target);
        });
      }, { threshold: th, rootMargin: o.rootMargin || '0px', root: o.root || null });
      observers.set(key, obs);
    }
    var list = typeof target === 'string'
      ? document.querySelectorAll(target)
      : (target.length != null ? target : [target]);
    var step = o.groupDelay == null ? 100 : o.groupDelay;
    Array.prototype.forEach.call(list, function (el, i) {
      var opt = {};
      for (var k in o) opt[k] = o[k];
      opt.groupDelay = step * i;
      el._silkOpts = opt;
      el._silkRepeat = !!o.repeat;
      obs.observe(el);
    });
  }

  /* -------------------------------------------------------- SVG SIGN */
  /* Draws an SVG path set as if handwritten: duration proportional to
     path length (so a long stroke does not finish as fast as a dot), each
     stroke starting just after the previous one lands. */
  function drawPaths(svg, o) {
    o = o || {};
    var speed = o.speed || 720;          // px of path length per second
    var gap = o.gap == null ? 0.03 : o.gap;
    var t = o.delay == null ? 0.5 : o.delay;
    var paths = svg.querySelectorAll(o.selector || 'path');
    Array.prototype.forEach.call(paths, function (p) {
      var len = p.getTotalLength();
      var dur = len / speed;
      p.style.setProperty('--silk-len', String(len));
      p.style.setProperty('--silk-dur', dur + 's');
      p.style.setProperty('--silk-delay', t + 's');
      p.style.strokeDasharray = String(len);
      p.style.strokeDashoffset = String(len);
      t += dur + gap;
    });
    svg.classList.add('is-drawing');
    return t;
  }

  return {
    init: init,
    get: function () { return instance; },
    reveal: reveal,
    revealOnEnter: revealOnEnter,
    drawPaths: drawPaths,
    delaysFor: delaysFor,
    viewport: viewport,
    scroll: scroll,
    damp: damp,
    clamp: clamp,
    reducedMotion: RM
  };
});
