// Cart. Pure state machine — no DOM, no network, no colour.
//
// Everything here runs in node under `npm test`, which is the point: the maths
// that decides what a customer is charged must be testable without a browser.
//
// Spec §13: memberships, PT packages and classes are quantity-locked to 1 and
// carry kind-specific options captured at add-to-cart. Two of the same product
// with DIFFERENT options are two separate lines (a January membership and a
// March membership are not "quantity 2").

import { toPaise } from './money.js';

export const QTY_LOCKED_KINDS = new Set(['membership', 'pt_package', 'class']);
export const MAX_QTY = 99;
export const STORAGE_KEY = 'j7.cart.v1';

/** Options each kind asks for at add-to-cart. Drives the form render. */
export const KIND_OPTIONS = {
  product: [],
  membership: [{ name: 'start_date', label: 'Preferred start date', type: 'date', required: false }],
  pt_package: [{ name: 'trainer', label: 'Preferred trainer', type: 'text', required: false }],
  class: [
    { name: 'date', label: 'Preferred date', type: 'date', required: false },
    { name: 'slot', label: 'Preferred slot', type: 'select', required: false, from: 'meta.slots' },
  ],
};

/** Stable identity for a cart line: same product AND same options = same line. */
export function lineKey(productId, options = {}) {
  const sorted = Object.keys(options)
    .filter((k) => options[k] !== '' && options[k] != null)
    .sort()
    .map((k) => `${k}=${options[k]}`)
    .join('&');
  return sorted ? `${productId}#${sorted}` : String(productId);
}

/** In-memory storage so the cart works in node tests and in private browsing. */
export function memoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => void map.set(k, String(v)),
    removeItem: (k) => void map.delete(k),
  };
}

/**
 * @param {object} opts
 * @param {Storage} opts.storage   localStorage, or memoryStorage() in tests
 * @param {string}  opts.tenantSlug which gym this cart belongs to
 */
export function createCart({ storage = memoryStorage(), tenantSlug = '', key = STORAGE_KEY } = {}) {
  let lines = [];
  const listeners = new Set();

  function persist() {
    try {
      storage.setItem(key, JSON.stringify({ tenantSlug, lines }));
    } catch {
      // Private browsing, quota, or storage disabled. The cart still works for
      // this page view; it just will not survive a reload. Never throw here.
    }
  }

  function forget() {
    // Storage can throw on read, write AND delete — a browser in a locked-down
    // privacy mode refuses all three. Cleanup must never be the thing that
    // crashes the shop.
    try {
      storage.removeItem(key);
    } catch {
      /* nothing to do; the cart just will not persist */
    }
  }

  function load() {
    let raw;
    try {
      raw = storage.getItem(key);
    } catch {
      return;
    }
    if (!raw) return;
    try {
      const saved = JSON.parse(raw);
      // A cart belongs to one gym. Landing on a different gym starts fresh,
      // otherwise someone orders whey from a gym 400 km away.
      if (saved?.tenantSlug !== tenantSlug) return forget();
      if (Array.isArray(saved.lines)) lines = saved.lines.filter(isSaneLine);
    } catch {
      forget();
    }
  }

  function isSaneLine(l) {
    return (
      l &&
      typeof l.productId === 'string' &&
      typeof l.name === 'string' &&
      Number.isInteger(l.priceP) &&
      l.priceP >= 0 &&
      Number.isInteger(l.qty) &&
      l.qty > 0
    );
  }

  function emit() {
    persist();
    for (const fn of listeners) fn(api);
  }

  const api = {
    /** Subscribe to changes. Returns an unsubscribe function. */
    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    /**
     * @param {object} product a row from `products`
     * @param {object} [opts]  { qty, options }
     */
    add(product, { qty = 1, options = {} } = {}) {
      const locked = QTY_LOCKED_KINDS.has(product.kind);
      const wanted = locked ? 1 : clampQty(qty);
      const k = lineKey(product.id, options);
      const existing = lines.find((l) => l.key === k);

      if (existing) {
        // A locked kind already in the cart stays at 1 — adding the same
        // membership twice is a mis-tap, not an order for two memberships.
        existing.qty = locked ? 1 : clampQty(existing.qty + wanted);
      } else {
        lines.push({
          key: k,
          productId: product.id,
          name: product.name,
          kind: product.kind,
          priceP: toPaise(product.price),
          qty: wanted,
          options,
          imageUrl: product.image_url ?? null,
          qtyLocked: locked,
        });
      }
      emit();
      return api;
    },

    setQty(k, qty) {
      const line = lines.find((l) => l.key === k);
      if (!line) return api;
      if (line.qtyLocked) return api;
      const n = clampQty(qty);
      if (n === 0) return api.remove(k);
      line.qty = n;
      emit();
      return api;
    },

    remove(k) {
      const before = lines.length;
      lines = lines.filter((l) => l.key !== k);
      if (lines.length !== before) emit();
      return api;
    },

    clear() {
      lines = [];
      emit();
      return api;
    },

    /** Defensive copy — callers must not be able to edit prices in place. */
    lines: () => lines.map((l) => ({ ...l, options: { ...l.options } })),
    isEmpty: () => lines.length === 0,
    /** Total item count, for the header badge. */
    count: () => lines.reduce((n, l) => n + l.qty, 0),

    /**
     * All amounts integer paise. delivery/tax/discount are Phase 2 and are
     * present at zero so the order payload shape never has to change.
     */
    totals() {
      const subtotalP = lines.reduce((sum, l) => sum + l.priceP * l.qty, 0);
      const deliveryFeeP = 0;
      const taxP = 0;
      const discountP = 0;
      return {
        subtotalP,
        deliveryFeeP,
        taxP,
        discountP,
        totalP: subtotalP + deliveryFeeP + taxP - discountP,
      };
    },
  };

  load();
  return api;
}

function clampQty(n) {
  const i = Math.trunc(Number(n));
  if (!Number.isFinite(i) || i < 0) return 0;
  return Math.min(i, MAX_QTY);
}
