// Render — paints catalog, cart, checkout and confirmation into the skin's
// mount points.
//
// Every class name is prefixed `j7-` and every one of them is styled in
// engine.css using CSS custom properties only. The skin owns the values; this
// file owns the structure. That split is what makes a redesign a stylesheet
// swap instead of a rebuild.
//
// No colour, no font. See CLAUDE.md §1.

import { el, mount } from './dom.js';
import { formatMoney } from './money.js';
import { KIND_OPTIONS, QTY_LOCKED_KINDS } from './cart.js';
import { FULFILMENT } from './checkout.js';

const KIND_LABEL = {
  product: null,
  membership: 'Membership',
  pt_package: 'Personal training',
  class: 'Class',
};

/** Stated plainly on the page, because a class line is not a held seat (spec §13). */
const CLASS_DISCLAIMER = 'This is a request, not a booked seat — the gym confirms your slot.';

// --------------------------------------------------------------- catalog

export function renderCatalog(node, { catalog, currency, onAdd }) {
  if (!catalog.categories.length) {
    return mount(node, el('p', { class: 'j7-empty' }, 'Nothing is listed yet.'));
  }

  const sections = catalog.categories.map((cat) =>
    el('section', { class: 'j7-cat', id: `j7-cat-${cat.slug ?? cat.id ?? 'more'}` }, [
      el('header', { class: 'j7-cat-head', 'data-j7-reveal': '' }, [
        // Two spans, not one: the outer is the clipping box, the inner is what
        // slides. A box cannot clip against itself while also translating.
        el('h3', { class: 'j7-cat-title' }, [el('span', { class: 'j7-mask' }, [el('span', {}, cat.name)])]),
        el('span', { class: 'j7-cat-count' }, `${cat.products.length} item${cat.products.length === 1 ? '' : 's'}`),
      ]),
      el(
        'div',
        { class: 'j7-grid', 'data-j7-stagger': '' },
        cat.products.map((p) => productCard(p, { currency, onAdd }))
      ),
    ])
  );

  const nav = el(
    'nav',
    { class: 'j7-catnav', 'aria-label': 'Shop categories' },
    catalog.categories.map((cat) =>
      el('a', { class: 'j7-catnav-link', href: `#j7-cat-${cat.slug ?? cat.id ?? 'more'}` }, cat.name)
    )
  );

  return mount(node, [nav, ...sections]);
}

function productCard(product, { currency, onAdd }) {
  const optionSpecs = KIND_OPTIONS[product.kind] ?? [];
  const inputs = new Map();

  const optionFields = optionSpecs.map((spec) => {
    const id = `j7-opt-${product.id}-${spec.name}`;
    let field;

    if (spec.type === 'select') {
      const choices = readMetaPath(product, spec.from) ?? [];
      if (!choices.length) return null;
      field = el(
        'select',
        { class: 'j7-input', id, name: spec.name },
        [el('option', { value: '' }, 'No preference'), ...choices.map((c) => el('option', { value: c }, c))]
      );
    } else {
      field = el('input', { class: 'j7-input', id, name: spec.name, type: spec.type ?? 'text' });
    }

    inputs.set(spec.name, field);
    return el('label', { class: 'j7-field', for: id }, [el('span', { class: 'j7-label' }, spec.label), field]);
  });

  const qtyInput = QTY_LOCKED_KINDS.has(product.kind)
    ? null
    : el('input', {
        class: 'j7-input j7-qty',
        type: 'number',
        min: '1',
        max: '99',
        value: '1',
        'aria-label': `Quantity of ${product.name}`,
      });

  const kindLabel = KIND_LABEL[product.kind];

  return el(
    'article',
    { class: 'j7-card', 'data-kind': product.kind, 'data-j7-reveal': '', 'data-j7-tilt': '' },
    [
      product.image_url &&
        el('div', { class: 'j7-card-media' }, [
          el('img', {
            class: 'j7-card-img',
            src: product.image_url,
            // The product name is the alt text and the heading right below it.
            // A screen reader announcing both reads the name twice, so the
            // image is decorative here and the heading carries the meaning.
            alt: '',
            role: 'presentation',
            loading: 'lazy',
            decoding: 'async',
          }),
        ]),
      el('div', { class: 'j7-card-body' }, [
        kindLabel && el('span', { class: 'j7-tag' }, kindLabel),
        el('h4', { class: 'j7-card-title' }, product.name),
        product.description && el('p', { class: 'j7-card-desc' }, product.description),
        product.kind === 'class' && el('p', { class: 'j7-note' }, CLASS_DISCLAIMER),
        ...optionFields.filter(Boolean),
        el('div', { class: 'j7-card-foot' }, [
          el('span', { class: 'j7-price' }, formatMoney(Math.round(Number(product.price) * 100), currency)),
          el('div', { class: 'j7-card-actions' }, [
            qtyInput,
            el(
              'button',
              {
                class: 'j7-btn j7-btn-primary',
                type: 'button',
                'data-j7-magnetic': '',
                onclick: () => {
                  const options = {};
                  for (const [name, input] of inputs) if (input.value) options[name] = input.value;
                  onAdd(product, { qty: qtyInput ? Number(qtyInput.value) : 1, options });
                  if (qtyInput) qtyInput.value = '1';
                },
              },
              'Add'
            ),
          ]),
        ]),
      ]),
    ]
  );
}

