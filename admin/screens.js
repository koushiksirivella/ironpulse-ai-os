// ===========================================================================
// ELITE GYM — the operator console screens.
//
// Every screen is a pure function of `ctx` and returns a detached node. None
// of them fetches: `admin.js` owns loading and hands the data down. That split
// is what makes a screen testable and what stops seven screens each inventing
// their own idea of when to refresh.
// ===========================================================================

import { el, mount, clear } from '../engine/dom.js';
import * as api from './api.js';
import {
  icon, chip, card, cardHead, field, button, empty, toast, modal,
  money, ago, stamp, initials, readPhone, orderItems, FLOW, FLOW_LABEL,
} from './ui.js';
import { barChart, sparkline, donut, byDay, dayLabel, delta, fmtDelta, compact } from './charts.js';

const cur = (ctx) => ctx.state.tenant?.currency ?? 'INR';

// ═══════════════════════════════════════════════════════ 1 · OVERVIEW ═════
//
// The board. Answers, in one screen: what is waiting on me right now, is the
// shop growing, what sells, and who just bought something.

export function overview(ctx) {
  const { orders, products, windowDays } = ctx.state;
  const c = cur(ctx);

  // ---- the pipeline strip. This is the first thing on the page because it
  // is the only part that is a TO-DO list rather than a report.
  const counts = {};
  for (const o of orders) counts[o.status] = (counts[o.status] ?? 0) + 1;
  counts.approved = (counts.approved ?? 0) + (counts.confirmed ?? 0);

  const pipe = el('div', { class: 'pipe rise' },
    FLOW.map((s) => {
      const n = counts[s.key] ?? 0;
      // "Hot" is the operator's own queue — orders that cannot move until a
      // human here approves them. Nothing else on the strip is actionable.
      const hot = s.key === 'new' && n > 0;
      return el('button', {
        class: `pipe-step${hot ? ' is-hot' : ''}`,
        onclick: () => ctx.go('orders', { filter: s.key }),
        title: `Show ${s.label.toLowerCase()}`,
      }, [el('b', {}, String(n)), el('span', {}, s.short)]);
    }));

  // ---- KPI row. Compared against the previous window of the same length, so
  // "this month vs last month" is a real comparison and not a vibe.
  const now = Date.now();
  const winMs = windowDays * 86400000;
  const paid = (o) => o.status !== 'cancelled';
  const inWin = orders.filter((o) => paid(o) && now - new Date(o.created_at) < winMs);
  const prevWin = orders.filter((o) => {
    const age = now - new Date(o.created_at);
    return paid(o) && age >= winMs && age < winMs * 2;
  });

  const sum = (rows) => rows.reduce((t, o) => t + Number(o.total || 0), 0);
  const rev = sum(inWin);
  const revPrev = sum(prevWin);
  const people = new Set(inWin.map((o) => o.phone)).size;
  const peoplePrev = new Set(prevWin.map((o) => o.phone)).size;
  const avg = inWin.length ? rev / inWin.length : 0;
  const avgPrev = prevWin.length ? revPrev / prevWin.length : 0;

  const series = byDay(inWin, windowDays, (o) => Number(o.total || 0));

  const kpi = (label, value, was, now_, sub, art) => {
    const d = delta(now_, was);
    return card([
      el('div', { class: 'kpi' }, [
        el('div', { class: 'kpi-top' }, [
          el('div', {}, [
            el('p', { class: 'kpi-label' }, label),
            el('div', { class: 'kpi-row', style: { marginTop: '10px' } }, [
              el('span', { class: 'kpi-v' }, value),
              el('span', { class: 'delta', 'data-dir': d.dir }, fmtDelta(d)),
            ]),
          ]),
          art ? el('div', { class: 'kpi-art' }, art) : null,
        ]),
        el('p', { class: 'kpi-sub' }, sub),
      ]),
    ], { class: 'rise' });
  };

  const kpis = el('div', { class: 'grid grid--kpi' }, [
    kpi('Total revenue', money(rev, c), revPrev, rev,
        `${money(revPrev, c)} previous ${windowDays} days`,
        sparkline(series.map((d) => d.value), { width: 150, height: 54, label: 'Revenue trend' })),
    kpi('Orders', String(inWin.length), prevWin.length, inWin.length,
        `${prevWin.length} previous ${windowDays} days`,
        sparkline(series.map((d) => d.count), { width: 150, height: 54, label: 'Order trend' })),
    kpi('Customers', String(people), peoplePrev, people,
        `${peoplePrev} previous ${windowDays} days`,
        donut(people + peoplePrev ? (people / (people + peoplePrev)) * 100 : 0,
              { size: 62, stroke: 11, center: false, label: 'Share of customers' })),
    kpi('Average order', money(avg, c), avgPrev, avg,
        `${money(avgPrev, c)} previous ${windowDays} days`),
  ]);

  // ---- the big chart: revenue per day, with order count as the ghost.
  const peakRev = Math.max(1, ...series.map((d) => d.value));
  const peakCount = Math.max(1, ...series.map((d) => d.count));
  const bars = series.map((d) => ({
    label: dayLabel(d.date),
    value: d.value,
    // Order count is rescaled onto the revenue axis so the two live in one
    // frame. It is a SHAPE comparison, not a second readable axis — which is
    // why the tooltip prints the real number and the axis never does.
    ghost: (d.count / peakCount) * peakRev,
    tip: [
      { label: d.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' }), value: '' },
      { dot: true, label: 'Revenue', value: money(d.value, c) },
      { dot: 'mute', label: 'Orders', value: String(d.count) },
    ],
  }));

  const board = card([
    cardHead('Sales analytics',
      el('div', { class: 'legend' }, [
        el('span', {}, [el('i', {}), 'Revenue']),
        el('span', {}, [el('i', { 'data-mute': '' }), 'Orders']),
      ])),
    barChart(bars, {
      height: 300, label: 'Revenue per day',
      format: (v) => compact(v), every: Math.ceil(windowDays / 8),
    }),
  ], { class: 'rise', style: { '--d': '60ms' } });

  // ---- what actually sells. Counted off the frozen item snapshots, which is
  // the only honest source: a product renamed last week still sold under its
  // old name and that is what the customer bought.
  const tally = new Map();
  for (const o of inWin) {
    for (const it of Array.isArray(o.items) ? o.items : []) {
      const key = it.name ?? 'Item';
      const prev = tally.get(key) ?? { qty: 0, rev: 0 };
      prev.qty += Number(it.qty ?? 1);
      prev.rev += Number(it.price ?? 0) * Number(it.qty ?? 1);
      tally.set(key, prev);
    }
  }
  const top = [...tally.entries()].sort((a, b) => b[1].rev - a[1].rev).slice(0, 6);
  const topPeak = Math.max(1, ...top.map(([, v]) => v.rev));

  const sellers = card([
    cardHead('Top sellers', el('span', { class: 'card-t' }, `last ${windowDays} days`)),
    top.length
      ? el('div', { class: 'share' }, top.map(([name, v], i) => {
          const fill = el('div', { class: 'fill', style: { '--d': `${i * 70}ms` } });
          requestAnimationFrame(() => { fill.style.width = `${(v.rev / topPeak) * 100}%`; });
          return el('div', { class: 'share-row' }, [
            el('span', { class: 'rank' }, String(i + 1).padStart(2, '0')),
            el('div', {}, [
              el('p', { class: 'nm' }, name),
              el('div', { class: 'track', style: { marginTop: '7px' } }, fill),
            ]),
            el('span', { class: 'pc' }, money(v.rev, c)),
          ]);
        }))
      : empty('Nothing sold yet', 'Top sellers appear once the first order is in.'),
  ], { class: 'rise', style: { '--d': '120ms' } });

  // ---- live feed
  const feed = card([
    cardHead('Last activity', button('See all', { kind: 'btn--ghost btn--sm', onclick: () => ctx.go('orders') })),
    orders.length
      ? el('div', { class: 'feed' }, orders.slice(0, 7).map((o) =>
          el('div', { class: 'feed-row' }, [
            el('div', { class: 'avatar' }, initials(o.customer_name)),
            el('div', { style: { minWidth: 0 } }, [
              el('p', { class: 'who' }, o.customer_name),
              el('p', { class: 'what' }, `${FLOW_LABEL[o.status] ?? o.status} · ${money(o.total, c)}`),
            ]),
            el('span', { class: 'when' }, ago(o.created_at)),
          ])))
      : empty('No orders yet', 'The feed fills as the shop takes orders.'),
  ], { class: 'rise', style: { '--d': '60ms' } });

  const stock = products.filter((p) => p.active !== false);

  return el('div', { class: 'view' }, [
    pipe,
    el('div', { style: { height: '18px' } }),
    kpis,
    el('div', { style: { height: '18px' } }),
    el('div', { class: 'grid grid--board' }, [
      el('div', { class: 'grid' }, [sellers, feed]),
      board,
    ]),
    el('div', { style: { height: '18px' } }),
    card([
      cardHead('Catalogue', el('span', { class: 'card-t' }, `${stock.length} live`)),
      productTable(ctx, stock.slice(0, 8)),
    ], { class: 'rise' }),
  ]);
}

// ═══════════════════════════════════════════════════════════ 2 · ORDERS ═══
//
// The complete order book. Filter, inspect, approve, cancel — and watch a
// row travel the pipeline without leaving the screen.

export function orders(ctx) {
  const { orders: rows, orderFilter } = ctx.state;
  const c = cur(ctx);

  const shown = orderFilter
    ? rows.filter((o) => (orderFilter === 'approved'
        ? o.status === 'approved' || o.status === 'confirmed'
        : o.status === orderFilter))
    : rows;

  const counts = {};
  for (const o of rows) counts[o.status] = (counts[o.status] ?? 0) + 1;
  counts.approved = (counts.approved ?? 0) + (counts.confirmed ?? 0);

  const filters = el('div', { class: 'row row--wrap', style: { marginBottom: '18px' } },
    [{ key: '', short: 'All', n: rows.length }]
      .concat(FLOW.map((s) => ({ ...s, n: counts[s.key] ?? 0 })))
      .concat([{ key: 'cancelled', short: 'Cancelled', n: counts.cancelled ?? 0 }])
      .map((s) => el('button', {
        class: `tab${orderFilter === s.key ? ' is-active' : ''}`,
        onclick: () => ctx.go('orders', { filter: s.key }),
      }, [s.short, el('span', { class: 'tab-n', 'data-n': String(s.n) }, String(s.n))])));

  const body = el('tbody', {}, shown.map((o) => orderRow(ctx, o, c)));

  return el('div', { class: 'view' }, [
    filters,
    card([
      shown.length
        ? el('div', { class: 'table-wrap' },
            el('table', { class: 'table' }, [
              el('thead', {}, el('tr', {}, [
                el('th', {}, 'Order'), el('th', {}, 'Customer'), el('th', {}, 'Items'),
                el('th', {}, 'Fulfilment'), el('th', {}, 'Status'),
                el('th', { class: 'num' }, 'Total'), el('th', {}, 'Placed'), el('th', {}, ''),
              ])),
              body,
            ]))
        : empty('Nothing here',
            orderFilter ? 'No orders in this stage right now.' : 'No orders yet.'),
    ], { class: 'card--flush rise' }),
  ]);
}

function orderRow(ctx, o, c) {
  const items = Array.isArray(o.items) ? o.items : [];
  const qty = items.reduce((t, i) => t + Number(i.qty ?? 1), 0);
  const canApprove = o.status === 'new';

  return el('tr', {}, [
    el('td', { class: 'mono strong' }, o.order_no ?? o.id.slice(0, 8)),
    el('td', {}, [
      el('div', { class: 'row' }, [
        el('div', { class: 'avatar', style: { width: '30px', height: '30px', fontSize: '11px' } },
           initials(o.customer_name)),
        el('div', {}, [
          el('div', { class: 'strong' }, o.customer_name),
          el('div', { class: 'muted', style: { fontSize: '13px' } }, readPhone(o.phone)),
        ]),
      ]),
    ]),
    el('td', { class: 'num' }, String(qty)),
    el('td', {}, o.fulfilment === 'delivery' ? 'Delivery' : 'Pickup'),
    el('td', {}, chip(o.status)),
    el('td', { class: 'num strong' }, money(o.total, c)),
    el('td', { class: 'muted', style: { whiteSpace: 'nowrap' } }, ago(o.created_at)),
    el('td', {}, el('div', { class: 'row' }, [
      canApprove
        ? button('Approve', {
            kind: 'btn--spring btn--sm', icon: 'check',
            onclick: (e) => approve(ctx, o, e.currentTarget),
          })
        : null,
      button('Open', { kind: 'btn--ghost btn--sm', onclick: () => openOrder(ctx, o) }),
    ])),
  ]);
}

async function approve(ctx, o, btn) {
  btn.disabled = true;
  try {
    await api.approveOrder(o.id);
    toast(`${o.order_no ?? 'Order'} approved — it is on the kitchen board now`);
    await ctx.refresh();
  } catch (err) {
    toast(err.message, 'bad');
    btn.disabled = false;
  }
}

/** The full order, and every action that can be taken on it. */
function openOrder(ctx, o) {
  const c = cur(ctx);
  const track = el('div', { class: 'pipe', style: { marginBottom: '18px' } },
    FLOW.map((s) => {
      const idx = FLOW.findIndex((f) => f.key === (o.status === 'confirmed' ? 'approved' : o.status));
      const mine = FLOW.findIndex((f) => f.key === s.key);
      const done = idx >= 0 && mine <= idx;
      return el('div', { class: `pipe-step${done ? ' is-hot' : ''}` }, [
        el('b', {}, done ? '✓' : '·'),
        el('span', {}, s.short),
      ]);
    }));

  const times = [
    ['Placed', o.created_at], ['Approved', o.approved_at],
    ['Prepared', o.prepared_at], ['Accepted by rider', o.accepted_at],
    ['Delivered', o.delivered_at],
  ].filter(([, v]) => v);

  const close = modal(`${o.order_no ?? 'Order'} — ${o.customer_name}`, el('div', { class: 'f-stack' }, [
    o.status === 'cancelled'
      ? el('div', { class: 'notice', 'data-kind': 'stop' }, 'This order was cancelled.')
      : track,
    orderItems(o.items, c),
    el('div', { class: 'f-row' }, [
      el('div', {}, [el('p', { class: 'card-t' }, 'Phone'), el('p', {}, readPhone(o.phone))]),
      el('div', {}, [el('p', { class: 'card-t' }, 'Fulfilment'),
                     el('p', {}, o.fulfilment === 'delivery' ? 'Delivery' : 'Pickup at gym')]),
      el('div', {}, [el('p', { class: 'card-t' }, 'Total'),
                     el('p', { class: 'strong' }, money(o.total, c))]),
    ]),
    o.address ? el('div', {}, [el('p', { class: 'card-t' }, 'Address'), el('p', {}, o.address)]) : null,
    o.note ? el('div', {}, [el('p', { class: 'card-t' }, 'Note'), el('p', {}, o.note)]) : null,
    times.length
      ? el('div', {}, [
          el('p', { class: 'card-t', style: { marginBottom: '8px' } }, 'Timeline'),
          el('div', { class: 'feed' }, times.map(([k, v]) =>
            el('div', { class: 'feed-row' }, [
              el('span', { class: 'who' }, k),
              el('span', { class: 'when' }, stamp(v)),
            ]))),
        ])
      : null,
  ]), [
    o.status === 'new'
      ? button('Approve order', {
          kind: 'btn--spring', icon: 'check',
          onclick: async (e) => { await approve(ctx, o, e.currentTarget); close(); },
        })
      : null,
    o.status !== 'delivered' && o.status !== 'cancelled'
      ? button('Cancel order', {
          kind: 'btn--ghost', icon: 'x',
          onclick: async () => {
            const why = prompt('Why is this being cancelled? The customer sees this.');
            if (why === null) return;
            try {
              await api.cancelOrder(o.id, why || null);
              toast('Order cancelled');
              close();
              await ctx.refresh();
            } catch (err) { toast(err.message, 'bad'); }
          },
        })
      : null,
  ].filter(Boolean));
}

// ═════════════════════════════════════════════════════════ 3 · PRODUCTS ═══

export function products(ctx) {
  const rows = ctx.state.products;
  return el('div', { class: 'view' }, [
    card([
      cardHead('Catalogue',
        el('span', { class: 'card-t' }, `${rows.filter((p) => p.active !== false).length} live · ${rows.length} total`),
        button('New product', { kind: 'btn--ink', icon: 'plus', onclick: () => ctx.go('new') })),
      rows.length ? productTable(ctx, rows) : empty('No products', 'Add the first one to open the shop.'),
    ], { class: 'card--flush rise' }),
  ]);
}

function productTable(ctx, rows) {
  const c = cur(ctx);
  return el('div', { class: 'table-wrap' },
    el('table', { class: 'table' }, [
      el('thead', {}, el('tr', {}, [
        el('th', {}, 'Product'), el('th', {}, 'Kind'), el('th', {}, 'Status'),
        el('th', { class: 'num' }, 'Price'), el('th', { class: 'num' }, 'Stock'), el('th', {}, ''),
      ])),
      el('tbody', {}, rows.map((p) => el('tr', {}, [
        el('td', {}, el('div', { class: 'row' }, [
          p.image_url
            ? el('img', { src: p.image_url, alt: '', loading: 'lazy',
                          style: { width: '38px', height: '38px', borderRadius: '9px',
                                   objectFit: 'cover', flexShrink: 0 } })
            : el('div', { class: 'avatar' }, initials(p.name)),
          el('div', { style: { minWidth: 0 } }, [
            el('div', { class: 'strong' }, p.name),
            el('div', { class: 'muted', style: { fontSize: '13px' } }, p.category_id ? 'Catalogued' : 'Uncategorised'),
          ]),
        ])),
        el('td', { class: 'muted' }, (p.kind ?? 'product').replace('_', ' ')),
        el('td', {}, el('span', { class: 'chip', 'data-s': p.active === false ? 'cancelled' : 'ready' },
                        p.active === false ? 'Hidden' : 'Live')),
        el('td', { class: 'num strong' }, money(p.price, c)),
        el('td', { class: 'num' }, p.stock == null ? '∞' : String(p.stock)),
        el('td', {}, el('div', { class: 'row' }, [
          button('Edit', { kind: 'btn--ghost btn--sm', onclick: () => ctx.go('new', { edit: p.id }) }),
          button(p.active === false ? 'Show' : 'Hide', {
            kind: 'btn--ghost btn--sm',
            onclick: async () => {
              try {
                await api.updateProduct(p.id, { active: p.active === false });
                toast(p.active === false ? 'Back in the shop' : 'Hidden from the shop');
                await ctx.refresh();
              } catch (err) { toast(err.message, 'bad'); }
            },
          }),
        ])),
      ]))),
    ]));
}

// ══════════════════════════════════════════════════════ 4 · NEW PRODUCT ═══
//
// Laid out as in reference frames 3 and 4: media and visibility on the left,
// a General / Advanced detail card on the right.

export function newProduct(ctx) {
  const editing = ctx.state.editId
    ? ctx.state.products.find((p) => p.id === ctx.state.editId)
    : null;
  const c = cur(ctx);
  const draft = {
    name: editing?.name ?? '',
    kind: editing?.kind ?? 'product',
    price: editing?.price ?? '',
    stock: editing?.stock ?? '',
    sku: editing?.sku ?? '',
    slug: editing?.slug ?? '',
    description: editing?.description ?? '',
    category_id: editing?.category_id ?? '',
    image_url: editing?.image_url ?? '',
    active: editing ? editing.active !== false : true,
  };

  const set = (k) => (e) => { draft[k] = e.target.value; };

  // ---- General tab
  const nameIn = el('input', { class: 'input', value: draft.name, oninput: set('name'),
                               placeholder: 'e.g. Whey Isolate — Unflavoured, 1 kg' });
  const kindIn = el('select', { class: 'select', onchange: set('kind') },
    ['product', 'membership', 'pt_package', 'class'].map((k) =>
      el('option', { value: k, selected: draft.kind === k }, k.replace('_', ' '))));
  const catIn = el('select', { class: 'select', onchange: set('category_id') }, [
    el('option', { value: '' }, 'Uncategorised'),
    ...ctx.state.categories.map((cat) =>
      el('option', { value: cat.id, selected: draft.category_id === cat.id }, cat.name)),
  ]);
  const priceIn = el('input', { class: 'input', type: 'number', min: '0', step: '1',
                                value: draft.price, oninput: set('price'), placeholder: 'e.g. 3499' });
  const descIn = el('textarea', { class: 'textarea', oninput: set('description'),
                                  placeholder: 'What it is, who it is for, and what it does. Two sentences beat ten.' },
                    draft.description);

  const general = el('div', { class: 'f-stack' }, [
    field('Product name', nameIn),
    el('div', { class: 'f-row' }, [field('Kind', kindIn), field('Category', catIn)]),
    el('div', { class: 'f-row' }, [
      field('Price', priceIn, `Charged in ${c}. Whole rupees.`),
    ]),
    field('Description', descIn),
  ]);

  // ---- Advanced tab
  const skuIn = el('input', { class: 'input', value: draft.sku, oninput: set('sku'),
                              placeholder: 'e.g. EG-WHEY-1K' });
  const stockIn = el('input', { class: 'input', type: 'number', min: '0', value: draft.stock,
                                oninput: set('stock'), placeholder: 'Leave blank for unlimited' });
  const slugIn = el('input', { class: 'input', value: draft.slug, oninput: set('slug'),
                               placeholder: 'e.g. whey-isolate-1kg' });
  const advanced = el('div', { class: 'f-stack hide' }, [
    el('div', { class: 'f-row' }, [
      field('SKU', skuIn, 'Your own code. Printed on the pick list.'),
      field('Stock', stockIn, 'Blank means the shop never says sold out.'),
    ]),
    field('URL slug', slugIn, 'What the product’s own address will be.'),
  ]);

  const seg = el('div', { class: 'seg' }, [
    el('button', { class: 'is-active', onclick: (e) => swap(e, 0) }, 'General'),
    el('button', { onclick: (e) => swap(e, 1) }, 'Advanced'),
  ]);
  function swap(e, which) {
    [...seg.children].forEach((b, i) => b.classList.toggle('is-active', i === which));
    general.classList.toggle('hide', which !== 0);
    advanced.classList.toggle('hide', which !== 1);
  }

  // ---- media
  const preview = el('div', { class: 'tile' + (draft.image_url ? ' is-cover' : '') },
    draft.image_url
      ? [el('img', { src: draft.image_url, alt: '' }), el('span', { class: 'tile-tag' }, 'Cover')]
      : el('span', { class: 'muted' }, 'No image'));

  const fileIn = el('input', { type: 'file', accept: 'image/*', class: 'sr',
    onchange: async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        toast('Uploading…');
        const path = await api.uploadImage(file, ctx.state.tenant.slug);
        draft.image_url = api.publicUrl(path);
        clear(preview);
        preview.classList.add('is-cover');
        preview.append(el('img', { src: draft.image_url, alt: '' }),
                       el('span', { class: 'tile-tag' }, 'Cover'));
        toast('Image set');
      } catch (err) { toast(err.message, 'bad'); }
    } });

  const visToggle = el('button', {
    class: `toggle${draft.active ? ' is-on' : ''}`,
    role: 'switch', 'aria-checked': String(draft.active), 'aria-label': 'Visible in the shop',
    onclick: (e) => {
      draft.active = !draft.active;
      e.currentTarget.classList.toggle('is-on', draft.active);
      e.currentTarget.setAttribute('aria-checked', String(draft.active));
    },
  });

  const save = button(editing ? 'Save changes' : 'Publish', {
    kind: 'btn--spring', icon: 'check',
    onclick: async (e) => {
      if (!draft.name.trim()) return toast('A product needs a name', 'bad');
      if (draft.price === '' || Number(draft.price) < 0) return toast('A product needs a price', 'bad');
      e.currentTarget.disabled = true;
      const row = {
        tenant_id: ctx.state.tenant.id,
        name: draft.name.trim(),
        kind: draft.kind,
        price: Number(draft.price),
        stock: draft.stock === '' ? null : Number(draft.stock),
        sku: draft.sku.trim() || null,
        slug: draft.slug.trim() || null,
        description: draft.description.trim() || null,
        category_id: draft.category_id || null,
        image_url: draft.image_url || null,
        active: draft.active,
      };
      try {
        if (editing) await api.updateProduct(editing.id, row);
        else await api.createProduct(row);
        toast(editing ? 'Saved' : 'Published to the shop');
        ctx.go('products');
        await ctx.refresh();
      } catch (err) {
        toast(err.message, 'bad');
        e.currentTarget.disabled = false;
      }
    },
  });

  return el('div', { class: 'view' }, [
    el('div', { class: 'row row--wrap', style: { marginBottom: '18px' } }, [
      el('button', { class: 'icon-btn', 'aria-label': 'Back', onclick: () => ctx.go('products') },
         icon('back', 18)),
      el('div', {}, [
        el('h2', { style: { fontSize: '22px', fontWeight: '700' } },
           editing ? 'Edit product' : 'Add new product'),
        el('p', { class: 'muted', style: { fontSize: '13.5px' } },
           editing ? `Last saved ${stamp(editing.updated_at ?? editing.created_at)}` : 'Not saved yet'),
      ]),
      el('div', { class: 'spacer row' }, [
        editing
          ? button('Delete', {
              kind: 'btn--ghost', icon: 'trash',
              onclick: async () => {
                if (!confirm('Hide this product from the shop? Past orders keep it.')) return;
                try {
                  await api.archiveProduct(editing.id);
                  toast('Hidden from the shop');
                  ctx.go('products');
                  await ctx.refresh();
                } catch (err) { toast(err.message, 'bad'); }
              },
            })
          : null,
        save,
      ]),
    ]),

    el('div', { class: 'grid grid--form' }, [
      el('div', { class: 'grid' }, [
        card([
          cardHead('Media'),
          el('div', { class: 'tiles' }, [
            preview,
            el('button', { class: 'tile tile--add', onclick: () => fileIn.click() }, icon('plus', 22)),
          ]),
          fileIn,
        ], { class: 'rise' }),
        card([
          cardHead('Visibility'),
          el('p', { class: 'muted', style: { marginBottom: '14px' } },
             'Hidden products stay in past orders but disappear from the shop.'),
          el('div', { class: 'row' }, [visToggle, el('span', { class: 'strong' }, 'Visible to customers')]),
        ], { class: 'rise', style: { '--d': '60ms' } }),
      ]),
      card([
        cardHead('Product details',
          el('span', { class: 'chip', 'data-s': editing ? 'ready' : 'new' },
             editing ? 'Editing' : 'Draft')),
        seg,
        el('div', { style: { height: '18px' } }),
        general,
        advanced,
      ], { class: 'rise', style: { '--d': '60ms' } }),
    ]),
  ]);
}

