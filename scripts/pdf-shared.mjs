// Shared Puppeteer capture & A4 print stylesheet for Understone AI Automation PDFs
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import puppeteer from 'puppeteer';

export function toDataUri(filePath) {
  const b64 = readFileSync(filePath).toString('base64');
  return `data:image/png;base64,${b64}`;
}

export async function withAppSession(rootDir, port, task) {
  const base = `http://127.0.0.1:${port}`;
  const shotDir = join(rootDir, 'temporary screenshots');
  mkdirSync(shotDir, { recursive: true });

  const server = spawn(process.execPath, [join(rootDir, 'serve.mjs')], {
    env: { ...process.env, PORT: String(port) },
    stdio: 'ignore',
  });

  async function waitForServer() {
    for (let i = 0; i < 40; i++) {
      try {
        if ((await fetch(`${base}/pitch/`)).ok) return;
      } catch { /* wait */ }
      await new Promise((r) => setTimeout(r, 150));
    }
    throw new Error('Local server did not start');
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

    const capture = async (file, hash) => {
      if (hash) {
        await page.evaluate((h) => { location.hash = h; }, hash);
        await new Promise((r) => setTimeout(r, 650));
      }
      const out = join(shotDir, file);
      await page.screenshot({ path: out });
      return toDataUri(out);
    };

    const safeGoto = async (url, waitUntil = 'domcontentloaded') => {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          return await page.goto(url, { waitUntil });
        } catch (err) {
          if (attempt === 3 || !/ERR_ABORTED|ERR_CONNECTION/i.test(err.message)) throw err;
          await new Promise((r) => setTimeout(r, 400));
        }
      }
    };

    await safeGoto(`${base}/admin/`, 'domcontentloaded');
    await page.waitForSelector('#view .table tbody tr');
    await new Promise((r) => setTimeout(r, 700));
    const shots = {
      renewals: await capture('pdf-renewals.png'),
      agent: await capture('pdf-agent.png', '#/agent'),
      gate: await capture('pdf-gate.png', '#/gate'),
      leads: await capture('pdf-leads.png', '#/leads'),
    };

    await safeGoto(`${base}/store/`, 'domcontentloaded');
    await new Promise((r) => setTimeout(r, 950));
    shots.store = await capture('pdf-store.png');

    await safeGoto(`${base}/pitch/`, 'domcontentloaded');
    await new Promise((r) => setTimeout(r, 600));
    shots.pitch = await capture('pdf-pitch.png');

    if (errors.length) {
      throw new Error(`Console/page errors detected:\n${errors.join('\n')}`);
    }

    return await task({ browser, page, base, shotDir, shots });
  } finally {
    await browser?.close();
    server.kill();
  }
}

