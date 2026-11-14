# J7 Commerce Engine — Design Spec

- **Date:** 2026-08-23
- **Owner:** Koushik Sirivella
- **Status:** design locked, not yet built
- **Repo:** `koushiksirivella/j7-fitness-studio`
- **Live (current, pre-build):** https://j7-fitness-studio.vercel.app

---

## 1. What this is

A **multi-tenant storefront engine** for local gyms. One website serves many gyms; each
gym's branding, products and prices come from a database row. A visitor can order
memberships, personal training, classes, supplements and merch. The order is saved to the
database, pushed to the operator's phone, and fulfilled by hand at the gym.

It is a **product sold many times**, not a website built once.

---

## 2. Goals

1. A stranger can open the site, build a mixed cart, check out, and the operator's phone buzzes.
2. Onboarding a new gym takes minutes, not an afternoon.
3. The look can be replaced wholesale without touching a line of commerce logic.
4. The operator edits products, prices, photos and branding from an admin panel — no redeploy.

## 3. Non-goals (v1)

- **No online payment.** No Razorpay, no Stripe. Money changes hands at the gym.
- **No seat reservation.** A class booking is a *request*, not a held seat.
- **No customer accounts.** Guest checkout only.
- **No n8n in the live path.** The local instance at `localhost:5678` is unreachable from the internet.
- **No aesthetic rewrite of the existing skin.** Defects are fixed; the redesign is a separate, later project briefed by `AUDIT-J7.md`.

---

## 4. Decisions locked

| # | Decision | Chosen |
|---|---|---|
| 1 | Base repo | `j7-fitness-studio` |
| 2 | Build approach | Skin-agnostic engine, J7 as first theme |
| 3 | Tenancy | Multi-tenant, one shared Supabase |
| 4 | Deployment | **One deploy serving all gyms**, bespoke copy available as escape hatch |
| 5 | Sells | memberships · PT packages · classes · supplements · merch |
| 6 | Order truth | Written to database **first**, notification second |
| 7 | Server code | Supabase Edge Function |
| 8 | Product images | Supabase Storage, uploaded from admin |
| 9 | Admin access | Operator only (Koushik). Gym owners do not log in. |
| 10 | Store features | stock · delivery fee · GST · coupons — all in, **Phase 2** |
| 11 | Catalog for v1 | Realistic placeholder catalog, swappable from admin |
| 12 | Commercial shape | Setup fee + monthly recurring |
| 13 | Shipping | Phase 1 live and demo-able first, extras after |
| 14 | Classes in v1 | Request, not reservation |
| 15 | Admin styling | mono-glass, functional |

**Decision 9 is the business model, not a limitation.** The gym cannot self-serve, so the
gym stays subscribed. Do not "fix" it later without re-pricing.

---

## 5. Architecture — four layers

```
+---------------------------------------------------+
|  1. SKIN      one HTML template, many faces        |  browser · no secrets
|               colours/logo/text from database      |
+---------------------------------------------------+
|  2. ENGINE    catalog · cart · checkout            |  browser · knows no colours
+---------------------------------------------------+
|  3. DATABASE  Supabase Postgres + Auth + Storage   |  cloud · the truth
+---------------------------------------------------+
|  4. MESSENGER Supabase Edge Function               |  cloud · holds the secrets
|               pushes the order to the phone        |
+---------------------------------------------------+
```

Layer 4 exists for exactly one reason: **anyone can read a website's JavaScript.** A bot
token or an API secret placed in the browser is a published secret.

---

## 6. Tenant resolution

Resolved in this order, first match wins:

1. **Custom domain** — `j7fitness.com` maps to `tenants.domain`
2. **Subdomain** — `j7.<yourdomain>` — slug is the subdomain
3. **Query param** — `?gym=j7` — slug is the param

Rule 3 works today with zero DNS, so no domain purchase blocks the build. Rules 1 and 2
are launch-day configuration. One Vercel project can hold many custom domains, so a gym
still gets a site at its own address.

Unknown slug produces a clean "gym not found" page, never a broken render.

---

## 7. Data model