function readMetaPath(product, path) {
  if (!path) return null;
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), product);
}

// ------------------------------------------------------------------ cart

export function renderCart(node, { cart, currency, onCheckout }) {
  const lines = cart.lines();

  if (!lines.length) {
    return mount(node, el('p', { class: 'j7-empty' }, 'Your cart is empty.'));
  }

  const totals = cart.totals();

  return mount(node, [
    el(
      'ul',
      { class: 'j7-lines' },
      lines.map((line) =>
        el('li', { class: 'j7-line' }, [
          el('div', { class: 'j7-line-main' }, [
            el('span', { class: 'j7-line-name' }, line.name),
            optionSummary(line.options),
          ]),
          el('div', { class: 'j7-line-side' }, [
            line.qtyLocked
              ? el('span', { class: 'j7-line-qty' }, '1')
              : el('input', {
                  class: 'j7-input j7-qty',
                  type: 'number',
                  min: '0',
                  max: '99',
                  value: String(line.qty),
                  'aria-label': `Quantity of ${line.name}`,
                  onchange: (e) => cart.setQty(line.key, e.target.value),
                }),
            el('span', { class: 'j7-line-total' }, formatMoney(line.priceP * line.qty, currency)),
            el(
              'button',
              {
                class: 'j7-btn j7-btn-ghost',
                type: 'button',
                'aria-label': `Remove ${line.name}`,
                onclick: () => cart.remove(line.key),
              },
              'Remove'
            ),
          ]),
        ])
      )
    ),
    el('div', { class: 'j7-totals' }, [
      el('span', {}, 'Total'),
      el('strong', { class: 'j7-grand' }, formatMoney(totals.totalP, currency)),
    ]),
    el('p', { class: 'j7-note' }, 'No payment online. You pay at the gym when you collect.'),
    onCheckout &&
      el(
        'button',
        { class: 'j7-btn j7-btn-primary j7-btn-block', type: 'button', 'data-j7-magnetic': '', onclick: onCheckout },
        'Checkout'
      ),
  ]);
}

