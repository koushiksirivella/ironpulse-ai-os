# The engine — what every file does

Written for the person maintaining this six months from now, and for Koushik,
who is learning it while building it.

**Read this in order.** Each section builds on the one before.

---

## The one idea

There are two kinds of file in this repo, and the whole product depends on
keeping them apart:

| | Knows about | Contains colours | Changes when |
|---|---|---|---|
| **`engine/`** | shopping | **never** | commerce logic changes |
| **`skins/`** | looking good | always | a design changes |

Because the engine has no colours, replacing the entire look is a stylesheet
swap. Because the skin has no logic, a designer cannot break checkout.

`npm test` fails the build if a colour, a font name or a gym name gets into
`engine/`. That check is the product's warranty, not a style preference.

---

## Layer 1 — the browser

```
engine/config.js      which gym is this page for, and where is the database
engine/money.js       integers only; rupees exist at two edges and nowhere else
engine/cart.js        cart state machine — no DOM, no network, fully testable
engine/store.js       the ONLY file that calls fetch()
engine/theme.js       tenants.brand -> CSS custom properties on <html>
engine/dom.js         node builder; nothing is ever built from an HTML string
engine/render.js      paints catalog, cart, checkout, confirmation
engine/checkout.js    validation, order payload, WhatsApp handoff
engine/index.js       boot() — wires all of the above to the page
engine/engine.css     every colour is var(--token). Zero literals.
```

### Why each one is separate

**`money.js`** — every amount is an integer number of paise. `0.1 + 0.2` is not
`0.3` in floating point, and a nine-line cart can end up a paisa off the number
the customer can see. Integers cannot drift.

**`cart.js`** has no DOM and no `fetch`. That is what lets `npm test` check the
maths that decides what a customer is charged, in milliseconds, with no browser.

**`store.js`** is the only file allowed to touch the network. When Supabase is
one day swapped for something else, exactly one file changes. A test enforces
this.

**`dom.js`** exists so product names are never interpolated into HTML. A gym
owner types a product name; that string ends up on every visitor's page. Setting
`.textContent` makes an injected `<img onerror=...>` impossible instead of
merely unlikely — there is no escaping function to forget to call.

**`theme.js`** is the hinge the business turns on. It reads a small JSON object
from the database and writes it onto `<html>` as `--brand: #FF2738` and friends.
That is why the admin panel can restyle a gym with no deploy.

---

## Layer 2 — the skin

```
skins/base.css       neutral defaults, so no token is ever undefined
skins/vibrant.css    THE DEFAULT — red, dark, glass, on the site's own palette
skins/mono.css       black and white, mono-glass, no accent colour at all
skins/j7.css         the flat red look verified against the live site
skins/daylight.css   light and paper, to prove the point
```

Three places can set a token. **Later wins:**

1. `skins/base.css` — the safety net
2. another skin file — a designed look
3. `tenants.brand` — inline on `<html>`, per gym, from the database

Row 3 is inline style, so it beats every stylesheet. That is deliberate: the
admin panel must always win over a designer's file. It is also what makes a skin
swap look broken when you forget it — a gym whose `brand` row still holds the old
colours renders the old colours no matter which file the page links.
`node scripts/brand.mjs <slug> <preset>` writes a whole preset into that row.

**To restyle one gym:** admin panel → Settings → edit a token. No deploy.
**To restyle every gym:** write a new file in `skins/`.

### The tokens are not only colours

A colour-only token set can recolour a shop. It cannot redesign one — "make the
cards glass", "make the photos black and white", "slow it all down" each meant
editing `engine.css`, which is the exact thing the engine exists to avoid. So the
contract covers material, texture and motion too:

| group | tokens |
|---|---|
| colour | `bg` `surface` `surface-2` `border` `brand` `brand-hover` `brand-glow` `brand-text` `text` `text-muted` `danger` |
| shape / type | `radius` `radius-lg` `font-display` `font-body` |
| material | `surface-fill` `rim` `shadow` `glow` |
| texture | `field` `grain` `grain-opacity` |
| imagery | `img-filter` `img-filter-hover` |
| motion | `ease` `dur-1` `dur-2` `dur-3` |

Translucency inside `engine.css` is built with `color-mix()` over a token rather
than a literal alpha value — that is how a pointer-tracking sheen exists in a
file containing no colour. Change `--brand-glow` and every sheen, focus ring and
highlight moves with it.

**`--grain` is the one token a gym cannot set.** Its value is a `url(data:…)`,
and `engine/theme.js` refuses `url(` from the database so a row can never make a
visitor's browser fetch something. It comes from the skin file only.