export function basePdfCss(base) {
  return `
  @font-face {
    font-family: 'Figtree';
    src: url('${base}/assets/fonts/TikTokSans.ttf') format('truetype');
    font-weight: 100 900;
  }
  @font-face {
    font-family: 'IBM Plex Mono';
    src: url('${base}/assets/fonts/GeistMono.ttf') format('truetype');
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
    padding: 12mm 14mm 11mm;
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
    padding-bottom: 6px;
    border-bottom: 1.5px solid #121414;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 8.2pt;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .top-bar .muted { color: #666; }
  .tag-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
    margin-bottom: 7px;
  }
  .pill-black {
    background: #121414;
    color: #c0fe04;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 7.5pt;
    font-weight: 700;
    padding: 4px 10px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .part-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 8pt;
    font-weight: 700;
    color: #b84a00;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-top: 7px;
    margin-bottom: 3px;
  }
  h1 {
    font-size: 20.5pt;
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.02em;
    color: #111;
  }
  h1 .accent { color: #b84a00; }
  .sublead {
    font-size: 9.4pt;
    color: #444;
    line-height: 1.4;
    margin-top: 4px;
    margin-bottom: 9px;
  }
  .shot-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin-bottom: 9px; }
  .shot-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 9px; }
  .shot-box { border: 1px solid #222; background: #0d1010; overflow: hidden; }
  .shot-box img { width: 100%; height: 124px; object-fit: cover; object-position: top left; display: block; }
  .shot-cap {
    background: #121414;
    color: #fff;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 7.1pt;
    padding: 4px 7px;
    letter-spacing: 0.02em;
  }
  .shot-cap b { color: #c0fe04; }
  .compare-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin-bottom: 9px; }
  .compare-card { border: 1px solid #d4d4d0; padding: 9px 11px; background: #fafaf7; }
  .compare-card.good { border: 1.5px solid #121414; background: #f5f9e8; }
  .compare-head {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 7.8pt;
    font-weight: 700;
    text-transform: uppercase;
    padding-bottom: 5px;
    margin-bottom: 6px;
    border-bottom: 1px solid #ddd;
  }
  .compare-item { margin-bottom: 5.5px; font-size: 8.3pt; line-height: 1.35; color: #333; }
  .compare-item > b:first-child { color: #111; display: block; margin-bottom: 1px; }
  .compare-item b { color: #111; }
  .summary-banner {
    background: #101212;
    color: #ffffff;
    padding: 12px 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
    border-left: 5px solid #c0fe04;
  }
  .summary-banner h3 { font-size: 12.8pt; font-weight: 800; margin: 3px 0 5px; }
  .summary-banner ul { list-style: none; font-size: 8.2pt; line-height: 1.46; color: #d8d8d8; }
  .val-box {
    border: 1px solid #333;
    background: #181c1c;
    padding: 10px 14px;
    text-align: center;
    min-width: 190px;
  }
  .val-big {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 18pt;
    font-weight: 800;
    color: #c0fe04;
    line-height: 1.1;
    margin: 3px 0;
  }
  .val-note { font-family: 'IBM Plex Mono', monospace; font-size: 7pt; color: #d4d4d8; text-transform: uppercase; line-height: 1.35; }
  .spec-table { width: 100%; border-collapse: collapse; margin-bottom: 9px; font-size: 8.3pt; }
  .spec-table th {
    background: #121414;
    color: #fff;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 7.3pt;
    text-transform: uppercase;
    padding: 6.5px 8px;
    text-align: left;
  }
  .spec-table td { padding: 6.5px 8px; border-bottom: 1px solid #e2e2de; vertical-align: top; line-height: 1.33; }
  .spec-table tr:nth-child(even) td { background: #f8f8f5; }
  .steps-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 7px 0 9px; }
  .step-box { border: 1px solid #222; padding: 8px 9px; background: #fafaf7; }
  .step-box .s-num { font-family: 'IBM Plex Mono', monospace; font-size: 7.2pt; font-weight: 700; color: #b84a00; margin-bottom: 2px; }
  .step-box h4 { font-size: 9pt; font-weight: 800; margin-bottom: 3px; }
  .step-box p { font-size: 7.8pt; color: #444; line-height: 1.33; }
  .sign-box { border: 1.5px solid #121414; display: grid; grid-template-columns: 1.15fr 0.85fr; }
  .sign-head {
    grid-column: 1 / -1;
    background: #121414;
    color: #fff;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 7.6pt;
    font-weight: 700;
    padding: 6px 11px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .sign-col { padding: 9px 11px; font-size: 8.2pt; line-height: 1.44; }
  .sign-col + .sign-col { border-left: 1px solid #ddd; }
  .kpi-row-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 9px; }
  .kpi-card { border: 1.5px solid #121414; padding: 8px 9px; background: #fafaf7; }
  .kpi-card.dark { background: #101212; color: #fff; }
  .kpi-lbl { font-family: 'IBM Plex Mono', monospace; font-size: 7pt; color: #666; text-transform: uppercase; }
  .kpi-card.dark .kpi-lbl { color: #c0fe04; }
  .kpi-val { font-family: 'IBM Plex Mono', monospace; font-size: 13pt; font-weight: 800; margin: 2px 0; }
  .kpi-sub { font-size: 7.5pt; color: #555; line-height: 1.3; }
  .kpi-card.dark .kpi-sub { color: #d4d4d8; }
  .foot-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 6px;
    border-top: 1px solid #ccc;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 7.3pt;
    color: #666;
  }
  .foot-bar b { color: #111; }
  `;
}
