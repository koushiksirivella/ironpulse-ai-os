// Checkout — validation, payload, WhatsApp handoff.
//
// The validation rules here are deliberately the SAME rules as the database
// CHECK constraints in supabase/schema.sql. The browser copy exists to give a
// helpful message; the database copy exists because the browser can be edited.
// If one changes, change both — the comments name each pair.
//
// No colour, no font, no DOM. See CLAUDE.md §1.

import { formatMoney, toRupees } from './money.js';

export const FULFILMENT = ['pickup_at_gym', 'delivery'];

/** Digits only. Indian mobiles are 10; +91 prefixed forms are 12. */
export function digitsOf(phone) {
  return String(phone ?? '').replace(/\D/g, '');
}

/**
 * @returns {{ok: boolean, errors: Record<string,string>}}
 *          errors is keyed by field name so the renderer can place each message
 *          next to its own input instead of dumping a list at the top.
 */
export function validateCheckout(form, { cartIsEmpty = false } = {}) {
  const errors = {};

  // mirrors: check (length(trim(customer_name)) > 0)
  if (!String(form.customer_name ?? '').trim()) {
    errors.customer_name = 'Tell us your name';
  }

  // mirrors: check (length(regexp_replace(phone,'\D','','g')) >= 10)
  const digits = digitsOf(form.phone);
  if (digits.length < 10) {
    errors.phone = 'A 10-digit phone number, so the gym can confirm';
  } else if (digits.length > 15) {
    errors.phone = 'That is too long for a phone number';
  }

  // mirrors: check (fulfilment in ('pickup_at_gym','delivery'))
  if (!FULFILMENT.includes(form.fulfilment)) {
    errors.fulfilment = 'Pick up at the gym, or delivery';
  }

  // mirrors: constraint delivery_needs_address
  if (form.fulfilment === 'delivery' && !String(form.address ?? '').trim()) {
    errors.address = 'Delivery needs an address';
  }

  // mirrors: constraint items_not_empty
  if (cartIsEmpty) errors.cart = 'Your cart is empty';

  return { ok: Object.keys(errors).length === 0, errors };
}

/**
 * Build the RPC payload.
 *
 * Note what is NOT sent: prices. The database re-reads every price from
 * `products` (supabase/functions.sql), so sending them would be theatre.
 */
export function buildOrderPayload({ tenantSlug, form, lines }) {
  return {
    p_tenant_slug: tenantSlug,
    p_customer_name: String(form.customer_name).trim(),
    p_phone: String(form.phone).trim(),
    p_fulfilment: form.fulfilment,
    p_address: form.fulfilment === 'delivery' ? String(form.address).trim() : null,
    p_note: String(form.note ?? '').trim() || null,
    p_items: lines.map((l) => ({
      product_id: l.productId,
      qty: l.qty,
      options: l.options ?? {},
    })),
  };
}

/**
 * The message the customer's WhatsApp opens with.
 *
 * Best-effort only (spec §9 step 10). By the time this runs the order is
 * already in the database and the operator has already been pushed a copy, so
 * a customer who never presses send costs nothing.
 */
export function orderMessage({ gymName, orderNo, form, lines, totals, currency = 'INR' }) {
  const items = lines
    .map((l) => {
      const opts = Object.entries(l.options ?? {})
        .filter(([, v]) => v)
        .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
        .join(', ');
      return `- ${l.name} x${l.qty} — ${formatMoney(l.priceP * l.qty, currency)}${opts ? ` (${opts})` : ''}`;
    })
    .join('\n');

  const fulfilment =
    form.fulfilment === 'delivery' ? `Delivery to: ${form.address}` : 'Pickup at the gym';

  return [
    `Order ${orderNo} — ${gymName}`,
    '',
    items,
    '',
    `Total: ${formatMoney(totals.totalP, currency)}`,
    `Name: ${form.customer_name}`,
    `Phone: ${form.phone}`,
    fulfilment,
    form.note ? `Note: ${form.note}` : '',
    '',
    'Sent from the website.',
  ]
    .filter((l) => l !== '')
    .join('\n');
}

/**
 * @param {string|null} whatsappNumber E.164, e.g. +919876543210
 * @returns {string|null} null when the gym has no number on file — the caller
 *          must then show the confirmation screen alone, never a broken link.
 */
export function whatsappLink(whatsappNumber, message) {
  const digits = digitsOf(whatsappNumber);
  if (digits.length < 10) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/** Amount in rupees, for anything that has to leave the engine as a number. */
export const rupees = toRupees;