---

## Layer 2b — motion

`engine/motion.js`, started by `boot()` and restarted after every repaint,
because the catalog and cart are rebuilt wholesale and the new nodes carry no
observers.

Reveal on scroll · per-grid stagger · mask-line reveal on section titles ·
pointer tilt on cards · weak magnetism on primary buttons.

**The rule it obeys:** strip every effect and the page must still look composed.
`[data-j7-reveal]` is styled **visible** by default and is hidden only once
`motion.js` has set `data-j7-motion="on"` on `<html>` — after confirming it can
observe and reveal again. Written the other way round, a page with JS disabled, a
crawler, a print, or a failed module load shows an empty shop, and that failure
is both silent and total.

`prefers-reduced-motion: reduce` disables all of it twice over: `motion.js`
early-returns, and `engine.css` carries a blanket block.

---

## Layer 2c — catalog imagery

```
scripts/assets.mjs     search -> sources.json -> download -> grade -> manifest
assets/catalog/*.webp  20 graded images, all under the 200 KB page budget
assets/library.json    the manifest the admin panel's media library reads
assets/CREDITS.md      author and licence for every one, generated
```

Sources are **Openverse** and **Wikimedia Commons**: no API key, and both return
the licence in the same response, which is what makes attribution automatic
rather than a TODO. Only `cc0`, `pdm`, `by` and `by-sa` are shipped — `nc` bars
commercial use and `nd` bars the crop.

Two phases on purpose. `search` proposes and writes `assets/sources.json`;
`fetch` downloads exactly what that file names. The lock file is the artifact: it
is committed, hand-correctable, and rebuilds identically. Search rank is not
taste — "personal trainer" returned a carnival parade — so `assets.mjs alts`
builds a contact sheet of the alternates and `bump <slot> <n>` takes a different
one. Pick imagery by looking at it.

**Masters are colour.** An earlier pass baked greyscale into the files, which
made the monochrome skin look right and every other skin look broken, and undoing
it cost a full re-download. Desaturation is a look, and a look belongs in
`--img-filter` where a skin changes its mind for free.

Encoding steps quality down until each file fits the same 200 KB budget the test
enforces; at the q52 floor it writes anyway and lets the test fail, because an
image that cannot fit needs a smaller crop, not more compression.

---

## Layer 3 — the database

```
supabase/schema.sql     5 tables
supabase/policies.sql   Row Level Security — the only wall
supabase/functions.sql  place_order()  <- orders go through here
supabase/storage.sql    the image bucket
supabase/seed.sql       J7's real catalogue
```

### The security model in one paragraph

The anon key ships inside every visitor's browser. It is public knowledge, not
a secret. What protects the data is RLS: anon can read active products of active
gyms, and can insert an order. **Anon cannot read orders at all** — otherwise
anyone who opens devtools reads every customer name and phone number on the
platform, for every gym at once.

### Why `place_order` exists

The engine does not insert into `orders` directly. It calls a database function,
for two reasons:

1. **The browser cannot be trusted with prices.** A direct insert lets anyone
   with devtools order a ₹9,000 membership for ₹1. `place_order` ignores every
   price in the request and re-reads it from `products`. It also forces
   quantity 1 on memberships, PT packages and classes.

2. **The browser cannot read orders back**, so an insert cannot return the order
   number. `place_order` returns exactly three fields — `order_no`, `total`,
   `currency` — and nothing else. A test asserts that list, so the function can
   never quietly become a read path into orders.

Proof, from `npm test`:

```
place_order ignores a price sent by the browser
place_order forces quantity 1 on memberships even when the browser asks for 9
place_order returns an order number, and nothing else about the order
```

---

## Layer 4 — the admin panel

```
admin/index.html   one mount point; everything is painted by JS
admin/api.js       auth + authenticated reads/writes/uploads/storage listing
admin/admin.js     the four tabs
admin/admin.css    mono-glass — a tool, not a brand surface
```

**Orders · Products · Media · Settings.**

*Media* has two sources kept deliberately apart on screen: **this gym's uploads**
(its own folder in the `gym-media` bucket) and **built in** (the 20 graded images
from `assets/library.json`, identical for every gym). Merging them into one grid
would hide the thing an operator most needs to know — whether a photo is theirs
or stock — and stock photos of somebody else's gym on a real gym's site is a
specific kind of embarrassing.

Any product's photo is set from the same picker, which can also upload on the
spot. Deleting an upload that products still reference warns and names them.

