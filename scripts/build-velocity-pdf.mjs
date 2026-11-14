#!/usr/bin/env node
// ============================================================================
// Builds the clean, personalized 2-Page Proposal PDF for Velocity Fitness
// (Nandigama, AP) featuring:
//   - Live inspection of velocityfitness.in + Google Maps (5.0★, 75 reviews, Rajesh/Venky)
//   - Showcase of Understone's live 3D walkthrough website (www.understone.in)
//   - Exact 5 solutions to mitigate potential losses & help double sales
//   - ZERO "AI" jargon, ZERO assumed rupee losses, ZERO prices/offers revealed
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
  const understoneShot = toDataUri(join(shotDir, 'understone-live-3d.png'));

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Velocity Fitness Nandigama — Custom 3D Web & Automation Brief</title>
<style>
${basePdfCss(base)}
.page { padding: 13mm 15mm 12mm; }
h1 { font-size: 20.5pt; }
.shot-box img { height: 128px; }
</style>
</head>
<body>

<!-- ============================== PAGE 01 ============================== -->
<section class="page">
  <div>
    <div class="top-bar">
      <span><b>VELOCITY FITNESS &middot; NANDIGAMA</b> &middot; PERSONALIZED SYSTEM BRIEF</span>
      <span class="muted">PAGE 01 / 02 &middot; SITE, MAPS &amp; 3D AUDIT</span>
    </div>

    <div class="tag-row">
      <span class="pill-black">RAITHUPETA, NANDIGAMA (521185) &middot; +91 96032 18498</span>
      <span class="mono" style="font-size:8pt;color:#444">PREPARED BY KOUSHIK SIRIVELLA</span>
    </div>

    <h1>
      Velocity Built A 5.0&#9733; Gym.<br>
      <span class="accent">Here Is What We Can Upgrade To Mitigate Losses &amp; Grow Sales.</span>
    </h1>
    <p class="sublead">
      I reviewed <b>velocityfitness.in</b> and your Nandigama Google Maps listing. You already have strong reviews praising trainers Rajesh &amp; Venky and competitive supplement availability &mdash; below is a simple, straightforward look at what is missing online right now.
    </p>

    <div class="kpi-row-4">
      <div class="kpi-card dark">
        <div class="kpi-lbl">GOOGLE MAPS SCORE</div>
        <div class="kpi-val" style="color:#c0fe04">5.0 &#9733;</div>
        <div class="kpi-sub">75 verified reviews &mdash; highest rating quality in town</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-lbl">MAPS SEARCH VOLUME</div>
        <div class="kpi-val" style="color:#b84a00">75 vs 217</div>
        <div class="kpi-sub">Nearby gym holds 217 reviews &mdash; capture more searchers</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-lbl">EVENING PEAK FLOOR</div>
        <div class="kpi-val">6&ndash;8 PM</div>
        <div class="kpi-sub">74%&ndash;80% busy peak load right when desk staff coach</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-lbl">SUPPLEMENTS &amp; SITE</div>
        <div class="kpi-val">Offline</div>
        <div class="kpi-sub">Reviews praise your supplement prices, yet no store/3D tour live</div>
      </div>
    </div>

    <div class="compare-grid">
      <div class="compare-card good">
        <div class="compare-head" style="color:#166534">WHAT YOUR CURRENT WEBSITE ALREADY HAS</div>
        <div class="compare-item">
          <b>1. Clean Info &amp; Member Reviews:</b>
          Shows trainer certifications, results (Abi Vinnu, Arjun K, Rahul B), hours (5 AM&ndash;10 PM), Google Maps directions, and a manual WhatsApp enquiry button.
        </div>
        <div class="compare-item">
          <b>2. Trusted Local Supplement Demand:</b>
          Your Maps reviews specifically praise Velocity for offering quality supplements at better prices than outside websites.
        </div>
      </div>

      <div class="compare-card">
        <div class="compare-head" style="color:#b82020">POTENTIAL LEAKS WE CAN PREVENT AUTOMATICALLY</div>
        <div class="compare-item">
          <b>1. Manual Expiry Tracking &amp; Rush-Hour Blind Spots:</b>
          Without automatic D-7, D-6, D-3, D-2, D-1 &amp; weekly payment links or live CCTV head-tracking, late renewals and overdue walk-ins during 6&ndash;8 PM rush can go unnoticed.
        </div>
        <div class="compare-item">
          <b>2. Static Pages Instead of Interactive 3D &amp; Supplement Checkout:</b>
          Prospects can&rsquo;t virtually walk through your gym in 3D before visiting, and members can&rsquo;t order supplement sets online for quick local delivery.
        </div>
      </div>
    </div>

    <div class="shot-grid-2">
      <div class="shot-box">
        <img src="${velocityShot}" alt="Current velocityfitness.in">
        <div class="shot-cap"><b>CURRENT SITE:</b> velocityfitness.in static template (manual WhatsApp only)</div>
      </div>
      <div class="shot-box">
        <img src="${understoneShot}" alt="Understone 3D Interactive Website Example">
        <div class="shot-cap"><b>WHAT WE BUILD (www.understone.in):</b> Full Interactive 3D Walkthrough Experience</div>
      </div>
    </div>
  </div>

  <div class="foot-bar">
    <span>Prepared for <b>Velocity Fitness (Nandigama)</b> by <b>Koushik Sirivella (www.understone.in)</b> &middot; +91 81254 81616</span>
    <b>PAGE 01 / 02</b>
  </div>
</section>

