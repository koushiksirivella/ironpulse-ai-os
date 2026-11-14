#!/usr/bin/env node
// ============================================================================
// Renders a clean 1920x1080 walkthrough MP4 video explaining the exact systems
// Koushik built & Understone's 3D Website / Virtual 3D Gym Walkthrough:
//   - Highlights www.understone.in 3D interactive capability
//   - Mitigates potential operational losses (NO guessed rupee amounts)
//   - ZERO "AI" buzzwords, ZERO prices or offers mentioned
//   - Ends with open question: what else can be fixed/automated to double sales
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
h1 { font-size: 58px; font-weight: 800; line-height: 1.09; letter-spacing: -0.025em; margin-bottom: 16px; }
h1 .hi { color: #c0fe04; }
h1 .warn { color: #ff8a3d; }
.lead { font-size: 27px; color: #b8bdb9; line-height: 1.44; max-width: 1580px; }
.grid-2 { display: grid; grid-template-columns: 1.02fr 0.98fr; gap: 38px; align-items: center; flex: 1; margin: 22px 0; }
.grid-equal { display: grid; grid-template-columns: 1fr 1fr; gap: 34px; flex: 1; margin: 24px 0; align-items: stretch; }
.card { background: #131717; border: 1px solid rgba(255,255,255,0.14); padding: 30px 34px; }
.card.accent { border-left: 6px solid #c0fe04; background: #141914; }
.card.orange { border-left: 6px solid #ff8a3d; }
.k-lbl { font-family: 'IBM Plex Mono', monospace; font-size: 17px; color: #909692; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px; }
.k-val { font-family: 'IBM Plex Mono', monospace; font-size: 42px; font-weight: 800; color: #c0fe04; line-height: 1.15; margin-bottom: 12px; }
.k-desc { font-size: 25px; color: #d5d9d6; line-height: 1.48; }
.shot-frame { border: 2px solid rgba(192,254,4,0.4); background: #090b0b; overflow: hidden; }
.shot-frame img { width: 100%; height: 480px; object-fit: cover; object-position: top left; display: block; }
.shot-cap { background: #151919; padding: 14px 20px; font-family: 'IBM Plex Mono', monospace; font-size: 18px; color: #c0fe04; border-top: 1px solid rgba(255,255,255,0.12); }
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
  const understoneShot = toDataUri(join(shotDir, 'understone-live-3d.png'));

  const slides = [
    // 01: Real Audit of velocityfitness.in + Maps (No prices/guesses)
    `
    <div>
      <div class="pill">01 / VELOCITY FITNESS &middot; NANDIGAMA &middot; PRACTICAL UPGRADE WALKTHROUGH</div>
      <h1>Your Gym Has <span class="hi">5.0&#9733; Reputation</span>.<br>Here Is How We Stop Hidden Leaks On <span class="warn">velocityfitness.in</span>.</h1>
      <p class="lead">You already built strong coaching (Rajesh &amp; Venky) and great supplement reviews &mdash; these upgrades focus purely on preventing lost renewals, missed orders, and missed walk-ins.</p>
    </div>
    <div class="grid-2">
      <div>
        <div class="card accent" style="margin-bottom:22px">
          <div class="k-lbl">WHAT STANDS OUT ON YOUR MAPS LISTING</div>
          <div class="k-desc">5.0&#9733; across 75 reviews, busy 6:00&ndash;8:00 PM peak crowd, and members praising Velocity for better supplement availability &amp; pricing.</div>
        </div>
        <div class="card orange">
          <div class="k-lbl">POTENTIAL GAPS WE CAN FIX AUTOMATICALLY</div>
          <div class="k-desc">1. Static site &mdash; visitors cannot walk through your gym in 3D yet.<br>2. Expiry reminders &amp; WhatsApp replies are still manual.<br>3. No existing CCTV floor count or online supplement checkout.</div>
        </div>
      </div>
      <div class="shot-frame">
        <img src="${velocityShot}" alt="Current velocityfitness.in">
        <div class="shot-cap">TODAY: velocityfitness.in has static pages &amp; manual WhatsApp buttons</div>
      </div>
    </div>`,

    // 02: 3D Website & 3D Virtual Gym Walkthrough (Understone Showcase)
    `
    <div>
      <div class="pill">02 / SOLUTION 01 &mdash; COMPLETE 3D WEBSITE &amp; 3D GYM WALKTHROUGH</div>
      <h1>Let Visitors <span class="hi">Literally Walk Through Your Gym In 3D</span> Online</h1>
      <p class="lead">See what we built live on <b>www.understone.in</b> &mdash; we can design a complete interactive 3D website so anyone checking Velocity can tour your equipment &amp; floor from their phone.</p>
    </div>
    <div class="grid-2">
      <div>
        <div class="card accent" style="margin-bottom:22px">
          <div class="k-lbl">WHY 3D WALKTHROUGHS CONVERT MORE WALK-INS</div>
          <div class="k-desc">Instead of reading static text, new prospects move through your gym floor, racks, cardio zone, and facilities in 3D before they even step inside.</div>
        </div>
        <div class="card">
          <div class="k-lbl">LIVE REFERENCE BUILT BY UNDERSTONE</div>
          <div class="k-desc">Full custom 3D architecture, smooth scroll interaction, and instant WhatsApp booking built by Koushik at <b>www.understone.in</b>.</div>
        </div>
      </div>
      <div class="shot-frame">
        <img src="${understoneShot}" alt="Understone 3D Interactive Website">
        <div class="shot-cap">OUR LIVE 3D WORK (www.understone.in): Custom 3D Virtual Environments</div>
      </div>
    </div>`,

    // 03: Solution 02 - 24/7 Message Recorder + Countdown & Weekly UPI Payment Links
    `
    <div>
      <div class="pill">03 / SOLUTION 02 &mdash; 24/7 MESSAGE RECORDER + AUTO PAYMENT LINKS</div>
      <h1>Stop Missed Renewals With <span class="hi">D-7, D-6, D-3, D-2, D-1 &amp; Weekly</span> Direct Links</h1>
      <p class="lead">Every member enquiry is logged 24/7, direct payment links go out automatically before expiry, and reminders stop the second payment is confirmed.</p>
    </div>
    <div class="grid-2">
      <div>
        <div class="card accent" style="margin-bottom:22px">
          <div class="k-lbl">MITIGATING RENEWAL DROP-OFFS</div>
          <div class="k-desc">Even when trainers are busy coaching, no expiring member gets forgotten &mdash; and paid members never receive awkward duplicate follow-up messages.</div>
        </div>
        <div class="card">
          <div class="k-lbl">CLEAN WEEKLY FOLLOW-UP UNTIL PAID</div>
          <div class="k-desc">Direct 1-tap UPI checkout keeps renewals effortless for every member directly inside WhatsApp.</div>
        </div>
      </div>
      <div class="shot-frame">
        <img src="${shots.renewals}" alt="Automated Renewal Console">
        <div class="shot-cap">SYSTEM 02: 24/7 Message Recorder + Automated Renewal Cadence</div>
      </div>
    </div>`,

    // 04: Solution 03 - Existing CCTV Head-Tracking (Live IN/OUT + Desk Alert)
    `
    <div>
      <div class="pill">04 / SOLUTION 03 &mdash; EXISTING CCTV HEAD-TRACKING SOFTWARE</div>
      <h1>Live Crowd Meter On Your Site &amp; <span class="hi">Overdue Alerts From Current CCTV</span></h1>
      <p class="lead">No expensive new gate hardware &mdash; software connects directly to your existing CCTV cameras.</p>
    </div>
    <div class="grid-2">
      <div>
        <div class="card accent" style="margin-bottom:22px">
          <div class="k-lbl">LIVE FLOOR COUNT SYNCED TO WEBSITE</div>
          <div class="k-desc">Tracks people walking IN &amp; OUT automatically so members know floor busyness around the 6&ndash;8 PM evening rush before visiting.</div>
        </div>
        <div class="card">
          <div class="k-lbl">PROTECTING UNCOLLECTED SUBSCRIPTIONS</div>
          <div class="k-desc">Notifies the front desk cleanly if an expired profile enters during peak hours so renewals don&rsquo;t slip unnoticed.</div>
        </div>
      </div>
      <div class="shot-frame">
        <img src="${shots.gate}" alt="Existing CCTV Head-Tracking">
        <div class="shot-cap">SYSTEM 03: Live Floor Occupancy + Front-Desk Overdue Notification</div>
      </div>
    </div>`,

    // 05: Solution 04 - Supplement Store (10-Min Delivery OR 5km SEO) + Workout Builder + Mobile Switchboard
    `
    <div>
      <div class="pill">05 / SOLUTIONS 04 &amp; 05 &mdash; SUPPLEMENT STORE, 5KM SEO &amp; MOBILE CONTROL</div>
      <h1>10-Min Supplement Delivery, <span class="hi">Workout Plans</span> &amp; Phone Control Board</h1>
    </div>
    <div class="grid-2">
      <div>
        <div class="card accent" style="margin-bottom:22px">
          <div class="k-lbl">ONLINE SUPPLEMENT SETS OR 5KM GOOGLE MAPS SEO</div>
          <div class="k-desc">Turn your low-price supplement edge into online bundle orders with 10-min delivery &amp; 6-digit OTP verification &mdash; or boost Google Maps reviews &amp; nearby 5km walk-in leads.</div>
        </div>
        <div class="card">
          <div class="k-lbl">INDOOR + OUTDOOR WORKOUTS &amp; MOBILE SWITCHBOARD</div>
          <div class="k-desc">Deliver structured Indoor &amp; Outdoor routines paired with your supplement stacks, and control every automation from your phone or laptop anywhere.</div>
        </div>
      </div>
      <div class="shot-frame">
        <img src="${shots.store}" alt="Supplement Store & 3D Checkout">
        <div class="shot-cap">SYSTEMS 04 &amp; 05: Online Supplement Checkout + Mobile Master Control</div>
      </div>
    </div>`,

    // 06: Direct Collaborative Closing Question (NO prices, NO offers)
    `
    <div>
      <div class="pill">06 / LET&rsquo;S BUILD EXACTLY WHAT VELOCITY NEEDS</div>
      <h1>Can Anything Else Be Fixed Or Automated<br><span class="hi">To Double Your Sales?</span> I Can Build It.</h1>
      <p class="lead">Let&rsquo;s look at your current flow together &mdash; whether it&rsquo;s the 3D gym walkthrough, automated billing, CCTV tracking, supplement delivery, or any custom tool.</p>
    </div>
    <div class="grid-equal">
      <div class="card accent" style="display:flex;flex-direction:column;justify-content:center">
        <div class="k-lbl">CUSTOM BUILT AROUND VELOCITY</div>
        <div class="k-val">Tell Me What Else Needs Fixing</div>
        <div class="k-desc">We can test everything live on your real workflow first &mdash; if anything doesn&rsquo;t work cleanly as promised, 100% refund guaranteed.</div>
      </div>
      <div class="card" style="display:flex;flex-direction:column;justify-content:center">
        <div class="k-lbl">TALK DIRECTLY WITH KOUSHIK</div>
        <div class="k-val" style="color:#f5f5f0">Koushik Sirivella</div>
        <div class="k-desc">
          3D Portfolio &amp; Agency: <b style="color:#c0fe04">www.understone.in</b><br>
          Phone / WhatsApp: <b style="color:#c0fe04">+91 81254 81616</b><br>
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
          <span><b>VELOCITY FITNESS &middot; NANDIGAMA</b> &middot; CUSTOM 3D &amp; AUTOMATION BRIEF</span>
          <span>KOUSHIK SIRIVELLA &middot; SLIDE 0${i + 1} / 0${slides.length}</span>
        </div>
        ${slides[i]}
        <div class="footer">
          <span><b>www.understone.in</b> &middot; +91 81254 81616 &middot; koushiksirivella@gmail.com</span>
          <span>CUSTOM BUILT FOR VELOCITY FITNESS &middot; 100% WORKING GUARANTEE</span>
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
  console.log(`ok  built updated 3D/no-price MP4 video  -> ${MP4_OUT}`);
  console.log(`ok  copied updated 3D/no-price MP4 video -> ${MP4_DOWNLOADS}`);
});
