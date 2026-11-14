// Generates docs/gym-store-architecture.excalidraw
// Built with the excalidraw-diagram skill. Coordinates planned before JSON:
//
//   ROW 1  A:x30 w260 | gap60 | B:x350 w300 | gap60 | C:x710 w330 | gap60 | D:x1100 w260
//   ROW 2  six step boxes, w200, gap26, from x30 to x1360
//
import { writeFileSync } from 'node:fs';

const els = [];
let n = 0;
const id = (p) => `${p}-${++n}`;

const BASE = {
  angle: 0,
  strokeColor: '#1e1e1e',
  backgroundColor: 'transparent',
  fillStyle: 'solid',
  strokeWidth: 2,
  strokeStyle: 'solid',
  roughness: 1,
  opacity: 100,
  groupIds: [],
  frameId: null,
  roundness: null,
  boundElements: [],
  updated: 1,
  link: null,
  locked: false,
};

function rect(x, y, width, height, stroke, bg, rounded = true) {
  els.push({
    ...BASE,
    id: id('rect'),
    type: 'rectangle',
    x, y, width, height,
    strokeColor: stroke,
    backgroundColor: bg,
    roundness: rounded ? { type: 3 } : null,
  });
}

function text(x, y, width, str, fontSize = 16, color = '#1e1e1e', align = 'center') {
  const lines = str.split('\n').length;
  els.push({
    ...BASE,
    id: id('text'),
    type: 'text',
    x, y, width,
    height: Math.round(lines * fontSize * 1.25),
    strokeColor: color,
    text: str,
    fontSize,
    fontFamily: 1,
    textAlign: align,
    verticalAlign: 'top',
    containerId: null,
    originalText: str,
    lineHeight: 1.25,
  });
}

function arrow(x, y, width, color, dashed = false) {
  els.push({
    ...BASE,
    id: id('arrow'),
    type: 'arrow',
    x, y, width, height: 0,
    strokeColor: color,
    strokeStyle: dashed ? 'dashed' : 'solid',
    points: [[0, 0], [width, 0]],
    lastCommittedPoint: null,
    startBinding: null,
    endBinding: null,
    startArrowhead: null,
    endArrowhead: 'arrow',
  });
}

const BLUE = ['#1971c2', '#e7f5ff', '#d0ebff'];
const YELL = ['#f59f00', '#fff9db', '#ffec99'];
const GREE = ['#2f9e44', '#d3f9d8', '#b2f2bb'];
const PURP = ['#862e9c', '#f3d9fa', '#eebefa'];
const MUTED = '#868e96';
const INK = '#1e1e1e';

// ------------------------------------------------------------------ title
text(30, 20, 1330, 'How Your Gym Store Works', 32, INK);
text(30, 66, 1330,
  'One website serves every gym. Orders land on your phone. You take the money in person.',
  15, MUTED);

// ------------------------------------------------------------------ ROW 1
// Zone A — customer
rect(30, 110, 260, 400, BLUE[0], BLUE[1]);
text(30, 122, 260, 'CUSTOMER', 22, INK);
rect(45, 165, 230, 90, BLUE[0], BLUE[2]);
text(45, 190, 230, 'Opens the site\non a phone', 16, INK);
rect(45, 270, 230, 90, BLUE[0], BLUE[2]);
text(45, 288, 230, 'Adds whey and a\nmembership to\none cart', 16, INK);
rect(45, 375, 230, 90, BLUE[0], BLUE[2]);
text(45, 393, 230, 'Name, phone,\npickup or\ndelivery', 16, INK);
text(45, 478, 230, 'No account. No card.', 13, MUTED);

// Zone B — the website
rect(350, 110, 300, 400, YELL[0], YELL[1]);
text(350, 122, 300, 'THE WEBSITE', 22, INK);
text(350, 150, 300, 'one deploy, every gym', 13, MUTED);
rect(365, 180, 270, 95, YELL[0], YELL[2]);
text(365, 198, 270, 'SKIN\nhow it looks.\nSwapped per gym.', 16, INK);
rect(365, 290, 270, 115, YELL[0], YELL[2]);
text(365, 310, 270, 'ENGINE\ncatalog, cart,\ncheckout.\nKnows no colours.', 16, INK);
text(365, 420, 270, 'Colours and prices come\nfrom the database, never\nfrom the code.', 13, MUTED);

// Zone C — Supabase
rect(710, 110, 330, 400, GREE[0], GREE[1]);
text(710, 122, 330, 'SUPABASE', 22, INK);
text(710, 150, 330, 'Mumbai, ap-south-1', 13, MUTED);
rect(725, 180, 300, 100, GREE[0], GREE[2]);
text(725, 198, 300, 'DATABASE\ngyms, products, orders', 16, INK);
rect(725, 295, 300, 70, GREE[0], GREE[2]);
text(725, 315, 300, 'STORAGE\nproduct photos', 16, INK);
rect(725, 380, 300, 85, GREE[0], '#8ce99a');
text(725, 398, 300, 'MESSENGER\nholds the secret,\nsends the ping', 15, INK);
text(725, 478, 300, 'Security rules: nobody can read your orders.', 13, MUTED);

// Zone D — you
rect(1100, 110, 260, 400, PURP[0], PURP[1]);
text(1100, 122, 260, 'YOU', 22, INK);
rect(1115, 165, 230, 90, PURP[0], PURP[2]);
text(1115, 190, 230, 'Phone buzzes\nwith the order', 16, INK);
rect(1115, 270, 230, 90, PURP[0], PURP[2]);
text(1115, 288, 230, 'Admin panel:\nedit prices,\nsee orders', 16, INK);
rect(1115, 375, 230, 90, PURP[0], PURP[2]);
text(1115, 400, 230, 'Gym hands it over.\nCash in person.', 16, INK);
text(1115, 478, 230, 'You hold the only login.', 13, MUTED);

// Row 1 arrows
arrow(295, 250, 50, BLUE[0]);
text(285, 218, 70, 'taps', 13, MUTED);
arrow(655, 250, 50, YELL[0]);
text(645, 218, 70, 'saves', 13, MUTED);
arrow(1045, 250, 50, GREE[0]);
text(1035, 218, 70, 'pings', 13, MUTED);

// ------------------------------------------------------------------ ROW 2
text(30, 560, 1330, 'What happens the moment someone taps Order', 22, INK);

const steps = [
  ['1. Taps Place Order', BLUE],
  ['2. Engine builds\nthe order', YELL],
  ['3. SAVED to the\ndatabase', GREE],
  ['4. Messenger fires\nautomatically', GREE],
  ['5. Your phone\nbuzzes', PURP],
  ['6. Their WhatsApp\nopens, pre-filled', BLUE],
];

steps.forEach(([label, palette], i) => {
  const x = 30 + i * 226;
  rect(x, 610, 200, 100, palette[0], palette[2]);
  text(x, 640, 200, label, 15, INK);
  if (i < steps.length - 1) arrow(x + 203, 660, 20, '#495057');
});

text(30, 730, 1330,
  'Step 3 happens before step 5 on purpose. If the ping ever fails, the order still exists.',
  15, MUTED);

const doc = {
  type: 'excalidraw',
  version: 2,
  source: 'https://excalidraw.com',
  elements: els,
  appState: { gridSize: null, viewBackgroundColor: '#ffffff' },
  files: {},
};

const out = new URL('./gym-store-architecture.excalidraw', import.meta.url);
writeFileSync(out, JSON.stringify(doc, null, 2));
console.log(`wrote ${els.length} elements to gym-store-architecture.excalidraw`);