```sql
tenants
  id uuid pk
  slug text unique           -- 'j7'
  name text                  -- 'J7 Fitness Studio'
  domain text unique null    -- 'j7fitness.com'
  whatsapp_number text       -- E.164
  currency text default 'INR'
  brand jsonb                -- design tokens: bg, brand, text, fonts, radius
  logo_url text
  sections jsonb             -- which page sections are on/off
  active boolean default true

categories
  id uuid pk
  tenant_id uuid fk -> tenants
  name text
  sort int

products
  id uuid pk
  tenant_id uuid fk -> tenants
  category_id uuid fk -> categories null
  kind text            -- 'product' | 'membership' | 'pt_package' | 'class'
  name text
  description text
  price numeric(10,2)
  image_url text
  meta jsonb           -- kind-specific: duration, sessions, trainer, slots
  stock int null       -- Phase 2
  active boolean default true
  sort int

orders
  id uuid pk
  tenant_id uuid fk -> tenants
  order_no text unique          -- human-readable, e.g. J7-0042
  customer_name text
  phone text
  fulfilment text               -- 'pickup_at_gym' | 'delivery'
  address text null
  note text null
  items jsonb                   -- FROZEN SNAPSHOT, see below
  subtotal numeric(10,2)
  delivery_fee numeric(10,2) default 0   -- Phase 2
  tax numeric(10,2) default 0            -- Phase 2
  discount numeric(10,2) default 0       -- Phase 2
  total numeric(10,2)
  status text default 'new'     -- new | confirmed | delivered | cancelled
  channels_sent jsonb           -- {telegram: true, wa_link_opened: false}
  created_at timestamptz default now()

coupons                         -- Phase 2
  id uuid pk
  tenant_id uuid fk
  code text
  kind text                     -- 'percent' | 'flat'
  value numeric
  max_uses int null
  used int default 0
  expires_at timestamptz null
  active boolean default true
```

**`orders.items` is a frozen snapshot.** It stores name, price and quantity as they were at
the moment of purchase. A price edit tomorrow must never change yesterday's order total.
This is the single most common e-commerce data bug, and it is prevented by design rather
than by care.

---

## 8. Row Level Security

RLS is the only wall between the public and the data. The anon key is published in every
static site — treat it as public knowledge, because it is.

| Table | anon (public visitor) | authenticated (operator) |
|---|---|---|
| `tenants` | SELECT where `active` — branding only | full |
| `categories` | SELECT where tenant active | full |
| `products` | SELECT where `active` and tenant active | full |
| `orders` | **INSERT only. No SELECT, no UPDATE.** | full |
| `coupons` | **no direct access** — validated server-side | full |

**`orders` must never be readable by anon.** Otherwise anyone who opens devtools reads
every customer name and phone number on the platform — for every gym at once.

Coupon validation happens in the Edge Function. A discount computed in the browser is a
discount the customer can edit.

---

## 9. Order flow

| # | Step | Where |
|---|---|---|
| 1 | Visitor lands; tenant resolved from hostname/subdomain/param | browser |
| 2 | Brand tokens injected as CSS variables from `tenants.brand` | browser |
| 3 | Engine fetches active categories and products for the tenant | browser to Supabase |
| 4 | Engine renders catalog into the skin's mount points | browser |
| 5 | Visitor adds mixed items to cart; cart persists in `localStorage` | browser |
| 6 | Checkout form: name, phone, pickup-or-delivery, address, note | browser |
| 7 | **Order INSERTed into `orders`** — truth exists from here | Supabase |
| 8 | Insert fires the Edge Function via database webhook | Supabase |
| 9 | Function composes the order text and pushes it to the operator | Telegram / email |
| 10 | Browser opens a prefilled `wa.me` link to the gym's number | customer's phone |
| 11 | Confirmation screen with order number | browser |
| 12 | Operator confirms in admin, gym fulfils, cash collected in person | real world |

**Step 7 precedes steps 9 and 10 deliberately.** If a notification fails, the order still
exists. Reverse that order and a failed push is a sale nobody ever knew about.

**Step 10 is best-effort.** If the customer never presses send in WhatsApp, step 9 already
delivered the order. Nothing depends on the customer finishing.

---

## 10. New-gym onboarding flow

1. Insert a `tenants` row — name, slug, WhatsApp number, brand tokens
2. Upload a logo to Supabase Storage
3. Add categories and products, with photos, from the admin panel
4. Preview at `?gym=<slug>`
5. Attach a subdomain or their custom domain
6. Live

No code change. No deploy. Target: under 30 minutes including entering real products.

---

## 11. File layout

```
index.html            template — one skin, many faces, mount points only
offerings.html        customer-facing: what this gym sells
admin/index.html      operator panel, auth-gated
engine/
  config.js           supabase url + anon key, tenant resolution
  store.js            all database access
  theme.js            reads tenants.brand, injects CSS variables
  cart.js             cart state, localStorage, totals
  checkout.js         validation, order write, notify fan-out
  render.js           paints catalog/cart/checkout into mount points
  engine.css          styles that reference CSS variables ONLY
supabase/
  schema.sql          tables
  policies.sql        RLS
  seed.sql            realistic placeholder catalog
  functions/notify-order/   Edge Function
pitch/index.html      owner-facing sales page (NOT part of the tenant template)
AUDIT-J7.md           slop and defect findings; brief for the future redesign
```

---

## 12. Theming contract — the reuse guarantee

**No file under `engine/` contains a hex colour.** That rule is the whole product.

- **Skin provides** CSS custom properties: `--bg`, `--surface`, `--brand`, `--brand-hover`, `--text`, `--text-muted`, `--radius`, `--font-display`, `--font-body`
- **Database provides** the values, per tenant, via `tenants.brand`
- **Skin provides** mount points: `data-j7-mount="catalog"`, `"cart"`, `"checkout"`
- **Engine provides** everything inside those mounts

