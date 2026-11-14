# CLAUDE.md — J7 Commerce Engine

> Multi-tenant storefront engine for local gyms. One deploy serves many gyms.
> **Design spec (read first, binding):** `docs/superpowers/specs/2026-08-23-j7-commerce-engine-design.md`
> Rewritten 2026-08-23. The previous version described "Elite Gym" and pointed at
> `gym-demo-` and a GitHub Pages URL — all three were wrong for this repo.

---

## 0. Project identity

- **Repo:** `koushiksirivella/j7-fitness-studio`
- **Host:** Vercel — https://j7-fitness-studio.vercel.app
- **Stack:** vanilla HTML + CSS + JS. **No build step. No React. No Tailwind config.**
- **Backend:** Supabase — Postgres, Auth, Storage, Edge Functions. Region `ap-south-1`.
- **Product, not a site:** this is sold to many gyms. Every change ships to every tenant at once.

---

## 1. The one rule that defines the product

**No file under `engine/` contains a hex colour, an `rgb()`, or a font name.**

The engine renders commerce. It never knows what anything looks like. Colours, fonts and
radii arrive as CSS custom properties that the skin declares and the database fills in
per tenant.

**This is enforced by `npm test`, not by discipline.** `scripts/design-contract.test.mjs`
fails the build on a colour, a font name, a gym name, an `innerHTML`, or a `fetch()` outside
`store.js`. Run `npm test` before every commit that touches `engine/`.

This is what makes a redesign a skin swap instead of a rewrite. Break it and the product
stops being reusable.

**Contract between skin and engine:**
- **Tokens** (the full list lives in `engine/theme.js` as `TOKENS`, and a test checks that
  `engine.css` never reads one that is not on it):
  `--bg` `--surface` `--surface-2` `--border` `--brand` `--brand-hover` `--brand-glow`
  `--brand-text` `--text` `--text-muted` `--danger` `--radius` `--font-display` `--font-body`
- **Mount points:** `data-j7-mount="catalog" | "cart" | "checkout" | "cart-count" |
  "gym-name" | "gym-address" | "gym-hours" | "gym-logo"`
- Engine owns everything inside those mounts, and nothing outside them

**Three places set a token; later wins:** `skins/base.css` (defaults) →
another skin file → `tenants.brand` (inline on `<html>`, per gym, from the admin panel).
Row 3 is inline style, so the admin panel always beats a designer's file.

---

## 2. Security rules — non-negotiable

- **The Supabase anon key is public.** It ships in the browser. Never treat it as a secret,
  never add a "secret" to client JS to compensate.
- **RLS is the only wall.** `orders` is INSERT-only for anon — **never SELECT, never UPDATE**.
  A readable `orders` table leaks every customer name and phone across every gym at once.
- **Secrets live in Edge Function secrets only.** Telegram bot token, email API key,
  service-role key. Never in a file, never in a commit, never printed in chat output.
- **Coupons and totals are validated server-side.** Anything priced in the browser can be
  edited in the browser.
- **`orders.items` is a frozen snapshot.** Never recompute a historical order from current
  product rows.

---

## 3. Multi-tenancy

- Every query is scoped by `tenant_id`. A query without a tenant filter is a bug, always.
- Tenant resolution order: custom domain hostname, then subdomain, then `?gym=<slug>`.
- Unknown slug renders a clean "gym not found" page. Never a half-rendered site.
- Adding a gym is a database row plus a logo upload. **If onboarding needs a code change,
  the design was violated** — fix the design, not the client.

---

## 4. Build order

**Phase 0 — clean the ground**
Write `AUDIT-J7.md`. Delete the duplicate `J7 Fitness/index.html`. Compress the ~3.3 MB of
oversized images. Correct the stale `₹8,000–₹10,000` claim in `gym-design-system-complete.json`.

**Phase 1 — the thing a stranger can use**
Supabase project, schema, RLS, seed, engine, J7 as token-driven theme #1, admin panel,
Edge Function push, deploy. Then `pitch/`, pointing at the live URL.

**Done means:** a stranger opens the URL, adds whey and a membership to one cart, checks
out, and Koushik's phone buzzes. Not "the code is written."

**Phase 2 — real-store features**
Stock counts, delivery fee, GST line, coupon codes.

Do not start Phase 2 work while Phase 1 is unshipped.

---

## 5. Scope fences