*Settings* splits the token editor: colour tokens get a colour picker, everything
else gets a text field with the live `isSafeValue()` check beside it, so a value
the engine will refuse says so before you press Save rather than silently doing
nothing after.

Signed in as `authenticated`, RLS grants full access. **There is currently no
tenant scoping on the operator role** — one account can see every gym. That is
the business model (spec decision 9), not an oversight: gym owners do not log
in, so the gym stays subscribed. If gym-owner logins are ever added, every
policy in `policies.sql` must gain a tenant scope *first*.

The session lives in `sessionStorage` — it survives a reload and dies when the
tab closes. An admin token in `localStorage` outlives the person using the
machine.

**Products are archived, never deleted.** A deleted product leaves every past
order pointing at nothing.

---

## The order flow, end to end

```
1  visitor lands            engine/config.js resolves which gym
2  brand applied            engine/theme.js writes CSS variables
                            skipped when config.js brandSuspended() says so:
                            ?brand=off, dev hosts only, CLAUDE.md section 9
3  catalog fetched          engine/store.js
4  catalog painted          engine/render.js
5  items added              engine/cart.js, saved to localStorage
6  form filled              engine/checkout.js validates (same rules as the DB)
7  place_order() called     prices re-read server side; ORDER NOW EXISTS
8  order number returned    confirmation screen
9  wa.me link offered       best effort — customer may never press send
10 operator sees it         admin panel, Orders tab
```

**Step 7 is the point of no return, and it comes before any notification.** If a
notification ever fails, the order still exists. Reverse that order and a failed
push is a sale nobody ever knew about.

**Step 9 is optional by design.** Nothing depends on the customer finishing.

---

## Running it

```bash
npm install
npm run serve          # the site at /, the harness at /demo/, the panel at /admin/

npm test               # 62 tests: logic, design contract, assets, live RLS
npm run smoke          # real browser, saves screenshots
npm run smoke:order    # also places a real order, then deletes it
npm run shot demo/ out.png    # screenshot a page, and report dead fonts/images

npm run operator create you@example.com    # make an admin login
npm run db:setup                           # schema + policies + functions + storage
```

Look, don't probe: a computed-style check passes on a page whose fonts silently
died, whose glass composited as a transparent hole, or whose images 404ed into
empty boxes. `npm run shot` exists so those get seen.

**Imagery and branding**

```bash
npm run assets:search              # propose a pick per slot -> assets/sources.json
npm run assets:alts <slot>...      # contact sheet of the alternates, to choose by eye
node scripts/assets.mjs bump <slot> <n>   # take the nth alternate instead
npm run assets:fetch [slot...]     # download + grade + write the manifest
npm run assets:sheet               # contact sheet of everything, to check the set

npm run brand j7 vibrant           # write a whole skin preset into tenants.brand
npm run brand j7 mono              # ...or the black-and-white one
```

`npm run db:*` and `npm run brand` need `.env.supabase.local` (gitignored)
holding `SUPABASE_PROJECT_REF` plus either `SUPABASE_DB_PASSWORD` (preferred —
runs real DDL over the pooler, and survives a revoked token) or
`SUPABASE_ACCESS_TOKEN`. Nothing prints a secret.

---

## Adding a second gym

No code change, no deploy:

1. `insert into tenants (slug, name, brand, ...) values ('ironworks', ...)`
2. Sign in to `/admin/`, pick the gym in the top bar
3. Add categories and products, upload photos
4. Set the brand tokens under **Look** — the preview updates live
5. Preview at `?gym=ironworks`
6. Point a subdomain or their own domain at it

Target: under 30 minutes including entering real products.

---

## What is deliberately NOT built

| Not here | Why | When |
|---|---|---|
| Online payment | Money changes hands at the gym | not planned |
| Class capacity | A class line is a request, and the page says so | named v2 |
| Customer accounts | Guest checkout only | not planned |
| Stock, delivery fee, GST, coupons | Phase 2 | after Phase 1 ships |
| Notification push | Needs a Telegram token or an email sender | next |
| Gym-owner logins | Would need tenant-scoped RLS first | when priced |

---

## The known weak spot

`orders.total` is written by `place_order` from real product prices, so it
cannot be tampered with. But **nobody is notified automatically yet** — orders
only appear in the admin panel. Until the notify function is deployed, the panel
has to be checked by hand. That is the next thing to build, and it is the last
gap between here and the spec's definition of done:

> a stranger opens the URL, adds whey and a membership to one cart, checks out,
> and Koushik's phone buzzes with the order.
