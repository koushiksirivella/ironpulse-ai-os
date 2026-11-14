// ===========================================================================
// ELITE GYM — rider board.
//
// Built for a phone held in one hand, outdoors, possibly in the rain. Two
// tabs and nothing else: jobs going, and jobs I have taken.
//
// The delivery is closed with the customer's six-digit code, not a photo. A
// photo proves a doorstep was visited; a code proves the customer was there
// and took the bag. The code is never sent to this device — it goes to the
// server for comparison, because a code on the rider's own screen would prove
// nothing at all.
// ===========================================================================

import { el, mount } from '../engine/dom.js';
import * as api from '../admin/api.js';
import {
  icon, mark, chip, card, cardHead, button, empty, toast, modal,
  money, ago, stamp, initials, readPhone, orderItems, otpField, roleLogin, revealAll,
} from '../admin/ui.js';

const app = document.getElementById('app');

const state = { tenant: null, roles: [], board: [], mine: [], tab: 'board' };

const cur = () => state.tenant?.currency ?? 'INR';

// ------------------------------------------------------------------ actions

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

/**
 * The doorstep screen. Six boxes, one call, one outcome.
 *
 * Six wrong guesses locks the order server-side and the rider is told to ring
 * the gym — which is the correct end state for "the customer has lost their
 * code", and it is decided in the database rather than here, where it could be
 * skipped by reloading the page.
 */
function complete(o) {
  const status = el('p', { class: 'muted', style: { textAlign: 'center', marginTop: '14px' } },
    'Ask the customer for the six digits on their order.');

  const otp = otpField(async (code) => {
    status.textContent = 'Checking…';
    try {
      await api.verifyDeliveryOtp(o.id, code);
      close();
      toast(`${o.order_no ?? 'Order'} delivered`);
      await load();
    } catch (err) {
      status.textContent = err.message;
      otp.reset(true);
    }
  });

  const close = modal('Confirm delivery', el('div', {}, [
    el('p', { class: 'muted', style: { marginBottom: '20px' } },
      `${o.customer_name} · ${money(o.total, cur())}`),
    otp,
    status,
  ]));
  otp.focus();
}

// ------------------------------------------------------------------- cards

