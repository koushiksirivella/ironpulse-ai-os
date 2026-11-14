#!/usr/bin/env node
// ============================================================================
// Renders a concise, natural 1920x1080 walkthrough MP4 video explaining the
// exact 4 solutions built for Velocity Fitness (Nandigama, AP):
//   - Grounded in real http://velocityfitness.in/#pricing & Google Maps data
//   - Realistic Rs. 1,000/mo subscription math ONLY (zero inflated 1-yr numbers)
//   - Zero "AI" buzzwords and zero upfront price revealed (discussed in person)
//   - Includes Half-now / Half-later + 100% Unconditional Refund Promise
// ============================================================================

import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { toDataUri, withAppSession } from './pdf-shared.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MP4_OUT = join(ROOT, 'pitch', 'Velocity_Fitness_Value_Walkthrough.mp4');
const MP4_DOWNLOADS = 'C:/Users/skous/Downloads/Velocity_Fitness_Value_Walkthrough.mp4';

const SLIDE_CSS = (base) => `
@font-face { font-family: 'Figtree'; src: url('${base}/assets/fonts/TikTokSans.ttf') format('truetype'); font-weight: 100 900; }
@font-face { font-family: 'IBM Plex Mono'; src: url('${base}/assets/fonts/GeistMono.ttf') format('truetype'); font-weight: 100 900; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  width: 1920px; height: 1080px; overflow: hidden;
  background: #0c0e0e; color: #f5f5f0;
  font-family: 'Figtree', system-ui, sans-serif;
  background-image:
    linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px);
  background-size: 48px 48px;
}
.wrap {
  width: 1920px; height: 1080px;
  padding: 58px 78px 48px;
  display: flex; flex-direction: column; justify-content: space-between;
}
.mono { font-family: 'IBM Plex Mono', monospace; }
.topbar {
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px solid rgba(255,255,255,0.16); padding-bottom: 18px;
  font-family: 'IBM Plex Mono', monospace; font-size: 18px; letter-spacing: 0.08em; text-transform: uppercase;
  color: #a6aba8;
}
.topbar b { color: #c0fe04; }
.pill {
  display: inline-block; background: #1a2112; border: 1px solid #c0fe04; color: #c0fe04;
  font-family: 'IBM Plex Mono', monospace; font-size: 18px; font-weight: 700;
  padding: 8px 18px; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 18px;
}
h1 { font-size: 60px; font-weight: 800; line-height: 1.09; letter-spacing: -0.025em; margin-bottom: 16px; }
h1 .hi { color: #c0fe04; }
h1 .warn { color: #ff8a3d; }
.lead { font-size: 27px; color: #b8bdb9; line-height: 1.44; max-width: 1580px; }
.grid-2 { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 38px; align-items: center; flex: 1; margin: 24px 0; }
.grid-equal { display: grid; grid-template-columns: 1fr 1fr; gap: 34px; flex: 1; margin: 24px 0; align-items: stretch; }
.card { background: #131717; border: 1px solid rgba(255,255,255,0.14); padding: 30px 34px; }
.card.accent { border-left: 6px solid #c0fe04; background: #141914; }
.card.orange { border-left: 6px solid #ff8a3d; }
.k-lbl { font-family: 'IBM Plex Mono', monospace; font-size: 17px; color: #909692; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }
.k-val { font-family: 'IBM Plex Mono', monospace; font-size: 50px; font-weight: 800; color: #c0fe04; line-height: 1.1; margin-bottom: 10px; }
.k-val.orange { color: #ff8a3d; }
.k-desc { font-size: 24px; color: #d5d9d6; line-height: 1.44; }
.shot-frame { border: 2px solid rgba(192,254,4,0.4); background: #090b0b; overflow: hidden; }
.shot-frame img { width: 100%; height: 470px; object-fit: cover; object-position: top left; display: block; }
.shot-cap { background: #151919; padding: 14px 20px; font-family: 'IBM Plex Mono', monospace; font-size: 18px; color: #c0fe04; border-top: 1px solid rgba(255,255,255,0.12); }
.math-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 26px; background: #141818; border: 1px solid rgba(255,255,255,0.12); margin-bottom: 16px;
}
.math-row .name { font-size: 26px; font-weight: 700; }
.math-row .sub { font-size: 20px; color: #9ea3a0; margin-top: 4px; }
.math-row .num { font-family: 'IBM Plex Mono', monospace; font-size: 32px; font-weight: 800; color: #ff8a3d; white-space: nowrap; }
.math-row.total { background: #182010; border: 2px solid #c0fe04; }
.math-row.total .num { color: #c0fe04; font-size: 38px; }
.footer {
  display: flex; justify-content: space-between; align-items: center;
  border-top: 1px solid rgba(255,255,255,0.16); padding-top: 16px;
  font-family: 'IBM Plex Mono', monospace; font-size: 18px; color: #8c918e;
}
.footer b { color: #f5f5f0; }
`;

