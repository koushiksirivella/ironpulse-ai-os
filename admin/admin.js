// ===========================================================================
// UNDERSTONE GYM OS™ (IRONPULSE AI) — Operator & Automation Command Console
// Built by Understone AI Automation (https://www.understone.in/)
// Contact: +91 81254 81616 · koushiksirivella@gmail.com
// ===========================================================================

import { el, mount } from '../engine/dom.js';
import * as api from './api.js';
import * as screens from './screens.js';
import {
  renewalsScreen, agentScreen, gateScreen, leadsScreen, outreachScreen,
  openAlertCounts, resetRecoveryDemo,
} from './recovery.js';
import { icon, mark, googleMark, button, field, toast, revealAll } from './ui.js';
import { hideTip } from './charts.js';

let PRESETS = [];
try { PRESETS = (await import('./presets.js')).PRESETS ?? []; } catch { /* optional */ }

const app = document.getElementById('app');

const NAV = [
  { key: 'renewals',  label: 'Renewals',   icon: 'clock' },
  { key: 'agent',     label: '24/7 Agent', icon: 'spark' },
  { key: 'gate',      label: 'CCTV Gate',  icon: 'flame' },
  { key: 'leads',     label: 'Leads & SEO',icon: 'phone' },
  { key: 'orders',    label: '10m Store',  icon: 'receipt' },
  { key: 'products',  label: 'Stacks',     icon: 'box' },
  { key: 'new',       label: 'New',        icon: 'plusSq' },
  { key: 'customers', label: 'Members',    icon: 'users' },
  { key: 'overview',  label: 'Overview',   icon: 'grid' },
  { key: 'brand',     label: 'Brand',      icon: 'gear' },
  { key: 'outreach',  label: 'Outreach',   icon: 'pin' },
];

const TITLES = {
  renewals:  ['Understone Gym Revenue Recovery OS', 'D-7, D-6, D-3, D-2, D-1 + Weekly direct payment links, verified UTR webhook & instant reminder suppression.'],
  agent:     ['24/7 AI Agent Builder & Message Recorder', 'Live recorded WhatsApp/Instagram messages, Indoor + Outdoor workout & diet builder, and 10-min supplement set upsells.'],
  gate:      ['CCTV AI Head-Tracking & Live Floor Stream', 'Existing camera head-tracking software: automatic IN / OUT floor count synced to your live 3D website + expired entry flags.'],
  leads:     ['Lead Recorder, Mobile/Laptop Command & Local SEO Radar', 'Control every automation from phone or laptop + capture nearby area search traffic within 5km.'],
  orders:    ['10-Minute Supplement Set Dispatch Board', 'Complete supplement stacks ordered online — dispatched in 10 minutes with 6-digit OTP handover.'],
  products:  ['Supplement Sets & Membership Plans', 'Complete supplement sets (Muscle, Cut, Recovery) and gym membership packages.'],
  new:       ['New Supplement Set or Plan', 'Add a supplement bundle or membership tier to the store.'],
  customers: ['Member & Buyer Registry', 'Who buys, how often, and active membership status.'],
  overview:  ['Executive Store & Fulfilment Overview', 'Supplement e-commerce revenue, order velocity, and kitchen/rider pipeline.'],
  media:     ['Media Library', 'Product & facility photography.'],
  brand:     ['White-Label Theme Engine', 'Restyle the live 3D gym & supplement store without a deploy.'],
  outreach:  ['Hyderabad ₹60K/Day Deal Closer Desk', 'Qualified gyms, Free Trial + 15-Day 100% Refund pitch scripts, and WhatsApp openers.'],
};

const state = {
  tab: 'renewals',
  demoMode: new URLSearchParams(location.search).get('auth') !== '1',
  editId: null,
  orderFilter: '',
  windowDays: 30,
  tenants: [], tenant: null,
  orders: [], products: [], categories: [],
  media: { uploads: [], builtIn: [], loaded: false },
  roles: [],
};

// ------------------------------------------------------------------ routing

function readHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  if (!raw) return;
  const [tab, query] = raw.split('?');
  if (NAV.some((n) => n.key === tab) || tab === 'media') state.tab = tab;
  const params = new URLSearchParams(query ?? '');
  state.orderFilter = params.get('filter') ?? '';
  state.editId = params.get('edit') ?? null;
}

