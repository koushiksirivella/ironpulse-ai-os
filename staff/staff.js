// ===========================================================================
// ELITE GYM — kitchen board.
//
// The counter screen. Shows only work: orders an operator has approved and
// that nobody has handed over yet. Nothing on this page can create, price or
// cancel an order — a cook needs three buttons, and every extra control on a
// screen used with wet hands is a mis-tap waiting to happen.
//
// It is the same console.css as the admin. Deliberately: the two screens sit
// four feet apart in the same room, and a second look would read as a second
// product.
// ===========================================================================

import { el, mount } from '../engine/dom.js';
import * as api from '../admin/api.js';
import {
  icon, mark, chip, card, cardHead, button, empty, toast, modal,
  money, ago, initials, readPhone, orderItems, otpField, roleLogin, revealAll,
} from '../admin/ui.js';

const app = document.getElementById('app');

const state = { tenant: null, roles: [], jobs: [], tab: 'live' };

const cur = () => state.tenant?.currency ?? 'INR';

// ------------------------------------------------------------------ actions

/**
 * Every action re-reads the board afterwards rather than patching the row it
 * just changed. Two cooks on two tablets is the normal case, and a screen that
 * trusts its own last write is a screen that shows a job somebody else already
 * took.
 */
async function act(label, fn, btn) {
  if (btn) btn.disabled = true;
  try {
    await fn();
    toast(label);
    await load();
  } catch (err) {
    toast(err.message, 'bad');
    if (btn) btn.disabled = false;
  }
}

// -------------------------------------------------------------------- board

function jobCard(o) {
  const isPickup = o.fulfilment === 'pickup_at_gym';
  const waited = ago(o.approved_at ?? o.created_at);

  const actions = [];
  if (o.status === 'approved') {
    actions.push(button('Start preparing', {
      kind: 'btn--ink', icon: 'flame',
      onclick: (e) => act('Started', () => api.startPreparing(o.id), e.currentTarget),
    }));
  }
  if (o.status === 'preparing' || o.status === 'approved') {
    actions.push(button('Mark ready', {
      kind: 'btn--spring', icon: 'check',
      onclick: (e) => act(
        isPickup
          ? 'Ready — the customer has been sent their collection code'
          : 'Ready — it is on the rider board now',
        () => api.markReady(o.id),
        e.currentTarget
      ),
    }));
  }
  if (o.status === 'ready' && isPickup) {
    actions.push(button('Hand over', { kind: 'btn--spring', icon: 'check', onclick: () => handover(o) }));
  }
  if (o.status === 'ready' && !isPickup) {
    actions.push(el('span', { class: 'muted', style: { fontSize: '14px' } },
      'Waiting for a rider to accept it'));
  }

  return card([
    el('div', { class: 'job' }, [
      el('div', { class: 'job-head' }, [
        el('div', { class: 'avatar avatar--lg' }, initials(o.customer_name)),
        el('div', { style: { minWidth: 0 } }, [
          el('p', { class: 'job-no' }, o.order_no ?? o.id.slice(0, 8)),
          el('p', { class: 'job-who' }, o.customer_name),
          el('p', { class: 'job-meta' },
             `${isPickup ? 'Collecting at the gym' : 'For delivery'} · waiting ${waited}`),
        ]),
        el('div', { class: 'spacer' }, chip(o.status)),
      ]),
      orderItems(o.items, cur()),
      o.note
        ? el('div', { class: 'notice', 'data-kind': 'go' }, [
            el('b', {}, 'Note: '), o.note])
        : null,
      el('div', { class: 'job-foot' }, [
        el('span', { class: 'mono muted' }, money(o.total, cur())),
        el('div', { class: 'spacer row row--wrap' }, actions),
      ]),
    ]),
  ], { class: 'rise' });
}

/** Counter handover. The customer reads six digits out; staff types them in. */
function handover(o) {
  const status = el('p', { class: 'muted', style: { textAlign: 'center', marginTop: '14px' } },
    'Ask for the six-digit code on their order confirmation.');

  const otp = otpField(async (code) => {
    status.textContent = 'Checking…';
    try {
      await api.verifyPickupOtp(o.id, code);
      close();
      toast(`${o.order_no ?? 'Order'} handed over`);
      await load();
    } catch (err) {
      status.textContent = err.message;
      otp.reset(true);
    }
  });

  const close = modal(`Hand over ${o.order_no ?? 'order'}`, el('div', {}, [
    el('p', { class: 'muted', style: { marginBottom: '20px' } },
      `${o.customer_name} · ${readPhone(o.phone)}`),
    otp,
    status,
  ]));
  otp.focus();
}

// -------------------------------------------------------------------- shell

