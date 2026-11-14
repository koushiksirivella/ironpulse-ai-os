// Motion.
//
// The rule this file obeys: strip every effect and the page must still look
// composed. Motion is the finish, never the structure. So nothing here creates
// layout, nothing here hides content permanently, and every element is fully
// visible and interactive before a single frame runs.
//
// That is not a style preference. An IntersectionObserver that never fires —
// print, an old browser, a headless screenshot, a crawler, a tab restored while
// scrolled past — must leave a readable shop behind, not a page of invisible
// cards. So `[data-j7-reveal]` is styled visible by default in engine.css and
// only ever animated once JS confirms the observer exists.
//
// No colour, no font, no network. See CLAUDE.md §1.

/** Honour the OS setting. Someone who asked for less motion asked for it. */
const wantsLess = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Tilt and magnetism are pointer affordances. A finger has no hover. */
const finePointer = () => typeof matchMedia === 'function' && matchMedia('(pointer: fine)').matches;

/**
 * Reveal on scroll.
 *
 * Marks the root as animating FIRST, which is what switches engine.css from
 * "everything visible" to "hidden until revealed". Do it the other way round
 * and there is a frame where the content is hidden with nothing coming to show
 * it again — that frame is the flash of empty page.
 */
function initReveal(root, host) {
  const targets = root.querySelectorAll('[data-j7-reveal]');
  if (!targets.length || typeof IntersectionObserver !== 'function') return () => {};

  host.setAttribute('data-j7-motion', 'on');

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.setAttribute('data-j7-in', '');
        io.unobserve(entry.target);
      }
    },
    // Fire slightly before the element arrives, so the reveal reads as the
    // element settling into place rather than as a delayed reaction to it.
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
  );

  // The stagger index is set per grid, not per page: a card in the third row of
  // the second category should not wait for a delay counted from the top of the
  // document. Capped, because a 40-item grid otherwise ends on a two-second wait.
  for (const grid of root.querySelectorAll('[data-j7-stagger]')) {
    [...grid.children].forEach((child, i) => child.style.setProperty('--j7-i', String(Math.min(i, 11))));
  }

  for (const t of targets) io.observe(t);
  return () => io.disconnect();
}

/**
 * Pointer tilt on cards.
 *
 * Written as two custom properties rather than a transform string so the skin
 * keeps control of the transform itself — a skin that wants tilt plus a lift,
 * or no tilt at all, changes CSS instead of this file.
 */
function initTilt(root) {
  if (!finePointer()) return () => {};
  const cards = [...root.querySelectorAll('[data-j7-tilt]')];
  if (!cards.length) return () => {};

  const off = [];
  for (const card of cards) {
    let frame = 0;

    const move = (e) => {
      if (frame) return; // one write per frame; pointermove fires far faster
      frame = requestAnimationFrame(() => {
        frame = 0;
        const r = card.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--j7-tilt-x', (-y * 5).toFixed(2) + 'deg');
        card.style.setProperty('--j7-tilt-y', (x * 5).toFixed(2) + 'deg');
        card.style.setProperty('--j7-px', (x * 100 + 50).toFixed(1) + '%');
        card.style.setProperty('--j7-py', (y * 100 + 50).toFixed(1) + '%');
      });
    };

    const leave = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      for (const p of ['--j7-tilt-x', '--j7-tilt-y', '--j7-px', '--j7-py']) card.style.removeProperty(p);
    };

    card.addEventListener('pointermove', move);
    card.addEventListener('pointerleave', leave);
    off.push(() => {
      cancelAnimationFrame(frame);
      card.removeEventListener('pointermove', move);
      card.removeEventListener('pointerleave', leave);
    });
  }
  return () => off.forEach((fn) => fn());
}

/**
 * Magnetic primary buttons: the button leans toward the cursor near it.
 *
 * Deliberately weak (max ~5px). A button that chases the pointer far enough to
 * be noticed is a button that is hard to click, and the primary CTA is the last
 * place to spend usability on delight.
 */
function initMagnetic(root) {
  if (!finePointer()) return () => {};
  const buttons = [...root.querySelectorAll('[data-j7-magnetic]')];
  if (!buttons.length) return () => {};

  const off = [];
  for (const btn of buttons) {
    let frame = 0;

    const move = (e) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const r = btn.getBoundingClientRect();
        btn.style.setProperty('--j7-mx', ((e.clientX - (r.left + r.width / 2)) * 0.16).toFixed(1) + 'px');
        btn.style.setProperty('--j7-my', ((e.clientY - (r.top + r.height / 2)) * 0.16).toFixed(1) + 'px');
      });
    };

    const leave = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      btn.style.removeProperty('--j7-mx');
      btn.style.removeProperty('--j7-my');
    };

    btn.addEventListener('pointermove', move);
    btn.addEventListener('pointerleave', leave);
    // A keyboard user never fires pointerleave, so a button focused after a
    // mouse pass would keep its offset forever.
    btn.addEventListener('blur', leave);
    off.push(() => {
      cancelAnimationFrame(frame);
      btn.removeEventListener('pointermove', move);
      btn.removeEventListener('pointerleave', leave);
      btn.removeEventListener('blur', leave);
    });
  }
  return () => off.forEach((fn) => fn());
}

/**
 * Turn motion on for a subtree.
 *
 * Called again after every repaint, because the catalog and cart are rebuilt
 * from scratch on change and the new nodes have no observers on them.
 *
 * @param {ParentNode} root  the subtree that was just painted
 * @param {Element} host     the element carrying `data-j7-motion`; defaults to <html>
 * @returns {() => void} teardown
 */
export function initMotion(root = document, host = document.documentElement) {
  if (typeof window === 'undefined' || wantsLess()) return () => {};

  const teardowns = [initReveal(root, host), initTilt(root), initMagnetic(root)];
  return () => teardowns.forEach((fn) => fn());
}
