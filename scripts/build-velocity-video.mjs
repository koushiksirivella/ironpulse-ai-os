#!/usr/bin/env node
// ============================================================================
// Renders a crisp 1920x1080 natural-paced walkthrough MP4 video showing
// rough monthly revenue-leak calculations (subscriptions + supplements + Maps)
// and the exact Rs. 1,00,000 standalone system value breakdown for Velocity
// Fitness (Nandigama, AP), with zero pushy discount pricing.
//   - pitch/Velocity_Fitness_Value_Walkthrough.mp4
//   - C:/Users/skous/Downloads/Velocity_Fitness_Value_Walkthrough.mp4
// ============================================================================

import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { withAppSession } from './pdf-shared.mjs';

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
h1 { font-size: 62px; font-weight: 800; line-height: 1.08; letter-spacing: -0.025em; margin-bottom: 18px; }
h1 .hi { color: #c0fe04; }
h1 .warn { color: #ff8a3d; }
.lead { font-size: 28px; color: #b8bdb9; line-height: 1.45; max-width: 1580px; }
.grid-2 { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 38px; align-items: center; flex: 1; margin: 26px 0; }
.grid-equal { display: grid; grid-template-columns: 1fr 1fr; gap: 34px; flex: 1; margin: 26px 0; align-items: stretch; }
.card {
  background: #131717; border: 1px solid rgba(255,255,255,0.14); padding: 30px 34px;
}
.card.accent { border-left: 6px solid #c0fe04; background: #141914; }
.card.orange { border-left: 6px solid #ff8a3d; }
.k-lbl { font-family: 'IBM Plex Mono', monospace; font-size: 17px; color: #909692; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }
.k-val { font-family: 'IBM Plex Mono', monospace; font-size: 52px; font-weight: 800; color: #c0fe04; line-height: 1.1; margin-bottom: 10px; }
.k-val.orange { color: #ff8a3d; }
.k-desc { font-size: 24px; color: #d5d9d6; line-height: 1.42; }
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
.math-row.total .num { color: #c0fe04; font-size: 40px; }
.val-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 28px; background: #141818; border: 1px solid rgba(255,255,255,0.13); margin-bottom: 14px;
}
.val-row .num { font-family: 'IBM Plex Mono', monospace; font-size: 32px; font-weight: 800; color: #c0fe04; white-space: nowrap; }
.val-row.sum { background: #c0fe04; color: #0c0e0e; border: none; padding: 24px 28px; }
.val-row.sum .num { color: #0c0e0e; font-size: 42px; }
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

  const slides = [
    // 01: Context & Velocity Audit
    `
    <div>
      <div class="pill">01 / VELOCITY FITNESS &middot; NANDIGAMA, AP &middot; REAL MAPS AUDIT</div>
      <h1>Velocity Already Won Quality (<span class="hi">5.0&#9733;</span>).<br>Now Fix What Is Quietly Leaking Behind The Scenes.</h1>
      <p class="lead">Look at your live Google Maps &amp; website audit &mdash; zero hype, just three factual observations from Raithupeta, Nandigama:</p>
    </div>
    <div class="grid-equal">
      <div class="card accent">
        <div class="k-lbl">VERIFIED ON GOOGLE MAPS</div>
        <div class="k-val">5.0 &#9733; &middot; 75 Rev.</div>
        <div class="k-desc">Trainers Rajesh &amp; Venky + low-price supplements are praised in reviews, with busy 6:00&ndash;8:00 PM peak hours (74%&ndash;80% full).</div>
      </div>
      <div class="card orange">
        <div class="k-lbl">WHERE REVENUE &amp; TRAFFIC LEAK TODAY</div>
        <div class="k-val orange">&ldquo;Akhara&rdquo; Tab</div>
        <div class="k-desc">1. <b>velocityfitness.in</b> still loads a generic <i>Akhara</i> title.<br>2. J7 sits nearby with <b>217 reviews</b> capturing Maps clicks.<br>3. Renewals &amp; supplement orders still rely on manual memory.</div>
      </div>
    </div>`,

    // 02: Rough Subscription Loss Math
    `
    <div>
      <div class="pill">02 / ROUGH SUBSCRIPTION MATH (CONSERVATIVE BASELINE)</div>
      <h1>If Even <span class="warn">9 Renewals</span> Slip Late Every Month&hellip;</h1>
    </div>
    <div class="grid-2">
      <div>
        <div class="math-row">
          <div><div class="name">Missed / Delayed Renewals (~9/mo)</div><div class="sub">Suppose ~60 plans due/mo @ ~Rs. 1,500&ndash;2,000 avg. Without automated D-7/6/3/2/1 UPI links, 15% delay or fade out.</div></div>
          <div class="num">Rs. 13.5k&ndash;18k</div>
        </div>
        <div class="math-row">
          <div><div class="name">6&ndash;8 PM Peak Crowd Overdue Walk-Ins</div><div class="sub">When trainers are busy at 80% rush, even 4&ndash;5 expired members slip past unnoticed on the floor.</div></div>
          <div class="num">Rs. 6k&ndash;7.5k</div>
        </div>
        <div class="math-row total">
          <div><div class="name">Rough Subscription Revenue Lost / Month</div><div class="sub">Automatically plugged via 24/7 Message Recorder + Direct UPI Cadence + Existing CCTV Head-Tracking.</div></div>
          <div class="num">~Rs. 20k&ndash;25.5k/mo</div>
        </div>
      </div>
      <div class="shot-frame">
        <img src="${shots.renewals}" alt="Subscription Automation Console">
        <div class="shot-cap">LIVE CONSOLE: D-7, D-6, D-3, D-2, D-1 &amp; Weekly Payment Links + Auto-Suppression</div>
      </div>
    </div>`,

    // 03: Rough Supplement Store Opportunity
    `
    <div>
      <div class="pill">03 / SUPPLEMENT COUNTER MATH (FROM VELOCITY&rsquo;S OWN REVIEW)</div>
      <h1>Your Members Already Love Your Supplement Prices.<br>Why Let <span class="warn">15&ndash;20 Orders/Mo</span> Go To Amazon?</h1>
    </div>
    <div class="grid-2">
      <div>
        <div class="card orange" style="margin-bottom:22px">
          <div class="k-lbl">QUOTED DIRECTLY FROM VELOCITY&rsquo;S 5&#9733; REVIEW</div>
          <div class="k-desc" style="font-style:italic">&ldquo;The main peculiarity point is the availability of supplements for low price while compared to the other websites.&rdquo;</div>
        </div>
        <div class="math-row total">
          <div><div class="name">15&ndash;20 Supplement Sets / Month</div><div class="sub">At even ~Rs. 700&ndash;1,000 profit/set via 1-tap 3D site &amp; 10-min Nandigama OTP delivery instead of third-party apps.</div></div>
          <div class="num">Rs. 10.5k&ndash;20k/mo</div>
        </div>
      </div>
      <div class="shot-frame">
        <img src="${shots.store}" alt="3D Storefront & Supplement Sets">
        <div class="shot-cap">UPGRADED VELOCITY 3D SITE: Branded Supplement Sets + 6-Digit OTP Delivery Tracking</div>
      </div>
    </div>`,

    // 04: Google Maps & Peak Crowd Visibility Math
    `
    <div>
      <div class="pill">04 / GOOGLE MAPS + EXISTING CCTV CROWD VISIBILITY</div>
      <h1>Close The <span class="hi">75 &rarr; 217 Review Gap</span> &amp; Live 6&ndash;8 PM Floor Visibility</h1>
    </div>
    <div class="grid-2">
      <div>
        <div class="math-row">
          <div><div class="name">Unanswered / Slow Google Maps Walk-Ins</div><div class="sub">Losing just 4&ndash;5 new joins/month (@ ~Rs. 1,500&ndash;2,000) due to delayed WhatsApp replies or unbranded site.</div></div>
          <div class="num">Rs. 6k&ndash;10k/mo</div>
        </div>
        <div class="card accent" style="margin-top:20px">
          <div class="k-lbl">TWO AUTOMATIC ENGINES INCLUDED</div>
          <div class="k-desc">1. <b>Existing CCTV AI Head-Tracking:</b> Syncs live IN/OUT floor count onto velocityfitness.in with zero extra hardware.<br>2. <b>Automated Google Review Prompts + 5km SEO Radar:</b> Compounds your 5.0&#9733; lead every week.</div>
        </div>
      </div>
      <div class="shot-frame">
        <img src="${shots.gate}" alt="CCTV AI Head-Tracking">
        <div class="shot-cap">EXISTING CCTV FEED: Real-Time IN/OUT Occupancy + Desk Overdue Alert</div>
      </div>
    </div>`,

    // 05: Total Natural Monthly Leakage
    `
    <div>
      <div class="pill">05 / NATURAL SUMMARY &mdash; CONSERVATIVE MONTHLY NUMBERS</div>
      <h1>Total Quiet Monthly Leakage: <span class="warn">Rs. 36,000 &ndash; 55,500 / Month</span></h1>
      <p class="lead">Even with very conservative numbers for Nandigama, manually running Excel + WhatsApp + offline supplements leaves roughly <b>Rs. 4.3 Lakhs &ndash; Rs. 6.6 Lakhs / year</b> uncaptured.</p>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:14px">
      <div class="math-row"><div><div class="name">1. Missed Subscription Renewals &amp; Peak-Hour Overdue Walk-Ins</div></div><div class="num">Rs. 19,500 &ndash; 25,500 / mo</div></div>
      <div class="math-row"><div><div class="name">2. Supplement Sets Bought Outside Instead of Velocity Online Store</div></div><div class="num">Rs. 10,500 &ndash; 20,000 / mo</div></div>
      <div class="math-row"><div><div class="name">3. Slow WhatsApp Inquiry Follow-Up &amp; Local Maps Walk-In Loss</div></div><div class="num">Rs. 6,000 &ndash; 10,000 / mo</div></div>
      <div class="math-row total"><div><div class="name">TOTAL CONSERVATIVE MONTHLY LEAKAGE PLUGGED</div></div><div class="num">Rs. 36,000 &ndash; 55,500 / MO</div></div>
    </div>`,

    // 06: Exact Rs. 1,00,000 Standalone Value Stack (NO fake discounts)
    `
    <div>
      <div class="pill">06 / EXACT SYSTEM VALUATION &mdash; COMPLETE IRONPULSE AI OS&trade;</div>
      <h1>Every Module Included (<span class="hi">Rs. 1,00,000 Standalone Value</span>)</h1>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center">
      <div class="val-row"><div><div class="name mono" style="font-size:25px">01. 24/7 AI Agent + Message Recorder + D-7/6/3/2/1 &amp; Weekly UPI Engine</div><div class="sub">Zero-duplicate payment suppression + automated 5&#9733; Google review prompts</div></div><div class="num">Rs. 30,000</div></div>
      <div class="val-row"><div><div class="name mono" style="font-size:25px">02. Existing CCTV AI Head-Tracking Software &amp; Live Floor Occupancy</div><div class="sub">Works on current CCTV cameras &mdash; syncs live IN/OUT to 3D site &amp; alerts desk on overdue entry</div></div><div class="num">Rs. 25,000</div></div>
      <div class="val-row"><div><div class="name mono" style="font-size:25px">03. Upgraded 3D Velocity Site + 10-Min OTP Supplement Store + 5km SEO</div><div class="sub">Replaces generic &ldquo;Akhara&rdquo; tab with branded e-commerce + Nandigama local SEO radar</div></div><div class="num">Rs. 25,000</div></div>
      <div class="val-row"><div><div class="name mono" style="font-size:25px">04. Indoor + Outdoor AI Workout Agent &amp; Mobile/Laptop Master Control</div><div class="sub">One switchboard to control all automations &amp; leads anytime from phone or desktop</div></div><div class="num">Rs. 20,000</div></div>
      <div class="val-row sum"><div><div class="name mono" style="font-size:28px;font-weight:800">COMPLETE SYSTEM STANDALONE VALUE (PAYS BACK IN ~2&ndash;3 MONTHS)</div></div><div class="num">Rs. 1,00,000</div></div>
    </div>`,

    // 07: Risk-Free Trial & Direct Conversation Closing
    `
    <div>
      <div class="pill">07 / ZERO RISK &middot; FREE LIVE TRIAL + 15-DAY GUARANTEE</div>
      <h1>See It Working On Your Own Gym First.<br><span class="hi">Final Partner Terms Discussed Personally.</span></h1>
    </div>
    <div class="grid-equal">
      <div class="card accent" style="display:flex;flex-direction:column;justify-content:center">
        <div class="k-lbl">YOUR TWO PROTECTIONS</div>
        <div class="k-val" style="font-size:40px">Free Trial + 15-Day 100% Refund</div>
        <div class="k-desc">Test the live WhatsApp subscription engine, CCTV floor head-tracker, and upgraded Velocity 3D supplement store first. If anything fails or doesn&rsquo;t deliver value within 15 days, 100% refund with zero conditions.</div>
      </div>
      <div class="card" style="display:flex;flex-direction:column;justify-content:center">
        <div class="k-lbl">DIRECT NEXT STEP &middot; UNDERSTONE AI AUTOMATION</div>
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
          <span><b>UNDERSTONE AI AUTOMATION</b> &middot; IRONPULSE AI OS&trade;</span>
          <span>VELOCITY FITNESS &middot; NANDIGAMA, AP &middot; SLIDE 0${i + 1} / 0${slides.length}</span>
        </div>
        ${slides[i]}
        <div class="footer">
          <span><b>www.understone.in</b> &middot; +91 81254 81616 &middot; koushiksirivella@gmail.com</span>
          <span>CONSERVATIVE ILLUSTRATIVE AUDIT &middot; COMPLETE Rs. 1,00,000 SYSTEM VALUE</span>
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

  // Assemble smooth 49-second MP4 with 0.5s fade transitions via ffmpeg
  const dur = 7.0;
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
  console.log(`ok  built MP4 video -> ${MP4_OUT}`);
  console.log(`ok  copied MP4 video -> ${MP4_DOWNLOADS}`);
});
