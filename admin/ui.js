// ===========================================================================
// ELITE GYM — shared UI vocabulary.
//
// Pure. Nothing in this file reads app state or calls the network, so the
// admin, staff and rider pages can all import it without dragging the admin's
// data layer into a rider's phone.
// ===========================================================================

import { el } from '../engine/dom.js';
import { formatMoney } from '../engine/money.js';

const NS = 'http://www.w3.org/2000/svg';

// ------------------------------------------------------------------- icons
//
// Inline, stroked, 24-grid. Inline rather than an icon font because a font
// that fails to load leaves boxes where the navigation used to be, and this
// page is the only way to run the shop.

const PATHS = {
  grid:    ['M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z'],
  receipt: ['M5 3h14v18l-2.5-1.6L14 21l-2-1.6L10 21l-2.5-1.6L5 21z', 'M9 8h6M9 12h6'],
  box:     ['M21 8 12 3 3 8v8l9 5 9-5z', 'M3 8l9 5 9-5', 'M12 13v8'],
  plus:    ['M12 5v14M5 12h14'],
  plusSq:  ['M4 4h16v16H4z', 'M12 9v6M9 12h6'],
  users:   ['M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8', 'M22 20v-2a4 4 0 0 0-3-3.9', 'M16 2.1a4 4 0 0 1 0 7.8'],
  image:   ['M3 3h18v18H3z', 'M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3', 'm21 15-5-5L5 21'],
  gear:    ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6', 'M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.8 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 13.9H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H10a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.8 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V10a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z'],
  search:  ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14', 'm20 20-3.2-3.2'],
  bell:    ['M18 8a6 6 0 1 0-12 0c0 7-2 8-2 8h16s-2-1-2-8', 'M13.7 21a2 2 0 0 1-3.4 0'],
  refresh: ['M21 12a9 9 0 1 1-2.6-6.4', 'M21 3v6h-6'],
  check:   ['m4 12 5 5L20 6'],
  x:       ['M6 6l12 12M18 6 6 18'],
  chev:    ['m6 9 6 6 6-6'],
  back:    ['M19 12H5', 'm11 18-6-6 6-6'],
  out:     ['M12 16V4', 'm7 9 5-5 5 5', 'M4 16v3h16v-3'],
  trash:   ['M4 7h16', 'M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2', 'm6.5 7 1 13h9l1-13'],
  flame:   ['M12 22a7 7 0 0 0 7-7c0-5-4-6-4-10 0 0-3 1.5-3 5 0-1.5-1-3-1-3s-6 3-6 8a7 7 0 0 0 7 7z'],
  truck:   ['M3 6h11v10H3z', 'M14 9h4l3 3v4h-7z', 'M7.5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4', 'M17.5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4'],
  pin:     ['M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0', 'M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5'],
  phone:   ['M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z'],
  logout:  ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'm16 17 5-5-5-5', 'M21 12H9'],
  clock:   ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18', 'M12 7v5l3 2'],
  bag:     ['M6 8h12l-1 12H7z', 'M9 8V6a3 3 0 0 1 6 0v2'],
};

export function icon(name, size = 20) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.8');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  for (const d of PATHS[name] ?? PATHS.grid) {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    svg.append(p);
  }
  return svg;
}

/** The wordmark tile. An E cut out of the accent square. */
export function mark(size = 22) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('d', 'M6 4h12M6 12h9M6 20h12M6 4v16');
  // currentColor, not a literal. The mark sits on spring in the rail and on
  // ink in the staff/rider headers; a hardcoded ink stroke made it a solid
  // black disc on the boards — invisible, and only visible in a screenshot.
  p.setAttribute('stroke', 'currentColor');
  p.setAttribute('stroke-width', '2.6');
  p.setAttribute('stroke-linecap', 'round');
  svg.append(p);
  return svg;
}

/** Google's mark, inline, so drawing the button fetches nothing from Google. */
export function googleMark() {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 48 48');
  svg.setAttribute('width', '18');
  svg.setAttribute('height', '18');
  svg.setAttribute('aria-hidden', 'true');
  const paths = [
    ['#FFC107', 'M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z'],
    ['#FF3D00', 'M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z'],
    ['#4CAF50', 'M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.2 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.4l-6.5 5C9.5 39.6 16.2 44 24 44z'],
    ['#1976D2', 'M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C39.1 35.9 44 30.6 44 24c0-1.2-.1-2.4-.4-3.5z'],
  ];
  for (const [fill, d] of paths) {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('fill', fill);
    p.setAttribute('d', d);
    svg.append(p);
  }
  return svg;
}

// ------------------------------------------------------------ the pipeline
//
// One definition of the order lifecycle, imported by all three pages. Three
// copies of this list is how a rider's screen ends up disagreeing with the
// admin's about what "ready" means.