<!-- ============================== PAGE 02 ============================== -->
<section class="page">
  <div>
    <div class="top-bar">
      <span><b>VELOCITY FITNESS &middot; NANDIGAMA</b> &middot; PERSONALIZED SYSTEM BRIEF</span>
      <span class="muted">PAGE 02 / 02 &middot; CUSTOM SOLUTIONS &amp; NEXT STEPS</span>
    </div>

    <div class="part-label">SPECIFIC SOLUTIONS I CAN BUILD DIRECTLY FOR VELOCITY</div>
    <h1>Full 3D Gym Walkthrough + Complete Operations Automation</h1>
    <p class="sublead">
      No fluff &mdash; below are the exact software upgrades we plug into Velocity Fitness so nothing slips through the cracks and every prospect visiting online sees the best version of your gym.
    </p>

    <table class="spec-table">
      <thead>
        <tr>
          <th style="width:42px">#</th>
          <th style="width:36%">SPECIFIC SYSTEM BUILT FOR VELOCITY</th>
          <th>HOW IT HELPS MITIGATE LOSSES &amp; GROW SALES</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="mono"><b>01</b></td>
          <td><b>Complete 3D Website + 3D Gym Walkthrough</b><br><span style="color:#555">(Like our live work at www.understone.in)</span></td>
          <td>Prospects visiting <b>velocityfitness.in</b> can literally <b>walk through your gym floor, racks, and training zones in interactive 3D</b> on phone or laptop &mdash; building instant trust before they step in.</td>
        </tr>
        <tr>
          <td class="mono"><b>02</b></td>
          <td><b>24/7 Message Recorder + Countdown Direct Payment Links</b></td>
          <td>Records every WhatsApp enquiry 24/7 and automatically sends direct 1-tap UPI payment links on <b>Day 7, 6, 3, 2, 1</b> before expiry and <b>every 1 week</b> until paid (auto-stops as soon as they pay).</td>
        </tr>
        <tr>
          <td class="mono"><b>03</b></td>
          <td><b>Existing CCTV Camera Head-Tracking (IN / OUT + Gate Alert)</b></td>
          <td>Installs directly onto your existing gate/floor CCTV feed (no extra hardware) to show real-time gym crowd on your 3D website and notify the desk if an overdue profile enters during peak hours.</td>
        </tr>
        <tr>
          <td class="mono"><b>04</b></td>
          <td><b>Online Supplement Set Store (10-Min OTP Delivery) + 5km SEO</b></td>
          <td>Turns your supplement pricing edge into instant online set checkouts with 10-minute delivery &amp; 6-digit OTP verification &mdash; plus automated Google review &amp; 5km local SEO capture.</td>
        </tr>
        <tr>
          <td class="mono"><b>05</b></td>
          <td><b>Indoor + Outdoor Workout Builder &amp; Mobile Switchboard</b></td>
          <td>Generates structured Indoor &amp; Outdoor plans paired with Velocity supplement sets, plus one simple Lead &amp; Automation control board you run from mobile or laptop anywhere.</td>
        </tr>
      </tbody>
    </table>

    <div class="shot-grid-2" style="margin-bottom:8px">
      <div class="shot-box">
        <img src="${shots.renewals}" style="height:110px" alt="Automated Renewal Console">
        <div class="shot-cap"><b>AUTOMATED RENEWALS:</b> 24/7 Message Recorder + D-7..D-1 &amp; Weekly Payment Links</div>
      </div>
      <div class="shot-box">
        <img src="${shots.gate}" style="height:110px" alt="Existing CCTV Floor Head-Tracking">
        <div class="shot-cap"><b>EXISTING CCTV SOFTWARE:</b> Live IN/OUT Crowd Count + Desk Overdue Alert</div>
      </div>
    </div>

    <div class="sign-box">
      <div class="sign-head">ANYTHING ELSE NEEDED TO DOUBLE YOUR SALES? LET&rsquo;S BUILD IT</div>
      <div class="sign-col">
        <b>OPEN PARTNERSHIP QUESTION FOR VELOCITY</b><br>
        &bull; Tell me honestly: <b>is there anything else in your gym workflow that can be fixed, automated, or improved to double your memberships &amp; supplement sales?</b> Whatever it is &mdash; website, 3D walkthrough, billing, CCTV tracking, or custom automation &mdash; I can build it directly for you.<br>
        &bull; <b>100% Working Guarantee:</b> See the system running live first. If anything fails to work cleanly as promised, full 100% refund with no questions asked.
      </div>
      <div class="sign-col">
        <div class="mono" style="font-size:7.3pt;color:#666;text-transform:uppercase">TALK DIRECTLY WITH</div>
        <div style="font-size:12.5pt;font-weight:800;margin-top:2px">Koushik Sirivella</div>
        <div style="font-size:8.4pt;color:#444"><b>Understone</b> &middot; <b>www.understone.in</b></div>
        <div style="font-size:8.4pt;color:#444">Phone / WhatsApp: <b>+91 81254 81616</b></div>
        <div style="font-size:8.4pt;color:#444;margin-bottom:8px">Email: <b>koushiksirivella@gmail.com</b></div>

        <div class="mono" style="font-size:7.2pt;color:#b84a00;text-transform:uppercase;margin-bottom:2px">DIRECT WALKTHROUGH</div>
        <div style="font-size:8pt;color:#222">Call or reply on WhatsApp anytime to walk through the live setup together and see <b>www.understone.in</b> in 3D.</div>
      </div>
    </div>
  </div>

  <div class="foot-bar">
    <span>Prepared personally for <b>Velocity Fitness (Nandigama)</b> &middot; <b>www.understone.in</b> &middot; +91 81254 81616</span>
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
  console.log(`ok  built updated no-price/3D Velocity PDF -> ${PDF_OUT}`);
  console.log(`ok  copied updated Velocity PDF -> ${PDF_DOWNLOADS}`);
});