Enforcement is a grep, so it cannot silently rot:

```
grep -REn "#[0-9a-fA-F]{3,8}|rgba?\(" engine/     # must return nothing
```

Consequence: replacing the entire look later is a **skin swap, not a rebuild**.

---

## 13. Item kinds

One cart, one `kind` field, kind-specific fields captured at add-to-cart.

| kind | quantity | extra fields captured |
|---|---|---|
| `product` | yes | — (stock decrement in Phase 2) |
| `membership` | locked to 1 | duration, preferred start date |
| `pt_package` | locked to 1 | sessions, preferred trainer |
| `class` | locked to 1 | preferred date, preferred slot |

**Honest limit, stated on the page:** a class line is an enquiry. There is no capacity check
and no double-booking prevention. The copy reads "we'll confirm your slot on WhatsApp" so
nobody believes they hold a seat. Real booking is a named v2, not a vague someday.

---

## 14. Admin panel

- Supabase Auth, email and password. Operator only.
- **Tenant switcher** — the gym being managed
- **Orders board** — new, confirmed, delivered, cancelled; detail view; status change
- **Products** — create, edit, deactivate; photo upload to Supabase Storage; categories; sort
- **Tenant settings** — gym name, WhatsApp number, logo, **brand tokens**, section toggles

Editing brand tokens re-skins that gym's entire storefront with no redeploy.

Styling: mono-glass, functional. This is a tool, not a brand surface.

---

## 15. Notifications

| Channel | Fires | Guaranteed | Holds secrets |
|---|---|---|---|
| Telegram bot | Edge Function, on insert | **yes** | in the function |
| Email | Edge Function, on insert | yes | in the function |
| `wa.me` deep link | browser, after insert | no — customer must press send | none |
| Admin orders board | on open | yes | behind auth |

**Phase 1 ships Telegram as the guaranteed push.** Email is wired in the same function but
stays off by default — two guaranteed channels for one order is noise, not safety.

WhatsApp Cloud API is a later swap of one function. The engine does not change.

---

## 16. Phases

### Phase 0 — clean the ground
- Write `AUDIT-J7.md` — ranked findings
- Delete the duplicate `J7 Fitness/index.html`; one file is the truth
- Rewrite the stale `CLAUDE.md` (it currently describes "Elite Gym" and points at the wrong repo)
- Compress roughly 3.3 MB of images (`logo.png` 1.1 MB, `logo-new.png` 1.1 MB, a WhatsApp screenshot 1.1 MB)

### Phase 1 — the thing a stranger can use
Supabase project (ap-south-1), schema, RLS, seed, engine, J7 converted to token-driven
theme #1, admin panel, Edge Function push, deploy — **then** `pitch/` pointing at the live URL.

**Definition of done:** a stranger opens the URL, adds whey and a membership to one cart,
checks out, and Koushik's phone buzzes with the order. Nothing less counts as done.

### Phase 2 — real-store features
Stock counts · delivery fee · GST line · coupon codes (validated server-side).

---

## 17. Tools

| Tool | Job | Cost |
|---|---|---|
| Vercel | serves the site | free tier, already in use |
| Supabase | Postgres, Auth, Storage, Edge Functions | free tier, ap-south-1 |
| Vanilla HTML/CSS/JS | engine and skin, no build step | free |
| Telegram Bot API | guaranteed push to phone | free |
| `wa.me` deep link | customer's WhatsApp thread | free |
| GitHub and git | version control, deploy trigger | free |

Deliberately excluded: **n8n** (localhost, unreachable from the internet — addable later via
a public webhook), **payment gateways** (out of scope by decision), **React/Next.js** (a build
step buys nothing here and makes skin-swapping harder).

---

## 18. Risks and honest limits

| Risk | Mitigation |
|---|---|
| Anon key is public | RLS written and tested before any real data exists |
| One deploy down means every gym down | Accepted trade-off of decision 4. Bespoke copy is the escape hatch. |
| Every gym gets the same layout | Stated openly when selling. Section toggles absorb some variation. |
| Customer never presses send in WhatsApp | Edge Function already delivered the order |
| Price edit corrupts old orders | `items` frozen snapshot |
| Coupon tampering in the browser | Validated server-side only |
| Stale price claim in `gym-design-system-complete.json` (₹8,000–₹10,000) | Below the Line B floor. Corrected in Phase 0; `pitch/` uses the real ladder. |

---

## 19. Open items

1. **Supabase project must be created** — `clock` is paused; a fresh `ap-south-1` project is needed. Creation may require cost confirmation. **Koushik's action.**
2. **Telegram bot token** — Koushik creates the bot via @BotFather and supplies the token. It goes into Edge Function secrets, never into a file and never into a commit.
3. **Gym WhatsApp number** for the J7 tenant row — placeholder until supplied.
4. **Domain** for subdomain routing — not required for the build; `?gym=` covers development.
5. **Monthly price** — setup-plus-monthly shape agreed; exact numbers set when `pitch/` is written, floor is the Line B ladder.