function render() {
  const live = state.jobs.filter((o) => o.status !== 'delivered');
  const byStage = {
    approved: live.filter((o) => o.status === 'approved' || o.status === 'confirmed'),
    preparing: live.filter((o) => o.status === 'preparing'),
    ready: live.filter((o) => o.status === 'ready'),
  };

  const strip = el('div', { class: 'pipe rise' }, [
    ['approved', 'To start'], ['preparing', 'In progress'], ['ready', 'Ready'],
  ].map(([k, label]) =>
    el('div', { class: `pipe-step${k === 'approved' && byStage[k].length ? ' is-hot' : ''}` }, [
      el('b', {}, String(byStage[k].length)),
      el('span', {}, label),
    ])));

  // Oldest first, always. A kitchen board sorted newest-first starves the
  // order that has already been waiting longest, which is the one the customer
  // is about to ring up about.
  const order = ['approved', 'confirmed', 'preparing', 'ready'];
  const sorted = [...live].sort((a, b) => {
    const s = order.indexOf(a.status) - order.indexOf(b.status);
    return s !== 0 ? s : new Date(a.created_at) - new Date(b.created_at);
  });

  mount(app, el('div', { class: 'main' }, [
    el('header', { class: 'topbar' }, [
      el('div', { class: 'row' }, [
        el('div', { class: 'avatar avatar--ink' }, mark(18)),
        el('b', { style: { fontSize: '17px', fontWeight: '800', letterSpacing: '-.02em' } }, 'KITCHEN'),
      ]),
      el('div', { class: 'topbar-right' }, [
        el('button', {
          class: 'icon-btn', 'aria-label': 'Refresh',
          onclick: async (e) => {
            e.currentTarget.disabled = true;
            try { await load(); toast('Up to date'); } catch (err) { toast(err.message, 'bad'); }
            e.currentTarget.disabled = false;
          },
        }, icon('refresh', 18)),
        el('button', {
          class: 'icon-btn', 'aria-label': 'Sign out',
          onclick: async () => { await api.signOut(); boot(); },
        }, icon('logout', 18)),
      ]),
    ]),
    el('div', { class: 'page-head' }, [
      el('div', {}, [
        el('h1', {}, 'Kitchen board'),
        el('p', {}, 'Approved orders, oldest first. Start one, then mark it ready.'),
      ]),
    ]),
    el('div', { class: 'view' }, [
      strip,
      el('div', { style: { height: '18px' } }),
      sorted.length
        ? el('div', { class: 'grid grid--half' }, sorted.map(jobCard))
        : card([empty('Nothing to make',
            'Approved orders land here the moment the counter approves them.')], { class: 'rise' }),
    ]),
  ]));

  revealAll(app);
}

// --------------------------------------------------------------------- data

async function load() {
  state.jobs = await api.listKitchenQueue(state.tenant.id);
  render();
}

async function start() {
  mount(app, el('div', { class: 'login-wrap' }, el('p', { class: 'empty' }, 'Loading…')));

  const member = await api.amOperator().catch(() => false);
  if (member !== true) return denied('Your account is not registered with the gym yet.');

  state.roles = await api.myRoles().catch(() => []);
  if (!state.roles.includes('staff') && !state.roles.includes('operator')) {
    return denied('This board is for kitchen staff. Ask the gym owner for the staff role.');
  }

  const tenants = await api.listTenants();
  if (!tenants.length) return denied('No gym is set up on this account yet.');
  state.tenant = tenants[0];

  await load();

  // 20s, and only while the screen is awake. Shorter than the admin's poll
  // because this board IS the queue — a cook staring at a stale screen is a
  // customer waiting for food nobody has started.
  setInterval(async () => {
    if (document.hidden) return;
    try {
      const before = state.jobs.length;
      state.jobs = await api.listKitchenQueue(state.tenant.id);
      if (state.jobs.length > before) toast('New order on the board');
      render();
    } catch { /* a dropped poll is not worth a toast */ }
  }, 20000);
}

function denied(message) {
  mount(app, el('div', { class: 'login-wrap' },
    el('div', { class: 'card login' }, [
      el('h1', {}, 'No access'),
      el('p', { class: 'sub' }, message),
      el('div', { class: 'row', style: { marginTop: '18px' } }, [
        button('Sign out', { kind: 'btn--ghost', onclick: async () => { await api.signOut(); boot(); } }),
      ]),
    ])));
}

function boot() {
  mount(app, roleLogin({
    title: 'Kitchen sign in',
    sub: 'For the people making the orders.',
    onSignedIn: async (email, password) => { await api.signIn(email, password); await start(); },
  }));
}

if (api.isSignedIn()) await start();
else boot();