- **No payment gateway.** Money changes hands at the gym. Do not add Razorpay or Stripe.
- **No seat reservation.** A class is a request. The page says so in plain words.
- **No customer accounts.** Guest checkout only.
- **No n8n in the live path.** `localhost:5678` is unreachable from Vercel.
- **No aesthetic rewrite of the current skin.** Fix defects; record taste problems in
  `AUDIT-J7.md`. The redesign is a separate project, briefed by that file.
- **Gym owners do not get admin logins.** Operator-only is the business model.

---

## 6. Design tokens — J7, theme #1

**Red on near-black.** Verified against `index.html` on 2026-08-23 — not from the design JSON,
which is stale. These become **values in a database row**, not constants in a stylesheet.

| Engine token | J7 value | |
|---|---|---|
| `--brand` | `#FF2738` | neon red |
| `--brand-hover` | `#B21212` | crimson |
| `--brand-glow` | `#FF4D4D` | |
| `--bg` | `#0A0D0E` | |
| `--surface` | `#1B1B19` | |
| `--surface-2` | `#1A2123` | |
| `--text` | `#FFFFFF` | |
| `--text-muted` | `#B8B8B8` | |
| `--danger` | `#E74C3C` · `--success` `#2ECC71` | |

⚠️ **Known trap in the existing skin.** `index.html` declares CSS variables named
`--gold`, `--gold-hover`, `--gold-light`, `--gold-glow`, `--gold-glow-strong` — and every
one of them holds a **red** value. The site was rebranded gold to red and the names were
never changed. There is also a duplicate token set carrying identical values
(`--gold`/`--neon-red`, `--gold-hover`/`--crimson`, `--charcoal-2`/`--carbon`,
`--blush`/`--chrome`, `--text-secondary`/`--silver`).

**Do not carry `--gold` into `engine/`.** The engine uses semantic names only (`--brand`),
and the skin maps its own variables onto them. Renaming the skin's tokens is a Phase 1
task recorded in `AUDIT-J7.md`, not a casual find-and-replace.

`gym-design-system-complete.json` documents the **old gold system that the site does not
implement**. Treat it as history, not as spec.

---

## 7. Frontend rules

- Animate `transform` and `opacity` only. Never `transition-all`.
- Every clickable element gets hover, `focus-visible`, and active states.
- Mobile-first. The buyer is on a phone in a gym.
- Images compressed before commit. A 1.1 MB logo is a defect, not a preference.
- No placeholder text and no "TODO" left in shipped markup.

---

## 8. Where things live

| Path | Holds | Status |
|---|---|---|
| `engine/` | commerce logic — **no colours, ever** | built |
| `skins/` | where colour lives: `base`, `j7`, `mono`, `daylight`, `studio` | built |
| `skins/studio.css` | theme #4 — light monochrome, editorial. The current site look | built |
| `demo/` | standalone engine harness with a live skin switcher | built |
| `admin/` | operator panel, auth-gated, mono-glass | built |
| `admin/presets.js` | the skin presets the Look tab applies in one click | built |
| `supabase/` | schema, policies, functions, storage, seed | built |
| `supabase/apply-studio-brand.sql` | non-destructive restyle of the j7 row. **Deploy before running** | built |
| `scripts/` | tests, SQL runner, browser smoke tests, operator accounts | built |
| `index.html` | the J7 site — engine wired in, **structural clone of the `_scrape/butter-video` reference** | built |
| `legacy/index-studio-*.html` | the first Studio pass, before the clone rebuild | archive |
| `legacy/index-red-*.html` | the previous red site, kept byte-for-byte | archive |
| `_scrape/butter-video/` | the design reference scrape + `BRAND-DNA.md` | reference |
| `offerings.html` | customer-facing: what this gym sells | not built |
| `pitch/` | owner-facing sales page, not part of the tenant template | not built |
| `supabase/functions/notify-order/` | the Telegram/email push | not built |
| `AUDIT-J7.md` | defect + slop findings, brief for the redesign | 15 findings |
| `docs/ENGINE.md` | **what every file does — read this first** | built |
| `docs/superpowers/specs/` | the binding design spec | built |

---

## 9. Local dev

```
npm install
npm run serve          # /demo/  the engine harness    /admin/  the operator panel
npm test               # 58 tests: logic, design contract, live RLS
npm run smoke          # real browser, screenshots to "temporary screenshots/"
npm run smoke:order    # also places a real order, then deletes it
npm run smoke:admin    # OPERATOR_EMAIL=... OPERATOR_PASSWORD=... required

npm run operator create you@example.com    # an admin login
npm run db:setup                           # schema + policies + functions + storage
```

