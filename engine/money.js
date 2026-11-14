// Money. Integers only.
//
// Every amount inside the engine is an integer number of PAISE (or cents).
// Floating point rupees drift: 0.1 + 0.2 is not 0.3, and a cart of nine items
// can end up one paisa off the sum the customer can see. Integers cannot drift.
// Rupees exist only at two edges: reading a price from the database, and
// writing an order back to it.
//
// No colour, no font, no DOM. See CLAUDE.md §1.

/** Rupees (number or numeric string from PostgREST) -> integer paise. */
export function toPaise(rupees) {
  const n = Number(rupees);
  if (!Number.isFinite(n)) throw new TypeError(`not a price: ${rupees}`);
  return Math.round(n * 100);
}

/** Integer paise -> rupees, rounded to 2dp, safe to send to numeric(10,2). */
export function toRupees(paise) {
  return Math.round(paise) / 100;
}

/**
 * Human money string. Falls back to a plain decimal if the runtime has no
 * Intl data for the locale, which is better than throwing mid-render.
 */
export function formatMoney(paise, currency = 'INR', locale = 'en-IN') {
  const value = toRupees(paise);
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}