// ════════════════════════════════════════════════════════ 5 · CUSTOMERS ═══
//
// There is no customers table — guest checkout only, by design. A customer is
// therefore a PHONE NUMBER with orders attached, which is also how the gym
// thinks about it.

export function customers(ctx) {
  const c = cur(ctx);
  const map = new Map();
  for (const o of ctx.state.orders) {
    if (o.status === 'cancelled') continue;
    const key = String(o.phone || '').replace(/\D/g, '');
    if (!key) continue;
    const row = map.get(key) ?? {
      phone: o.phone, name: o.customer_name, orders: 0, spend: 0,
      last: o.created_at, items: new Map(),
    };
    row.orders += 1;
    row.spend += Number(o.total || 0);
    if (new Date(o.created_at) > new Date(row.last)) {
      row.last = o.created_at;
      row.name = o.customer_name;   // the most recent spelling wins
    }
    for (const it of Array.isArray(o.items) ? o.items : []) {
      row.items.set(it.name, (row.items.get(it.name) ?? 0) + Number(it.qty ?? 1));
    }
    map.set(key, row);
  }

  const rows = [...map.values()].sort((a, b) => b.spend - a.spend);
  const repeat = rows.filter((r) => r.orders > 1).length;

  return el('div', { class: 'view' }, [
    el('div', { class: 'grid grid--kpi', style: { marginBottom: '18px' } }, [
      card([el('div', { class: 'kpi' }, [
        el('p', { class: 'kpi-label' }, 'Customers'),
        el('span', { class: 'kpi-v' }, String(rows.length)),
        el('p', { class: 'kpi-sub' }, 'unique phone numbers'),
      ])], { class: 'rise' }),
      card([el('div', { class: 'kpi' }, [
        el('p', { class: 'kpi-label' }, 'Repeat buyers'),
        el('span', { class: 'kpi-v' }, String(repeat)),
        el('p', { class: 'kpi-sub' },
           rows.length ? `${Math.round((repeat / rows.length) * 100)}% came back` : 'none yet'),
      ])], { class: 'rise', style: { '--d': '60ms' } }),
      card([el('div', { class: 'kpi' }, [
        el('p', { class: 'kpi-label' }, 'Best customer'),
        el('span', { class: 'kpi-v', style: { fontSize: '24px' } }, rows[0]?.name ?? '—'),
        el('p', { class: 'kpi-sub' }, rows[0] ? money(rows[0].spend, c) : 'no orders yet'),
      ])], { class: 'rise', style: { '--d': '120ms' } }),
    ]),
    card([
      rows.length
        ? el('div', { class: 'table-wrap' }, el('table', { class: 'table' }, [
            el('thead', {}, el('tr', {}, [
              el('th', {}, 'Customer'), el('th', {}, 'Phone'),
              el('th', { class: 'num' }, 'Orders'), el('th', { class: 'num' }, 'Spend'),
              el('th', {}, 'Usually buys'), el('th', {}, 'Last order'),
            ])),
            el('tbody', {}, rows.map((r) => {
              const fav = [...r.items.entries()].sort((a, b) => b[1] - a[1])[0];
              return el('tr', {}, [
                el('td', {}, el('div', { class: 'row' }, [
                  el('div', { class: 'avatar', style: { width: '30px', height: '30px', fontSize: '11px' } },
                     initials(r.name)),
                  el('span', { class: 'strong' }, r.name),
                ])),
                el('td', { class: 'mono' }, readPhone(r.phone)),
                el('td', { class: 'num' }, String(r.orders)),
                el('td', { class: 'num strong' }, money(r.spend, c)),
                el('td', { class: 'muted' }, fav ? fav[0] : '—'),
                el('td', { class: 'muted' }, ago(r.last)),
              ]);
            })),
          ]))
        : empty('No customers yet', 'They appear here the moment the first order lands.'),
    ], { class: 'card--flush rise' }),
  ]);
}

