#!/usr/bin/env node
// ============================================================================
// Builds the 4-Page Personalized Growth Audit & System Blueprint PDF for
// Velocity Fitness (Nandigama, Andhra Pradesh) grounded in live Apify Google
// Maps intelligence and velocityfitness.in findings.
//   - pitch/Velocity_Fitness_Nandigama_System_Blueprint.pdf
//   - C:/Users/skous/Downloads/Velocity_Fitness_Nandigama_System_Blueprint.pdf
// ============================================================================

import { copyFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { basePdfCss, withAppSession } from './pdf-shared.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PDF_OUT = join(ROOT, 'pitch', 'Velocity_Fitness_Nandigama_System_Blueprint.pdf');
const PDF_DOWNLOADS = 'C:/Users/skous/Downloads/Velocity_Fitness_Nandigama_System_Blueprint.pdf';

await withAppSession(ROOT, 3194, async ({ browser, base, shotDir, shots }) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Velocity Fitness Nandigama — Growth Audit & IRONPULSE AI OS Blueprint</title>
<style>${basePdfCss(base)}</style>
</head>
<body>

<!-- ============================== PAGE 01 ============================== -->
<section class="page">
  <div>
    <div class="top-bar">
      <span><b>VELOCITY FITNESS (NANDIGAMA, AP)</b> &middot; PERSONALIZED DIGITAL AUDIT</span>
      <span class="muted">01 &middot; GOOGLE MAPS &amp; WEBSITE DIAGNOSTIC</span>
    </div>

    <div class="tag-row">
      <span class="pill-black">PREPARED FOR VELOCITY FITNESS &middot; RAITHUPETA, NANDIGAMA (521185)</span>
      <span class="mono" style="font-size:8pt;color:#444">+91 96032 18498</span>
    </div>

    <h1>
      Velocity Has The Best Rating In Nandigama (5.0&#9733;).<br>
      <span class="accent">Here Is How To Capture Every Renewal, Supplement Order &amp; Google Walk-In.</span>
    </h1>
    <p class="sublead">
      A focused digital audit for the Velocity Fitness team (Rajesh, Venky &amp; Management) at 6-130, 1st Floor Vaaraahi Super Mart Building, based on live Google Maps performance data and an inspection of <b>velocityfitness.in</b>.
    </p>

    <div class="kpi-row-4">
      <div class="kpi-card dark">
        <div class="kpi-lbl">GOOGLE MAPS RATING</div>
        <div class="kpi-val" style="color:#c0fe04">5.0 &#9733;</div>
        <div class="kpi-sub">75 verified reviews &mdash; highest quality score in town</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-lbl">NEAREST SEARCH RIVAL</div>
        <div class="kpi-val" style="color:#b84a00">217 Rev.</div>
        <div class="kpi-sub">Competitor holds ~3&times; review volume despite lower 4.9&#9733;</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-lbl">EVENING PEAK RUSH</div>
        <div class="kpi-val">74%&ndash;80%</div>
        <div class="kpi-sub">Busiest floor load between 6:00 PM &ndash; 8:00 PM daily</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-lbl">WEBSITE TAB AUDIT</div>
        <div class="kpi-val" style="color:#b82020">&ldquo;Akhara&rdquo;</div>
        <div class="kpi-sub">velocityfitness.in still displays a generic white-label title</div>
      </div>
    </div>

    <div class="compare-grid">
      <div class="compare-card good">
        <div class="compare-head" style="color:#166534">VERIFIED STRENGTHS ALREADY WINNING MEMBERS (GOOGLE MAPS DATA)</div>
        <div class="compare-item">
          <b>1. Elite Personal Coaching Reputation (Rajesh &amp; Venky):</b>
          Recent reviews repeatedly highlight clean hygiene, modern machines, and supportive coaching from trainers Rajesh and Venky.
        </div>
        <div class="compare-item">
          <b>2. Low-Price Supplement Advantage (Hidden Goldmine):</b>
          Member reviews specifically praise Velocity for offering <b>supplements at better prices than outside websites</b> &mdash; a huge edge most gyms never monetize online.
        </div>
        <div class="compare-item">
          <b>3. Multi-Format Service Listing (5 AM &ndash; 10 PM):</b>
          Already listed for <b>Onsite + Online Classes + Outdoor Services</b>, plus Google Pay / UPI / Card acceptance.
        </div>
      </div>

      <div class="compare-card">
        <div class="compare-head" style="color:#b82020">3 SILENT GAPS CURRENTLY LEAKING REVENUE IN NANDIGAMA</div>
        <div class="compare-item">
          <b>1. Generic Website &amp; Zero Live Floor Visibility:</b>
          <code>velocityfitness.in</code> loads an unbranded <code>&ldquo;Akhara&rdquo;</code> template tab with no live evening crowd meter and no 10-minute supplement set checkout.
        </div>
        <div class="compare-item">
          <b>2. Manual Renewal &amp; Subscription Follow-Up:</b>
          When staff are coaching 6&ndash;8 PM batches, members nearing expiry miss automated pre-expiry WhatsApp UPI links and slip late or drop off.
        </div>
        <div class="compare-item">
          <b>3. 75 Reviews vs. 217 Competitor Reviews on Maps:</b>
          Velocity has a higher rating (5.0&#9733; vs 4.9&#9733;), yet prospects searching Nandigama gyms see competitors first until review capture &amp; 5km Local SEO are automated.
        </div>
      </div>
    </div>

    <div class="shot-grid-2">
      <div class="shot-box">
        <img src="${shots.renewals}" alt="Subscription Renewal Automation">
        <div class="shot-cap"><b>UPGRADE 01:</b> Automated D-7, D-6, D-3, D-2, D-1 &amp; Weekly Subscription Links</div>
      </div>
      <div class="shot-box">
        <img src="${shots.store}" alt="Upgraded 3D Website and Supplement Store">
        <div class="shot-cap"><b>UPGRADE 02:</b> Upgraded 3D Velocity Site + 10-Min Supplement Set Store</div>
      </div>
    </div>
  </div>

  <div class="foot-bar">
    <span>Prepared for <b>Velocity Fitness (Nandigama, AP)</b> by <b>Understone AI Automation (www.understone.in)</b></span>
    <b>PAGE 01 / 04</b>
  </div>
</section>

<!-- ============================== PAGE 02 ============================== -->
<section class="page">
  <div>
    <div class="top-bar">
      <span><b>VELOCITY FITNESS (NANDIGAMA, AP)</b> &middot; PERSONALIZED DIGITAL AUDIT</span>
      <span class="muted">02 &middot; ROUGH SUBSCRIPTION, SUPPLEMENT &amp; MAPS MATH</span>
    </div>

    <div class="part-label">PART 1 &middot; NATURAL ROUGH CALCULATIONS (CONSERVATIVE ESTIMATES)</div>
    <h1>How Much Revenue Quietly Slips Away Each Month?</h1>
    <p class="sublead">
      No exaggerated claims &mdash; below is simple, rough math for an active local gym like Velocity. Even if your exact monthly numbers are 20% higher or lower, the pattern stays the same across subscriptions, supplements, and Google Maps search traffic.
    </p>

    <table class="spec-table">
      <thead>
        <tr>
          <th>Revenue Stream</th>
          <th>Simple Conservative Assumption</th>
          <th>What Slips Through Manually</th>
          <th style="text-align:right">Est. Monthly Impact</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><b>1. Subscription Renewals<br><span style="color:#666">(Missed / Delayed Follow-Up)</span></b></td>
          <td>~60 plans expiring/mo at ~Rs. 1,500&ndash;2,000 avg fee</td>
          <td>Even 15% (~<b>9 members/mo</b>) delay renewal or quietly drop because no D-7 to D-1 UPI link arrived</td>
          <td class="mono" style="text-align:right"><b>Rs. 13,500 &ndash; 18,000</b></td>
        </tr>
        <tr>
          <td><b>2. 6&ndash;8 PM Peak Crowd Leakage<br><span style="color:#666">(Unnoticed Expired Entries)</span></b></td>
          <td>74%&ndash;80% peak evening floor rush (coach busy on floor)</td>
          <td>Just <b>4&ndash;5 overdue members/mo</b> keep working out unnoticed for weeks before desk catches it</td>
          <td class="mono" style="text-align:right"><b>Rs. 6,000 &ndash; 7,500</b></td>
        </tr>
        <tr>
          <td><b>3. Offline Supplement Orders<br><span style="color:#666">(Velocity Price Advantage)</span></b></td>
          <td>Existing low-price supplement buyers (~Rs. 700&ndash;1,000 margin/set)</td>
          <td><b>15&ndash;20 members/mo</b> order stacks on outside apps instead of a 1-tap Velocity online set + 10-min delivery</td>
          <td class="mono" style="text-align:right"><b>Rs. 10,500 &ndash; 20,000</b></td>
        </tr>
        <tr>
          <td><b>4. Google Maps &amp; Site Drop-Off<br><span style="color:#666">(75 vs 217 Local Reviews)</span></b></td>
          <td>Local searches around Raithupeta &amp; Nandigama 5 km</td>
          <td>Slow enquiry replies &amp; unbranded <code>Akhara</code> page lose just <b>4&ndash;5 new joins/mo</b> to competitors</td>
          <td class="mono" style="text-align:right"><b>Rs. 6,000 &ndash; 10,000</b></td>
        </tr>
        <tr style="background:#121414;color:#fff">
          <td colspan="3" class="mono" style="color:#fff;padding:9px"><b>CONSERVATIVE COMBINED MONTHLY OPPORTUNITY LEFT ON THE TABLE</b></td>
          <td class="mono" style="text-align:right;color:#c0fe04;font-size:11.5pt;padding:9px;white-space:nowrap"><b>Rs. 36,000 &ndash; 55,500 / MO</b></td>
        </tr>
      </tbody>
    </table>

    <div class="compare-grid">
      <div class="compare-card">
        <div class="compare-head">WHY GOOGLE MAPS IS VELOCITY&rsquo;S FASTEST FREE TRAFFIC ENGINE</div>
        <div class="compare-item">
          <b>Current Maps Reality:</b>
          Velocity already beats nearby gyms on quality (<b>5.0&#9733;</b> vs 4.9&#9733; and 4.4&#9733;), yet J7 has <b>217 reviews</b> because satisfied members aren&rsquo;t prompted systematically after joining.
        </div>
        <div class="compare-item">
          <b>Automated Review + Referral Boost:</b>
          On Day 14 after a member joins or renews via UPI, our 24/7 WhatsApp Agent automatically sends a polite 1-tap Velocity Google Review link &mdash; steadily closing the 75 &rarr; 217 review gap on autopilot.
        </div>
        <div class="compare-item">
          <b>5 km Nandigama Local SEO Radar:</b>
          Captures nearby searches cleanly onto your branded <code>velocityfitness.in</code> trial flow with instant sub-2s WhatsApp confirmation.
        </div>
      </div>

      <div class="compare-card good">
        <div class="compare-head" style="color:#166534">TURN EVENING CROWD (6&ndash;8 PM) INTO SOCIAL PROOF</div>
        <div class="compare-item">
          <b>Why Existing CCTV Head-Tracking Helps Velocity:</b>
          Google Maps shows Velocity hits <b>74%&ndash;80%</b> occupancy at 6&ndash;8 PM, while morning/midday is calm. Prospects worry whether a gym is too crowded before visiting.
        </div>
        <div class="compare-item">
          <b>Zero New Hardware Cost:</b>
          Our software plugs into your existing CCTV feed, tracks head counts IN &amp; OUT live (e.g. <code>24 / 60</code> free right now), displays it on <code>velocityfitness.in</code>, and privately alerts desk staff if an expired subscription enters.
        </div>
      </div>
    </div>
  </div>

  <div class="foot-bar">
    <span>Data Sources: Google Maps Profile (Nandigama) + velocityfitness.in Audit &middot; Conservative Estimates</span>
    <b>PAGE 02 / 04</b>
  </div>
</section>

<!-- ============================== PAGE 03 ============================== -->
<section class="page">
  <div>
    <div class="top-bar">
      <span><b>VELOCITY FITNESS (NANDIGAMA, AP)</b> &middot; PERSONALIZED DIGITAL AUDIT</span>
      <span class="muted">03 &middot; CUSTOM VELOCITY SYSTEM WORKFLOW</span>
    </div>

    <div class="part-label">PART 2 &middot; HOW ALL 4 MODULES WORK FOR RAJESH, VENKY &amp; VELOCITY DESK</div>
    <h1>Replacing Generic &ldquo;Akhara&rdquo; With Velocity&rsquo;s Complete AI OS</h1>
    <p class="sublead">
      Every workflow below is already built and ready to configure with Velocity Fitness branding, your supplement price list, and WhatsApp templates &mdash; controllable anytime from mobile or laptop.
    </p>

    <div class="shot-grid-3">
      <div class="shot-box">
        <img src="${shots.agent}" style="height:108px" alt="24/7 AI Agent & Workout Builder">
        <div class="shot-cap"><b>01 &middot; 24/7 AI AGENT + RECORDER</b><br>Indoor/Outdoor Plans + Supp Sets</div>
      </div>
      <div class="shot-box">
        <img src="${shots.gate}" style="height:108px" alt="Existing CCTV AI Head-Tracker">
        <div class="shot-cap"><b>02 &middot; CCTV HEAD-TRACKING</b><br>Live 6&ndash;8 PM Floor Count + Alerts</div>
      </div>
      <div class="shot-box">
        <img src="${shots.leads}" style="height:108px" alt="Lead Recorder & 5km Local SEO">
        <div class="shot-cap"><b>03 &middot; MAPS &amp; LEAD RADAR</b><br>Mobile/Laptop Switchboard</div>
      </div>
    </div>

    <table class="spec-table">
      <thead>
        <tr>
          <th>Velocity Module</th>
          <th>What It Replaces Today</th>
          <th>Exact Live Behaviour For Members &amp; Staff</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><b>1. 24/7 Message Recorder &amp; Subscription Engine</b></td>
          <td>Manual register/Excel checks &amp; forgotten reminders during peak training hours</td>
          <td>Records all WhatsApp/DM enquiries 24/7; sends direct UPI payment links on <b>D-7, D-6, D-3, D-2, D-1 &amp; Weekly</b> until paid, then auto-suppresses + extends expiry.</td>
        </tr>
        <tr>
          <td><b>2. Velocity 10-Min Supplement Set Store (or 5km SEO)</b></td>
          <td>Unbranded <code>Akhara</code> page &amp; offline-only counter supplement sales</td>
          <td>Sells bundled <b>Complete Supplement Sets</b> at Velocity&rsquo;s competitive prices with <b>10-minute Nandigama dispatch</b> &amp; 6-digit OTP verification (<code>/staff/</code>, <code>/rider/</code>, <code>/order/</code>).</td>
        </tr>
        <tr>
          <td><b>3. Existing CCTV Camera AI Head-Tracking</b></td>
          <td>No live crowd meter online &amp; missed overdue members at 7 PM peak</td>
          <td>Reads existing CCTV feed to show live IN/OUT occupancy on <code>velocityfitness.in</code> and alerts desk/trainers if an overdue subscription walks in.</td>
        </tr>
        <tr>
          <td><b>4. Indoor + Outdoor AI Agent &amp; Mobile Master Control</b></td>
          <td>Repetitive WhatsApp replies for diet, beginner routines &amp; fee enquiries</td>
          <td>Generates customized Indoor &amp; Outdoor plans aligned with Rajesh/Venky&rsquo;s coaching style and lets owners pause/override any automation from mobile.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="foot-bar">
    <span>Understone AI Automation &middot; Custom Configured for Velocity Fitness Nandigama</span>
    <b>PAGE 03 / 04</b>
  </div>
</section>

<!-- ============================== PAGE 04 ============================== -->
<section class="page">
  <div>
    <div class="top-bar">
      <span><b>VELOCITY FITNESS (NANDIGAMA, AP)</b> &middot; PERSONALIZED DIGITAL AUDIT</span>
      <span class="muted">04 &middot; Rs. 1,00,000 SYSTEM VALUATION &amp; ZERO-RISK TRIAL</span>
    </div>

    <div class="part-label">PART 3 &middot; TRANSPARENT SYSTEM VALUATION &amp; PARTNERSHIP NEXT STEPS</div>
    <h1>Complete Standalone Valuation (Rs. 1,00,000) &amp; Trial Guarantee</h1>
    <p class="sublead">
      Notice how conservative monthly leakage (~Rs. 36,000&ndash;55,500/mo across renewals, supplements, and Maps walk-ins) compares naturally against the full Rs. 1,00,000 engineering value below. Exact partner investment terms for Velocity Fitness are discussed personally on our walkthrough.
    </p>

    <table class="spec-table">
      <thead>
        <tr>
          <th>#</th>
          <th>VELOCITY FITNESS DEPLOYMENT MODULE</th>
          <th style="text-align:right">STANDALONE VALUE</th>
          <th style="text-align:right">INCLUDED</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="mono"><b>01</b></td>
          <td>
            <b>24/7 Message Recorder + D-7, D-6, D-3, D-2, D-1 &amp; Weekly UPI Subscription Engine</b><br>
            <span style="color:#555">Clean import of Velocity&rsquo;s current active/expiring roster, automated direct payment cadence, instant payment suppression &amp; automated Google Review prompts.</span>
          </td>
          <td class="mono" style="text-align:right"><b>Rs. 30,000</b></td>
          <td class="mono" style="text-align:right;color:#166534"><b>YES</b></td>
        </tr>
        <tr>
          <td class="mono"><b>02</b></td>
          <td>
            <b>Existing CCTV AI Head-Tracking Software &amp; Overdue Desk Alert</b><br>
            <span style="color:#555">Connects to Velocity&rsquo;s existing floor/gate CCTV stream to track live IN/OUT crowd counts onto your 3D website and notify the desk on overdue entries.</span>
          </td>
          <td class="mono" style="text-align:right"><b>Rs. 25,000</b></td>
          <td class="mono" style="text-align:right;color:#166534"><b>YES</b></td>
        </tr>
        <tr>
          <td class="mono"><b>03</b></td>
          <td>
            <b>Velocity Branded 3D Website + 10-Min Supplement Set OTP Store + 5km SEO Radar</b><br>
            <span style="color:#555">Upgrades <code>velocityfitness.in</code> out of the generic <code>Akhara</code> template with live supplement stack bundles, OTP delivery counter, and Nandigama Local SEO capture.</span>
          </td>
          <td class="mono" style="text-align:right"><b>Rs. 25,000</b></td>
          <td class="mono" style="text-align:right;color:#166534"><b>YES</b></td>
        </tr>
        <tr>
          <td class="mono"><b>04</b></td>
          <td>
            <b>Indoor + Outdoor AI Workout Agent &amp; Mobile/Laptop Master Switchboard</b><br>
            <span style="color:#555">24/7 workout/supplement assistant tailored to Velocity&rsquo;s coaching programs plus one-tap mobile &amp; desktop control over all automations.</span>
          </td>
          <td class="mono" style="text-align:right"><b>Rs. 20,000</b></td>
          <td class="mono" style="text-align:right;color:#166534"><b>YES</b></td>
        </tr>
        <tr style="background:#121414;color:#fff">
          <td colspan="2" class="mono" style="color:#fff;padding:10px"><b>TOTAL STANDALONE SYSTEM VALUATION (ALL 4 MODULES)</b></td>
          <td colspan="2" class="mono" style="text-align:right;color:#c0fe04;font-size:13.5pt;padding:10px;white-space:nowrap"><b>Rs. 1,00,000</b></td>
        </tr>
      </tbody>
    </table>

    <div class="steps-4">
      <div class="step-box">
        <div class="s-num">STEP 01</div>
        <h4>10-Min Floor Chat</h4>
        <p>Verify Velocity&rsquo;s active member count, renewal plans, supplement sets &amp; current CCTV angle.</p>
      </div>
      <div class="step-box">
        <div class="s-num">STEP 02</div>
        <h4>Free Live Trial</h4>
        <p>Launch Velocity&rsquo;s live workspace and test WhatsApp links, CCTV count &amp; supplement flow risk-free.</p>
      </div>
      <div class="step-box">
        <div class="s-num">STEP 03</div>
        <h4>Side-By-Side Test</h4>
        <p>Confirm every reminder stops on payment and every supplement OTP verifies cleanly before handover.</p>
      </div>
      <div class="step-box">
        <div class="s-num">STEP 04</div>
        <h4>15-Day Guarantee</h4>
        <p>Written 15-Day 100% Unconditional Refund Guarantee if anything breaks or fails to deliver value.</p>
      </div>
    </div>

    <div class="sign-box">
      <div class="sign-head">VELOCITY FITNESS TRIAL TERMS, GUARANTEE &amp; DIRECT CONTACT</div>
      <div class="sign-col">
        <b>HOW WE START WITH ZERO RISK FOR VELOCITY</b><br>
        &bull; <b>Start With a Free Live Trial:</b> Experience the live WhatsApp subscription links, CCTV floor feed, and upgraded <code>velocityfitness.in</code> 3D store firsthand.<br>
        &bull; <b>15-Day 100% Refund Guarantee:</b> Even after going live, if any agreed workflow fails to run cleanly or doesn&rsquo;t feel worth it within 15 days, receive a <b>100% full refund without any conditions.</b><br>
        &bull; <b>Direct Commercial Discussion:</b> Custom local partner terms presented in person by Koushik Sirivella.
      </div>
      <div class="sign-col">
        <div class="mono" style="font-size:7.3pt;color:#666;text-transform:uppercase">PREPARED FOR VELOCITY FITNESS BY</div>
        <div style="font-size:12pt;font-weight:800;margin-top:2px">Koushik Sirivella</div>
        <div style="font-size:8.2pt;color:#444"><b>Understone AI Automation</b> (<b>www.understone.in</b>)</div>
        <div style="font-size:8.2pt;color:#444">Email: <b>koushiksirivella@gmail.com</b></div>
        <div style="font-size:8.2pt;color:#444;margin-bottom:9px">WhatsApp / Call: <b>+91 81254 81616</b></div>

        <div class="mono" style="font-size:7.3pt;color:#b84a00;text-transform:uppercase;margin-bottom:3px">CLIENT TARGET LOCATION</div>
        <div style="font-size:8pt;color:#222">Velocity Fitness &middot; Raithupeta, Nandigama, AP 521185<br>Phone: +91 96032 18498 &middot; Rating: 5.0&#9733; (75 Reviews)</div>
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
  console.log(`ok  built Velocity PDF  -> ${PDF_OUT}`);
  console.log(`ok  copied Velocity PDF -> ${PDF_DOWNLOADS}`);
});
