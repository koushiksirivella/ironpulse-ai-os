/* =========================================================================
   UNDERSTONE AI AUTOMATION (https://www.understone.in/)
   IRONPULSE AI OS™ — Autonomous Gym Revenue, AI Vision & 10-Min Store
   Contact: +91 81254 81616 · koushiksirivella@gmail.com
   ========================================================================= */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* 1. Haoqi Architectural Blueprint Grid + Intersection Crosshairs */
  function drawBlueprint() {
    var svg = $('#blueprint');
    if (!svg) return;
    var w = window.innerWidth;
    var h = window.innerHeight;
    var pad = w >= 1024 ? 56.5 : 20.5;
    var xs = [];
    for (var i = 0; i < 4; i++) {
      xs.push(Math.round(pad + (w - pad * 2) * (i / 3)) + 0.5);
    }
    var ys = [Math.round(h * 0.34) + 0.5, Math.round(h * 0.68) + 0.5];
    var G = 12;
    var M = 6;

    var vert = '', horiz = '', mark = '';
    xs.forEach(function (x) {
      var segs = [0].concat(ys.map(function (y) { return y - G; }));
      var ends = ys.map(function (y) { return y + G; }).concat([h]);
      for (var k = 0; k < segs.length; k++) vert += 'M' + x + ' ' + segs[k] + 'V' + ends[k];
    });
    ys.forEach(function (y) {
      var segs = [0].concat(xs.map(function (x) { return x + G; }));
      var ends = xs.map(function (x) { return x - G; }).concat([w]);
      for (var k = 0; k < segs.length; k++) horiz += 'M' + segs[k] + ' ' + y + 'H' + ends[k];
    });
    xs.forEach(function (x) {
      ys.forEach(function (y) {
        mark += 'M' + x + ' ' + (y - M) + 'V' + (y + M) + 'M' + (x - M) + ' ' + y + 'H' + (x + M);
      });
    });

    var isLight = document.documentElement.classList.contains('light');
    var lineStroke = isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.06)';
    var markStroke = isLight ? 'rgba(0,0,0,0.35)' : 'rgba(192,254,4,0.42)';

    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.innerHTML =
      '<path d="' + vert + horiz + '" stroke="' + lineStroke + '" stroke-width="1" fill="none"/>' +
      '<path d="' + mark + '" stroke="' + markStroke + '" stroke-width="1" fill="none"/>';
  }
  drawBlueprint();
  window.addEventListener('resize', drawBlueprint);

  /* 2. Cursor Coordinates Readout */
  var coordsEl = $('#coords');
  window.addEventListener('pointermove', function (e) {
    if (!coordsEl) return;
    var x = String(e.clientX | 0).padStart(4, '0');
    var y = String(e.clientY | 0).padStart(4, '0');
    coordsEl.textContent = x + ' X ' + y + ' Y';
  }, { passive: true });

  /* 3. Theme Switcher */
  var themeBtn = $('#theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var html = document.documentElement;
      var toLight = !html.classList.contains('light');
      html.classList.toggle('light', toLight);
      html.classList.toggle('dark', !toLight);
      themeBtn.textContent = toLight ? 'THEME[LIGHT]' : 'THEME[DARK]';
      drawBlueprint();
    });
  }

  /* 4. Interactive 4-Step Simulator */
  var simScreen = $('#sim-screen');
  var simSteps = $$('.sim-step');
  var simFloorCount = 38;

  var SIM_VIEWS = {
    step1: function () {
      return (
        '<div>' +
          '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:14px">' +
            '<span class="sim-badge">24/7 AI AGENT + MESSAGE RECORDER</span>' +
            '<span class="mono-2" style="font-size:12px;color:#c0fe04">LATENCY: 1.1S &middot; RECORDED LOG #MSG-901</span>' +
          '</div>' +
          '<div style="border:1px solid rgba(255,255,255,0.14);padding:12px;background:#111515;margin-bottom:10px;font-size:13px">' +
            '<div class="mono-2" style="font-size:11px;color:rgba(255,255,255,0.6);margin-bottom:4px">INBOUND MEMBER MESSAGE (RECORDED ON WHATSAPP)</div>' +
            '<div>&ldquo;Bro my plan expires in 2 days, send me the direct UPI link and also give me this week&rsquo;s indoor + outdoor workout plan.&rdquo;</div>' +
          '</div>' +
          '<pre class="mono" style="white-space:pre-wrap;font-size:12px;line-height:1.5;background:#162012;border:1px solid #c0fe04;padding:12px;color:#eaffb0;margin-bottom:12px">' +
            '[24/7 AI COACH AUTO-REPLY SENT IN 1.1s]\n' +
            '• Indoor Split (Mon/Tue/Thu/Fri): Barbell Squat 4x6 + RDL 3x10 + Sled Push\n' +
            '• Outdoor Plan (Wed/Sat): 6x200m Track Tempo + Calisthenics EMOM\n' +
            '• Complete Pro Muscle Supplement Set (10-Min Delivery): /store/#s-shop\n' +
            '• Direct 1-Tap Renewal Link (₹4,500): https://ironpulse.os/pay/ip-m101' +
          '</pre>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.12)">' +
          '<a class="btn-outline" href="../admin/?demo=1#/agent" style="padding:0.5rem 0.9rem;font-size:0.74rem;color:#fff">Open 24/7 Agent Builder &#8599;</a>' +
          '<button type="button" class="btn-volt" data-goto-sim="step2" style="padding:0.55rem 1rem;font-size:0.75rem">Step 2: D-7..D-1 Direct Pay Links &rarr;</button>' +
        '</div>'
      );
    },
    step2: function () {
      return (
        '<div>' +
          '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:14px">' +
            '<span class="sim-badge">COUNTDOWN &amp; WEEKLY DIRECT PAYMENT LINKS</span>' +
            '<span class="mono-2" style="font-size:12px;color:#c0fe04">AUTO-SUPPRESSED ONCE PAID</span>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;font-size:12px;margin-bottom:12px" class="mono-2">' +
            '<div style="padding:10px;border:1px solid #10b981;color:#10b981">D-7: DIRECT LINK ✓✓</div>' +
            '<div style="padding:10px;border:1px solid #10b981;color:#10b981">D-6: DIRECT LINK ✓✓</div>' +
            '<div style="padding:10px;border:1px solid #10b981;color:#10b981">D-3: DIRECT LINK ✓✓</div>' +
            '<div style="padding:10px;border:1px solid #c0fe04;color:#c0fe04">D-2: SENT TODAY ✓✓</div>' +
            '<div style="padding:10px;border:1px solid rgba(255,255,255,0.2)">D-1: QUEUED (24H)</div>' +
            '<div style="padding:10px;border:1px solid #ff6b6b;color:#ff6b6b">WEEKLY: UNTIL PAID</div>' +
          '</div>' +
          '<div style="padding:12px;border:1px solid #10b981;background:rgba(16,185,129,0.09);font-size:13px">' +
            '<strong style="color:#10b981">✓ Instant Payment Verification:</strong> The moment the member pays via their direct UPI link, the system extends their membership +90 days and suppresses all remaining countdown &amp; weekly messages.' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.12)">' +
          '<a class="btn-outline" href="../admin/?demo=1#/renewals" style="padding:0.5rem 0.9rem;font-size:0.74rem;color:#fff">Open Renewals Console &#8599;</a>' +
          '<button type="button" class="btn-volt" data-goto-sim="step3" style="padding:0.55rem 1rem;font-size:0.75rem">Step 3: CCTV AI Head-Tracker &rarr;</button>' +
        '</div>'
      );
    },
    step3: function () {
      return (
        '<div>' +
          '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:14px">' +
            '<span class="sim-badge">CCTV CAMERA AI HEAD-TRACKING SOFTWARE</span>' +
            '<span class="mono" style="font-size:13px;font-weight:700;color:#c0fe04">LIVE ON FLOOR: ' + simFloorCount + ' / 60 (' + Math.round((simFloorCount / 60) * 100) + '%)</span>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;font-size:12.5px">' +
            '<div style="padding:12px;border:1.5px solid #c0fe04;background:#101610">' +
              '<div class="mono-2" style="color:#c0fe04;font-size:11px">CAM-01 // HEAD-BOX #HT-101 [IN]</div>' +
              '<div style="font-weight:700;margin-top:4px">Aarav Reddy (IP-M101)</div>' +
              '<div style="color:rgba(255,255,255,0.68)">Tracked IN &rarr; Live 3D Website +1</div>' +
            '</div>' +
            '<div style="padding:12px;border:1.5px solid #ff5b5b;background:rgba(255,59,48,0.12)">' +
              '<div class="mono-2" style="color:#ff8080;font-size:11px">CAM-01 // HEAD-BOX #HT-103 [ALERT]</div>' +
              '<div style="font-weight:700;margin-top:4px">Vikram Varma (IP-M103)</div>' +
              '<div style="color:#ffb4a2">4d Overdue &rarr; Front Desk Alerted</div>' +
            '</div>' +
          '</div>' +
          '<div style="font-size:12.5px;color:rgba(255,255,255,0.72)">Connects directly to your existing Hikvision / CP Plus / Dahua CCTV cameras — whenever someone walks IN or OUT, it updates your live website crowd meter automatically.</div>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.12)">' +
          '<button type="button" class="btn-outline" id="btn-sim-checkin" style="padding:0.5rem 0.9rem;font-size:0.74rem;color:#fff">+ Simulate Camera Head-Track IN</button>' +
          '<button type="button" class="btn-volt" data-goto-sim="step4" style="padding:0.55rem 1rem;font-size:0.75rem">Step 4: 10-Min Store &amp; SEO &rarr;</button>' +
        '</div>'
      );
    },
    step4: function () {
      return (
        '<div>' +
          '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:14px">' +
            '<span class="sim-badge">10-MIN SUPPLEMENT SETS + NEARBY LOCAL SEO</span>' +
            '<span class="mono-2" style="font-size:12px;color:#10b981">6-DIGIT OTP TRACKING + 5KM SEO RADAR</span>' +
          '</div>' +
          '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;font-size:13px">' +
            '<div style="padding:10px 12px;border:1px solid #c0fe04;background:#141818;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">' +
              '<div><strong>Pro Muscle Complete Set</strong> (Whey Isolate + Creatine + Pre) &middot; <strong>&#8377;7,499</strong></div>' +
              '<span class="mono-2" style="color:#c0fe04">10-MIN DELIVERY &middot; OTP #482910</span>' +
            '</div>' +
            '<div style="padding:10px 12px;border:1px solid rgba(255,255,255,0.14);background:#141818;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">' +
              '<div><strong>Nearby Local SEO Radar (5km Radius)</strong> &middot; 6,100+ monthly searches captured</div>' +
              '<span class="mono-2" style="color:#10b981">126 NEARBY LEADS RECORDED</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.12)">' +
          '<a class="btn-outline" href="../store/" target="_blank" rel="noopener" style="padding:0.5rem 0.9rem;font-size:0.74rem;color:#fff">Open 3D Supplement Store &#8599;</a>' +
          '<a class="btn-volt" href="../admin/?demo=1#/leads" style="padding:0.55rem 1rem;font-size:0.75rem">Open Mobile/Laptop Command &#8599;</a>' +
        '</div>'
      );
    }
  };

  function setSimStep(key) {
    simSteps.forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-sim') === key);
    });
    if (simScreen && SIM_VIEWS[key]) {
      simScreen.innerHTML = SIM_VIEWS[key]();
      var nextBtn = simScreen.querySelector('[data-goto-sim]');
      if (nextBtn) {
        nextBtn.addEventListener('click', function () {
          setSimStep(nextBtn.getAttribute('data-goto-sim'));
        });
      }
      var checkinBtn = simScreen.querySelector('#btn-sim-checkin');
      if (checkinBtn) {
        checkinBtn.addEventListener('click', function () {
          simFloorCount = Math.min(60, simFloorCount + 1);
          var hud = $('#hud-occupancy');
          if (hud) hud.textContent = simFloorCount + ' / 60 IN NOW';
          setSimStep('step3');
        });
      }
    }
  }

  simSteps.forEach(function (btn) {
    btn.addEventListener('click', function () {
      setSimStep(btn.getAttribute('data-sim'));
    });
  });
  setSimStep('step1');

  /* 5. Live ROI & Revenue Leakage Calculator */
  var inpN = $('#inp-n');
  var inpM = $('#inp-m');
  var inpR0 = $('#inp-r0');
  var inpR1 = $('#inp-r1');
  var inpC = $('#inp-c');

  function fmtInr(num) {
    return '₹' + Math.round(num).toLocaleString('en-IN');
  }

  function updateRoi() {
    if (!inpN) return;
    var n = Number(inpN.value);
    var m = Number(inpM.value);
    var r0 = Number(inpR0.value);
    var r1 = Math.max(r0 + 2, Number(inpR1.value));
    var c = Number(inpC.value);
    var hourlyVal = 250;

    $('#val-n').textContent = n + ' members';
    $('#val-m').textContent = fmtInr(m);
    $('#val-r0').textContent = r0 + '%';
    $('#val-r1').textContent = r1 + '%';
    $('#val-c').textContent = c + ' hrs/mo';

    var extraMembers = Math.max(1, Math.round(n * ((r1 - r0) / 100)));
    var monthlyCollections = extraMembers * m;
    var staffSaved = c * hourlyVal;
    var annualTotal = (monthlyCollections + staffSaved) * 12;
    var neededRenewals = Math.max(1, Math.ceil(19999 / m));
    var paybackDays = Math.max(3, Math.round((19999 / (monthlyCollections + staffSaved)) * 30));

    $('#out-members').textContent = '+' + extraMembers + ' renewals/mo';
    $('#out-monthly').textContent = fmtInr(monthlyCollections) + '/mo';
    $('#out-staff').textContent = Math.round(staffSaved).toLocaleString('en-IN');
    $('#out-annual').textContent = fmtInr(annualTotal) + ' / yr';
    $('#out-payback').textContent =
      'Recovering just ' + neededRenewals + ' missed renewals pays off the entire ₹19,999 one-time setup (~' + paybackDays + ' days payback).';
  }

  [inpN, inpM, inpR0, inpR1, inpC].forEach(function (el) {
    if (el) el.addEventListener('input', updateRoi);
  });
  updateRoi();

  /* 6. Scope Builder & WhatsApp Direct Closer (+91 81254 81616) */
  var selectedTier = 'Complete IRONPULSE AI OS (₹19,999 — Full ₹1L Stack)';
  var tierPills = $$('#tier-pills .scope-pill');
  tierPills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      tierPills.forEach(function (p) { p.classList.remove('is-active'); });
      pill.classList.add('is-active');
      selectedTier = pill.getAttribute('data-tier');
    });
  });

  $$('[data-pick-tier]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var t = btn.getAttribute('data-pick-tier');
      selectedTier = t;
      tierPills.forEach(function (p) {
        p.classList.toggle('is-active', p.getAttribute('data-tier').indexOf(t.split(' ')[0]) !== -1);
      });
    });
  });

  var waBtn = $('#btn-wa-send');
  if (waBtn) {
    waBtn.addEventListener('click', function () {
      var gym = ($('#f-gym')?.value || 'My Gym').trim();
      var owner = ($('#f-owner')?.value || 'Gym Owner').trim();
      var members = ($('#f-members')?.value || '300+ active members').trim();
      var goal = ($('#f-goal')?.value || '24/7 AI Agent + D-7..D-1 Links + CCTV Head-Track + 10-Min Store').trim();

      var msg =
        'Hi Koushik (Understone.in), I reviewed the IRONPULSE AI OS™ Gym System.\n\n' +
        '*Selected Package:* ' + selectedTier + '\n' +
        '*Gym & Area:* ' + gym + '\n' +
        '*Contact:* ' + owner + '\n' +
        '*Current Setup:* ' + members + '\n' +
        '*Priority Focus:* ' + goal + '\n\n' +
        'Let\'s activate the Free Trial (backed by the 15-Day 100% Refund Guarantee).';
      window.open('https://wa.me/918125481616?text=' + encodeURIComponent(msg), '_blank', 'noopener');
    });
  }
})();
