#!/usr/bin/env node
// ============================================================================
// Builds a concise, personalized 2-Page Executive Brief PDF specifically for
// Velocity Fitness (Nandigama, AP) using verified data from:
//   - http://velocityfitness.in/#pricing (₹1,099/mo online, ₹1,000/mo gym)
//   - Live Google Maps audit (5.0★, 75 reviews, 6-8 PM 74%-80% peak, Rajesh/Venky)
// Zero "AI" jargon. Zero price revealed (owner quotes live). Half-now /
// half-later + 100% Unconditional Refund Guarantee included.
//   - pitch/Velocity_Fitness_Nandigama_System_Blueprint.pdf
//   - C:/Users/skous/Downloads/Velocity_Fitness_Nandigama_System_Blueprint.pdf
// ============================================================================

import { copyFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { basePdfCss, toDataUri, withAppSession } from './pdf-shared.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PDF_OUT = join(ROOT, 'pitch', 'Velocity_Fitness_Nandigama_System_Blueprint.pdf');
const PDF_DOWNLOADS = 'C:/Users/skous/Downloads/Velocity_Fitness_Nandigama_System_Blueprint.pdf';

await withAppSession(ROOT, 3194, async ({ browser, base, shotDir, shots }) => {
  const velocityShot = toDataUri(join(shotDir, 'velocity-live-site.png'));

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Velocity Fitness Nandigama — Custom System Proposal</title>
<style>
${basePdfCss(base)}
.page { padding: 13mm 15mm 12mm; }
h1 { font-size: 21pt; }
.shot-box img { height: 134px; }
</style>
</head>
<body>

<!-- ============================== PAGE 01 ============================== -->
<section class="page">
  <div>
    <div class="top-bar">
      <span><b>VELOCITY FITNESS &middot; NANDIGAMA</b> &middot; PERSONALIZED SYSTEM PROPOSAL</span>
      <span class="muted">PAGE 01 / 02 &middot; SITE &amp; MAPS AUDIT</span>
    </div>

    <div class="tag-row">
      <span class="pill-black">RAITHUPETA, NANDIGAMA (521185) &middot; +91 96032 18498</span>
      <span class="mono" style="font-size:8pt;color:#444">PREPARED BY KOUSHIK SIRIVELLA</span>
    </div>

    <h1>
      Velocity Already Built A Great Gym (<span class="accent">5.0&#9733;</span>).<br>
      Here Are 4 Specific Systems Missing On Your Site.
    </h1>
    <p class="sublead">
      I checked <b>velocityfitness.in</b> and your Nandigama Google Maps listing. Your gym, trainers (Rajesh &amp; Venky), and ₹1,000/month pricing already beat nearby competitors on quality &mdash; this proposal focuses only on the 4 practical gaps costing monthly renewals, supplement sales, and walk-in leads.
    </p>

    <div class="kpi-row-4">
      <div class="kpi-card dark">
        <div class="kpi-lbl">GOOGLE MAPS SCORE</div>
        <div class="kpi-val" style="color:#c0fe04">5.0 &#9733;</div>
        <div class="kpi-sub">75 verified reviews &mdash; #1 quality score in Nandigama</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-lbl">MAPS SEARCH GAP</div>
        <div class="kpi-val" style="color:#b84a00">75 vs 217</div>
        <div class="kpi-sub">Nearby competitor holds 217 reviews at 4.9&#9733;</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-lbl">EVENING PEAK RUSH</div>
        <div class="kpi-val">6&ndash;8 PM</div>
        <div class="kpi-sub">74%&ndash;80% peak floor load right when desk is busiest</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-lbl">MONTHLY PLAN</div>
        <div class="kpi-val">Rs. 1,000</div>
        <div class="kpi-sub">Listed ₹1,099 online; Café &amp; supplements offered offline</div>
      </div>
    </div>

    <div class="compare-grid">
      <div class="compare-card good">
        <div class="compare-head" style="color:#166534">WHAT YOUR CURRENT WEBSITE ALREADY DOES WELL</div>
        <div class="compare-item">
          <b>1. Clear Pricing &amp; Portal Basics:</b>
          Shows Monthly (Rs. 1,099), Quarterly, PT plans, real member results (Abi Vinnu, Arjun K, Rahul B), trainer certifications, and a WhatsApp enquiry button.
        </div>
        <div class="compare-item">
          <b>2. Real Supplement Advantage:</b>
          Your Maps reviews specifically praise Velocity for offering <b>supplements at lower prices than other websites</b>.
        </div>
      </div>

      <div class="compare-card">
        <div class="compare-head" style="color:#b82020">WHY MONEY STILL SLIPS THROUGH EVERY MONTH</div>
        <div class="compare-item">
          <b>1. Manual Expiry &amp; Reply Chasing:</b>
          No system automatically messages expiring members with direct payment links on D-7, D-6, D-3, D-2, D-1 &amp; Weekly, and no 24/7 message recorder captures late-night enquiries.
        </div>
        <div class="compare-item">
          <b>2. No Live Crowd Meter or Online Supplement Store:</b>
          Members cannot check 6&ndash;8 PM floor crowd before coming, expired members walk in unnoticed during rush hour, and supplements cannot be ordered online with 10-min delivery.
        </div>
      </div>
    </div>

    <div class="shot-grid-2">
      <div class="shot-box">
        <img src="${velocityShot}" alt="Current velocityfitness.in">
        <div class="shot-cap"><b>TODAY:</b> velocityfitness.in shows static plans &amp; manual WhatsApp CTA only</div>
      </div>
      <div class="shot-box">
        <img src="${shots.renewals}" alt="Automated Renewal & Payment Links">
        <div class="shot-cap"><b>UPGRADE:</b> Automatic D-7 to D-1 &amp; Weekly Payment Links + Auto-Stop on Paid</div>
      </div>
    </div>
  </div>

  <div class="foot-bar">
    <span>Prepared personally for <b>Velocity Fitness (Nandigama)</b> by <b>Koushik Sirivella (Understone)</b> &middot; +91 81254 81616</span>
    <b>PAGE 01 / 02</b>
  </div>
</section>

<!-- ============================== PAGE 02 ============================== -->
<section class="page">
  <div>
    <div class="top-bar">
      <span><b>VELOCITY FITNESS &middot; NANDIGAMA</b> &middot; PERSONALIZED SYSTEM PROPOSAL</span>
      <span class="muted">PAGE 02 / 02 &middot; 4 EXACT SOLUTIONS &amp; REALISTIC MATH</span>
    </div>

    <div class="part-label">WHAT I BUILT SPECIFICALLY FOR VELOCITY &amp; WHY EACH PIECE MATTERS</div>
    <h1>4 Concrete Upgrades Connected To One Mobile App</h1>
    <p class="sublead">
      No complicated jargon &mdash; below are the exact 4 software tools we plug into Velocity Fitness, alongside simple rough numbers based on your actual <b>Rs. 1,000/month</b> membership.
    </p>

    <table class="spec-table">
      <thead>
        <tr>
          <th>#</th>
          <th>EXACT SOLUTION INSTALLED FOR VELOCITY</th>
          <th>WHY IT MATTERS FOR YOU RIGHT NOW</th>
          <th style="text-align:right">EST. MONTHLY GAIN</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="mono"><b>01</b></td>
          <td>
            <b>24/7 Message Recorder + Auto Renewal &amp; Payment Links</b><br>
            <span style="color:#555">Records every enquiry 24/7; automatically sends direct UPI links on <b>Day 7, 6, 3, 2, 1</b> before expiry &amp; <b>every 1 week</b> until paid (auto-stops when paid).</span>
          </td>
          <td>Even <b>8&ndash;12 monthly renewals (Rs. 1,000)</b> saved or paid on time stops awkward manual chasing.</td>
          <td class="mono" style="text-align:right;white-space:nowrap"><b>Rs. 8,000 &ndash; 12,000</b></td>
        </tr>
        <tr>
          <td class="mono"><b>02</b></td>
          <td>
            <b>Existing CCTV Head-Tracking (Live IN/OUT + Gate Alert)</b><br>
            <span style="color:#555">Connects to your existing gate CCTV camera (no extra hardware) to count heads coming IN &amp; going OUT onto your live site and alert desk on overdue entries.</span>
          </td>
          <td>Catches <b>4&ndash;5 overdue Rs. 1,000 members/mo</b> slipping in during the busy <b>6&ndash;8 PM (80%) rush</b>.</td>
          <td class="mono" style="text-align:right;white-space:nowrap"><b>Rs. 4,000 &ndash; 5,000</b></td>
        </tr>
        <tr>
          <td class="mono"><b>03</b></td>
          <td>
            <b>Online Supplement Store (10-Min OTP Delivery) OR 5km SEO</b><br>
            <span style="color:#555">Lets members buy complete supplement sets online at Velocity&rsquo;s low prices with 10-min delivery &amp; 6-digit OTP &mdash; OR captures 5km Nandigama Google search + review traffic.</span>
          </td>
          <td>Captures <b>10&ndash;15 supplement orders/mo</b> (~Rs. 600&ndash;800 margin) + <b>5 new Rs. 1,000/mo joins</b> from Maps.</td>
          <td class="mono" style="text-align:right;white-space:nowrap"><b>Rs. 11,000 &ndash; 17,000</b></td>
        </tr>
        <tr>
          <td class="mono"><b>04</b></td>
          <td>
            <b>Indoor + Outdoor Workout Builder &amp; Mobile Master Control</b><br>
            <span style="color:#555">Instant Indoor &amp; Outdoor beginner workout/diet plans paired with your supplement sets, plus Lead Recorder &amp; full switchboard on your mobile or laptop.</span>
          </td>
          <td>Saves coaching time for Rajesh &amp; Venky and keeps every enquiry, order &amp; renewal in your pocket.</td>
          <td class="mono" style="text-align:right;white-space:nowrap"><b>Time + Retention</b></td>
        </tr>
        <tr style="background:#121414;color:#fff">
          <td colspan="3" class="mono" style="color:#fff;padding:9px"><b>REALISTIC CONSERVATIVE MONTHLY IMPACT FOR VELOCITY (AT Rs. 1,000/MO)</b></td>
          <td class="mono" style="text-align:right;color:#c0fe04;font-size:11.5pt;padding:9px;white-space:nowrap"><b>Rs. 23,000 &ndash; 34,000 / MO</b></td>
        </tr>
      </tbody>
    </table>

    <div class="shot-grid-2" style="margin-bottom:8px">
      <div class="shot-box">
        <img src="${shots.gate}" style="height:112px" alt="Existing CCTV Head-Tracking">
        <div class="shot-cap"><b>EXISTING CCTV SOFTWARE:</b> Live Floor Head Count IN/OUT + Overdue Alert</div>
      </div>
      <div class="shot-box">
        <img src="${shots.store}" style="height:112px" alt="3D Storefront & Supplement Checkout">
        <div class="shot-cap"><b>ONLINE SUPPLEMENT &amp; 3D SITE:</b> 10-Min Delivery Checkout + 6-Digit OTP</div>
      </div>
    </div>

    <div class="sign-box">
      <div class="sign-head">SIMPLE, ZERO-RISK WAY TO START (WE TEST EVERYTHING LIVE FIRST)</div>
      <div class="sign-col">
        <b>HOW PAYMENT &amp; GUARANTEE WORK</b><br>
        &bull; <b>1. See Everything Live First:</b> Walk through the working system together on your phone/laptop or start with a free trial setup.<br>
        &bull; <b>2. Flexible Milestone Pay:</b> Pay <b>half when we start and half after it goes live</b> (or full once satisfied). Final custom figure shared directly in person.<br>
        &bull; <b>3. 100% Unconditional Refund Promise:</b> If anything breaks or doesn&rsquo;t work cleanly as promised, I refund 100% of your money without any questions.
      </div>
      <div class="sign-col">
        <div class="mono" style="font-size:7.3pt;color:#666;text-transform:uppercase">DIRECT PERSONAL CONTACT</div>
        <div style="font-size:12.5pt;font-weight:800;margin-top:2px">Koushik Sirivella</div>
        <div style="font-size:8.4pt;color:#444"><b>Understone</b> &middot; <b>www.understone.in</b></div>
        <div style="font-size:8.4pt;color:#444">Phone / WhatsApp: <b>+91 81254 81616</b></div>
        <div style="font-size:8.4pt;color:#444;margin-bottom:8px">Email: <b>koushiksirivella@gmail.com</b></div>

        <div class="mono" style="font-size:7.2pt;color:#b84a00;text-transform:uppercase;margin-bottom:3px">NEXT STEP FOR VELOCITY TEAM</div>
        <div style="font-size:8.1pt;color:#222">Reply <b>&ldquo;Let&rsquo;s check it&rdquo;</b> on WhatsApp or call +91 81254 81616 for a quick 5-minute live walkthrough.</div>
      </div>
    </div>
  </div>

  <div class="foot-bar">
    <span>Velocity Fitness Personalized Brief &middot; <b>+91 81254 81616</b> &middot; <b>www.understone.in</b></span>
    <b>PAGE 02 / 02</b>
  </div>
</section>

</body>
</html>`;

  const htmlPath = join(shotDir, 'velocity-blueprint.html');
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
  console.log(`ok  built concise 2-page Velocity PDF -> ${PDF_OUT}`);
  console.log(`ok  copied Velocity PDF -> ${PDF_DOWNLOADS}`);
});
