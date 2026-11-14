/* ============================================================
   chrome.js — procedural miniature product UI.

   The plates read empty because a gradient rectangle is not
   content. The reference fills its media with small, dense,
   legible app chrome: segmented controls, transport bars, layer
   rows, property sliders, a sidebar. That density IS the texture.

   Everything here is drawn from our own markup + tokens. Nothing
   is loaded, nothing is traced. Motion rides silk.onFrame only.
   ============================================================ */
(function () {
  'use strict';
  var silk = window.silk;
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function h(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function add(p, tag, cls, txt) { var e = h(tag, cls, txt); p.appendChild(e); return e; }

  var live = [];   /* things the shared raf nudges */

  /* ---------- 1. segmented control over an open stage ---------- */
  function segments(root) {
    var st = add(root, 'div', 'ch ch--center');

    /* a dropped asset pinned in the corner, the way the reference does it */
    var chip = add(st, 'div', 'ch-chip');
    add(chip, 'i', 'ch-chip__m');
    var ct = add(chip, 'div', 'ch-chip__t');
    add(ct, 'b', null, 'reel-04.mov');
    add(ct, 'span', null, '1.2 GB');

    var seg = add(st, 'div', 'ch-seg');
    ['Footage', 'Stills', 'Audio'].forEach(function (t, i) {
      add(seg, 'span', 'ch-seg__i' + (i === 0 ? ' is-on' : ''), t);
    });
    var badge = add(st, 'div', 'ch-drop');
    add(badge, 'span', 'ch-drop__k', 'Drop anything');
    add(badge, 'span', 'ch-drop__v', 'mp4   mov   wav   png');

    /* an ingest list along the floor so the plate is not half empty */
    var list = add(st, 'div', 'ch-ing');
    [['a-cam_0416', '00:04:12'], ['b-cam_0417', '00:09:03'], ['room-tone', '00:15:20']].forEach(function (r, i) {
      var row = add(list, 'div', 'ch-ing__r');
      add(row, 'i', 'ch-ing__d');
      add(row, 'span', 'ch-ing__n', r[0]);
      add(row, 'span', 'ch-ing__v', r[1]);
      row.style.setProperty('--i', i);
    });
    live.push({ kind: 'seg', root: seg, n: 3 });
  }

  /* ---------- 2. transport + layer rows + filmstrip ---------- */
  function player(root) {
    var st = add(root, 'div', 'ch ch--pad');
    var bar = add(st, 'div', 'ch-bar');
    add(bar, 'span', 'ch-bar__play');
    add(bar, 'span', 'ch-bar__tc', '00:01.25 / 00:12');
    var d = add(bar, 'span', 'ch-bar__dur');
    add(d, 'i', null, 'Dur');
    add(d, 'b', null, '5s');
    add(d, 'i', null, 'sec');

    var rule = add(st, 'div', 'ch-rule');
    add(rule, 'span', 'ch-rule__l', '0s');
    var ticks = add(rule, 'div', 'ch-rule__t');
    for (var i = 0; i < 15; i++) add(ticks, 'i', i % 7 === 0 ? 'is-big' : null);
    add(rule, 'span', 'ch-rule__l', '1s');

    var rows = [['T', 'Title card', 0.62], ['▣', 'Carousel', 0.44], ['♪', 'Room tone', 0.30]];
    rows.forEach(function (r, i) {
      var row = add(st, 'div', 'ch-row');
      add(row, 'span', 'ch-row__ic', r[0]);
      add(row, 'span', 'ch-row__n', r[1]);
      var t = add(row, 'span', 'ch-row__t');
      add(t, 'i', null).style.width = (r[2] * 100) + '%';
      row.style.setProperty('--i', i);
    });

    var film = add(st, 'div', 'ch-film');
    for (var j = 0; j < 12; j++) {
      add(film, 'i', null).style.setProperty('--o', (0.10 + ((j * 37) % 11) / 11 * 0.24).toFixed(3));
    }
    live.push({ kind: 'play', head: add(st, 'span', 'ch-head'), t: 0.2 });
  }

  /* ---------- 3. asset grid + property sliders ---------- */
  function props(root) {
    var st = add(root, 'div', 'ch ch--pad');
    var hd = add(st, 'div', 'ch-hd');
    var hl = add(hd, 'div', 'ch-hd__l');
    add(hl, 'b', null, 'Carousel');
    add(hl, 'span', null, 'Up to 20 assets');
    var hr = add(hd, 'div', 'ch-hd__r');
    add(hr, 'i', 'ch-ico');
    add(hr, 'i', 'ch-ico');

    var g = add(st, 'div', 'ch-grid');
    for (var i = 0; i < 6; i++) {
      var cell = add(g, 'div', 'ch-grid__c' + (i === 0 ? ' is-add' : ''));
      if (i === 0) add(cell, 'span', null, '+');
      else cell.style.setProperty('--o', (0.12 + ((i * 53) % 9) / 9 * 0.26).toFixed(3));
    }
    var btns = add(st, 'div', 'ch-btns');
    add(btns, 'span', 'ch-btn', 'Manage');
    add(btns, 'span', 'ch-btn', 'Remove BG');

    [['Rotation', 73], ['Spacing', 38], ['Tilt', 61]].forEach(function (r, i) {
      var row = add(st, 'div', 'ch-sl');
      add(row, 'span', 'ch-sl__f', null).style.width = r[1] + '%';
      var lab = add(row, 'span', 'ch-sl__lab');
      add(lab, 'b', null, r[0]);
      add(lab, 'i', null, r[1] + '/100');
      add(row, 'span', 'ch-sl__k' + (i === 0 ? ' is-on' : ''));
    });
  }

  /* ---------- 4. full app shell: sidebar + content ---------- */
  function app(root) {
    var st = add(root, 'div', 'ch ch--app');
    var sb = add(st, 'aside', 'ch-sb');
    add(sb, 'div', 'ch-sb__logo', 'Cutroom');
    var groups = [
      ['Home', ['Explore', 'Saved']],
      ['Workspace', ['My files', 'Projects', 'Brand kit']],
      ['Community', ['Templates', 'Blocks', 'By studios']],
      ['Resources', ['Learn', 'Changelog']]
    ];
    groups.forEach(function (g) {
      add(sb, 'div', 'ch-sb__h', g[0]);
      g[1].forEach(function (it) {
        var a = add(sb, 'div', 'ch-sb__i' + (it === 'Brand kit' ? ' is-on' : ''));
        add(a, 'i', 'ch-sb__d');
        add(a, 'span', null, it);
      });
    });
    var me = add(sb, 'div', 'ch-sb__me');
    add(me, 'i', 'ch-sb__av');
    var mt = add(me, 'div', 'ch-sb__mt');
    add(mt, 'b', null, 'Studio seat');
    add(mt, 'span', null, 'Team plan');

    var cn = add(st, 'div', 'ch-cn');
    add(cn, 'div', 'ch-cn__crumb', 'Brand kit');
    var names = [['Grain wash', 'Text bleed', 'Split frame'], ['Cold open', 'Lower third', 'End card']];
    [['Saved blocks', 'Start from a block'], ['Templates', 'Start from a template']].forEach(function (sec, s) {
      var hd = add(cn, 'div', 'ch-cn__h');
      add(hd, 'b', null, sec[0]);
      add(hd, 'span', null, sec[1]);
      var row = add(cn, 'div', 'ch-cn__row');
      for (var i = 0; i < 3; i++) {
        var c = add(row, 'div', 'ch-cn__c');
        add(c, 'i', 'ch-cn__m').style.setProperty('--o', (0.12 + ((i * 41 + s * 13) % 7) / 7 * 0.26).toFixed(3));
        var l = add(c, 'div', 'ch-cn__l');
        add(l, 'b', null, names[s][i]);
        add(l, 'span', null, 'Cutroom studio');
      }
    });
  }

  /* ---------- 5. export queue ---------- */
  function queue(root) {
    var st = add(root, 'div', 'ch ch--pad');
    add(st, 'div', 'ch-qh', 'Render queue');
    [['Master  1080p', 100], ['Vertical  9:16', 74], ['Square  1:1', 46],
     ['Square  4:5', 33], ['Preview  ProRes', 21], ['GIF  loop', 8]].forEach(function (r, i) {
      var row = add(st, 'div', 'ch-q');
      add(row, 'span', 'ch-q__n', r[0]);
      var t = add(row, 'span', 'ch-q__t');
      add(t, 'i', null).style.width = r[1] + '%';
      add(row, 'span', 'ch-q__p', r[1] === 100 ? 'done' : r[1] + '%');
      row.style.setProperty('--i', i);
    });

    /* who is watching, and the running total — fills the floor */
    var ft = add(st, 'div', 'ch-qf');
    var who = add(ft, 'div', 'ch-qf__who');
    for (var a = 0; a < 3; a++) add(who, 'i', 'ch-qf__av').style.setProperty('--i', a);
    add(ft, 'span', 'ch-qf__n', '3 editors live');
    add(ft, 'span', 'ch-qf__t', '6 outputs');
  }

  var MODES = { segments: segments, player: player, props: props, app: app, queue: queue };

  function build(node) {
    if (node.querySelector('.ch')) return;
    var m = node.getAttribute('data-chrome');
    if (MODES[m]) { MODES[m](node); node.classList.add('has-chrome'); }
  }
  function buildAll() { document.querySelectorAll('[data-chrome]').forEach(build); }

  /* one shared raf; no rAF of our own, no scroll listener */
  if (silk && silk.onFrame && !RM) {
    var t = 0;
    silk.onFrame(function (dt) {
      t += dt;
      for (var i = 0; i < live.length; i++) {
        var L = live[i];
        if (L.kind === 'seg') {
          var k = Math.floor((t * 0.45 + i) % L.n);
          var kids = L.root.children;
          for (var j = 0; j < kids.length; j++) kids[j].classList.toggle('is-on', j === k);
        } else if (L.kind === 'play') {
          L.head.style.setProperty('--u', (((t * 0.10) + L.t) % 1).toFixed(4));
        }
      }
    });
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(buildAll);
  buildAll();
  window.silkChrome = buildAll;
}());
