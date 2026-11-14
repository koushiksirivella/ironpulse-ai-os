# IRONPULSE AI OS™ — Autonomous Gym Operating System

Engineered by **[Understone AI Automation](https://www.understone.in/)** (`+91 81254 81616` · `koushiksirivella@gmail.com`).

**IRONPULSE AI OS™** is a complete ₹1,00,000 Value-Stack Autonomous Gym Operating System (offered at a **Founding 3 Members Offer of ₹19,999 one-time** with a **Free 7-Day Live Trial** and a written **15-Day 100% Unconditional Refund Guarantee**). It unifies 24/7 member message recording, countdown + weekly direct payment link automation, Indoor + Outdoor workout generation, existing CCTV AI head-tracking, a 3D gym storefront with 10-minute supplement set delivery, Local SEO radar, and mobile/laptop master controls in one modular vanilla HTML/CSS/ESM web application.

---

## Live Architecture & Routes

| Surface | Path | Description |
| :--- | :--- | :--- |
| **Launch Notice & Redirect** | `/` (`index.html`) | System upgrade splash that announces IRONPULSE AI OS™ and redirects straight to `/pitch/` |
| **Executive Pitch LP** | `/pitch/` | Haoqi Architectural Blueprint landing page with Founding 3 Members Offer, interactive 4-step simulator, ROI calculator, Free Trial, 15-Day 100% Refund Guarantee & WhatsApp brief builder |
| **Executive Quotation PDF** | `/pitch/Koushik_Gym_Revenue_Recovery_OS_Quotation.pdf` | 4-page printable quotation & value-stack proposal |
| **Operator Command Console** | `/admin/` | Multi-screen SPA (opens directly in interactive mode) covering Renewals, 24/7 AI Agent, CCTV Head-Tracking, Leads & SEO, Outreach, Orders, Catalog, Site & Brand |
| **3D Gym & 10-Min Storefront** | `/store/` | Interactive Silk-Scroll + WebGL 3D gym storefront and supplement set e-commerce checkout |
| **Supplement Fulfilment Board** | `/staff/` | Live kitchen/counter packing board for 10-minute supplement orders |
| **10-Min Rider Dispatch Board** | `/rider/` | Hyperlocal delivery board with 6-digit OTP verification handoff |
| **Member Order Tracker** | `/order/` | Public real-time delivery status page with 6-digit handover PIN |

---

## Core Modules (₹1,00,000 Value Stack)

### 1. 24/7 AI Agent + Message Recorder & Countdown Payment Engine (`#/renewals`)
- **Omni-Channel Recording:** Logs every incoming member WhatsApp message, voice note, and Instagram DM 24/7.
- **Exact Countdown + Weekly Cadence:** Dispatches direct 1-tap UPI payment links automatically on **Day 7 (`D-7`), Day 6 (`D-6`), Day 3 (`D-3`), Day 2 (`D-2`), and Day 1 (`D-1`)** before expiry, plus **Every 1 Week (`Weekly`)** after expiry until paid.
- **Zero-Duplicate Suppression:** Instantly suppresses all remaining reminders the moment UPI verification clears.

### 2. Complete 24/7 AI Agent Builder — Indoor + Outdoor Workouts & Supplement Sets (`#/agent`)
- Generates custom **Indoor Gym Floor** and **Outdoor Running / Calisthenics** workout splits paired with macro nutrition targets.
- Automatically attaches matching complete supplement stack checkout links (**Pro Muscle Set**, **Lean Cut Set**, **Daily Recovery Set**).

### 3. Existing CCTV Camera AI Head-Tracking Software (`#/gate`)
- Connects to existing gym CCTV cameras (Cam-01 Main Gate IN/OUT + Cam-02 Free-Weight Floor) without requiring costly turnstile hardware.
- Tracks every person walking **IN** and going **OUT** via head bounding boxes (`#HT-xxx`) and syncs live floor occupancy (`38 / 60`) directly onto the 3D gym website.
- Triggers instant front-desk alerts when an expired or overdue member crosses the optical entry line.

### 4. 3D Gym Website + Complete Supplement Set Store (`10-Min Delivery OR Local SEO`) (`/store/`, `#/orders`, `/staff/`, `/rider/`)
- Sells curated complete supplement sets with **10-minute hyperlocal rider dispatch** and 6-digit OTP handoff (`?track=<token>` -> `#/orders` -> `/staff/` -> `/rider/` -> `/order/`).
- Toggleable **Nearby Area Local SEO Radar (`#/leads`)** captures high-intent searches within a 5 km radius when a gym prioritizes member acquisition over supplement delivery.

### 5. Lead Recorder & Mobile/Laptop Master Automation Control Center (`#/leads`, `#/outreach`)
- Central switchboard to pause, resume, or override every automation from phone or desktop.
- Includes full Hyderabad lead tracker and high-velocity closing scripts anchored around the **Free 7-Day Live Trial** and **15-Day 100% Unconditional Refund Guarantee**.

---

## Directory Structure

```text
ironpulse-ai-os/
├── index.html                    # System notice & redirect -> /pitch/
├── vercel.json                   # Trailing-slash & clean URL rewrites for all routes
├── serve.mjs                     # Zero-dependency local HTTP dev server + legacy SW killer
├── package.json                  # Project metadata & Node test/verification scripts
├── pitch/                        # Offer Landing Page, CSS blueprint, interactive JS & PDF quote
├── admin/                        # Unified Operator Console (#/renewals, #/agent, #/gate, #/leads, #/outreach, ...)
├── store/                        # 3D WebGL Gym & 10-Min Supplement E-Commerce storefront
├── staff/                        # Counter packing board
├── rider/                        # 10-minute rider dispatch & OTP verification
├── order/                        # Customer order tracking page
├── engine/                       # Headless skin-agnostic commerce & checkout runtime
├── skins/                        # CSS token themes (base, elite, daylight, mono, studio, vibrant)
├── styles/elite/                 # Storefront layout, scroll, motion & shop stylesheets
├── js/elite/                     # WebGL canvas & silk-scroll visual controllers
├── assets/                       # Local variable fonts (TikTokSans, GeistMono, DepartureMono) & product WebPs
├── supabase/                     # PostgreSQL + RLS schema (schema.sql, recovery.sql, functions.sql, seed.sql)
└── scripts/                      # Unit tests (node:test) & Puppeteer visual/PDF generator
```

---

## Local Development & Verification

```bash
# Install dev dependencies (only needed for PDF generation & browser smoke checks)
npm install

# Run contract & unit tests (76 tests)
npm test

# Start local static server (http://localhost:3000)
npm run serve
```

---

## Contact

- **Agency:** Understone AI Automation — [https://www.understone.in/](https://www.understone.in/)
- **Phone / WhatsApp:** `+91 81254 81616`
- **Email:** `koushiksirivella@gmail.com`
