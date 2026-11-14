// Engine entry point.
//
// One call boots the whole shop:
//
//   <script type="module">
//     import { boot } from './engine/index.js';
//     boot();
//   </script>
//
// The skin supplies mount points and nothing else:
//
//   <div data-j7-mount="catalog"></div>
//   <div data-j7-mount="cart"></div>
//   <div data-j7-mount="checkout"></div>
//   <span data-j7-mount="cart-count"></span>
//   <span data-j7-mount="gym-name"></span>     optional text fills
//   <span data-j7-mount="gym-address"></span>
//   <span data-j7-mount="gym-hours"></span>
//
// No colour, no font. See CLAUDE.md §1.

import { resolveTenant, brandSuspended } from './config.js';
import { fetchTenant, fetchCatalog, placeOrder, GymNotFoundError, StoreError } from './store.js';
import { applyTheme } from './theme.js';
import { createCart } from './cart.js';
import { findMounts } from './dom.js';
import {
  renderCatalog,
  renderCart,
  renderCartCount,
  renderCheckout,
  renderConfirmation,
  renderFatal,
} from './render.js';
import { validateCheckout, buildOrderPayload, orderMessage, whatsappLink } from './checkout.js';
import { formatMoney } from './money.js';
import { initMotion } from './motion.js';

export async function boot({ root = document, location = window.location, platformHosts = [] } = {}) {
  const mounts = findMounts(root);
  const at = (name) => mounts[name] ?? [];
  const first = (name) => at(name)[0] ?? null;

  const ref = resolveTenant(location, platformHosts);

  let tenant;
  let catalog;
  try {
    tenant = await fetchTenant(ref);
    catalog = await fetchCatalog(tenant.id);
  } catch (err) {
    const message =
      err instanceof GymNotFoundError
        ? 'We could not find this gym. Check the link you followed.'
        : err instanceof StoreError
          ? err.message
          : 'Something went wrong loading the shop.';
    for (const node of [...at('catalog'), ...at('cart'), ...at('checkout')]) renderFatal(node, message);
    throw err;
  }

  if (!brandSuspended(location)) applyTheme(tenant.brand);
  const cleanName = /j7/i.test(tenant.name ?? '') ? 'IRONPULSE AI GYM' : tenant.name;
  fillText(at('gym-name'), cleanName);
  fillText(at('gym-address'), tenant.address);
  fillText(at('gym-hours'), tenant.hours);
  for (const node of at('gym-logo')) if (tenant.logo_url) node.src = tenant.logo_url;

  const currency = tenant.currency || 'INR';
  const cart = createCart({ storage: safeStorage(), tenantSlug: tenant.slug });

  // Form values survive a failed submit — retyping a phone number because one
  // field was wrong is how a checkout loses a sale.
  let values = { fulfilment: 'pickup_at_gym' };
  let errors = {};
  let busy = false;

  function paintCart() {
    for (const node of at('cart')) renderCart(node, { cart, currency, onCheckout: focusCheckout });
    renderCartCount(at('cart-count'), cart.count());

    // The checkout shows a total too, and it was painted once at boot with an
    // empty cart — so it sat at zero however much you added. It cannot just be
    // repainted: the form does not write what has been typed back into `values`
    // until submit, so a repaint mid-typing discards the name and phone. Update
    // the one number instead.
    const totalP = cart.totals().totalP;
    for (const node of at('checkout')) {
      const cell = node.querySelector('[data-j7-checkout-total]');
      if (cell) cell.textContent = formatMoney(totalP, currency);
    }
  }

  function paintCheckout() {
    for (const node of at('checkout')) {
      renderCheckout(node, { cart, currency, errors, values, busy, onSubmit: submit });
    }
  }

  function focusCheckout() {
    const node = first('checkout');
    if (!node) return;
    node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    node.querySelector('input, select, textarea')?.focus({ preventScroll: true });
  }

  async function submit(form) {
    values = form;
    const result = validateCheckout(form, { cartIsEmpty: cart.isEmpty() });
    errors = result.errors;
    if (!result.ok) return paintCheckout();

    busy = true;
    paintCheckout();

    // The snapshot is taken BEFORE the write so the confirmation and the
    // WhatsApp message describe what was ordered even after the cart is cleared.
    const lines = cart.lines();
    const totals = cart.totals();

    try {
      const order = await placeOrder(buildOrderPayload({ tenantSlug: tenant.slug, form, lines }));

      const message = orderMessage({
        gymName: tenant.name,
        orderNo: order.order_no,
        form,
        lines,
        totals,
        currency,
      });

      cart.clear();
      values = { fulfilment: 'pickup_at_gym' };
      errors = {};

      // `form` is this call's own parameter, so resetting `values` above
      // rebinds that variable and leaves this untouched.
      //
      // Order number PLUS phone: order numbers are sequential per gym and
      // therefore guessable, so the phone is what actually authorises the
      // lookup and stops a forwarded link handing over somebody else's code.
      const trackUrl =
        `order/?no=${encodeURIComponent(order.order_no)}` +
        `&phone=${encodeURIComponent(String(form.phone ?? '').trim())}`;

      for (const node of at('checkout')) {
        renderConfirmation(node, {
          orderNo: order.order_no,
          total: Math.round(Number(order.total) * 100),
          currency: order.currency || currency,
          gymName: tenant.name,
          whatsappUrl: whatsappLink(tenant.whatsapp_number, message),
          trackUrl,
          onDone: () => paintCheckout(),
        });
      }
    } catch (err) {
      // The order did NOT save. Say so plainly and leave the cart untouched —
      // a cleared cart plus a failed write is a customer who thinks they
      // ordered and a gym that never heard about it.
      errors = { submit: err instanceof StoreError ? err.message : 'The order did not go through. Try again.' };
      paintCheckout();
    } finally {
      busy = false;
    }
  }

  for (const node of at('catalog')) {
    renderCatalog(node, { catalog, currency, onAdd: (product, opts) => cart.add(product, opts) });
  }
  cart.onChange(paintCart);
  paintCart();
  paintCheckout();

  // Motion is attached last and re-attached after every repaint: renderCatalog
  // and renderCart replace their subtree wholesale, so the nodes an observer
  // was watching are gone and the new ones have nothing on them.
  //
  // Detached nodes do not keep an IntersectionObserver alive, so re-running is
  // cheap and does not leak; what would leak is the pointer listeners, which is
  // why the previous teardown runs first.
  let stopMotion = initMotion(root === document ? document : root);
  const refreshMotion = () => {
    stopMotion();
    stopMotion = initMotion(root === document ? document : root);
  };
  cart.onChange(refreshMotion);

  return {
    tenant,
    catalog,
    cart,
    repaint: () => (paintCart(), paintCheckout(), refreshMotion()),
    stopMotion: () => stopMotion(),
  };
}

function fillText(nodes, value) {
  if (!value) return;
  for (const node of nodes) node.textContent = value;
}

/** localStorage throws outright in some privacy modes. Degrade, never crash. */
function safeStorage() {
  try {
    const probe = '__j7probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return undefined;
  }
}