// ════════════════════════════════════════════════════════════ 6 · MEDIA ═══

export function media(ctx) {
  const { uploads, builtIn } = ctx.state.media;
  const fileIn = el('input', { type: 'file', accept: 'image/*', multiple: true, class: 'sr',
    onchange: async (e) => {
      const files = [...(e.target.files ?? [])];
      if (!files.length) return;
      try {
        toast(`Uploading ${files.length}…`);
        for (const f of files) await api.uploadImage(f, ctx.state.tenant.slug);
        toast('Uploaded');
        await ctx.refresh();
      } catch (err) { toast(err.message, 'bad'); }
    } });

  const tile = (src, name, onDelete) =>
    el('div', { class: 'tile' }, [
      el('img', { src, alt: name, loading: 'lazy' }),
      onDelete
        ? el('button', {
            class: 'tile-tag', style: { right: '8px', left: 'auto' }, title: 'Delete',
            onclick: async () => {
              if (!confirm('Delete this image? Products using it will lose their picture.')) return;
              try { await onDelete(); toast('Deleted'); await ctx.refresh(); }
              catch (err) { toast(err.message, 'bad'); }
            },
          }, '×')
        : null,
    ]);

  return el('div', { class: 'view' }, [
    card([
      cardHead('Your uploads',
        button('Upload images', { kind: 'btn--ink', icon: 'out', onclick: () => fileIn.click() })),
      fileIn,
      uploads.length
        ? el('div', { class: 'tiles' },
            uploads.map((u) => tile(api.publicUrl(u.path ?? u.name), u.name,
                                    () => api.deleteUpload(u.path ?? u.name))))
        : empty('Nothing uploaded', 'Product photos you upload land here.'),
    ], { class: 'rise' }),
    el('div', { style: { height: '18px' } }),
    builtIn?.length
      ? card([
          cardHead('Built in', el('span', { class: 'card-t' }, 'shipped with the engine')),
          el('div', { class: 'tiles' }, builtIn.map((b) => tile(b.url ?? b, b.name ?? ''))),
        ], { class: 'rise', style: { '--d': '60ms' } })
      : null,
  ]);
}