function go(tab, opts = {}) {
  state.tab = tab;
  state.orderFilter = opts.filter ?? (tab === 'orders' ? state.orderFilter : '');
  state.editId = opts.edit ?? null;
  const params = new URLSearchParams();
  if (state.orderFilter) params.set('filter', state.orderFilter);
  if (state.editId) params.set('edit', state.editId);
  const q = params.toString();
  const next = `#/${tab}${q ? `?${q}` : ''}`;
  if (location.hash === next) render();
  else location.hash = next;
}

const ctx = { state, go, refresh };

// --------------------------------------------------------------------- data

async function loadAll() {
  const [orders, products, categories] = await Promise.all([
    api.listOrders(state.tenant.id, { limit: 500 }),
    api.listProducts(state.tenant.id),
    api.listCategories(state.tenant.id),
  ]);
  Object.assign(state, { orders, products, categories });

  const [uploads, builtIn] = await Promise.all([
    api.listUploads(state.tenant.slug).catch(() => []),
    api.listBuiltIn().catch(() => []),
  ]);
  state.media = { uploads: uploads ?? [], builtIn: builtIn ?? [], loaded: true };
}

async function refresh() {
  await loadAll();
  render();
}

// ------------------------------------------------------------------- chrome

function rail() {
  return el('aside', { class: 'rail' }, [
    el('a', { class: 'logo', href: '../', title: 'Understone AI Automation · Gym OS' }, mark(22)),
    el('nav', { class: 'rail-nav', 'aria-label': 'Sections' },
      NAV.map((n) => el('button', {
        class: `rail-btn${state.tab === n.key ? ' is-active' : ''}`,
        'aria-label': n.label,
        onclick: () => go(n.key),
      }, [icon(n.icon, 20), el('span', { class: 'rail-tip' }, n.label)]))),
    el('div', { class: 'rail-foot' },
      el('a', {
        class: 'rail-btn',
        href: 'https://www.understone.in/',
        target: '_blank',
        rel: 'noopener',
        'aria-label': 'Understone.in Agency',
      }, [icon('out', 20), el('span', { class: 'rail-tip' }, 'Understone.in')])),
  ]);
}

function topbar() {
  const waiting = state.orders.filter((o) => o.status === 'new').length;
  const alerts = openAlertCounts();

  const windowPick = el('select', {
    class: 'btn', 'aria-label': 'Reporting window',
    onchange: (e) => { state.windowDays = Number(e.target.value); render(); },
  }, [7, 30, 90].map((d) =>
    el('option', { value: d, selected: state.windowDays === d }, `Last ${d} days`)));

  return el('header', { class: 'topbar', id: 'topbar' }, [
    el('nav', { class: 'tabs', role: 'tablist' },
      NAV.filter((n) => n.key !== 'new').map((n) => {
        const badgeCount =
          n.key === 'orders'     ? waiting
          : n.key === 'renewals' ? alerts.renewals
          : n.key === 'agent'    ? alerts.agent
          : n.key === 'gate'     ? alerts.gate
          : n.key === 'leads'    ? alerts.leads
          : 0;
        return el('button', {
          class: `tab${state.tab === n.key ? ' is-active' : ''}`,
          role: 'tab', 'aria-selected': String(state.tab === n.key),
          onclick: () => go(n.key),
        }, [
          n.label,
          badgeCount
            ? el('span', { class: 'tab-n', 'data-n': String(badgeCount) }, String(badgeCount))
            : null,
        ]);
      })),

    el('div', { class: 'topbar-right' }, [
      el('a', {
        class: 'chip',
        'data-s': 'ready',
        href: 'https://www.understone.in/',
        target: '_blank',
        rel: 'noopener',
        style: { textDecoration: 'none' },
        title: 'Built by Understone AI Automation (+91 81254 81616)',
      }, 'UNDERSTONE.IN · +91 81254 81616'),
      state.tab === 'overview' ? windowPick : null,
      el('button', {
        class: 'icon-btn', 'aria-label': 'Reset / Refresh',
        onclick: async (e) => {
          const btn = e.currentTarget;
          btn.disabled = true;
          try {
            if (state.demoMode) { resetRecoveryDemo(render); }
            else { await refresh(); toast('Up to date'); }
          } catch (err) { toast(err.message, 'bad'); }
          finally { btn.disabled = false; }
        },
      }, icon('refresh', 18)),
      el('button', {
        class: 'icon-btn', 'aria-label': `${waiting} orders awaiting approval`,
        ...(waiting || alerts.gate ? { 'data-dot': '' } : {}),
        onclick: () => go(alerts.gate ? 'gate' : 'orders', { filter: 'new' }),
      }, icon('bell', 18)),
      el('div', { class: 'avatar avatar--ink', title: 'Koushik Sirivella · koushiksirivella@gmail.com' }, 'US'),
    ]),
  ]);
}