export const FLOW = [
  { key: 'new',              label: 'Awaiting approval', short: 'New' },
  { key: 'approved',         label: 'Approved',          short: 'Approved' },
  { key: 'preparing',        label: 'Being prepared',    short: 'Preparing' },
  { key: 'ready',            label: 'Ready to collect',  short: 'Ready' },
  { key: 'out_for_delivery', label: 'Out for delivery',  short: 'On the way' },
  { key: 'delivered',        label: 'Delivered',         short: 'Delivered' },
];

export const FLOW_LABEL = Object.fromEntries(
  FLOW.map((s) => [s.key, s.short]).concat([['cancelled', 'Cancelled'], ['confirmed', 'Approved']])
);

/** A status chip. Colour is a brightness rank; see console.css. */
export const chip = (status) =>
  el('span', { class: 'chip', 'data-s': status }, FLOW_LABEL[status] ?? status);

// ----------------------------------------------------------------- format

export const money = (rupees, currency = 'INR') =>
  formatMoney(Math.round(Number(rupees || 0) * 100), currency);

/**
 * Relative time, and absolute past a week.
 *
 * "3 days ago" stops being useful the moment someone is looking for the order
 * from the 14th, so it switches to a date rather than counting forever.
 */
export function ago(iso) {
  if (!iso) return '—';
  const then = new Date(iso);
  const secs = (Date.now() - then.getTime()) / 1000;
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)} min`;
  if (secs < 86400) return `${Math.floor(secs / 3600)} h`;
  if (secs < 604800) return `${Math.floor(secs / 86400)} d`;
  return then.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export const stamp = (iso) =>
  iso ? new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  }) : '—';

/** Two initials from a name, for the avatar discs. */
export function initials(name) {
  const parts = String(name || '?').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

/** A phone number a human can read back over a noisy gym floor. */
export const readPhone = (p) => {
  const d = String(p || '').replace(/\D/g, '');
  return d.length === 10 ? `${d.slice(0, 5)} ${d.slice(5)}` : p || '—';
};

// ------------------------------------------------------------- primitives

export const card = (children, props = {}) =>
  el('section', { ...props, class: `card ${props.class ?? ''}`.trim() }, children);

export const cardHead = (title, ...right) =>
  el('div', { class: 'card-head' }, [
    el('h2', {}, title),
    right.length ? el('div', { class: 'spacer row' }, right.filter(Boolean)) : null,
  ]);

export const field = (labelText, control, hint) =>
  el('label', { class: 'f' }, [
    el('span', {}, labelText),
    control,
    hint ? el('small', {}, hint) : null,
  ]);

export const button = (text, props = {}) => {
  const { icon: ic, kind = '', ...rest } = props;
  return el('button', { type: 'button', ...rest, class: `btn ${kind} ${rest.class ?? ''}`.trim() },
    [ic ? icon(ic, 17) : null, text]);
};

export const empty = (title, note) =>
  el('div', { class: 'empty' }, [el('b', {}, title), note]);

/** Toasts stack rather than overwrite; two failures in a row must both show. */
export function toast(message, kind = 'ok') {
  const node = el('div', { class: 'toast', 'data-kind': kind, role: 'status' }, message);
  document.body.append(node);
  setTimeout(() => node.remove(), 3200);
}

/**
 * Reveal on enter. One observer for the whole page, disconnected per render —
 * an observer per element is one of the four things that make a page heavy.
 */
let revealObserver = null;
export function revealAll(root = document) {
  revealObserver?.disconnect();
  const targets = root.querySelectorAll('.rise:not(.is-in)');
  if (!targets.length) return;
  revealObserver = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      revealObserver.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  targets.forEach((t) => revealObserver.observe(t));
}

/** A modal that closes on Escape, on scrim click, and returns focus. */
export function modal(title, body, actions = []) {
  const wasFocused = document.activeElement;
  const close = () => {
    scrim.remove();
    document.removeEventListener('keydown', onKey);
    wasFocused?.focus?.();
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };

  const box = el('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' }, [
    el('div', { class: 'modal-head' }, [
      el('h2', {}, title),
      el('button', { class: 'icon-btn spacer', 'aria-label': 'Close', onclick: close }, icon('x', 18)),
    ]),
    body,
    actions.length ? el('div', { class: 'row row--wrap', style: { marginTop: '20px' } }, actions) : null,
  ]);

  const scrim = el('div', {
    class: 'scrim',
    onclick: (e) => { if (e.target === scrim) close(); },
  }, box);

  document.addEventListener('keydown', onKey);
  document.body.append(scrim);
  box.querySelector('input,select,textarea,button:not(.icon-btn)')?.focus();
  return close;
}

/**
 * Items on an order are a FROZEN SNAPSHOT of name and price at purchase time.
 * Never look the product up to redraw a historical order — a price change
 * would silently rewrite what a customer was charged last month.
 */
export const orderItems = (items, currency = 'INR') =>
  el('div', { class: 'job-items' },
    (Array.isArray(items) ? items : []).map((it) =>
      el('div', { class: 'job-item' }, [
        el('span', { class: 'q' }, `${it.qty ?? 1}×`),
        el('span', { class: 'n' }, it.name ?? 'Item'),
        el('span', { class: 'p' }, money((it.price ?? 0) * (it.qty ?? 1), currency)),
      ])));

// --------------------------------------------------------------------- OTP
//
// Six boxes, one digit each. Shared by the rider's doorstep screen and the
// staff counter screen so the two never drift apart.
//
// The code is NEVER compared here. `onDone` hands it to the server, which
// holds the answer. Comparing in the browser would put the answer on the
// screen of the person being checked, which is the whole thing this exists to
// prevent.

export function otpField(onDone) {
  const boxes = Array.from({ length: 6 }, (_, i) =>
    el('input', {
      class: '', type: 'text', inputmode: 'numeric', autocomplete: 'one-time-code',
      maxLength: 1, 'aria-label': `Digit ${i + 1}`,
    }));

  const read = () => boxes.map((b) => b.value).join('');

  const sync = () => {
    for (const b of boxes) {
      if (b.value) b.setAttribute('data-filled', '');
      else b.removeAttribute('data-filled');
    }
  };

  boxes.forEach((box, i) => {
    box.addEventListener('input', () => {
      box.value = box.value.replace(/\D/g, '').slice(0, 1);
      sync();
      if (box.value && i < 5) boxes[i + 1].focus();
      if (read().length === 6) onDone(read());
    });
    // Backspace on an empty box steps back. Without this, correcting a typo
    // means clicking each box, which on a phone in the rain is unusable.
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && i > 0) {
        boxes[i - 1].focus();
        boxes[i - 1].value = '';
        sync();
        e.preventDefault();
      }
    });
    // A pasted code fills the whole row rather than dropping five digits.
    box.addEventListener('paste', (e) => {
      const text = (e.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, 6);
      if (!text) return;
      e.preventDefault();
      text.split('').forEach((ch, k) => { if (boxes[k]) boxes[k].value = ch; });
      sync();
      boxes[Math.min(text.length, 5)].focus();
      if (text.length === 6) onDone(text);
    });
  });

  const wrap = el('div', { class: 'otp-wrap' }, el('div', { class: 'otp' }, boxes));

  wrap.reset = (wrong = false) => {
    for (const b of boxes) b.value = '';
    sync();
    if (wrong) {
      wrap.classList.add('is-wrong');
      setTimeout(() => wrap.classList.remove('is-wrong'), 460);
    }
    boxes[0].focus();
  };
  wrap.focus = () => boxes[0].focus();
  return wrap;
}

/**
 * A sign-in card for the staff and rider pages.
 *
 * Deliberately the same component for both: a rider and a cook signing in to
 * different-looking boxes is how a support call starts with ten minutes of
 * working out which screen someone is actually on.
 */
export function roleLogin({ title, sub, onSignedIn, onError }) {
  const email = el('input', { class: 'input', type: 'email', autocomplete: 'username',
                              placeholder: 'you@elitegym.in' });
  const password = el('input', { class: 'input', type: 'password', autocomplete: 'current-password' });
  const submit = el('button', { class: 'btn btn--spring btn--block', type: 'submit' }, 'Sign in');
  const err = el('div', { class: 'notice', 'data-kind': 'stop', style: { marginBottom: '18px' } });
  err.hidden = true;

  const form = el('form', {
    class: 'card login',
    onsubmit: async (e) => {
      e.preventDefault();
      submit.disabled = true;
      err.hidden = true;
      try {
        await onSignedIn(email.value.trim(), password.value);
      } catch (ex) {
        err.textContent = ex.message;
        err.hidden = false;
        submit.disabled = false;
        onError?.(ex);
      }
    },
  }, [
    el('div', { class: 'brand' }, [el('div', { class: 'mark' }, mark(24)), el('b', {}, 'ELITE GYM')]),
    el('h1', {}, title),
    el('p', { class: 'sub' }, sub),
    err,
    el('div', { class: 'f-stack' }, [
      field('Email', email),
      field('Password', password),
      submit,
    ]),
  ]);

  queueMicrotask(() => email.focus());
  return el('div', { class: 'login-wrap' }, form);
}