Preview a tenant: `http://localhost:3000/demo/?gym=j7`

**Preview a skin before it exists in the database: `http://localhost:3000/?brand=off`.**
`tenants.brand` is written inline on `<html>`, so it beats every stylesheet — correct in
production, backwards while designing, because a new skin could not be seen on the real page
until it had already been saved to the live row. `?brand=off` suspends the row for one page
load and lets the linked skin file through. **Development hosts only** (`engine/config.js`
`brandSuspended`) — on a gym's own domain a stranger typing that URL must not be able to strip
their branding, and a test asserts exactly that.

**Look at the screenshot, do not just read the assertion.** A computed-style probe passes
on a page whose script died, and a `waitFor` on a non-transitioning property captures every
animated element mid-fade — both have already produced a false result in this repo.

---

## 10. ELITE GYM rebuild — 2026-08-25

The site and console were rebuilt as **ELITE GYM**. The engine, the Supabase
schema and the security model are unchanged; what changed is the skin, the
surfaces, and the fact that an order is now a route rather than a flag.

### The five surfaces

| Path | Who | What |
|---|---|---|
| `/` | customers | storefront. Commerce mounts unchanged |
| `/admin/` | operator | 7 screens: overview, orders, products, new, customers, media, brand |
| `/staff/` | kitchen | approved orders. start, mark ready, hand over a pickup by OTP |
| `/rider/` | riders | open job board + own runs. closes a delivery with the OTP |
| `/order/` | customers | track an order. **the only place the OTP is ever shown** |

### The order pipeline

```
new -> approved -> preparing -> ready -> out_for_delivery -> delivered
       operator     staff       staff     rider              rider + OTP
                                  |
                                  +-- pickup: staff takes the OTP at the counter
```

**Every transition is an RPC, never a PATCH on `orders`.** This is the security
boundary, not a style choice: an UPDATE policy that can set `status` can set it
to any value, so a rider holding the anon key could mark an order delivered
without leaving the building. Each function in `supabase/fulfilment.sql` accepts
exactly one transition, from one prior state, for one role.

**The OTP lives in `order_otps`, a table with RLS on and ZERO policies.** Nobody
reads it — not the rider, not the operator, not the service of any page. RLS is
row-level, not column-level, so an `otp_code` column on `orders` would be
readable by exactly the person the code exists to check. Verification happens
inside a SECURITY DEFINER function; the customer gets their own copy through
`order_status(order_no, phone)`.

Roles live in `operators.roles text[]` — `operator` / `staff` / `rider`. One
person can hold all three. `is_operator()` is only membership in that table, so
**every page checks the ROLE too**, not just membership.

### Design

- `styles/elite/brand.css` — the palette, type and curves. One accent hue,
  spring `#b1e743`, and it is the only hue on either surface. Everything else
  is a pure neutral or one of the four brand swatches.
- `admin/console.css` — the console look, shared by admin, staff, rider and the
  tracking page. Order status is a **brightness rank**, never red/amber/green:
  six stages need six readable steps and a traffic light has three.
- `skins/elite.css` — engine tokens. Still the only place the engine gets colour.
- Storefront motion is the `ss` silk-scroll runtime, vendored into
  `js/elite/silk-scroll.js`. **Never edit that file** — fix the skill and re-copy.
- The hero object is a raymarched glass **dumbbell**, built from SDF primitives
  in `js/elite/gl.js`. No model is fetched.

### Verify

```
npm test                 # design contract, logic, live RLS
node _pipeline.mjs       # the whole chain end to end against the live database
node _shotauth.mjs       # screenshots every signed-in surface
node _storeshot.mjs      # storefront, screen by screen
```

`_pipeline.mjs` signs in as a throwaway account and walks an order from
placement to delivery, asserting that every step refuses to be skipped and that
the rider cannot read the code. 17 assertions.

**Screenshot trap, hit twice here:** the storefront scrolls inside
`.silk-viewport`, so `window.scrollTo` does nothing and a `fullPage` capture only
ever sees the first screen. And reveals run 660ms plus up to 270ms of stagger —
capturing at 700ms photographs everything mid-fade and the screen comes out
blank, which looks exactly like a broken section and is not one.