// -------------------------------------------------------------------- render

function render() {
  hideTip();
  const [title, sub] = TITLES[state.tab] ?? TITLES.renewals;

  const view =
    state.tab === 'overview'    ? screens.overview(ctx)
    : state.tab === 'renewals'  ? renewalsScreen(ctx)
    : state.tab === 'agent'     ? agentScreen(ctx)
    : state.tab === 'gate'      ? gateScreen(ctx)
    : state.tab === 'leads'     ? leadsScreen(ctx)
    : state.tab === 'outreach'  ? outreachScreen(ctx)
    : state.tab === 'orders'    ? screens.orders(ctx)
    : state.tab === 'products'  ? screens.products(ctx)
    : state.tab === 'new'       ? screens.newProduct(ctx)
    : state.tab === 'customers' ? screens.customers(ctx)
    : state.tab === 'media'     ? screens.media(ctx)
    :                             screens.brand(ctx, PRESETS);

  mount(app, el('div', { class: 'shell' }, [
    rail(),
    el('div', { class: 'main' }, [
      topbar(),
      state.tab === 'new' ? null : el('div', { class: 'page-head' }, [
        el('div', {}, [el('h1', {}, title), el('p', {}, sub)]),
        el('div', { class: 'spacer' }, [
          button('Owner Blueprint LP (/)', { icon: 'out', onclick: () => window.open('../', '_blank', 'noopener') }),
          button('3D Store (/store/)', { icon: 'out', onclick: () => window.open('../store/', '_blank', 'noopener') }),
          state.tab !== 'agent'
            ? button('24/7 AI Agent', { kind: 'btn--ink', icon: 'spark', onclick: () => go('agent') })
            : null,
          state.tab !== 'gate'
            ? button('CCTV Head-Track', { kind: 'btn--ink', icon: 'flame', onclick: () => go('gate') })
            : null,
          state.tab === 'orders' || state.tab === 'overview'
            ? button('Counter OTP Board', { icon: 'flame', onclick: () => window.open('../staff/', '_blank', 'noopener') })
            : null,
          state.tab === 'orders' || state.tab === 'overview'
            ? button('10-Min Rider App', { icon: 'truck', onclick: () => window.open('../rider/', '_blank', 'noopener') })
            : null,
        ].filter(Boolean)),
      ]),
      view,
    ]),
  ]));

  revealAll(app);
}

// ---------------------------------------------------------------- gatekeeping

function renderLogin(message) {
  const email = el('input', { class: 'input', type: 'email', autocomplete: 'username',
                              placeholder: 'koushiksirivella@gmail.com' });
  const password = el('input', { class: 'input', type: 'password', autocomplete: 'current-password' });
  const submit = el('button', { class: 'btn btn--spring btn--block', type: 'submit' }, 'Sign in');

  const form = el('form', {
    class: 'card login',
    onsubmit: async (e) => {
      e.preventDefault();
      submit.disabled = true;
      try { await api.signIn(email.value.trim(), password.value); await start(); }
      catch (err) { renderLogin(err.message); }
    },
  }, [
    el('div', { class: 'brand' }, [el('div', { class: 'mark' }, mark(24)), el('b', {}, 'UNDERSTONE GYM OS')]),
    el('h1', {}, 'Operator sign in'),
    el('p', { class: 'sub' }, 'Understone AI Automation · Autonomous Gym Operating System.'),
    message ? el('div', { class: 'notice', 'data-kind': 'stop', style: { marginBottom: '18px' } }, message) : null,

    el('button', { class: 'btn btn--block', type: 'button', onclick: () => api.signInWithGoogle() },
       [googleMark(), 'Continue with Google']),
    el('div', { class: 'or' }, 'or'),
    el('div', { class: 'f-stack' }, [
      field('Email', email),
      field('Password', password),
      submit,
      el('button', {
        class: 'btn btn--ink btn--block',
        type: 'button',
        onclick: () => startDemo(),
      }, 'Launch Interactive Demo Console (No Login)'),
    ]),
  ]);

  mount(app, el('div', { class: 'login-wrap' }, form));
  email.focus();
}