function jobCard(o, mine) {
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.address ?? '')}`;

  const actions = [];
  if (!mine && o.status === 'ready') {
    actions.push(button('Accept this run', {
      kind: 'btn--spring', icon: 'truck',
      onclick: (e) => act('Accepted — it is yours', () => api.acceptDelivery(o.id), e.currentTarget),
    }));
  }
  if (mine && o.status === 'out_for_delivery') {
    actions.push(button('Delivered — enter code', {
      kind: 'btn--spring', icon: 'check', onclick: () => complete(o),
    }));
  }

  return card([
    el('div', { class: 'job' }, [
      el('div', { class: 'job-head' }, [
        el('div', { class: 'avatar avatar--lg' }, initials(o.customer_name)),
        el('div', { style: { minWidth: 0 } }, [
          el('p', { class: 'job-no' }, o.order_no ?? o.id.slice(0, 8)),
          el('p', { class: 'job-who' }, o.customer_name),
          el('p', { class: 'job-meta' },
             mine && o.status === 'delivered'
               ? `Delivered ${stamp(o.delivered_at)}`
               : `Ready ${ago(o.ready_at ?? o.created_at)}`),
        ]),
        el('div', { class: 'spacer' }, chip(o.status)),
      ]),

      o.address
        ? el('div', { class: 'job-items' }, [
            el('div', { class: 'job-item' }, [
              el('span', { class: 'q' }, icon('pin', 14)),
              el('span', { class: 'n', style: { whiteSpace: 'normal' } }, o.address),
            ]),
          ])
        : null,

      orderItems(o.items, cur()),
      o.note ? el('div', { class: 'notice', 'data-kind': 'go' }, [el('b', {}, 'Note: '), o.note]) : null,

      el('div', { class: 'job-foot' }, [
        // Only reachable once the run is theirs. Handing a customer's phone
        // number to every rider looking at the open board is a privacy leak
        // with no upside — you do not need to ring someone to decide whether
        // to accept a job.
        mine
          ? el('a', { class: 'btn btn--sm', href: `tel:${String(o.phone).replace(/\s/g, '')}` },
               [icon('phone', 15), readPhone(o.phone)])
          : null,
        mine && o.address
          ? el('a', { class: 'btn btn--sm', href: mapHref, target: '_blank', rel: 'noopener' },
               [icon('pin', 15), 'Directions'])
          : null,
        el('span', { class: 'spacer mono muted' }, money(o.total, cur())),
        ...actions,
      ].filter(Boolean)),
    ]),
  ], { class: 'rise' });
}

// -------------------------------------------------------------------- shell

function render() {
  const active = state.mine.filter((o) => o.status === 'out_for_delivery');
  const done = state.mine.filter((o) => o.status === 'delivered');

  const tab = (key, label, n) => el('button', {
    class: `tab${state.tab === key ? ' is-active' : ''}`,
    onclick: () => { state.tab = key; render(); },
  }, [label, n ? el('span', { class: 'tab-n' }, String(n)) : null]);

  const list =
    state.tab === 'board'
      ? (state.board.length
          ? el('div', { class: 'grid grid--half' }, state.board.map((o) => jobCard(o, false)))
          : card([empty('No runs going',
              'Jobs appear the moment the kitchen marks a delivery order ready.')], { class: 'rise' }))
      : (state.mine.length
          ? el('div', { class: 'grid' }, [
              active.length
                ? el('div', { class: 'grid grid--half' }, active.map((o) => jobCard(o, true)))
                : null,
              done.length
                ? card([
                    cardHead('Delivered', el('span', { class: 'card-t' }, `${done.length} today`)),
                    el('div', { class: 'feed' }, done.map((o) =>
                      el('div', { class: 'feed-row' }, [
                        el('div', { class: 'avatar' }, initials(o.customer_name)),
                        el('div', {}, [
                          el('p', { class: 'who' }, o.customer_name),
                          el('p', { class: 'what' }, money(o.total, cur())),
                        ]),
                        el('span', { class: 'when' }, ago(o.delivered_at)),
                      ]))),
                  ], { class: 'rise' })
                : null,
            ].filter(Boolean))
          : card([empty('Nothing yet', 'Accept a run from the board and it shows up here.')],
                 { class: 'rise' }));

  mount(app, el('div', { class: 'main' }, [
    el('header', { class: 'topbar' }, [
      el('div', { class: 'row' }, [
        el('div', { class: 'avatar avatar--ink' }, mark(18)),
        el('b', { style: { fontSize: '17px', fontWeight: '800', letterSpacing: '-.02em' } }, 'RIDER'),
      ]),
      el('nav', { class: 'tabs' }, [
        tab('board', 'Available', state.board.length),
        tab('mine', 'My runs', active.length),
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
        el('h1', {}, state.tab === 'board' ? 'Runs going' : 'My runs'),
        el('p', {}, state.tab === 'board'
          ? 'First to accept takes it. Addresses and numbers appear once it is yours.'
          : 'Close each one with the customer’s six-digit code.'),
      ]),
    ]),
    el('div', { class: 'view' }, list),
  ]));

  revealAll(app);
}

// --------------------------------------------------------------------- data

async function load() {
  const me = api.currentUser()?.id;
  const [board, mine] = await Promise.all([
    api.listRiderBoard(state.tenant.id),
    me ? api.listMyRuns(state.tenant.id, me) : Promise.resolve([]),
  ]);
  state.board = board;
  state.mine = mine;
  render();
}

async function start() {
  mount(app, el('div', { class: 'login-wrap' }, el('p', { class: 'empty' }, 'Loading…')));

  const member = await api.amOperator().catch(() => false);
  if (member !== true) return denied('Your account is not registered with the gym yet.');

  state.roles = await api.myRoles().catch(() => []);
  if (!state.roles.includes('rider')) {
    return denied('This board is for riders. Ask the gym owner for the rider role.');
  }

  const tenants = await api.listTenants();
  if (!tenants.length) return denied('No gym is set up on this account yet.');
  state.tenant = tenants[0];

  await load();

  // 20s while awake. The open board is a race — a rider looking at a job that
  // was taken two minutes ago taps Accept and gets told off by an error, which
  // is a worse experience than the job simply not being there.
  setInterval(async () => {
    if (document.hidden) return;
    try {
      const before = state.board.length;
      await load();
      if (state.board.length > before && state.tab === 'board') toast('New run available');
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
    title: 'Rider sign in',
    sub: 'For the people on the road.',
    onSignedIn: async (email, password) => { await api.signIn(email, password); await start(); },
  }));
}

if (api.isSignedIn()) await start();
else boot();