function optionSummary(options) {
  const parts = Object.entries(options ?? {})
    .filter(([, v]) => v)
    .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`);
  return parts.length ? el('span', { class: 'j7-line-opts' }, parts.join(' · ')) : null;
}

/** The little number on the cart button in the header. */
export function renderCartCount(nodes, count) {
  for (const node of [].concat(nodes)) {
    node.textContent = String(count);
    node.hidden = count === 0;
  }
}

// -------------------------------------------------------------- checkout

export function renderCheckout(node, { cart, currency, errors = {}, values = {}, busy = false, onSubmit }) {
  const totals = cart.totals();
  const fields = {};

  const addressField = el('label', { class: 'j7-field', for: 'j7-address' }, [
    el('span', { class: 'j7-label' }, 'Delivery address'),
    (fields.address = el('textarea', {
      class: 'j7-input',
      id: 'j7-address',
      rows: '3',
      value: values.address ?? '',
    })),
    errors.address && el('span', { class: 'j7-error' }, errors.address),
  ]);

  const setAddressVisible = (visible) => {
    addressField.hidden = !visible;
  };

  const fulfilmentRadios = el(
    'div',
    { class: 'j7-radios', role: 'radiogroup', 'aria-label': 'How you want it' },
    FULFILMENT.map((value) => {
      const id = `j7-ful-${value}`;
      const input = el('input', {
        type: 'radio',
        name: 'j7-fulfilment',
        id,
        value,
        checked: (values.fulfilment ?? 'pickup_at_gym') === value,
        onchange: () => setAddressVisible(value === 'delivery'),
      });
      (fields.fulfilment ||= []).push(input);
      return el('label', { class: 'j7-radio', for: id }, [
        input,
        el('span', {}, value === 'delivery' ? 'Deliver to me' : 'I will collect at the gym'),
      ]);
    })
  );

  setAddressVisible((values.fulfilment ?? 'pickup_at_gym') === 'delivery');

  const form = el(
    'form',
    {
      class: 'j7-form',
      novalidate: true,
      onsubmit: (e) => {
        e.preventDefault();
        onSubmit({
          customer_name: fields.customer_name.value,
          phone: fields.phone.value,
          fulfilment: fields.fulfilment.find((r) => r.checked)?.value ?? '',
          address: fields.address.value,
          note: fields.note.value,
        });
      },
    },
    [
      errors.cart && el('p', { class: 'j7-error j7-error-top' }, errors.cart),
      errors.submit && el('p', { class: 'j7-error j7-error-top' }, errors.submit),

      el('label', { class: 'j7-field', for: 'j7-name' }, [
        el('span', { class: 'j7-label' }, 'Your name'),
        (fields.customer_name = el('input', {
          class: 'j7-input',
          id: 'j7-name',
          autocomplete: 'name',
          value: values.customer_name ?? '',
        })),
        errors.customer_name && el('span', { class: 'j7-error' }, errors.customer_name),
      ]),

      el('label', { class: 'j7-field', for: 'j7-phone' }, [
        el('span', { class: 'j7-label' }, 'Phone'),
        (fields.phone = el('input', {
          class: 'j7-input',
          id: 'j7-phone',
          type: 'tel',
          inputmode: 'tel',
          autocomplete: 'tel',
          value: values.phone ?? '',
        })),
        errors.phone && el('span', { class: 'j7-error' }, errors.phone),
      ]),

      el('fieldset', { class: 'j7-fieldset' }, [
        el('legend', { class: 'j7-label' }, 'How you want it'),
        fulfilmentRadios,
        errors.fulfilment && el('span', { class: 'j7-error' }, errors.fulfilment),
      ]),

      addressField,

      el('label', { class: 'j7-field', for: 'j7-note' }, [
        el('span', { class: 'j7-label' }, 'Anything else? (size, flavour, timing)'),
        (fields.note = el('textarea', { class: 'j7-input', id: 'j7-note', rows: '2', value: values.note ?? '' })),
      ]),

      el('div', { class: 'j7-totals' }, [
        el('span', {}, 'Total to pay at the gym'),
        // Tagged so a cart change can refresh JUST this number. The checkout
        // cannot simply be repainted: the form does not sync what has been
        // typed back into `values` until submit, so a repaint mid-typing
        // throws away the customer's name and phone.
        el('strong', { class: 'j7-grand', 'data-j7-checkout-total': '' },
           formatMoney(totals.totalP, currency)),
      ]),

      el(
        'button',
        { class: 'j7-btn j7-btn-primary j7-btn-block', type: 'submit', 'data-j7-magnetic': '', disabled: busy },
        busy ? 'Sending…' : 'Place order'
      ),
    ]
  );

  return mount(node, form);
}

// ---------------------------------------------------------- confirmation

export function renderConfirmation(node, { orderNo, total, currency, whatsappUrl, gymName, trackUrl, onDone }) {
  return mount(node, [
    el('div', { class: 'j7-confirm', role: 'status' }, [
      el('h3', { class: 'j7-confirm-title' }, 'Order received'),
      el('p', { class: 'j7-confirm-no' }, [el('span', {}, 'Your order number is '), el('strong', {}, orderNo)]),
      el('p', {}, `${gymName} has it. Someone will confirm on your phone shortly.`),
      total != null && el('p', { class: 'j7-grand' }, formatMoney(total, currency)),

      // The handover code is minted when the order is marked ready, NOT now —
      // a code sitting in an inbox for three days before the order is real is
      // a code that gets lost. So this screen cannot show it, and without a
      // route back the customer has no way to ever collect it.
      trackUrl &&
        el(
          'a',
          { class: 'j7-btn j7-btn-primary j7-btn-block', href: trackUrl, 'data-j7-magnetic': '' },
          'Track this order'
        ),

      whatsappUrl
        ? el(
            'a',
            { class: 'j7-btn j7-btn-ghost j7-btn-block', href: whatsappUrl, target: '_blank', rel: 'noopener' },
            'Send it on WhatsApp too'
          )
        : el('p', { class: 'j7-note' }, 'Keep your order number handy when you visit.'),
      onDone && el('button', { class: 'j7-btn j7-btn-ghost', type: 'button', onclick: onDone }, 'Keep shopping'),
    ]),
  ]);
}

// --------------------------------------------------------------- failure

/** Unknown slug or dead database. A clean page, never a half-painted one (spec §6). */
export function renderFatal(node, message) {
  return mount(node, [
    el('div', { class: 'j7-fatal', role: 'alert' }, [
      el('h3', { class: 'j7-confirm-title' }, 'This shop is not available'),
      el('p', {}, message),
    ]),
  ]);
}
