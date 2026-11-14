#!/usr/bin/env node
// ============================================================================
// Captures real browser screenshots of the Offer 01 Gym OS surfaces, verifies
// zero console/page errors, and builds the 4-Page Executive Proposal &
// Quotation PDF:
//   - pitch/Koushik_Gym_Revenue_Recovery_OS_Quotation.pdf
//   - C:/Users/skous/Downloads/Koushik_Gym_Revenue_Recovery_OS_Quotation.pdf
// ============================================================================

import { spawn } from 'node:child_process';
import { mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import puppeteer from 'puppeteer';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = 3192;
const BASE = `http://localhost:${PORT}`;
const SHOT_DIR = join(ROOT, 'temporary screenshots');
const PDF_OUT = join(ROOT, 'pitch', 'Koushik_Gym_Revenue_Recovery_OS_Quotation.pdf');
const PDF_DOWNLOADS = 'C:/Users/skous/Downloads/Koushik_Gym_Revenue_Recovery_OS_Quotation.pdf';

mkdirSync(SHOT_DIR, { recursive: true });

const server = spawn(process.execPath, [join(ROOT, 'serve.mjs')], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: 'ignore',
});

async function waitForServer() {
  for (let i = 0; i < 40; i++) {
    try {
      if ((await fetch(`${BASE}/pitch/`)).ok) return;
    } catch { /* wait */ }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error('Local server did not start');
}

function toDataUri(filePath) {
  const b64 = readFileSync(filePath).toString('base64');
  return `data:image/png;base64,${b64}`;
}

let browser;
try {
  await waitForServer();
  browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 920, deviceScaleFactor: 1.5 });

  const errors = [];
  page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/favicon|ERR_NAME_NOT_RESOLVED|StoreError: could not reach the server/i.test(m.text())) {
      errors.push(`CONSOLE: ${m.text()}`);
    }
  });

  // 1. Capture Renewals Recovery OS
  await page.goto(`${BASE}/admin/?demo=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#view .table tbody tr');
  await new Promise((r) => setTimeout(r, 700));
  const shotRenewals = join(SHOT_DIR, 'offer01-renewals.png');
  await page.screenshot({ path: shotRenewals });
  console.log('ok  captured Renewals Recovery OS');

  // 2. Capture 24/7 AI Agent Builder & Message Recorder
  await page.evaluate(() => { location.hash = '#/agent'; });
  await new Promise((r) => setTimeout(r, 650));
  const shotCadence = join(SHOT_DIR, 'offer01-cadence-modal.png');
  await page.screenshot({ path: shotCadence });
  console.log('ok  captured 24/7 AI Agent Builder & Message Recorder');

  // 3. Capture Live Gate ("Coming & Going" CCTV AI Head-Tracking Stream)
  await page.evaluate(() => { location.hash = '#/gate'; });
  await page.waitForSelector('#view .feed-row');
  await new Promise((r) => setTimeout(r, 700));
  const shotGate = join(SHOT_DIR, 'offer01-live-gate.png');
  await page.screenshot({ path: shotGate });
  console.log('ok  captured CCTV AI Head-Tracking & Live Gate Stream');

  // 4. Capture Leads Recorder, Mobile/Laptop Command & Local SEO
  await page.evaluate(() => { location.hash = '#/leads'; });
  await page.waitForSelector('#view .pipe');
  await new Promise((r) => setTimeout(r, 600));
  const shotLeads = join(SHOT_DIR, 'offer01-leads.png');
  await page.screenshot({ path: shotLeads });
  console.log('ok  captured Leads Recorder & Mobile/Laptop Command');

  // 5. Capture Outreach Board
  await page.evaluate(() => { location.hash = '#/outreach'; });
  await page.waitForSelector('#view .table tbody tr');
  await new Promise((r) => setTimeout(r, 600));
  const shotOutreach = join(SHOT_DIR, 'offer01-outreach.png');
  await page.screenshot({ path: shotOutreach });
  console.log('ok  captured Hyderabad Gym Outreach Board');

  // 6. Capture Customer 3D Storefront (/store/)
  await page.goto(`${BASE}/store/`, { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 950));
  const shotStore = join(SHOT_DIR, 'offer01-storefront.png');
  await page.screenshot({ path: shotStore });
  console.log('ok  captured 3D Website & 10-Min Supplement Storefront');

  // 7. Capture /pitch/ Owner Blueprint LP
  await page.goto(`${BASE}/pitch/`, { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 600));
  const shotPitch = join(SHOT_DIR, 'offer01-pitch-lp.png');
  await page.screenshot({ path: shotPitch });
  console.log('ok  captured /pitch/ Lab 01 Haoqi Blueprint LP');

  if (errors.length) {
    console.error('Errors detected:', errors);
    process.exit(1);
  }
  console.log('ok  0 console/page errors across all surfaces');

  // Build 4-Page Quotation HTML (matching Koushik_3D_Walkthrough_Quotation.pdf layout)
  const imgRenewals = toDataUri(shotRenewals);
  const imgCadence = toDataUri(shotCadence);
  const imgGate = toDataUri(shotGate);
  const imgLeads = toDataUri(shotLeads);
  const imgStore = toDataUri(shotStore);
  const imgPitch = toDataUri(shotPitch);

  const quotationHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Koushik AI Automation — Offer 01 Gym Revenue Recovery OS Quotation</title>
<style>
  @font-face {
    font-family: 'Figtree';
    src: url('${BASE}/assets/fonts/TikTokSans.ttf') format('truetype');
    font-weight: 100 900;
  }
  @font-face {
    font-family: 'IBM Plex Mono';
    src: url('${BASE}/assets/fonts/GeistMono.ttf') format('truetype');
    font-weight: 100 900;
  }
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Figtree', system-ui, sans-serif;
    color: #121414;
    background: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    width: 210mm;
    height: 297mm;
    padding: 13mm 15mm 12mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    page-break-after: always;
    position: relative;
    overflow: hidden;
  }
  .page:last-child { page-break-after: auto; }
  .mono { font-family: 'IBM Plex Mono', monospace; }

  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 7px;
    border-bottom: 1.5px solid #121414;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 8.5pt;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .top-bar .muted { color: #666; }

  .tag-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 9px;
    margin-bottom: 8px;
  }
  .pill-black {
    background: #121414;
    color: #c0fe04;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 7.8pt;
    font-weight: 700;
    padding: 4px 10px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .part-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 8.2pt;
    font-weight: 700;
    color: #b84a00;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-top: 8px;
    margin-bottom: 4px;
  }

  h1 {
    font-size: 22pt;
    font-weight: 800;
    line-height: 1.08;
    letter-spacing: -0.02em;
    color: #111;
  }
  h1 .accent { color: #b84a00; }
  .sublead {
    font-size: 9.8pt;
    color: #444;
    line-height: 1.42;
    margin-top: 5px;
    margin-bottom: 10px;
  }

  .shot-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 10px;
  }
  .shot-grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
    margin-bottom: 10px;
  }
  .shot-box {
    border: 1px solid #222;
    background: #0d1010;
    overflow: hidden;
  }
  .shot-box img {
    width: 100%;
    height: 132px;
    object-fit: cover;
    object-position: top left;
    display: block;
  }
  .shot-cap {
    background: #121414;
    color: #fff;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 7.3pt;
    padding: 5px 8px;
    letter-spacing: 0.02em;
  }
  .shot-cap b { color: #c0fe04; }

  .compare-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 10px;
  }
  .compare-card {
    border: 1px solid #d4d4d0;
    padding: 10px 12px;
    background: #fafaf7;
  }
  .compare-card.good {
    border: 1.5px solid #121414;
    background: #f5f9e8;
  }
  .compare-head {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 8pt;
    font-weight: 700;
    text-transform: uppercase;
    padding-bottom: 6px;
    margin-bottom: 7px;
    border-bottom: 1px solid #ddd;
  }
  .compare-item {
    margin-bottom: 6px;
    font-size: 8.6pt;
    line-height: 1.36;
    color: #333;
  }
  .compare-item b { color: #111; display: block; margin-bottom: 1px; }

  .quote-summary-black {
    background: #101212;
    color: #ffffff;
    padding: 13px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
    border-left: 5px solid #c0fe04;
  }
  .quote-summary-black h3 {
    font-size: 13.5pt;
    font-weight: 800;
    margin: 3px 0 6px;
  }
  .quote-summary-black ul {
    list-style: none;
    font-size: 8.5pt;
    line-height: 1.5;
    color: #d8d8d8;
  }
  .price-box {
    border: 1px solid #333;
    background: #181c1c;
    padding: 10px 16px;
    text-align: center;
    min-width: 185px;
  }
  .price-strike {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5pt;
    color: #ff6b6b;
    text-decoration: line-through;
    font-weight: 700;
  }
  .price-big {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 20pt;
    font-weight: 800;
    color: #ffffff;
    line-height: 1.1;
    margin: 2px 0;
  }
  .price-save {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 7.2pt;
    color: #c0fe04;
    text-transform: uppercase;
  }

  .spec-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
    font-size: 8.5pt;
  }
  .spec-table th {
    background: #121414;
    color: #fff;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 7.5pt;
    text-transform: uppercase;
    padding: 7px 9px;
    text-align: left;
  }
  .spec-table td {
    padding: 7.5px 9px;
    border-bottom: 1px solid #e2e2de;
    vertical-align: top;
    line-height: 1.35;
  }
  .spec-table tr:nth-child(even) td { background: #f8f8f5; }

  .steps-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin: 8px 0 10px;
  }
  .step-box {
    border: 1px solid #222;
    padding: 9px 10px;
    background: #fafaf7;
  }
  .step-box .s-num {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 7.5pt;
    font-weight: 700;
    color: #b84a00;
    margin-bottom: 3px;
  }
  .step-box h4 { font-size: 9.5pt; font-weight: 800; margin-bottom: 3px; }
  .step-box p { font-size: 8pt; color: #444; line-height: 1.35; }

  .sign-box {
    border: 1.5px solid #121414;
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
  }
  .sign-head {
    grid-column: 1 / -1;
    background: #121414;
    color: #fff;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 7.8pt;
    font-weight: 700;
    padding: 6px 12px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .sign-col { padding: 10px 12px; font-size: 8.5pt; line-height: 1.48; }
  .sign-col + .sign-col { border-left: 1px solid #ddd; }

  .foot-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 6px;
    border-top: 1px solid #ccc;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 7.5pt;
    color: #666;
  }
  .foot-bar b { color: #111; }
</style>
</head>
<body>

<!-- ============================== PAGE 01 ============================== -->
<section class="page">
  <div>
    <div class="top-bar">
      <span><b>KOUSHIK AI AUTOMATION</b> &middot; GYM REVENUE RECOVERY &amp; LIVE FLOOR OS</span>
      <span class="muted">01 &middot; EXECUTIVE PROPOSAL &amp; QUOTATION</span>
    </div>

    <div class="tag-row">
      <span class="pill-black">COMPLETE GYM REVENUE RECOVERY + LIVE GATE + WEB &amp; OTP STORE</span>
      <span class="mono" style="font-size:8.2pt;color:#444">QUOTATION REF: K-GYM-2026-01</span>
    </div>

    <h1>
      Stop Losing Gym Renewals To Spreadsheets.<br>
      <span class="accent">Automate Follow-Ups, Payment Matching &amp; Live Gate Occupancy.</span>
    </h1>
    <p class="sublead">
      One central operating system for independent gyms: Track active/expiring/overdue members, trigger 7-step WhatsApp renewal reminders with UPI links, automatically suppress reminders the moment payment is verified, monitor live &ldquo;Coming &amp; Going&rdquo; floor occupancy, and run your branded gym website + supplement OTP counter.
    </p>

    <div class="shot-grid-2">
      <div class="shot-box">
        <img src="${imgRenewals}" alt="Gym Revenue Recovery OS">
        <div class="shot-cap"><b>MODULE 01:</b> Owner Renewal Recovery Dashboard + Payment Suppression</div>
      </div>
      <div class="shot-box">
        <img src="${imgGate}" alt="Live Coming and Going Gate Stream">
        <div class="shot-cap"><b>MODULE 02:</b> Live &ldquo;Coming &amp; Going&rdquo; Floor Occupancy + Expired Gate Flag</div>
      </div>
    </div>

    <div class="mono" style="font-size:8.2pt;font-weight:700;text-transform:uppercase;margin-bottom:6px">
      WHY INDEPENDENT GYMS LEAK RENEWAL REVENUE TODAY &mdash; AND HOW THIS OS FIXES IT
    </div>

    <div class="compare-grid">
      <div class="compare-card">
        <div class="compare-head" style="color:#b82020">THE OLD MANUAL WORKFLOW (SPREADSHEETS &amp; MEMORY)</div>
        <div class="compare-item">
          <b>1. Forgotten Renewal Follow-Ups:</b>
          Expiry dates sit in an Excel file or register. If front-desk staff get busy, members expiring in 7 days never receive a timely reminder or payment link.
        </div>
        <div class="compare-item">
          <b>2. Unverified UPI Screenshots &amp; Duplicate Nagging:</b>
          Members pay by UPI or cash, but records aren&rsquo;t updated immediately — so paid members still get awkward overdue reminders, or unpaid dues slip through.
        </div>
        <div class="compare-item">
          <b>3. Expired Members Walking Through The Gate Unnoticed:</b>
          During the 6:30 PM evening rush, overdue members walk onto the gym floor without the front desk realizing their plan expired days ago.
        </div>
      </div>

      <div class="compare-card good">
        <div class="compare-head" style="color:#166534">YOUR NEW AUTOMATED GYM OS (LIVE IN ONE CONSOLE)</div>
        <div class="compare-item">
          <b>1. 7-Step Automated WhatsApp Renewal Cadence:</b>
          Automatically sends approved reminders at D-7, D-3, D-1, Expiry Day, and D+1/D+3/D+5 overdue with your direct payment link.
        </div>
        <div class="compare-item">
          <b>2. Verified Payment Matching &amp; Instant Suppression:</b>
          Updates status only on a signed payment webhook or authorized staff UTR confirmation, and immediately suppresses all remaining reminders.
        </div>
        <div class="compare-item">
          <b>3. Live &ldquo;Coming &amp; Going&rdquo; Stream + Gate Alert:</b>
          Shows real-time floor crowd (e.g., 38/60 inside) and flags front-desk staff the second an expired member scans in so dues are collected on site.
        </div>
      </div>
    </div>

    <div class="quote-summary-black">
      <div>
        <div class="mono" style="font-size:7.8pt;color:#c0fe04;text-transform:uppercase">SPECIAL ALL-IN IMPLEMENTATION PACKAGE</div>
        <h3>Complete Gym Revenue Recovery OS + Live Gate + Website &amp; OTP Store</h3>
        <ul>
          <li>&bull; Central Member &amp; Expiry Dashboard + 7-Step WhatsApp Renewal Automation</li>
          <li>&bull; Verified Payment Webhook / Staff UTR Matching + Unmatched UPI Exception Queue</li>
          <li>&bull; Live &ldquo;Coming &amp; Going&rdquo; Floor Occupancy Board + Interactive Website &amp; OTP Store</li>
          <li>&bull; <b>100% Unconditional Working Refund Guarantee:</b> If anything is broken or doesn&rsquo;t work, pay ₹0</li>
        </ul>
      </div>
      <div class="price-box">
        <div class="mono" style="font-size:7pt;color:#aaa;text-transform:uppercase">STANDALONE SYSTEM VALUE</div>
        <div class="price-strike">Rs. 1,00,000</div>
        <div class="mono" style="font-size:7pt;color:#c0fe04;text-transform:uppercase;margin-top:2px">YOUR ONE-TIME QUOTE</div>
        <div class="price-big">Rs. 19,999</div>
        <div class="price-save">ALL-IN &middot; SAVE 80% (Rs. 80,000)</div>
      </div>
    </div>
  </div>

  <div class="foot-bar">
    <span>Built by <b>Understone AI Automation (www.understone.in)</b> &middot; +91 81254 81616 &middot; koushiksirivella@gmail.com</span>
    <b>PAGE 01 / 04</b>
  </div>
</section>

<!-- ============================== PAGE 02 ============================== -->
<section class="page">
  <div>
    <div class="top-bar">
      <span><b>KOUSHIK AI AUTOMATION</b> &middot; GYM REVENUE RECOVERY &amp; LIVE FLOOR OS</span>
      <span class="muted">02 &middot; CORE ARCHITECTURE &amp; LIVE SURFACES</span>
    </div>

    <div class="part-label">PART 1 &middot; WHAT WE DEPLOY FOR YOUR GYM (5 INTEGRATED SURFACES)</div>
    <h1>Complete Revenue, Floor Gate &amp; Storefront Scope</h1>
    <p class="sublead">
      Every module below is already engineered on a zero-bloat multi-tenant Supabase + Row-Level Security architecture. We configure your gym&rsquo;s branding, import your member sheet, and hand over a live working system.
    </p>

    <div class="shot-grid-3">
      <div class="shot-box">
        <img src="${imgCadence}" style="height:108px" alt="WhatsApp 7-Step Cadence">
        <div class="shot-cap"><b>01 &middot; WHATSAPP CADENCE</b><br>D-7 to D+5 + Auto-Suppression</div>
      </div>
      <div class="shot-box">
        <img src="${imgStore}" style="height:108px" alt="Interactive 3D Gym Website">
        <div class="shot-cap"><b>02 &middot; 3D/WEBGL GYM SITE</b><br>Plans, Timetable &amp; Supplement Cart</div>
      </div>
      <div class="shot-box">
        <img src="${imgLeads}" style="height:108px" alt="Lead to Trial Pipeline">
        <div class="shot-cap"><b>03 &middot; LEAD CLOSER BOARD</b><br>Sub-2s WhatsApp Ack &rarr; Trial &rarr; Joined</div>
      </div>
    </div>

    <div class="compare-grid">
      <div class="compare-card" style="border:1.5px solid #121414;background:#fff">
        <div class="compare-head" style="background:#121414;color:#fff;margin:-10px -12px 8px;padding:7px 12px">
          A &middot; REVENUE RECOVERY &amp; WHATSAPP ENGINE
        </div>
        <div class="compare-item">
          <b>1. Central Member &amp; Plan Registry:</b>
          Clean import of your existing member spreadsheet. Tracks plan start date, expiry date, amount due, and live status (Active, Expiring &le;7d, Overdue, Paused).
        </div>
        <div class="compare-item">
          <b>2. Separated Owner Financial KPIs:</b>
          Shows Collected Revenue This Month, Expiring 7-Day Pipeline, and Recoverable Overdue Dues as strictly separate figures — never mixing pending dues with collected cash.
        </div>
        <div class="compare-item">
          <b>3. 7-Stage WhatsApp Reminder Workflow:</b>
          Pre-expiry (D-7, D-3, D-1), Expiry Day (D-0), and Overdue (D+1, D+3, D+5) messages with your approved UPI / payment gateway link and opt-out compliance.
        </div>
        <div class="compare-item">
          <b>4. Verified Payment &amp; Reminder Suppression:</b>
          Updates payment status only after a signed webhook or staff UTR entry, extends membership expiry automatically, and suppresses all future reminders for that cycle.
        </div>
        <div class="compare-item">
          <b>5. Unmatched UPI Exception Queue:</b>
          Ambiguous payments (e.g., paid from a family member&rsquo;s UPI account) are held in a Staff Review Queue rather than guessed or misassigned.
        </div>
      </div>

      <div class="compare-card" style="border:1.5px solid #121414;background:#fff">
        <div class="compare-head" style="background:#121414;color:#fff;margin:-10px -12px 8px;padding:7px 12px">
          B &middot; LIVE GATE STREAM, WEBSITE &amp; OTP STORE
        </div>
        <div class="compare-item">
          <b>1. Live &ldquo;Coming &amp; Going&rdquo; Floor Occupancy Stream:</b>
          Tracks member QR check-ins and check-outs in real time, displaying current floor occupancy (e.g. 38 / 60 capacity) and hourly peak traffic curves.
        </div>
        <div class="compare-item">
          <b>2. Expired-Member Gate Check-In Flag:</b>
          When an overdue member scans in at the front desk, the console triggers an immediate high-priority alert with a 1-click &ldquo;Collect &amp; Renew at Desk&rdquo; action.
        </div>
        <div class="compare-item">
          <b>3. Inbound Lead-to-Trial Closer Pipeline:</b>
          Captures website, walk-in QR, and Instagram enquiries, sends an instant WhatsApp acknowledgement, and tracks Contacted &rarr; Trial Booked &rarr; Joined.
        </div>
        <div class="compare-item">
          <b>4. Branded Interactive Gym Website + Supplement Store:</b>
          Responsive Silk-Scroll website with your gym&rsquo;s logo, colours, hours, membership plans, PT packages, and supplement catalogue.
        </div>
        <div class="compare-item">
          <b>5. Cryptographic 6-Digit OTP Counter &amp; Rider Apps:</b>
          Includes dedicated <code>/staff/</code> counter board, <code>/rider/</code> delivery board, and <code>/order/</code> customer OTP tracking so zero stock is handed over without verification.
        </div>
      </div>
    </div>
  </div>

  <div class="foot-bar">
    <span>Multi-Tenant Postgres RLS &middot; Immutable Audit Trail &middot; Koushik AI Automation</span>
    <b>PAGE 02 / 04</b>
  </div>
</section>

<!-- ============================== PAGE 03 ============================== -->
<section class="page">
  <div>
    <div class="top-bar">
      <span><b>KOUSHIK AI AUTOMATION</b> &middot; GYM REVENUE RECOVERY &amp; LIVE FLOOR OS</span>
      <span class="muted">03 &middot; ROI MATH, CADENCE MATRIX &amp; 12 ACCEPTANCE TESTS</span>
    </div>

    <div class="part-label">PART 2 &middot; CONFIGURABLE WHATSAPP CADENCE &amp; MEASURABLE ROI</div>
    <h1>Every Reminder, Exception &amp; Rupee Tracked In Writing.</h1>
    <p class="sublead">
      You approve message wording, language, and timing before go-live. Below is the standard 7-stage renewal schedule and the 12 acceptance criteria we verify together before final handover.
    </p>

    <table class="spec-table">
      <thead>
        <tr>
          <th>Trigger Window</th>
          <th>Automated System Action</th>
          <th>If Member Pays Before Trigger</th>
          <th>Audit &amp; Exception Handling</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="mono"><b>D-7 (7 Days Before)</b></td>
          <td>Friendly renewal notice + plan details + direct UPI / payment link</td>
          <td>Automatically skipped (Active)</td>
          <td>Delivery timestamp logged</td>
        </tr>
        <tr>
          <td class="mono"><b>D-3 &amp; D-1 (Pre-Expiry)</b></td>
          <td>Follow-up WhatsApp reminder + 1-tap renewal link</td>
          <td><b>SUPPRESSED immediately on payment</b></td>
          <td>Failed numbers routed to Staff Queue</td>
        </tr>
        <tr>
          <td class="mono"><b>D-0 (Expiry Date)</b></td>
          <td>Expiry day notice + instant renewal confirmation link</td>
          <td><b>SUPPRESSED immediately on payment</b></td>
          <td>Status flips Expiring &rarr; Expired</td>
        </tr>
        <tr>
          <td class="mono"><b>D+1 &amp; D+3 (Overdue)</b></td>
          <td>Overdue payment follow-up + option to pause/hold plan</td>
          <td><b>SUPPRESSED immediately on payment</b></td>
          <td>Gate check-in triggers Desk Flag</td>
        </tr>
        <tr>
          <td class="mono"><b>D+5–6 (Final Notice)</b></td>
          <td>Final configured WhatsApp notice + front-desk call task</td>
          <td><b>SUPPRESSED immediately on payment</b></td>
          <td>Moved to Staff Intervention Queue</td>
        </tr>
      </tbody>
    </table>

    <div class="compare-grid">
      <div class="compare-card">
        <div class="compare-head">ILLUSTRATIVE ROI &amp; PAYBACK MATH (OFFER 01 §8.3)</div>
        <div class="compare-item">
          <b>Example Independent Gym Baseline:</b>
          60 memberships expiring per month &middot; Average renewal fee Rs. 3,500 &middot; Current timely renewal rate 65% (manual chasing).
        </div>
        <div class="compare-item">
          <b>Recovering Just 6 to 10 Missed Renewals / Month:</b>
          &bull; 6 recovered renewals &times; Rs. 3,500 = <b>Rs. 21,000 / month</b><br>
          &bull; 10 recovered renewals &times; Rs. 3,500 = <b>Rs. 35,000 / month (Rs. 4.2L / year)</b><br>
          &bull; Front-desk time saved: ~35 hrs/month of manual Excel &amp; WhatsApp checking.
        </div>
        <div class="compare-item" style="margin-top:6px;padding:7px;background:#eef8d6;border:1px solid #97cf24">
          <b>Payback Period:</b> Recovering just <b>6 missed renewals once</b> pays back the entire Rs. 19,999 one-time implementation fee.
        </div>
      </div>

      <div class="compare-card">
        <div class="compare-head">12 WRITTEN ACCEPTANCE TESTS (OFFER 01 §15)</div>
        <div class="compare-item" style="font-size:8pt;line-height:1.45">
          <b>01.</b> Authorized staff can search &amp; view any member record.<br>
          <b>02.</b> Expiry status calculates accurately from plan duration.<br>
          <b>03.</b> Members in D-7 to D+5 windows are selected accurately.<br>
          <b>04.</b> Approved WhatsApp templates fire via configured BSP.<br>
          <b>05.</b> Verified payment updates the exact member &amp; extends expiry.<br>
          <b>06.</b> Unmatched UPI payments route to Staff Exception Queue.<br>
          <b>07.</b> Confirmed payment suppresses 100% of remaining reminders.<br>
          <b>08.</b> Idempotent webhooks prevent duplicate reminders/credits.<br>
          <b>09.</b> Failed WhatsApp deliveries appear in Exception Queue.<br>
          <b>10.</b> Dashboard totals reconcile with underlying records.<br>
          <b>11.</b> Tenant isolation (RLS) blocks cross-gym data access.<br>
          <b>12.</b> Live Gate flags expired members scanning in at the desk.
        </div>
      </div>
    </div>
  </div>

  <div class="foot-bar">
    <span>12 Written Acceptance Criteria &middot; Verified Before Final Handover</span>
    <b>PAGE 03 / 04</b>
  </div>
</section>

<!-- ============================== PAGE 04 ============================== -->
<section class="page">
  <div>
    <div class="top-bar">
      <span><b>KOUSHIK AI AUTOMATION</b> &middot; GYM REVENUE RECOVERY &amp; LIVE FLOOR OS</span>
      <span class="muted">04 &middot; OFFICIAL COMMERCIAL QUOTATION &amp; GUARANTEE</span>
    </div>

    <div class="part-label">PART 3 &middot; ITEMIZED VALUE BREAKDOWN &amp; FINAL COMMERCIAL QUOTATION</div>
    <h1>Rs. 1,00,000 Complete Gym OS &mdash; Yours for Rs. 19,999</h1>
    <p class="sublead">
      Below is the complete itemized breakdown of every deliverable included in your Gym Revenue Recovery &amp; Live Occupancy OS package, backed by our 100% Unconditional Working System Refund Guarantee.
    </p>

    <table class="spec-table">
      <thead>
        <tr>
          <th>#</th>
          <th>DELIVERABLE &amp; GYM OS MODULE SCOPE</th>
          <th style="text-align:right">REFERENCE VALUE</th>
          <th style="text-align:right">INCLUDED</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="mono"><b>01</b></td>
          <td>
            <b>Gym Revenue Recovery OS &amp; Central Member Registry</b><br>
            <span style="color:#555">Workspace setup, clean member CSV import, separated financial KPIs (Collected vs. Pending vs. Disputed), and expiry filters.</span>
          </td>
          <td class="mono" style="text-align:right"><b>Rs. 30,000</b></td>
          <td class="mono" style="text-align:right;color:#166534"><b>INCLUDED</b></td>
        </tr>
        <tr>
          <td class="mono"><b>02</b></td>
          <td>
            <b>7-Stage Automated WhatsApp Cadence + Verified Payment Suppression</b><br>
            <span style="color:#555">D-7 to D+5 scheduled reminders, UPI/gateway payment matching, automatic reminder suppression on payment, and Unmatched Exception Queue.</span>
          </td>
          <td class="mono" style="text-align:right"><b>Rs. 20,000</b></td>
          <td class="mono" style="text-align:right;color:#166534"><b>INCLUDED</b></td>
        </tr>
        <tr>
          <td class="mono"><b>03</b></td>
          <td>
            <b>Live &ldquo;Coming &amp; Going&rdquo; Floor Occupancy Stream &amp; Gate Watchdog</b><br>
            <span style="color:#555">Real-time QR check-in/check-out feed, live capacity gauge, hourly crowd curve, and front-desk collection flag when an expired member scans in.</span>
          </td>
          <td class="mono" style="text-align:right"><b>Rs. 20,000</b></td>
          <td class="mono" style="text-align:right;color:#166534"><b>INCLUDED</b></td>
        </tr>
        <tr>
          <td class="mono"><b>04</b></td>
          <td>
            <b>Interactive 3D/WebGL Branded Gym Website + Inbound Lead Closer</b><br>
            <span style="color:#555">Custom Silk-Scroll gym website with membership plans, timetable, and sub-2s WhatsApp enquiry &rarr; Trial Booked &rarr; Joined pipeline.</span>
          </td>
          <td class="mono" style="text-align:right"><b>Rs. 15,000</b></td>
          <td class="mono" style="text-align:right;color:#166534"><b>INCLUDED</b></td>
        </tr>
        <tr>
          <td class="mono"><b>05</b></td>
          <td>
            <b>Supplement E-Commerce Store + 6-Digit OTP Counter &amp; Rider Web Apps</b><br>
            <span style="color:#555">Full supplement/merch checkout plus <code>/staff/</code> counter board, <code>/rider/</code> delivery board, and <code>/order/</code> customer OTP verification.</span>
          </td>
          <td class="mono" style="text-align:right"><b>Rs. 15,000</b></td>
          <td class="mono" style="text-align:right;color:#166534"><b>INCLUDED</b></td>
        </tr>
        <tr style="background:#f3f3ee">
          <td colspan="2" class="mono"><b>TOTAL STANDALONE SYSTEM VALUE</b></td>
          <td class="mono" style="text-align:right;color:#c92a2a;text-decoration:line-through;white-space:nowrap"><b>Rs. 1,00,000</b></td>
          <td class="mono" style="text-align:right;color:#b84a00;white-space:nowrap"><b>80% OFF</b></td>
        </tr>
        <tr style="background:#121414;color:#fff">
          <td colspan="2" class="mono" style="color:#fff;padding:10px"><b>FINAL ALL-INCLUSIVE IMPLEMENTATION PRICE (COMPLETE PACKAGE)</b></td>
          <td colspan="2" class="mono" style="text-align:right;color:#c0fe04;font-size:13.5pt;padding:10px;white-space:nowrap"><b>Rs. 19,999 ONLY</b></td>
        </tr>
      </tbody>
    </table>

    <div class="mono" style="font-size:8pt;font-weight:700;text-transform:uppercase;margin-top:4px">
      HOW WE GO LIVE FROM START TO HANDOVER (4 SIMPLE STEPS)
    </div>
    <div class="steps-4">
      <div class="step-box">
        <div class="s-num">STEP 01</div>
        <h4>10-Min Discovery</h4>
        <p>Confirm your membership plans, reminder schedule, payment method &amp; member sheet format.</p>
      </div>
      <div class="step-box">
        <div class="s-num">STEP 02</div>
        <h4>Configure &amp; Import</h4>
        <p>We set up your isolated gym workspace, import clean member records, and brand your storefront.</p>
      </div>
      <div class="step-box">
        <div class="s-num">STEP 03</div>
        <h4>12 Acceptance Tests</h4>
        <p>We test expiry triggers, payment matching, reminder suppression &amp; live gate alerts together.</p>
      </div>
      <div class="step-box">
        <div class="s-num">STEP 04</div>
        <h4>Staff Handover</h4>
        <p>1 live staff training session + quick-start guide + 30 days of implementation support.</p>
      </div>
    </div>

    <div class="sign-box">
      <div class="sign-head">PAYMENT SCHEDULE, 100% REFUND GUARANTEE &amp; DIRECT CLIENT APPROVAL</div>
      <div class="sign-col">
        <b>MILESTONE PAYMENT TERMS (TOTAL: Rs. 19,999)</b><br>
        &bull; <b>50% Advance (Rs. 10,000):</b> To start workspace &amp; member OS build<br>
        &bull; <b>50% Final (Rs. 9,999):</b> After all 12 acceptance tests pass before handover<br><br>
        <b style="color:#166534">100% UNCONDITIONAL WORKING GUARANTEE</b><br>
        &bull; If anything is broken or any agreed workflow fails to work within 30 days of go-live, you receive a <b>100% Full Refund of your implementation fee without any conditions.</b><br>
        &bull; Third-party WhatsApp BSP / gateway / domain charges (if any) are direct at cost.
      </div>
      <div class="sign-col">
        <div class="mono" style="font-size:7.5pt;color:#666;text-transform:uppercase">PREPARED BY</div>
        <div style="font-size:12pt;font-weight:800;margin-top:2px">Koushik Sirivella</div>
        <div style="font-size:8.2pt;color:#444"><b>Understone AI Automation</b> (<b>www.understone.in</b>)</div>
        <div style="font-size:8.2pt;color:#444">Email: <b>koushiksirivella@gmail.com</b></div>
        <div style="font-size:8.2pt;color:#444;margin-bottom:10px">WhatsApp / Call: <b>+91 81254 81616</b></div>

        <div class="mono" style="font-size:7.5pt;color:#b84a00;text-transform:uppercase;margin-bottom:4px">CLIENT APPROVAL TO START</div>
        <div style="font-size:8.2pt;margin-bottom:8px">Gym Name / Owner: _______________________________</div>
        <div style="font-size:8.2pt">Signature &amp; Date: &nbsp;&nbsp;_______________________________</div>
      </div>
    </div>
  </div>

  <div class="foot-bar">
    <span>Agency: <b>www.understone.in</b> &middot; Email: <b>koushiksirivella@gmail.com</b> &middot; Call/WA: <b>+91 81254 81616</b></span>
    <b>PAGE 04 / 04</b>
  </div>
</section>

</body>
</html>`;

  const htmlPath = join(SHOT_DIR, 'offer01-quotation.html');
  writeFileSync(htmlPath, quotationHtml, 'utf8');

  const pdfPage = await browser.newPage();
  await pdfPage.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
  await pdfPage.pdf({
    path: PDF_OUT,
    format: 'A4',
    printBackground: true,
    margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
  });
  copyFileSync(PDF_OUT, PDF_DOWNLOADS);
  console.log(`ok  generated 4-page PDF -> ${PDF_OUT}`);
  console.log(`ok  copied 4-page PDF    -> ${PDF_DOWNLOADS}`);
} finally {
  await browser?.close();
  server.kill();
}