// ════════════════════════════════════════════════════════════ 7 · BRAND ═══
//
// Writes `tenants.brand`, which is stamped inline on <html> and therefore
// beats every stylesheet. This screen restyles the live shop with no deploy.

export function brand(ctx, presets) {
  const t = ctx.state.tenant;
  const current = { ...(t.brand ?? {}) };

  const TOKENS = [
    ['bg', 'Page background'], ['surface', 'Card'], ['surface-2', 'Panel'],
    ['border', 'Hairline'], ['brand', 'Accent'], ['brand-hover', 'Accent, hovered'],
    ['brand-text', 'Text on accent'], ['text', 'Text'], ['text-muted', 'Muted text'],
    ['radius', 'Corner radius'], ['font-display', 'Display face'], ['font-body', 'Body face'],
  ];

  const inputs = new Map();
  const swatches = el('div', { class: 'grid grid--half' }, TOKENS.map(([key, label]) => {
    const input = el('input', { class: 'input', value: current[key] ?? '',
                                placeholder: 'inherit from skin', oninput: (e) => { current[key] = e.target.value; } });
    inputs.set(key, input);
    return field(label, input);
  }));

  const apply = (preset) => {
    Object.assign(current, preset.tokens ?? preset);
    for (const [k, input] of inputs) input.value = current[k] ?? '';
    toast(`${preset.name ?? 'Preset'} loaded — press Save to publish it`);
  };

  return el('div', { class: 'view' }, [
    el('div', { class: 'grid grid--form' }, [
      card([
        cardHead('Gym'),
        el('div', { class: 'f-stack' }, [
          field('Name', el('input', { class: 'input', value: t.name ?? '',
                oninput: (e) => { t.name = e.target.value; } })),
          field('Address', el('input', { class: 'input', value: t.address ?? '',
                oninput: (e) => { t.address = e.target.value; } })),
          field('Hours', el('input', { class: 'input', value: t.hours ?? '',
                oninput: (e) => { t.hours = e.target.value; } })),
          field('Slug', el('input', { class: 'input', value: t.slug ?? '', disabled: true }),
                'The shop address. Changing it would break every link already shared.'),
        ]),
      ], { class: 'rise' }),

      card([
        cardHead('Look',
          button('Save and publish', {
            kind: 'btn--spring', icon: 'check',
            onclick: async (e) => {
              e.currentTarget.disabled = true;
              const clean = {};
              for (const [k, v] of Object.entries(current)) if (String(v).trim()) clean[k] = String(v).trim();
              try {
                await api.updateTenant(t.id, {
                  name: t.name, address: t.address, hours: t.hours, brand: clean,
                });
                toast('Published — the shop is restyled');
                await ctx.refresh();
              } catch (err) { toast(err.message, 'bad'); }
              finally { e.currentTarget.disabled = false; }
            },
          })),
        presets?.length
          ? el('div', { style: { marginBottom: '18px' } }, [
              el('p', { class: 'card-t', style: { marginBottom: '10px' } }, 'One-click presets'),
              el('div', { class: 'row row--wrap' },
                 presets.map((p) => button(p.name, { kind: 'btn--sm', onclick: () => apply(p) }))),
            ])
          : null,
        el('p', { class: 'muted', style: { marginBottom: '16px', fontSize: '13.5px' } },
           'Blank means "use the skin\'s own value". These are written to the gym\'s row and ' +
           'beat every stylesheet, which is why a restyle needs no deploy.'),
        swatches,
      ], { class: 'rise', style: { '--d': '60ms' } }),
    ]),
  ]);
}
