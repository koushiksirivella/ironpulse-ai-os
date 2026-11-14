/* ==========================================================================
   ELITE GYM — shop chrome.

   One job: make the checkout reachable.

   The cart and the checkout render at the foot of the catalogue, which across
   five categories is about four thousand pixels below the first Add button.
   Both worked; neither could be found. This wires a bar that appears the
   moment the cart stops being empty and takes you straight there.
   ========================================================================== */
(function () {
  'use strict';

  var bar = document.getElementById('cart-jump');
  var num = document.getElementById('cart-jump-n');
  var count = document.querySelector('[data-j7-mount="cart-count"]');
  var panels = document.getElementById('s-cart');
  if (!bar || !num || !count || !panels) return;

  var items = 0;
  var atCheckout = false;
  var top = 0;

  /* Outer scope on purpose: this file is strict, so a `function measure()`
     declared inside the `if (silk)` block below is block-scoped and readCount
     could not see it. */
  function measure() {
    var vp = document.querySelector('.silk-viewport');
    if (!vp) return;
    top = panels.getBoundingClientRect().top - vp.getBoundingClientRect().top + vp.scrollTop;
  }

  function paint() {
    /* Hidden when the cart is empty, and hidden again once the checkout is
       actually on screen — a fixed bar sitting on top of the form you just
       asked someone to fill in is worse than no bar at all. */
    var show = items > 0 && !atCheckout;
    bar.classList.toggle('is-on', show);
    bar.setAttribute('aria-hidden', show ? 'false' : 'true');
    bar.setAttribute('tabindex', show ? '0' : '-1');
    num.textContent = String(items);
  }

  function readCount() {
    var n = parseInt((count.textContent || '').trim(), 10);
    items = isNaN(n) ? 0 : n;
    measure();
    paint();
  }

  /* The engine owns everything inside its mount nodes and does not emit an
     event when the cart changes, so the counter it paints IS the signal.
     Watching one node is cheap; re-querying on a timer would not be. */
  new MutationObserver(readCount).observe(count, {
    childList: true,
    characterData: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['hidden'],
  });

  /* Never a raw scroll listener — there is exactly one scroll source on this
     page and it lives in the silk runtime. Rects are cached and only
     remeasured when the viewport actually changes, because measuring inside a
     scroll callback is the other half of what makes a page feel heavy. */
  var silk = window.SilkScroll && window.SilkScroll.get();
  if (silk) {
    /* This script runs before the engine has fetched a single product, so a
       measurement taken now puts the cart about three thousand pixels too
       high -- and the bar then vanished while the checkout was still a
       screen and a half away, which looks exactly like the bar failing.
       The catalogue is what moves it, and the catalogue is always painted
       before anyone can add to a cart, so re-measuring on a cart change is
       both the cheapest hook and a guaranteed-late one. */
    measure();
    silk.subscribeViewport(measure);
    silk.subscribe(function (s) {
      var next = s.scrollTop + s.viewportHeight > top + 120;
      if (next === atCheckout) return;   // only repaint on an actual change
      atCheckout = next;
      paint();
    });
  }

  readCount();
}());