### Known, not fixed — these are yours to decide

- **`1 Month - Personal Training` is ₹29,911 and `3 Months` is ₹8,000.** Bad data
  in `products`, not a build defect. Fix the row.
- **`J7 Training Tee` / `J7 Gym Bag`** still carry the old name while the site
  says ELITE GYM.
- **Public signup is still enabled on the Supabase project** — `npm test` fails on
  it. Authentication > Sign In / Providers > Email > turn off "Allow new users".
  Only you can flip it.
- The tenant row is still `j7`. Renaming the slug would break every link already
  shared, so it was left alone; the display name comes from `tenants.name`.

### The checkout was unreachable — fixed 2026-08-25

Three defects, all found by actually trying to buy something rather than by
reading the page:

1. **The cart and checkout render at the FOOT of the catalogue** — across five
   categories that is ~4,000px below the first Add button. Both worked; neither
   could be found. Fixed with `styles/elite/shop.css` + `js/elite/shop.js`: a
   fixed **cart-jump bar** appears the moment the cart stops being empty, and
   hides again once the checkout is on screen so it never covers the form. The
   header cart button now aims at `#s-cart`, not at the top of the shop.
2. **`.nav-cart` had no CSS**, so the header read `Shop1` — a word with a digit
   glued to it. Now a spring bubble.
3. **The checkout total was stuck at ₹0.** `cart.onChange` only ran `paintCart`,
   so the checkout kept the total it was painted with at boot. It cannot simply
   be repainted — **the checkout form never syncs what has been typed back into
   `values` until submit**, so a repaint mid-typing throws away the customer's
   name and phone. `paintCart` now updates the single `[data-j7-checkout-total]`
   cell instead. Verified: total tracks the cart AND typed input survives.

Also: the confirmation screen now carries a **Track this order** link
(`order/?no=…&phone=…`), because the handover code is minted at "ready" and so
cannot appear on the confirmation — without that link a customer had no route
back to it. And `tenants.name` is now **Elite Gym** (slug still `j7`), so the
confirmation no longer says "J7 Fitness Studio has it".

An order placed through the browser end to end: **J7-0005/0006/0007**, all in the
database, all reachable from the tracking page.

### …and reachable is not the same as present — fixed 2026-08-25

The cart bar shipped, and a click-through then showed the checkout landing
**2,808px below the fold**. Two more defects sat underneath it, both invisible
to any check that asks "is this element there?":

4. **`shop.js` measured the cart's position before the catalogue existed.** The
   script runs at parse time; the engine fetches products afterwards and adds
   about three thousand pixels above the cart. The cached `top` was therefore
   ~3,000px too high, and the bar hid itself while the checkout was still a
   screen and a half away — which looks exactly like the bar not working.
   `measure()` now re-runs on every cart change, which is both the cheapest
   hook and one guaranteed to fire after the catalogue is painted. It also had
   to move to the outer scope: the file is strict, so a `function` declared
   inside the `if (silk)` block was block-scoped and `readCount` could not see it.
5. **A damped scroll across 13,500px takes three seconds.** Easing that reads as
   craft over a nudge reads as a fault over a distance — "Checkout" was a
   three-second tour past every product on the page. `jumpTo` in `js/elite/site.js`
   now splits it: under 2.5 screens still eases exactly as before, anything
   longer cuts the distance instantly and eases only the last 1.5 screens, which
   is the only part anyone perceives. Same landing, no tour. This is fixed for
   **every** anchor on the page, not just the cart bar.

Cutting distance instantly then exposed a third thing: we land in a region whose
images have not decoded, and each one that lands moves the target out from under
the scroll chasing it — arriving ~200px short with the button half off the bottom
edge. `jumpTo` runs **one** correction 400ms later, re-measured, which stands
down if the reader has taken over (a page that yanks itself back mid-scroll is
worse than one that lands low).

**Two proofs are now npm scripts, because reading the page is what missed all
five of these:**

```
npm run buyflow      # 16 assertions: click Add, reach the checkout, type, pay
npm run fulfilment   # 17 assertions: the whole approve → prep → ready → OTP chain
```

`buyflow` asserts **reachability**, never visibility: it checks that the "Place
order" button's rect is inside the viewport after one click, that typed input
survives a cart change, that the total tracks, and that the track link resolves.
It needs `npm run serve` up. Both write real rows to the live database.

