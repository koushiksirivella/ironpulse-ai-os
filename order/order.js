// ===========================================================================
// ELITE GYM — "where is my order".
//
// The customer's end of the pipeline, and the only place the six-digit code
// is ever shown to anybody. It is minted when the kitchen marks the order
// ready, so it cannot appear on the checkout confirmation — this page is
// where the customer comes back to.
//
// Reads exactly one endpoint, order_status(order_no, phone), which is the only
// thing anon may read about an order. Order numbers are sequential per gym and
// therefore guessable, so the phone number is what actually authorises it.
// ===========================================================================

import { el, mount } from '../engine/dom.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../engine/config.js';
import {
  icon, mark, chip, card, button, field, toast,
  money, stamp, orderItems, FLOW, FLOW_LABEL, revealAll,
} from '../admin/ui.js';

const app = document.getElementById('app');

async function lookup(orderNo, phone) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/order_status`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ p_order_no: orderNo, p_phone: phone }),
  });
  if (!res.ok) throw new Error('Could not reach the gym just now. Try again in a moment.');
  const rows = await res.json();
  return Array.isArray(rows) ? rows[0] : rows;
}

// ------------------------------------------------------------------ screens

function form(prefill = {}, message) {
  const no = el('input', { class: 'input', value: prefill.no ?? '', placeholder: 'e.g. EG-0042',
                           autocomplete: 'off', spellcheck: 'false' });
  const ph = el('input', { class: 'input', value: prefill.phone ?? '', placeholder: '10-digit number',
                           inputmode: 'numeric', autocomplete: 'tel' });
  const go = el('button', { class: 'btn btn--spring btn--block', type: 'submit' }, 'Track my order');

  return el('form', {
    class: 'card login',
    onsubmit: async (e) => {
      e.preventDefault();
      go.disabled = true;
      try {
        const row = await lookup(no.value.trim(), ph.value.trim());
        if (!row) {
          go.disabled = false;
          return mount(app, el('div', { class: 'login-wrap' },
            form({ no: no.value, phone: ph.value },
              'No order matches that number and phone. Check both — the phone has to be the one on the order.')));
        }
        // Put it in the URL so a reload, or a link sent to whoever is actually
        // at home to receive it, lands straight on the order.
        const url = new URL(location.href);
        url.searchParams.set('no', row.order_no);
        url.searchParams.set('phone', ph.value.trim());
        history.replaceState({}, '', url);
        show(row, ph.value.trim());
      } catch (err) {
        go.disabled = false;
        toast(err.message, 'bad');
      }
    },
  }, [
    el('div', { class: 'brand' }, [el('div', { class: 'mark' }, mark(24)), el('b', {}, 'ELITE GYM')]),
    el('h1', {}, 'Track your order'),
    el('p', { class: 'sub' }, 'Your order number and the phone you gave at checkout.'),
    message ? el('div', { class: 'notice', 'data-kind': 'stop', style: { marginBottom: '18px' } }, message) : null,
    el('div', { class: 'f-stack' }, [field('Order number', no), field('Phone', ph), go]),
  ]);
}

function show(row, phone) {
  const isPickup = row.fulfilment === 'pickup_at_gym';
  const cur = row.currency ?? 'INR';

  // Where they are on the route. `confirmed` is the legacy spelling of
  // approved and has to land on the same step or an old order shows as lost.
  const key = row.status === 'confirmed' ? 'approved' : row.status;
  const at = FLOW.findIndex((s) => s.key === key);

  const track = el('div', { class: 'pipe' }, FLOW
    // A pickup never goes out for delivery; showing a step that will never
    // light up reads as a stuck order.
    .filter((s) => !(isPickup && s.key === 'out_for_delivery'))
    .map((s) => {
      const mine = FLOW.findIndex((f) => f.key === s.key);
      const done = at >= 0 && mine <= at;
      return el('div', { class: `pipe-step${done ? ' is-hot' : ''}` }, [
        el('b', {}, done ? '✓' : '·'),
        el('span', {}, s.key === 'delivered' && isPickup ? 'Collected' : s.short),
      ]);
    }));

  const headline =
    row.status === 'delivered' ? (isPickup ? 'Collected — enjoy it' : 'Delivered')
    : row.status === 'cancelled' ? 'This order was cancelled'
    : row.status === 'out_for_delivery' ? 'On the way to you'
    : row.status === 'ready' ? (isPickup ? 'Ready to collect' : 'Ready — a rider is on the way')
    : row.status === 'preparing' ? 'Being prepared'
    : 'We have your order';

  // The code. The whole reason this page exists.
  const codeBlock = row.code
    ? card([
        el('p', { class: 'card-t', style: { marginBottom: '10px' } },
          isPickup ? 'Show this at the counter' : 'Give this to the rider'),
        el('div', { class: 'otp', style: { justifyContent: 'flex-start' } },
          String(row.code).split('').map((d) =>
            el('div', {
              style: {
                width: '48px', height: '58px', display: 'grid', placeItems: 'center',
                borderRadius: '14px', background: 'var(--c-spring)', color: 'var(--c-ink)',
                fontFamily: 'var(--mono)', fontSize: '24px', fontWeight: '700',
              },
            }, d))),
        el('p', { class: 'muted', style: { marginTop: '14px', fontSize: '13.5px' } },
          isPickup
            ? 'Nobody can collect this order without it.'
            : 'Only give it once the order is actually in your hands — it is what marks the delivery complete.'),
      ], { class: 'rise', style: { '--d': '60ms' } })
    : null;

  mount(app, el('div', { class: 'main' }, [
    el('header', { class: 'topbar' }, [
      el('div', { class: 'row' }, [
        el('div', { class: 'avatar avatar--ink' }, mark(18)),
        el('b', { style: { fontSize: '17px', fontWeight: '800', letterSpacing: '-.02em' } }, 'ELITE GYM'),
      ]),
      el('div', { class: 'topbar-right' }, [
        el('button', {
          class: 'icon-btn', 'aria-label': 'Refresh',
          onclick: async (e) => {
            e.currentTarget.disabled = true;
            try { show(await lookup(row.order_no, phone), phone); toast('Up to date'); }
            catch (err) { toast(err.message, 'bad'); e.currentTarget.disabled = false; }
          },
        }, icon('refresh', 18)),
      ]),
    ]),

    el('div', { class: 'page-head' }, [
      el('div', {}, [
        el('h1', {}, headline),
        el('p', {}, `${row.order_no} · placed ${stamp(row.placed_at)}`),
      ]),
      el('div', { class: 'spacer' }, chip(row.status)),
    ]),

    el('div', { class: 'view' }, [
      row.status === 'cancelled' ? null : el('div', { class: 'rise' }, track),
      el('div', { style: { height: '18px' } }),
      el('div', { class: 'grid grid--half' }, [
        codeBlock,
        card([
          el('p', { class: 'card-t', style: { marginBottom: '12px' } }, 'Your order'),
          orderItems(row.items, cur),
          el('div', { class: 'row', style: { marginTop: '14px' } }, [
            el('span', { class: 'muted' }, isPickup ? 'Collecting at the gym' : 'Delivery'),
            el('span', { class: 'spacer strong mono' }, money(row.total, cur)),
          ]),
        ], { class: 'rise' }),
      ].filter(Boolean)),
      el('div', { style: { height: '18px' } }),
      el('div', { class: 'row' }, [
        button('Back to the shop', { icon: 'back', onclick: () => { location.href = '../'; } }),
      ]),
    ]),
  ]));

  revealAll(app);

  // Poll while the order is still moving, so someone watching the page sees
  // the code appear rather than having to guess when to reload. Stops dead on
  // a finished order: polling a delivered order forever is pure waste.
  if (['new', 'confirmed', 'approved', 'preparing', 'ready', 'out_for_delivery'].includes(row.status)) {
    setTimeout(async () => {
      if (document.hidden) return;
      try {
        const next = await lookup(row.order_no, phone);
        if (next && next.status !== row.status) show(next, phone);
        else if (next) show(next, phone);
      } catch { /* a dropped poll is not worth showing anyone */ }
    }, 25000);
  }
}

// ---------------------------------------------------------------------- boot

const params = new URLSearchParams(location.search);
const no = params.get('no');
const phone = params.get('phone');

if (no && phone) {
  mount(app, el('div', { class: 'login-wrap' }, el('p', { class: 'empty' }, 'Finding your order…')));
  try {
    const row = await lookup(no, phone);
    if (row) show(row, phone);
    else mount(app, el('div', { class: 'login-wrap' },
      form({ no, phone }, 'No order matches that number and phone.')));
  } catch (err) {
    mount(app, el('div', { class: 'login-wrap' }, form({ no, phone }, err.message)));
  }
} else {
  mount(app, el('div', { class: 'login-wrap' }, form({ no: no ?? '', phone: phone ?? '' })));
}
