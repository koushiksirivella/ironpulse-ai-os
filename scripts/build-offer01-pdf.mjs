#!/usr/bin/env node
// ============================================================================
// Builds the corrected 4-Page Master Executive Blueprint & Valuation PDF:
//   - pitch/Koushik_Gym_Revenue_Recovery_OS_Quotation.pdf
//   - C:/Users/skous/Downloads/Koushik_Gym_Revenue_Recovery_OS_Quotation.pdf
// ============================================================================

import { copyFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { basePdfCss, withAppSession } from './pdf-shared.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PDF_OUT = join(ROOT, 'pitch', 'Koushik_Gym_Revenue_Recovery_OS_Quotation.pdf');
const PDF_DOWNLOADS = 'C:/Users/skous/Downloads/Koushik_Gym_Revenue_Recovery_OS_Quotation.pdf';

await withAppSession(ROOT, 3192, async ({ browser, base, shotDir, shots }) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Understone AI Automation — IRONPULSE AI OS Master Blueprint & Valuation</title>
<style>${basePdfCss(base)}</style>
</head>
<body>

<!-- ============================== PAGE 01 ============================== -->
<section class="page">
  <div>
    <div class="top-bar">
      <span><b>UNDERSTONE AI AUTOMATION</b> &middot; IRONPULSE AI OS&trade; MASTER BLUEPRINT</span>
      <span class="muted">01 &middot; SYSTEM ARCHITECTURE &amp; REVENUE LEAK AUDIT</span>
    </div>

    <div class="tag-row">
      <span class="pill-black">24/7 AI AGENT + D-7..D-1/WEEKLY PAY + CCTV HEAD-TRACKING + 3D &amp; OTP STORE</span>
      <span class="mono" style="font-size:8pt;color:#444">REF: US-GYM-2026-01</span>
    </div>

    <h1>
      Stop Losing Gym Revenue To Manual Tracking.<br>
      <span class="accent">Automate Renewals, CCTV Crowd Tracking &amp; Supplement Orders.</span>
    </h1>
    <p class="sublead">
      Built by Understone AI Automation for growth-focused gyms: a 24/7 AI Agent &amp; Message Recorder that dispatches direct UPI links on Day 7, 6, 3, 2, 1 &amp; Weekly, builds Indoor + Outdoor workout plans, installs AI Head-Tracking on existing CCTV cameras synced to your 3D website, and powers 10-minute supplement delivery or 5km Local SEO — controlled anywhere from mobile or laptop.
    </p>

    <div class="shot-grid-2">
      <div class="shot-box">
        <img src="${shots.renewals}" alt="Gym Revenue Recovery OS">
        <div class="shot-cap"><b>MODULE 01:</b> Renewal Engine (D-7, D-6, D-3, D-2, D-1 + Weekly &amp; Auto-Stop)</div>
      </div>
      <div class="shot-box">
        <img src="${shots.gate}" alt="CCTV AI Head-Tracking Stream">
        <div class="shot-cap"><b>MODULE 02:</b> Existing CCTV AI Head-Tracking (Live IN/OUT &amp; Overdue Desk Alert)</div>
      </div>
    </div>

    <div class="mono" style="font-size:8pt;font-weight:700;text-transform:uppercase;margin-bottom:5px">
      WHERE GYM REVENUE LEAKS EVERY MONTH &mdash; AND HOW IRONPULSE AI OS&trade; PLUGS IT
    </div>

    <div class="compare-grid">
      <div class="compare-card">
        <div class="compare-head" style="color:#b82020">MANUAL WORKFLOW (SPREADSHEETS &amp; DELAYED REPLIES)</div>
        <div class="compare-item">
          <b>1. Missed Pre-Expiry Windows &amp; Late Chasing:</b>
          Expiry dates sit in Excel or registers. When staff get busy, reminders aren&rsquo;t sent cleanly before expiry, or paid members receive awkward duplicate messages.
        </div>
        <div class="compare-item">
          <b>2. No Visibility Into Peak Floor Crowd or Overdue Walk-Ins:</b>
          During the 6:00&ndash;8:30 PM rush, expired members train unnoticed and prospects avoid joining because they can&rsquo;t check real-time gym floor crowd levels.
        </div>
        <div class="compare-item">
          <b>3. Supplement Demand &amp; Google Search Leads Walk Elsewhere:</b>
          Without an online supplement checkout or instant 24/7 WhatsApp response, members buy stacks on outside websites and Google Maps walk-in enquiries go cold.
        </div>
      </div>

      <div class="compare-card good">
        <div class="compare-head" style="color:#166534">IRONPULSE AI OS&trade; (ONE MOBILE &amp; LAPTOP SWITCHBOARD)</div>
        <div class="compare-item">
          <b>1. 24/7 Message Recorder + Countdown Direct UPI Cadence:</b>
          Logs every member DM/WhatsApp 24/7 and triggers 1-tap UPI links on <b>D-7, D-6, D-3, D-2, D-1 + Weekly</b> until paid &mdash; instantly suppressed once verified.
        </div>
        <div class="compare-item">
          <b>2. Existing CCTV AI Head-Tracking Synced to Live 3D Site:</b>
          Reads your existing CCTV feed (no extra gate hardware), counts every head <b>IN &amp; OUT</b> live on your website, and alerts the desk if an overdue member enters.
        </div>
        <div class="compare-item">
          <b>3. 10-Min Supplement Store OR 5km Local SEO Radar:</b>
          Turns member workouts into complete supplement set orders with 6-digit OTP delivery, OR captures nearby 5km Google search enquiries automatically.
        </div>
      </div>
    </div>

    <div class="summary-banner">
      <div>
        <div class="mono" style="font-size:7.5pt;color:#c0fe04;text-transform:uppercase">COMPLETE END-TO-END SYSTEM ARCHITECTURE</div>
        <h3>All 5 Modules Connected &bull; Free Live Trial &bull; 15-Day 100% Refund Guarantee</h3>
        <ul>
          <li>&bull; 24/7 Message Recorder + D-7, D-6, D-3, D-2, D-1 &amp; Weekly UPI Payment Cadence</li>
          <li>&bull; Indoor + Outdoor AI Workout Planner &amp; Complete Supplement Set Checkout</li>
          <li>&bull; Existing CCTV AI Head-Tracking (IN/OUT) + 3D Website + 6-Digit OTP Store / 5km SEO</li>
          <li>&bull; <b>Written Guarantee:</b> Full 15-Day 100% Unconditional Refund if any workflow fails</li>
        </ul>
      </div>
      <div class="val-box">
        <div class="mono" style="font-size:6.9pt;color:#aaa;text-transform:uppercase">STANDALONE SYSTEM VALUATION</div>
        <div class="val-big">Rs. 1,00,000</div>
        <div class="val-note">CUSTOM DEPLOYMENT QUOTE<br>DISCUSSED LIVE WITH KOUSHIK</div>
      </div>
    </div>
  </div>

  <div class="foot-bar">
    <span>Engineered by <b>Understone AI Automation (www.understone.in)</b> &middot; +91 81254 81616 &middot; koushiksirivella@gmail.com</span>
    <b>PAGE 01 / 04</b>
  </div>
</section>

<!-- ============================== PAGE 02 ============================== -->
<section class="page">
  <div>
    <div class="top-bar">
      <span><b>UNDERSTONE AI AUTOMATION</b> &middot; IRONPULSE AI OS&trade; MASTER BLUEPRINT</span>
      <span class="muted">02 &middot; LIVE SYSTEM SURFACES &amp; MODULES</span>
    </div>

    <div class="part-label">PART 1 &middot; LIVE PRODUCTION SURFACES BUILT INTO IRONPULSE AI OS&trade;</div>
    <h1>Every Automation In One Mobile &amp; Laptop Command Center</h1>
    <p class="sublead">
      Engineered on isolated multi-tenant PostgreSQL + Row-Level Security so your gym&rsquo;s member ledger, supplement catalogue, CCTV stream counts, and WhatsApp automations stay fast, auditable, and accessible from any phone or desktop.
    </p>

    <div class="shot-grid-3">
      <div class="shot-box">
        <img src="${shots.agent}" style="height:108px" alt="24/7 AI Agent & Workout Builder">
        <div class="shot-cap"><b>01 &middot; 24/7 AGENT + RECORDER</b><br>Indoor/Outdoor Workouts + Supp Sets</div>
      </div>
      <div class="shot-box">
        <img src="${shots.store}" style="height:108px" alt="Interactive 3D Gym & Supplement Store">
        <div class="shot-cap"><b>02 &middot; 3D WEBSITE + 10-MIN STORE</b><br>Live Crowd Sync &amp; 6-Digit OTP Orders</div>
      </div>
      <div class="shot-box">
        <img src="${shots.leads}" style="height:108px" alt="Lead Recorder & 5km Local SEO Radar">
        <div class="shot-cap"><b>03 &middot; LEAD RECORDER + 5KM SEO</b><br>Mobile/Laptop Control Switchboard</div>
      </div>
    </div>

    <div class="compare-grid">
      <div class="compare-card" style="border:1.5px solid #121414;background:#fff">
        <div class="compare-head" style="background:#121414;color:#fff;margin:-9px -11px 7px;padding:6px 11px">
          A &middot; 24/7 MESSAGE RECORDER, CADENCE &amp; AI WORKOUT AGENT
        </div>
        <div class="compare-item">
          <b>1. 24/7 Omni-Channel Message Recorder:</b>
          Logs every member WhatsApp text, voice note, and Instagram enquiry in one unified timeline so zero follow-up context is lost across staff shifts.
        </div>
        <div class="compare-item">
          <b>2. Exact Pre-Expiry &amp; Weekly UPI Cadence:</b>
          Triggers approved payment-link reminders on <b>D-7, D-6, D-3, D-2, and D-1</b> before expiry, plus <b>Every 1 Week</b> afterward until renewed.
        </div>
        <div class="compare-item">
          <b>3. Verified Payment Suppression &amp; Exception Queue:</b>
          Automatically stops future reminders on signed payment webhook or staff UTR verification; unmatched UPI transfers route cleanly to a Review Queue.
        </div>
        <div class="compare-item">
          <b>4. Indoor + Outdoor AI Workout &amp; Stack Builder:</b>
          Generates tailored Indoor floor or Outdoor conditioning routines paired automatically with the member&rsquo;s recommended Complete Supplement Set checkout link.
        </div>
      </div>

      <div class="compare-card" style="border:1.5px solid #121414;background:#fff">
        <div class="compare-head" style="background:#121414;color:#fff;margin:-9px -11px 7px;padding:6px 11px">
          B &middot; CCTV HEAD-TRACKING, 3D SITE, 10-MIN STORE &amp; SEO
        </div>
        <div class="compare-item">
          <b>1. Existing CCTV Camera AI Head-Tracking (IN / OUT):</b>
          Connects directly to your existing entrance/floor CCTV feed to track head counts entering and leaving, updating live floor occupancy (e.g. 38/60) on your 3D website.
        </div>
        <div class="compare-item">
          <b>2. Overdue Member Entry Alert at Desk:</b>
          Flags front-desk staff immediately if an expired or overdue profile arrives during evening rush hours so dues are settled politely on the spot.
        </div>
        <div class="compare-item">
          <b>3. Complete 3D Gym Website + 10-Min Supplement Delivery:</b>
          Dedicated <code>/store/</code>, <code>/staff/</code> packing board, <code>/rider/</code> 10-min dispatch, and <code>/order/</code> 6-digit OTP customer tracker so zero inventory leaks.
        </div>
        <div class="compare-item">
          <b>4. Toggleable 5km Local SEO Radar + Mobile Control:</b>
          Switch focus from 10-minute delivery to Local SEO lead capture anytime, and control every automation ON/OFF directly from phone or laptop.
        </div>
      </div>
    </div>
  </div>

  <div class="foot-bar">
    <span>Understone AI Automation &middot; Multi-Tenant Postgres RLS &middot; www.understone.in</span>
    <b>PAGE 02 / 04</b>
  </div>
</section>

<!-- ============================== PAGE 03 ============================== -->
<section class="page">
  <div>
    <div class="top-bar">
      <span><b>UNDERSTONE AI AUTOMATION</b> &middot; IRONPULSE AI OS&trade; MASTER BLUEPRINT</span>
      <span class="muted">03 &middot; RENEWAL CADENCE, ROUGH LEAKAGE MATH &amp; ACCEPTANCE TESTS</span>
    </div>

    <div class="part-label">PART 2 &middot; NATURAL REVENUE-LEAK MATH &amp; AUTOMATED CADENCE</div>
    <h1>Rough Monthly Leakage vs. The Rs. 1,00,000 Value Stack</h1>
    <p class="sublead">
      Below is the exact automated message sequence together with conservative rough numbers for a typical 250&ndash;350 member independent gym (plug in your gym&rsquo;s real figures during your Free Live Trial).
    </p>

    <table class="spec-table">
      <thead>
        <tr>
          <th>Trigger Window</th>
          <th>Automated System Action</th>
          <th>If Paid Before Trigger</th>
          <th>Audit &amp; Exception Handling</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="mono"><b>D-7 &amp; D-6 (7 &amp; 6 Days Left)</b></td>
          <td>Early polite renewal reminder + direct 1-tap UPI payment link</td>
          <td>Automatically skipped (Active)</td>
          <td>WhatsApp delivery receipt logged</td>
        </tr>
        <tr>
          <td class="mono"><b>D-3 &amp; D-2 (3 &amp; 2 Days Left)</b></td>
          <td>Follow-up link + Indoor/Outdoor plan &amp; supplement set combo option</td>
          <td><b>SUPPRESSED immediately</b></td>
          <td>Failed numbers routed to Staff Queue</td>
        </tr>
        <tr>
          <td class="mono"><b>D-1 (Final Day Notice)</b></td>
          <td>Last-day continuity reminder with direct UPI renewal checkout link</td>
          <td><b>SUPPRESSED immediately</b></td>
          <td>Desk notified of due accounts</td>
        </tr>
        <tr>
          <td class="mono"><b>Every 1 Week (Post-Expiry)</b></td>
          <td>Automated weekly re-activation link &amp; flexible comeback offer</td>
          <td><b>SUPPRESSED immediately</b></td>
          <td>CCTV Gate flags desk upon walk-in</td>
        </tr>
      </tbody>
    </table>

    <div class="compare-grid">
      <div class="compare-card">
        <div class="compare-head">CONSERVATIVE MONTHLY LEAKAGE ESTIMATOR (ILLUSTRATIVE)</div>
        <div class="compare-item">
          <b>1. Subscription Renewals Slipping (~8&ndash;12 members/mo):</b>
          On ~60 monthly renewals @ ~Rs. 2,000 avg, even 15% late/dropped due to manual follow-up = <b>Rs. 16,000 &ndash; Rs. 24,000 / month lost</b>.
        </div>
        <div class="compare-item">
          <b>2. Supplement Orders Bought Outside (~15 orders/mo):</b>
          Members buying protein/pre-workout online instead of your counter (~Rs. 800 margin/set) = <b>~Rs. 12,000 / month missed</b>.
        </div>
        <div class="compare-item">
          <b>3. Slow WhatsApp / Maps Inquiry Replies (~4&ndash;5 walk-ins/mo):</b>
          Delayed responses losing prospects to nearby competitors @ ~Rs. 2,000 = <b>Rs. 8,000 &ndash; Rs. 10,000 / month lost</b>.
        </div>
        <div class="compare-item" style="margin-top:5px;padding:6px 8px;background:#eef8d6;border:1px solid #97cf24">
          <b>Combined Conservative Leakage:</b> <b>~Rs. 36,000 &ndash; Rs. 46,000 / month</b> (~Rs. 4.3L&ndash;5.5L/year) leaking without automation &mdash; paying back a <b>Rs. 1,00,000</b> value system in ~2.5 months.
        </div>
      </div>

      <div class="compare-card">
        <div class="compare-head">12 WRITTEN ACCEPTANCE TESTS (VERIFIED BEFORE HANDOVER)</div>
        <div class="compare-item" style="font-size:7.8pt;line-height:1.42">
          <b>01.</b> Mobile &amp; laptop staff login with full member search &amp; ledger view.<br>
          <b>02.</b> Plan start/expiry math verified across monthly, quarterly &amp; annual tiers.<br>
          <b>03.</b> Exact D-7, D-6, D-3, D-2, D-1 &amp; Weekly queue selection verified.<br>
          <b>04.</b> 24/7 Message Recorder logs inbound WhatsApp &amp; AI replies cleanly.<br>
          <b>05.</b> Payment verification updates exact member &amp; extends expiry.<br>
          <b>06.</b> Unmatched UPI UTR transfers route safely to Staff Review Queue.<br>
          <b>07.</b> Confirmed payment immediately suppresses all remaining triggers.<br>
          <b>08.</b> Indoor + Outdoor AI Workout &amp; Supplement builder generates sets.<br>
          <b>09.</b> Existing CCTV AI head-tracker updates live IN/OUT floor count on 3D site.<br>
          <b>10.</b> 6-digit OTP flow verified across <code>/store/</code>, <code>/staff/</code>, <code>/rider/</code> &amp; <code>/order/</code>.<br>
          <b>11.</b> Tenant Row-Level Security (RLS) isolates gym records completely.<br>
          <b>12.</b> Overdue gate arrival alert fires cleanly on desk control board.
        </div>
      </div>
    </div>
  </div>

  <div class="foot-bar">
    <span>12 Acceptance Tests Verified Live &middot; Understone AI Automation</span>
    <b>PAGE 03 / 04</b>
  </div>
</section>

<!-- ============================== PAGE 04 ============================== -->
<section class="page">
  <div>
    <div class="top-bar">
      <span><b>UNDERSTONE AI AUTOMATION</b> &middot; IRONPULSE AI OS&trade; MASTER BLUEPRINT</span>
      <span class="muted">04 &middot; STANDALONE SYSTEM VALUATION &amp; 15-DAY GUARANTEE</span>
    </div>

    <div class="part-label">PART 3 &middot; ITEMIZED Rs. 1,00,000 SYSTEM VALUE BREAKDOWN</div>
    <h1>Complete Standalone Valuation &amp; Risk-Free Trial Terms</h1>
    <p class="sublead">
      Every component below is custom-configured around your gym&rsquo;s member roster, existing CCTV cameras, supplement inventory, and local catchment area. Custom deployment pricing is finalized directly with Koushik Sirivella after verifying your setup scope.
    </p>

    <table class="spec-table">
      <thead>
        <tr>
          <th>#</th>
          <th>SYSTEM MODULE &amp; DELIVERABLE SCOPE</th>
          <th style="text-align:right">STANDALONE VALUE</th>
          <th style="text-align:right">STATUS</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="mono"><b>01</b></td>
          <td>
            <b>24/7 AI Agent + Message Recorder + D-7/D-6/D-3/D-2/D-1 &amp; Weekly UPI Engine</b><br>
            <span style="color:#555">Clean member import, 24/7 omni-channel message logging, automated countdown + weekly payment links, verified payment suppression &amp; exception queue.</span>
          </td>
          <td class="mono" style="text-align:right"><b>Rs. 30,000</b></td>
          <td class="mono" style="text-align:right;color:#166534"><b>INCLUDED</b></td>
        </tr>
        <tr>
          <td class="mono"><b>02</b></td>
          <td>
            <b>Existing CCTV Camera AI Head-Tracking Software &amp; Live Floor Stream</b><br>
            <span style="color:#555">Connects to your existing gate/floor CCTV feed to track head counts IN &amp; OUT in real time, syncs live occupancy onto your 3D website, and alerts on overdue entry.</span>
          </td>
          <td class="mono" style="text-align:right"><b>Rs. 25,000</b></td>
          <td class="mono" style="text-align:right;color:#166534"><b>INCLUDED</b></td>
        </tr>
        <tr>
          <td class="mono"><b>03</b></td>
          <td>
            <b>3D Gym Website + 10-Min Supplement Set Store (OTP) + 5km Local SEO Radar</b><br>
            <span style="color:#555">Custom 3D storefront, complete supplement set checkout with <code>/staff/</code>, <code>/rider/</code> &amp; <code>/order/</code> 6-digit OTP handoff, plus Local SEO traffic radar.</span>
          </td>
          <td class="mono" style="text-align:right"><b>Rs. 25,000</b></td>
          <td class="mono" style="text-align:right;color:#166534"><b>INCLUDED</b></td>
        </tr>
        <tr>
          <td class="mono"><b>04</b></td>
          <td>
            <b>Indoor + Outdoor AI Workout Planner &amp; Mobile/Laptop Master Control Center</b><br>
            <span style="color:#555">Automated member workout &amp; nutrition stack generator plus unified mobile/desktop switchboard &amp; Lead Recorder to manage all automations anywhere.</span>
          </td>
          <td class="mono" style="text-align:right"><b>Rs. 20,000</b></td>
          <td class="mono" style="text-align:right;color:#166534"><b>INCLUDED</b></td>
        </tr>
        <tr style="background:#121414;color:#fff">
          <td colspan="2" class="mono" style="color:#fff;padding:10px"><b>TOTAL STANDALONE SYSTEM VALUE (COMPLETE 4-MODULE SUITE)</b></td>
          <td colspan="2" class="mono" style="text-align:right;color:#c0fe04;font-size:13.5pt;padding:10px;white-space:nowrap"><b>Rs. 1,00,000</b></td>
        </tr>
      </tbody>
    </table>

    <div class="mono" style="font-size:7.8pt;font-weight:700;text-transform:uppercase;margin-top:4px">
      DEPLOYMENT PROCESS FROM FREE TRIAL TO LIVE HANDOVER
    </div>
    <div class="steps-4">
      <div class="step-box">
        <div class="s-num">STEP 01</div>
        <h4>10-Min Audit Call</h4>
        <p>Review your current member count, supplement catalogue, CCTV cameras &amp; local SEO goals.</p>
      </div>
      <div class="step-box">
        <div class="s-num">STEP 02</div>
        <h4>Free Live Trial Setup</h4>
        <p>We configure your branded environment, import clean member data &amp; test on real workflows.</p>
      </div>
      <div class="step-box">
        <div class="s-num">STEP 03</div>
        <h4>12 Acceptance Tests</h4>
        <p>Verify WhatsApp cadence, payment suppression, CCTV counts &amp; OTP delivery end-to-end.</p>
      </div>
      <div class="step-box">
        <div class="s-num">STEP 04</div>
        <h4>Team Handover</h4>
        <p>Mobile &amp; laptop walkthrough for your trainers/desk + 15-day unconditional guarantee coverage.</p>
      </div>
    </div>

    <div class="sign-box">
      <div class="sign-head">FREE TRIAL, 15-DAY 100% REFUND GUARANTEE &amp; DIRECT COMMERCIAL DISCUSSION</div>
      <div class="sign-col">
        <b>CUSTOM PARTNER COMMERCIAL TERMS</b><br>
        &bull; <b>Standalone System Value:</b> Rs. 1,00,000 (all 4 modules included)<br>
        &bull; <b>Final Implementation Price:</b> Quoted directly by Koushik Sirivella based on your gym&rsquo;s branch count &amp; selected modules (Free Live Trial available first)<br><br>
        <b style="color:#166534">15-DAY 100% UNCONDITIONAL REFUND GUARANTEE</b><br>
        &bull; Test the live system across your real renewals, CCTV feed, and storefront for 15 days. If anything agreed fails to work or doesn&rsquo;t deliver value, receive a <b>100% full refund with zero conditions.</b>
      </div>
      <div class="sign-col">
        <div class="mono" style="font-size:7.3pt;color:#666;text-transform:uppercase">ENGINEERED &amp; DELIVERED BY</div>
        <div style="font-size:12pt;font-weight:800;margin-top:2px">Koushik Sirivella</div>
        <div style="font-size:8.2pt;color:#444"><b>Understone AI Automation</b> (<b>www.understone.in</b>)</div>
        <div style="font-size:8.2pt;color:#444">Email: <b>koushiksirivella@gmail.com</b></div>
        <div style="font-size:8.2pt;color:#444;margin-bottom:9px">WhatsApp / Call: <b>+91 81254 81616</b></div>

        <div class="mono" style="font-size:7.3pt;color:#b84a00;text-transform:uppercase;margin-bottom:4px">AGREED SCOPE / PARTNER SIGN-OFF</div>
        <div style="font-size:8.2pt;margin-bottom:7px">Gym &amp; Decision Maker: ___________________________</div>
        <div style="font-size:8.2pt">Quoted Terms &amp; Date: ___________________________</div>
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

  const htmlPath = join(shotDir, 'offer01-quotation.html');
  writeFileSync(htmlPath, html, 'utf8');

  const pdfPage = await browser.newPage();
  await pdfPage.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
  await pdfPage.pdf({
    path: PDF_OUT,
    format: 'A4',
    printBackground: true,
    margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
  });
  copyFileSync(PDF_OUT, PDF_DOWNLOADS);
  console.log(`ok  rebuilt corrected PDF -> ${PDF_OUT}`);
  console.log(`ok  copied corrected PDF  -> ${PDF_DOWNLOADS}`);
});