await withAppSession(ROOT, 3196, async ({ browser, base, shotDir, shots }) => {
  const framesDir = join(shotDir, 'video-frames');
  mkdirSync(framesDir, { recursive: true });
  const velocityShot = toDataUri(join(shotDir, 'velocity-live-site.png'));

  const slides = [
    // 01: Real Audit of velocityfitness.in + Maps
    `
    <div>
      <div class="pill">01 / VELOCITY FITNESS &middot; NANDIGAMA &middot; WEBSITE &amp; MAPS CHECK</div>
      <h1>Your Gym Already Has <span class="hi">5.0&#9733; Reputation</span>.<br>Here Are 4 Missing Tools On <span class="warn">velocityfitness.in</span>.</h1>
      <p class="lead">You already show Rs. 1,000/1,099 monthly plans, trainer results, and low-price supplements in reviews &mdash; here is what is missing right now.</p>
    </div>
    <div class="grid-2">
      <div>
        <div class="card accent" style="margin-bottom:20px">
          <div class="k-lbl">WHAT VELOCITY ALREADY DOES GREAT</div>
          <div class="k-desc">5.0&#9733; across 75 reviews, Rajesh &amp; Venky coaching, 5 AM&ndash;10 PM hours, and lower supplement prices than outside websites.</div>
        </div>
        <div class="card orange">
          <div class="k-lbl">4 PRACTICAL GAPS RIGHT NOW</div>
          <div class="k-desc">1. Manual WhatsApp expiry reminders (no auto pay links).<br>2. No live CCTV crowd count or overdue alert at 6&ndash;8 PM.<br>3. Supplements listed offline only (no 10-min checkout).<br>4. 75 Maps reviews vs competitor&rsquo;s 217 local reviews.</div>
        </div>
      </div>
      <div class="shot-frame">
        <img src="${velocityShot}" alt="Current velocityfitness.in">
        <div class="shot-cap">LIVE TODAY: velocityfitness.in has static plans &amp; manual WhatsApp only</div>
      </div>
    </div>`,

    // 02: Solution 1 - 24/7 Message Recorder + D-7/6/3/2/1 & Weekly Pay Links
    `
    <div>
      <div class="pill">02 / SOLUTION 01 &mdash; 24/7 MESSAGE RECORDER + AUTO PAYMENT LINKS</div>
      <h1>Direct UPI Links Sent On <span class="hi">D-7, D-6, D-3, D-2, D-1 &amp; Weekly</span></h1>
      <p class="lead">Every WhatsApp enquiry is recorded 24/7, members receive a 1-tap payment link automatically before expiry, and reminders stop the instant they pay.</p>
    </div>
    <div class="grid-2">
      <div>
        <div class="math-row">
          <div><div class="name">Missed / Delayed Rs. 1,000 Renewals</div><div class="sub">Suppose even 8&ndash;12 monthly members delay renewal or skip a week because nobody sent a direct UPI link on time.</div></div>
          <div class="num">Rs. 8k&ndash;12k/mo</div>
        </div>
        <div class="card accent">
          <div class="k-lbl">EXACT SOLUTION BUILT FOR YOU</div>
          <div class="k-desc">24/7 Message Recorder saves every conversation + sends direct payment links at Day 7, 6, 3, 2, 1 &amp; every 1 week until renewed.</div>
        </div>
      </div>
      <div class="shot-frame">
        <img src="${shots.renewals}" alt="Automated Payment Links Console">
        <div class="shot-cap">SOLUTION 01: Automatic Expiry Countdown + Weekly Links + Instant Auto-Stop</div>
      </div>
    </div>`,

    // 03: Solution 2 - Existing CCTV Head-Tracking (Live IN/OUT + Desk Alert)
    `
    <div>
      <div class="pill">03 / SOLUTION 02 &mdash; EXISTING CCTV HEAD-TRACKING SOFTWARE</div>
      <h1>Live Crowd Count &amp; Overdue Alerts From <span class="hi">Your Current CCTV</span></h1>
      <p class="lead">Google Maps shows 74%&ndash;80% peak floor rush between 6:00 PM and 8:00 PM. Zero extra camera hardware needed.</p>
    </div>
    <div class="grid-2">
      <div>
        <div class="math-row">
          <div><div class="name">6&ndash;8 PM Peak Crowd Overdue Entries</div><div class="sub">When coaches are busy on the floor, even 4&ndash;5 expired Rs. 1,000/mo members slip in unnoticed each month.</div></div>
          <div class="num">Rs. 4k&ndash;5k/mo</div>
        </div>
        <div class="card accent">
          <div class="k-lbl">EXACT SOLUTION BUILT FOR YOU</div>
          <div class="k-desc">Installs directly on your existing entrance camera to track every person IN &amp; OUT onto your live site and alert your desk when an unpaid subscription enters.</div>
        </div>
      </div>
      <div class="shot-frame">
        <img src="${shots.gate}" alt="Existing CCTV Head-Tracking">
        <div class="shot-cap">SOLUTION 02: Live Floor Occupancy + Instant Overdue Member Desk Flag</div>
      </div>
    </div>`,

    // 04: Solution 3 - Online Supplement Set Store (10-Min OTP Delivery) OR 5km SEO
    `
    <div>
      <div class="pill">04 / SOLUTION 03 &mdash; SUPPLEMENT SET STORE (10-MIN DELIVERY) OR 5KM SEO</div>
      <h1>Turn Your <span class="hi">Low Supplement Prices</span> &amp; 5.0&#9733; Score Into Online Sales</h1>
    </div>
    <div class="grid-2">
      <div>
        <div class="math-row">
          <div><div class="name">10&ndash;15 Supplement Sets / Month</div><div class="sub">Members already praise Velocity&rsquo;s supplement prices &mdash; let them order complete sets online with 10-min Nandigama OTP delivery instead of Amazon.</div></div>
          <div class="num">Rs. 6k&ndash;12k/mo</div>
        </div>
        <div class="math-row">
          <div><div class="name">Google Maps Local SEO + Review Loop</div><div class="sub">Close the 75 vs 217 review gap &amp; capture just 5 extra Rs. 1,000/mo Nandigama joins every month.</div></div>
          <div class="num">Rs. 5k/mo</div>
        </div>
      </div>
      <div class="shot-frame">
        <img src="${shots.store}" alt="Upgraded 3D Storefront & Supplement Sets">
        <div class="shot-cap">SOLUTION 03: Online Supplement Set Checkout + 6-Digit OTP Handover</div>
      </div>
    </div>`,

    // 05: Solution 4 - Indoor/Outdoor Plans + Mobile Control Switchboard
    `
    <div>
      <div class="pill">05 / SOLUTION 04 &mdash; INDOOR/OUTDOOR PLANS + MOBILE MASTER CONTROL</div>
      <h1>Run Everything From Your <span class="hi">Phone Or Laptop</span> Anywhere</h1>
      <p class="lead">Built specifically so the Velocity team spends zero hours chasing spreadsheets.</p>
    </div>
    <div class="grid-2">
      <div>
        <div class="card accent" style="margin-bottom:22px">
          <div class="k-lbl">INDOOR + OUTDOOR WORKOUT &amp; SET BUILDER</div>
          <div class="k-desc">Gives walk-ins &amp; members clean Indoor floor + Outdoor training routines paired directly with your recommended Velocity supplement set.</div>
        </div>
        <div class="card">
          <div class="k-lbl">ONE POCKET SWITCHBOARD</div>
          <div class="k-desc">See every recorded lead, renewal link, CCTV count, and supplement order in one place &mdash; pause or control any automation from your mobile.</div>
        </div>
      </div>
      <div class="shot-frame">
        <img src="${shots.leads}" alt="Mobile and Laptop Control Board">
        <div class="shot-cap">SOLUTION 04: Mobile Control Switchboard + Lead Recorder + 5km SEO Radar</div>
      </div>
    </div>`,

    // 06: Natural Summary + Zero-Risk Half-Now/Half-Later + 100% Refund
    `
    <div>
      <div class="pill">06 / REALISTIC MONTHLY IMPACT &amp; ZERO-RISK START</div>
      <h1>Conservative Gain: <span class="hi">Rs. 23,000 &ndash; 34,000 / Month</span> (At Rs. 1,000/mo)</h1>
      <p class="lead">No exaggerated numbers &mdash; pay half when we start and half after it goes live (or pay once you see it working), backed by a written <b>100% Refund Promise</b>.</p>
    </div>
    <div class="grid-equal">
      <div class="card accent" style="display:flex;flex-direction:column;justify-content:center">
        <div class="k-lbl">HOW WE WORK TOGETHER</div>
        <div class="k-val" style="font-size:38px">Free Live Test + Half &amp; Half + 100% Refund</div>
        <div class="k-desc">1. We walk through the live working system together.<br>2. Start with a free trial or 50% advance / 50% after go-live.<br>3. If anything doesn&rsquo;t work cleanly as promised: <b>100% Full Refund</b>.</div>
      </div>
      <div class="card" style="display:flex;flex-direction:column;justify-content:center">
        <div class="k-lbl">TALK DIRECTLY WITH KOUSHIK FOR SETUP</div>
        <div class="k-val" style="font-size:38px;color:#f5f5f0">Koushik Sirivella</div>
        <div class="k-desc">
          Phone / WhatsApp: <b style="color:#c0fe04">+91 81254 81616</b><br>
          Website: <b>www.understone.in</b><br>
          Email: <b>koushiksirivella@gmail.com</b>
        </div>
      </div>
    </div>`,
  ];

  const slidePage = await browser.newPage();
  await slidePage.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  const framePaths = [];
  for (let i = 0; i < slides.length; i++) {
    const doc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${SLIDE_CSS(base)}</style></head><body>
      <div class="wrap">
        <div class="topbar">
          <span><b>VELOCITY FITNESS &middot; NANDIGAMA</b> &middot; CUSTOM GROWTH SYSTEM</span>
          <span>KOUSHIK SIRIVELLA &middot; SLIDE 0${i + 1} / 0${slides.length}</span>
        </div>
        ${slides[i]}
        <div class="footer">
          <span><b>www.understone.in</b> &middot; +91 81254 81616 &middot; koushiksirivella@gmail.com</span>
          <span>REALISTIC Rs. 1,000/MO BASELINE &middot; 100% UNCONDITIONAL REFUND GUARANTEE</span>
        </div>
      </div>
    </body></html>`;
    const htmlPath = join(framesDir, `slide-${i + 1}.html`);
    const pngPath = join(framesDir, `slide-${i + 1}.png`);
    writeFileSync(htmlPath, doc, 'utf8');
    await slidePage.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
    await slidePage.screenshot({ path: pngPath });
    framePaths.push(pngPath);
    console.log(`ok  rendered video slide ${i + 1}/${slides.length}`);
  }

  const dur = 7.5;
  const fade = 0.5;
  const inputs = framePaths.flatMap((p) => ['-loop', '1', '-t', String(dur), '-i', p]);
  const filters = [];
  let prev = '[0:v]';
  for (let i = 1; i < framePaths.length; i++) {
    const offset = (dur - fade) * i;
    const outTag = i === framePaths.length - 1 ? '[vout]' : `[v${i}]`;
    filters.push(`${prev}[${i}:v]xfade=transition=fade:duration=${fade}:offset=${offset.toFixed(2)}${outTag}`);
    prev = outTag;
  }
  const ffArgs = [
    '-y',
    ...inputs,
    '-filter_complex',
    `${filters.join(';')};[vout]format=yuv420p[final]`,
    '-map',
    '[final]',
    '-r',
    '30',
    '-c:v',
    'libx264',
    '-crf',
    '20',
    '-preset',
    'medium',
    '-movflags',
    '+faststart',
    MP4_OUT,
  ];
  execFileSync('ffmpeg', ffArgs, { stdio: 'inherit' });
  copyFileSync(MP4_OUT, MP4_DOWNLOADS);
  console.log(`ok  built MP4 video  -> ${MP4_OUT}`);
  console.log(`ok  copied MP4 video -> ${MP4_DOWNLOADS}`);
});