function startDemo() {
  state.demoMode = true;
  state.roles = ['operator', 'staff', 'rider'];
  state.tenant = {
    id: 'understone-gym-os',
    slug: 'ironpulse',
    name: 'IRONPULSE AI GYM (Understone OS)',
    currency: 'INR',
    whatsapp_number: '+918125481616',
    enquiry_email: 'koushiksirivella@gmail.com',
    address: 'Madhapur / Jubilee Hills Corridor, Hyderabad',
    hours: '05:30 AM – 10:30 PM',
    brand: {},
  };
  state.tenants = [state.tenant];
  state.categories = [
    { id: 'cat-1', name: 'Complete Supplement Sets (10-Min Delivery)', slug: 'supplements' },
    { id: 'cat-2', name: 'Memberships (Indoor + Outdoor AI Plan)', slug: 'memberships' },
    { id: 'cat-3', name: 'Personal Training', slug: 'pt' },
  ];
  state.products = [
    { id: 'p-1', name: 'Pro Muscle Complete Set (Isolate + Creatine + Pre)', kind: 'product', price: 7499, active: true, stock: 24 },
    { id: 'p-2', name: 'Lean Cut Complete Set (Zero-Carb Isolate + Carnitine)', kind: 'product', price: 6299, active: true, stock: 19 },
    { id: 'p-3', name: 'Daily Recovery Set (Whey + Creatine + Electrolytes)', kind: 'product', price: 4999, active: true, stock: 31 },
    { id: 'p-4', name: '3 Months Strength + Indoor/Outdoor AI Plan', kind: 'membership', price: 4500, active: true, stock: null },
    { id: 'p-5', name: '12 Months Annual Transformation Pass', kind: 'membership', price: 14999, active: true, stock: null },
  ];
  const now = Date.now();
  state.orders = [
    {
      id: 'o-1', order_no: 'IP-1094', customer_name: 'Aarav Reddy', phone: '9849011223',
      fulfilment: 'delivery', address: 'Plot 18, Madhapur High-Tech Rd (10-Min Express)', total: 7499, status: 'new',
      items: [{ name: 'Pro Muscle Complete Set (Isolate + Creatine + Pre)', price: 7499, qty: 1 }],
      created_at: new Date(now - 8 * 60000).toISOString(),
    },
    {
      id: 'o-2', order_no: 'IP-1093', customer_name: 'Sneha Rao', phone: '9885122334',
      fulfilment: 'delivery', address: 'Plot 42, Jubilee Hills Rd 36 (10-Min Express)', total: 6299, status: 'ready',
      items: [{ name: 'Lean Cut Complete Set (Zero-Carb Isolate + Carnitine)', price: 6299, qty: 1 }],
      created_at: new Date(now - 14 * 60000).toISOString(),
    },
    {
      id: 'o-3', order_no: 'IP-1092', customer_name: 'Siddharth Goud', phone: '9440788990',
      fulfilment: 'pickup_at_gym', total: 4999, status: 'delivered',
      items: [{ name: 'Daily Recovery Set (Whey + Creatine + Electrolytes)', price: 4999, qty: 1 }],
      created_at: new Date(now - 3600000 * 3).toISOString(),
    },
  ];
  if (!location.hash) state.tab = 'renewals';
  readHash();
  render();
  window.addEventListener('hashchange', () => { readHash(); render(); });
}

async function start() {
  return startDemo();
}

try {
  await api.captureOAuthRedirect();
  if (state.demoMode) startDemo();
  else if (api.isSignedIn()) await start();
  else renderLogin();
} catch {
  startDemo();
}
