// ===========================================================================
// IRONPULSE AI OS™ — Stable-Signaling Autonomous Gym Operating System
//
// Implements the complete ₹1,00,000 Value-Stack Gym Operating System:
//   1. Renewals  — Membership expiry tracking, D-7 / D-6 / D-3 / D-2 / D-1
//                  + Weekly direct payment link cadence, verified payment
//                  confirmation, and automatic reminder suppression.
//   2. AI Agent  — 24/7 AI Agent Builder + Live Message Recording System,
//                  Complete Indoor + Outdoor Workout & Diet Plan Generator,
//                  and Complete Supplement Set 10-Min Delivery Upsell.
//   3. Live Gate — CCTV AI Head-Tracking Vision Software ("Coming & Going"
//                  IN/OUT counter synced to live 3D website) + expired-member
//                  gate alert for front-desk intervention.
//   4. Leads     — Omni-channel Lead Recorder + Mobile/Laptop Master
//                  Automation Control Center + Nearby Area Local SEO Radar.
//   5. Outreach  — Hyderabad independent gym leads + Fastest Deal-Closing
//                  Playbook (7-Day Free Trial + 15-Day 100% Refund Guarantee).
// ===========================================================================

import { el } from '../engine/dom.js';
import {
  icon, card, cardHead, field, button, toast, modal,
  money, initials, readPhone,
} from './ui.js';
import { barChart, donut } from './charts.js';

const STORAGE_KEY = 'ironpulse_os_state_v2';

const CADENCE_STEPS = [
  { key: 'day_7',    offset: -7, label: '7th Day Before Expiry', tag: 'D-7',  template: '24/7 AI Agent sends 7-day notice + Direct 1-Tap UPI Payment Link' },
  { key: 'day_6',    offset: -6, label: '6th Day Before Expiry', tag: 'D-6',  template: 'Follow-up check-in + Indoor/Outdoor progress recap + Direct Pay Link' },
  { key: 'day_3',    offset: -3, label: '3rd Day Before Expiry', tag: 'D-3',  template: '72-hour slot & coach retention notice + Direct UPI Payment Link' },
  { key: 'day_2',    offset: -2, label: '2nd Day Before Expiry', tag: 'D-2',  template: '48-hour countdown reminder + 1-Tap Renewal & Supplement Set Link' },
  { key: 'day_1',    offset: -1, label: '1st Day Before Expiry', tag: 'D-1',  template: 'Final 24-hour expiry alert + Instant UPI Renewal Link' },
  { key: 'day_0',    offset:  0, label: 'Expiry Day Notice',     tag: 'D-0',  template: 'Membership expires today — direct payment link to keep gate active' },
  { key: 'weekly_1', offset:  7, label: 'Every 1 Week Overdue',  tag: 'WK+1', template: 'Weekly automated direct payment link + reactivation offer until paid' },
];

function initialData() {
  return {
    baseCollectedMonth: 284500,
    capacity: 60,
    autoGate: false,
    renewalFilter: 'all',
    renewalSearch: '',
    leadFilter: 'all',
    outreachFilter: 'all',
    agentGoal: 'Muscle Hypertrophy + Strength',
    agentEnv: 'Complete Indoor + Outdoor Hybrid',
    agentStack: 'Pro Muscle Complete Set (Whey Isolate + Creatine + Pre-Workout · ₹7,499 · 10-Min Delivery)',
    switches: {
      aiAgent24x7: true,
      countdownCadence: true,
      cctvHeadTracking: true,
      tenMinSupplementDelivery: true,
      localSeoRadar: true,
      freeTrial15DayRefund: true,
    },
    recordedMessages: [
      {
        id: 'MSG-901',
        time: 'Just now',
        member: 'Aarav Reddy (IP-M101)',
        phone: '9849011223',
        channel: 'WhatsApp + Voice Note Recorded',
        inbound: '"Bro my plan expires in 2 days, send me the direct UPI link and also give me this week\'s indoor + outdoor workout plan."',
        aiReply: 'Sent D-2 Direct UPI Payment Link (₹4,500) + 5-Day Indoor Barbell / Outdoor Sprint Hybrid Plan + Pro Muscle Supplement Set link (10-min delivery).',
        latency: '1.2s',
        intent: 'D-2_PAY_LINK + WORKOUT_PLAN',
      },
      {
        id: 'MSG-902',
        time: '6 mins ago',
        member: 'Sneha Rao (IP-M102)',
        phone: '9885122334',
        channel: 'WhatsApp Recorded',
        inbound: '"Can I get the Lean Cut Supplement Set delivered to Jubilee Hills Rd 36 right now?"',
        aiReply: 'Dispatched Complete Lean Cut Set (Isolate + L-Carnitine + Electrolytes). Rider assigned — 9 mins ETA with 6-digit OTP handover.',
        latency: '0.9s',
        intent: '10MIN_SUPPLEMENT_DELIVERY',
      },
      {
        id: 'MSG-903',
        time: '14 mins ago',
        member: 'Harsha Vardhan (New Lead)',
        phone: '9849501122',
        channel: 'Google Maps Local SEO Enquiry',
        inbound: '"Searched \'best gym near Madhapur with live crowd meter\'. Is a free trial available today?"',
        aiReply: '24/7 Agent booked 6:30 PM Free Trial Pass, shared live floor occupancy (38/60 on floor), and sent Beginner Indoor+Outdoor starter plan.',
        latency: '1.1s',
        intent: 'LOCAL_SEO_TRIAL_BOOKED',
      },
      {
        id: 'MSG-904',
        time: '29 mins ago',
        member: 'Vikram Varma (IP-M103)',
        phone: '9701233445',
        channel: 'Weekly Direct Link Automation',
        inbound: '[Auto-Trigger: 7-Day Weekly Overdue Cycle] Member scanned at CCTV Gate while 4d overdue.',
        aiReply: 'Sent Weekly Direct Payment Link (₹4,500) on WhatsApp + alerted front-desk reception screen.',
        latency: '0.6s',
        intent: 'WEEKLY_DIRECT_PAY_LINK',
      },
    ],
    seoAreas: [
      { corridor: 'Madhapur & Hitech City (0–3 km)', searches: '1,420 / mo', topKeyword: '"gym near me with personal training"', leadsCaptured: 34, conversion: '38%' },
      { corridor: 'Jubilee Hills & Banjara Hills (2–5 km)', searches: '1,890 / mo', topKeyword: '"luxury strength gym + live crowd"', leadsCaptured: 41, conversion: '44%' },
      { corridor: 'Kondapur & Gachibowli (3–6 km)', searches: '1,610 / mo', topKeyword: '"gym + 10 min supplement delivery"', leadsCaptured: 29, conversion: '35%' },
      { corridor: 'Kukatpally & Manikonda (4–8 km)', searches: '1,180 / mo', topKeyword: '"transformation gym free trial"', leadsCaptured: 22, conversion: '31%' },
    ],
    members: [
      {
        id: 'M-101', code: 'IP-M101', name: 'Aarav Reddy', phone: '9849011223',
        plan: '3 Months Strength + Cardio', durationDays: 90, amount: 4500,
        daysToExpiry: 2, status: 'expiring', paymentStatus: 'pending',
        remindersSuppressed: false, lastReminder: 'D-2 Sent (Direct UPI Link + Workout Plan)',
        lastReminderState: 'delivered', utr: '', insideNow: true, checkInMinsAgo: 34,
      },
      {
        id: 'M-102', code: 'IP-M102', name: 'Sneha Rao', phone: '9885122334',
        plan: '1 Month Pro Access', durationDays: 30, amount: 2200,
        daysToExpiry: 1, status: 'expiring', paymentStatus: 'pending',
        remindersSuppressed: false, lastReminder: 'D-1 Sent (24h Direct Payment Link)',
        lastReminderState: 'sent', utr: '', insideNow: false, checkInMinsAgo: null,
      },
      {
        id: 'M-103', code: 'IP-M103', name: 'Vikram Varma', phone: '9701233445',
        plan: '3 Months Strength + Cardio', durationDays: 90, amount: 4500,
        daysToExpiry: -4, status: 'overdue', paymentStatus: 'overdue',
        remindersSuppressed: false, lastReminder: 'Weekly Direct Pay Link Sent (Unpaid)',
        lastReminderState: 'delivered', utr: '', insideNow: true, checkInMinsAgo: 12,
      },
      {
        id: 'M-104', code: 'IP-M104', name: 'Karthik Nair', phone: '9948344556',
        plan: '6 Months Elite Transformation', durationDays: 180, amount: 8500,
        daysToExpiry: 6, status: 'expiring', paymentStatus: 'pending',
        remindersSuppressed: false, lastReminder: 'D-6 Delivered (Direct Payment Link)',
        lastReminderState: 'delivered', utr: '', insideNow: true, checkInMinsAgo: 51,
      },
      {
        id: 'M-105', code: 'IP-M105', name: 'Priya Deshmukh', phone: '9177455667',
        plan: '1 Month Cardio + Functional', durationDays: 30, amount: 2500,
        daysToExpiry: 3, status: 'expiring', paymentStatus: 'pending',
        remindersSuppressed: false, lastReminder: 'D-3 Delivered (Direct UPI Link)',
        lastReminderState: 'delivered', utr: '', insideNow: false, checkInMinsAgo: null,
      },
      {
        id: 'M-106', code: 'IP-M106', name: 'Rohan Sharma', phone: '9866566778',
        plan: '3 Months Strength + Cardio', durationDays: 90, amount: 4500,
        daysToExpiry: -1, status: 'overdue', paymentStatus: 'pending_review',
        remindersSuppressed: false, lastReminder: 'D-0 Delivered · Unmatched UPI in Queue',
        lastReminderState: 'exception', utr: '', insideNow: false, checkInMinsAgo: null,
      },
      {
        id: 'M-107', code: 'IP-M107', name: 'Ananya Choudhary', phone: '9000677889',
        plan: '12 Months Annual Pass', durationDays: 365, amount: 14999,
        daysToExpiry: 7, status: 'expiring', paymentStatus: 'pending',
        remindersSuppressed: false, lastReminder: 'D-7 Delivered (Direct Pay Link)',
        lastReminderState: 'delivered', utr: '', insideNow: true, checkInMinsAgo: 19,
      },
      {
        id: 'M-108', code: 'IP-M108', name: 'Siddharth Goud', phone: '9440788990',
        plan: '3 Months Strength + Cardio', durationDays: 90, amount: 4500,
        daysToExpiry: 84, status: 'active', paymentStatus: 'paid',
        remindersSuppressed: true, lastReminder: 'SUPPRESSED — Paid via Direct UPI Link',
        lastReminderState: 'suppressed', utr: 'UTR-43180092811', insideNow: true, checkInMinsAgo: 42,
      },
      {
        id: 'M-109', code: 'IP-M109', name: 'Meghana Kulkarni', phone: '9391899001',
        plan: '6 Months Elite Transformation', durationDays: 180, amount: 8500,
        daysToExpiry: 172, status: 'active', paymentStatus: 'paid',
        remindersSuppressed: true, lastReminder: 'SUPPRESSED — Paid via Direct Pay Link',
        lastReminderState: 'suppressed', utr: 'pay_P8x92Lm01Q', insideNow: false, checkInMinsAgo: null,
      },
      {
        id: 'M-110', code: 'IP-M110', name: 'Nikhil Bajaj', phone: '9652900112',
        plan: '1 Month Pro Access', durationDays: 30, amount: 2200,
        daysToExpiry: -19, status: 'disputed', paymentStatus: 'disputed',
        remindersSuppressed: true, lastReminder: 'PAUSED — Injury Hold Approved by Owner',
        lastReminderState: 'suppressed', utr: '', insideNow: false, checkInMinsAgo: null,
      },
    ],
    exceptions: [
      {
        id: 'EX-01',
        kind: 'unmatched_payment',
        title: 'Unmatched UPI Credit · ₹4,500',
        detail: 'Received ₹4,500 from "S. Sharma Traders" (UTR 431894401290) — payer phone does not match member registry. Routed to staff review instead of auto-assigning.',
        amount: 4500,
        utr: 'UTR-431894401290',
        suggestedMemberId: 'M-106',
        suggestedMemberName: 'Rohan Sharma (IP-M106)',
        resolved: false,
        time: '11 mins ago',
      },
      {
        id: 'EX-02',
        kind: 'expired_gate_entry',
        title: 'CCTV Head-Tracker Flagged Expired Entry · Vikram Varma (IP-M103)',
        detail: 'Camera 01 Head-Tracker (#HT-103) + Gate Scan detected entry 12 mins ago while membership is 4 days overdue (₹4,500 pending). Flagged for front-desk collection.',
        amount: 4500,
        utr: '',
        suggestedMemberId: 'M-103',
        suggestedMemberName: 'Vikram Varma (IP-M103)',
        resolved: false,
        time: '12 mins ago',
      },
    ],
    auditLogs: [
      { id: 'L-1', time: '14:02', actor: 'CCTV_AI_VISION', event: 'HEAD_TRACK_EXPIRED_FLAG', detail: 'Vikram Varma (IP-M103) tracked IN on Cam-01 (4d overdue · ₹4,500). Front desk alerted.' },
      { id: 'L-2', time: '13:51', actor: '24X7_AI_AGENT', event: 'RECORDED_MSG_AND_PAYLINK', detail: 'Recorded WhatsApp from Aarav Reddy (IP-M101); sent D-2 direct payment link + Indoor/Outdoor workout plan.' },
      { id: 'L-3', time: '11:30', actor: 'CADENCE_ENGINE', event: 'D7_D6_D3_D2_D1_SENT', detail: 'Dispatched D-7, D-6, D-3, D-2, D-1 direct UPI payment links to 5 expiring members.' },
      { id: 'L-4', time: '10:15', actor: 'PAYMENT_WEBHOOK', event: 'REMINDERS_SUPPRESSED', detail: 'Verified ₹4,500 for Siddharth Goud (IP-M108). Remaining countdown links SUPPRESSED.' },
    ],
    gateStats: {
      insideCount: 38,
      entriesToday: 124,
      exitsToday: 86,
      avgDurationMins: 68,
      hourly: [
        { hour: '06h', count: 44 },
        { hour: '07h', count: 52 },
        { hour: '08h', count: 41 },
        { hour: '09h', count: 26 },
        { hour: '10h', count: 18 },
        { hour: '11h', count: 14 },
        { hour: '12h', count: 12 },
        { hour: '16h', count: 24 },
        { hour: '17h', count: 35 },
        { hour: '18h', count: 38 },
        { hour: '19h', count: 49 },
        { hour: '20h', count: 36 },
      ],
    },
    gateFeed: [
      { id: 'G-1', time: 'Just now', name: 'Vikram Varma', code: 'IP-M103', headId: '#HT-103', dir: 'in', method: 'CCTV Cam-01 Head-Track + QR', planState: 'overdue', note: '4d OVERDUE (₹4,500) — Flagged for Front Desk', flagged: true },
      { id: 'G-2', time: '6 mins ago', name: 'Ananya Choudhary', code: 'IP-M107', headId: '#HT-107', dir: 'in', method: 'CCTV Cam-01 Head-Track', planState: 'expiring', note: 'Active · D-7 Direct Payment Link Delivered', flagged: false },
      { id: 'G-3', time: '14 mins ago', name: 'Deepak Chowdary', code: 'IP-M088', headId: '#HT-088', dir: 'out', method: 'CCTV Cam-01 Exit Tripwire', planState: 'active', note: 'Tracked OUT · 71 mins on floor · Website count -1', flagged: false },
      { id: 'G-4', time: '19 mins ago', name: 'Aarav Reddy', code: 'IP-M101', headId: '#HT-101', dir: 'in', method: 'CCTV Cam-01 Head-Track', planState: 'expiring', note: 'Expires in 2 days · D-2 direct link delivered', flagged: false },
      { id: 'G-5', time: '27 mins ago', name: 'Ritika Jain', code: 'IP-M064', headId: '#HT-064', dir: 'out', method: 'CCTV Cam-01 Exit Tripwire', planState: 'active', note: 'Tracked OUT · 64 mins on floor · Website count -1', flagged: false },
      { id: 'G-6', time: '42 mins ago', name: 'Siddharth Goud', code: 'IP-M108', headId: '#HT-108', dir: 'in', method: 'CCTV Cam-01 Head-Track', planState: 'active', note: 'Active · Renewed this week (84d left)', flagged: false },
    ],
    leads: [
      { id: 'LD-1', name: 'Harsha Vardhan', phone: '9849501122', source: 'Local SEO ("Gym Near Madhapur")', interest: 'Free Trial + 3M Strength', stage: 'new', time: '4 mins ago', note: '24/7 Agent recorded message & sent Free Trial pass in 1.1s' },
      { id: 'LD-2', name: 'Divya Krishnan', phone: '9989112233', source: 'Instagram Reel DM (Recorded)', interest: '6M Transformation + Lean Stack', stage: 'trial_booked', time: '1 hr ago', note: 'Evening 6:30 PM trial booked + Indoor/Outdoor plan preview sent' },
      { id: 'LD-3', name: 'Pranav Raju', phone: '9704223344', source: '3D Website Live Crowd Widget', interest: '1 Month Pro + Creatine Set', stage: 'contacted', time: '3 hrs ago', note: 'Sent tariff card + live CCTV head-count link on WhatsApp' },
      { id: 'LD-4', name: 'Keerthi Somayajulu', phone: '9100334455', source: 'Google Maps Nearby Search', interest: '3 Months Strength + Cardio', stage: 'trial_booked', time: 'Yesterday', note: 'Completed trial session · 24/7 Agent sent ₹4,500 direct pay link' },
      { id: 'LD-5', name: 'Abhishek Pratap', phone: '9866445566', source: 'Member Referral', interest: '12 Months Annual Pass', stage: 'joined', time: '2 days ago', note: 'Paid ₹14,999 via Direct Link · Added to Member Registry' },
    ],
    outreachLeads: [
      { id: 'HYD-01', gym: 'Apex Iron Fitness Club', area: 'Madhapur / Hitech City, Hyderabad', owner: 'Studio Owner', phone: '919848011223', membersEst: '320+', score: 10, pain: 'High monthly & quarterly volume; wants 24/7 AI Agent + D-7/6/3/2/1 payment links + CCTV live crowd', status: 'demo_ready', dealValue: 19999 },
      { id: 'HYD-02', gym: 'Iron Paradise Fitness Club', area: 'Jubilee Hills Rd 36, Hyderabad', owner: 'Owner / Desk', phone: '919849023451', membersEst: '450+', score: 9, pain: 'PT + quarterly renewals tracked in Excel; wants 10-min supplement delivery store + AI agent', status: 'to_call', dealValue: 19999 },
      { id: 'HYD-03', gym: 'Torque Fitness & Functional Studio', area: 'Banjara Hills Rd 12, Hyderabad', owner: 'Managing Partner', phone: '919885412098', membersEst: '280+', score: 9, pain: 'High-ticket ₹4,000/mo plans; wants CCTV head-tracking live occupancy + 3D website', status: 'to_call', dealValue: 39999 },
      { id: 'HYD-04', gym: 'Pulse8 Strength & Conditioning', area: 'Kondapur / Botanical Garden Rd, Hyderabad', owner: 'Founder', phone: '919701567812', membersEst: '350+', score: 8, pain: 'Evening peak crowd complaints + overdue members walking through gate without desk noticing', status: 'to_call', dealValue: 19999 },
      { id: 'HYD-05', gym: 'Beast Mode Barbell Studio', area: 'Gachibowli / DLF Cybercity, Hyderabad', owner: 'Head Coach & Owner', phone: '919948231045', membersEst: '400+', score: 9, pain: 'IT crowd on 3-month packages; wants 24/7 AI indoor+outdoor workout planner for members', status: 'to_call', dealValue: 19999 },
      { id: 'HYD-06', gym: 'Olympus Gym & CrossFit Box', area: 'Manikonda / Shaikpet, Hyderabad', owner: 'Owner', phone: '919177890234', membersEst: '260+', score: 8, pain: 'Register + WhatsApp broadcast list; needs D-7, D-6, D-3, D-2, D-1 direct payment links', status: 'to_call', dealValue: 19999 },
      { id: 'HYD-07', gym: 'Titan Athletics & Wellness', area: 'Kokapet / Financial District, Hyderabad', owner: 'Director', phone: '919000456123', membersEst: '310+', score: 9, pain: 'New luxury facility; needs 3D website + CCTV AI head tracking + 10-min supplement e-commerce', status: 'to_call', dealValue: 39999 },
      { id: 'HYD-08', gym: 'Spartan Strength House', area: 'Kukatpally / KPHB Phase 3, Hyderabad', owner: 'Owner', phone: '919440612398', membersEst: '500+', score: 9, pain: 'High footfall (500+ members); wants mobile/laptop automation control + local SEO traffic radar', status: 'to_call', dealValue: 19999 },
      { id: 'HYD-09', gym: 'CoreForge Fitness Lounge', area: 'Himayatnagar, Hyderabad', owner: 'Owner', phone: '919391045672', membersEst: '290+', score: 8, pain: 'Family & student memberships; needs structured trial lead recorder + weekly payment link flow', status: 'to_call', dealValue: 19999 },
      { id: 'HYD-10', gym: 'Valkyrie Sweat & Strength', area: 'Sainikpuri / Secunderabad', owner: 'Co-Founder', phone: '919652309811', membersEst: '240+', score: 8, pain: 'Two branches expanding; wants unified mobile/laptop dashboard for renewals and supplement store', status: 'to_call', dealValue: 39999 },
    ],
  };
}

let store = null;
let gateInterval = null;

function getStore() {
  if (store) return store;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) store = JSON.parse(raw);
  } catch { /* ignore */ }
  if (!store || !Array.isArray(store.members) || !Array.isArray(store.recordedMessages)) {
    store = initialData();
  }
  return store;
}

function saveStore() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch { /* ignore */ }
}

export function resetRecoveryDemo(onRender) {
  store = initialData();
  saveStore();
  toast('IRONPULSE AI OS™ dataset reset to clean baseline');
  onRender?.();
}

export function openAlertCounts() {
  const s = getStore();
  const actionMembers = s.members.filter((m) => m.status === 'expiring' || m.status === 'overdue').length;
  const openExceptions = s.exceptions.filter((x) => !x.resolved).length;
  const openGateFlags = s.gateFeed.filter((g) => g.flagged).length;
  return {
    renewals: actionMembers + openExceptions,
    agent: s.recordedMessages.length,
    gate: openGateFlags,
    leads: s.leads.filter((l) => l.stage === 'new').length,
  };
}

function nowTime() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatExpiryLabel(days) {
  if (days === 0) return 'Expires today';
  if (days > 0) return `In ${days} day${days === 1 ? '' : 's'}`;
  const over = Math.abs(days);
  return `${over}d overdue`;
}

function formatExpiryDate(days) {
  const d = new Date(Date.now() + days * 86400000);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusChip(status, suppressed = false) {
  if (suppressed && status === 'active') {
    return el('span', { class: 'chip', 'data-s': 'ready' }, 'Active · Paid');
  }
  const map = {
    active:   ['ready',            'Active · Paid'],
    expiring: ['preparing',        'D-7..D-1 Countdown'],
    overdue:  ['out_for_delivery', 'Weekly Pay Link Active'],
    disputed: ['cancelled',        'Paused / Hold'],
  };
  const [ds, label] = map[status] ?? ['new', status];
  return el('span', { class: 'chip', 'data-s': ds }, label);
}

// ===========================================================================
// CONFIRM PAYMENT WORKFLOW (Webhook Simulation or Authorized Staff UTR)
// ===========================================================================

function confirmMemberPayment(memberId, mode, refCode, onRender) {
  const s = getStore();
  const m = s.members.find((x) => x.id === memberId);
  if (!m) return;

  const utr = refCode?.trim() || (mode === 'webhook'
    ? `pay_Wbhk${Math.floor(100000 + Math.random() * 900000)}`
    : `UTR-${Math.floor(400000000000 + Math.random() * 99999999999)}`);

  m.status = 'active';
  m.paymentStatus = 'paid';
  m.daysToExpiry = Math.max(0, m.daysToExpiry) + m.durationDays;
  m.remindersSuppressed = true;
  m.lastReminder = `SUPPRESSED — Verified ${mode === 'webhook' ? 'Direct Link Webhook' : 'Staff UTR'} (${utr})`;
  m.lastReminderState = 'suppressed';
  m.utr = utr;
  s.baseCollectedMonth += m.amount;

  for (const ex of s.exceptions) {
    if (ex.suggestedMemberId === m.id && !ex.resolved) {
      ex.resolved = true;
    }
  }
  for (const g of s.gateFeed) {
    if (g.code === m.code && g.flagged) {
      g.flagged = false;
      g.planState = 'active';
      g.note = `RENEWED AT DESK (${utr}) · All D-7..D-1 & Weekly reminders suppressed`;
    }
  }

  s.auditLogs.unshift({
    id: `L-${Date.now()}`,
    time: nowTime(),
    actor: mode === 'webhook' ? 'DIRECT_LINK_WEBHOOK' : 'STAFF_CONFIRMED',
    event: 'PAID_AND_SUPPRESSED',
    detail: `Verified ${money(m.amount)} for ${m.name} (${m.code}) via ${utr}. Plan extended +${m.durationDays}d; remaining D-7/D-6/D-3/D-2/D-1 & weekly links SUPPRESSED.`,
  });

  saveStore();
  toast(`${m.name} marked PAID (${utr}) — countdown & weekly links suppressed`);
  onRender?.();
}

function openCadenceModal(member, onRender) {
  const isPaid = member.paymentStatus === 'paid' || member.remindersSuppressed;
  const payLink = `https://ironpulse.os/pay/${member.code.toLowerCase()}`;
  const storeLink = `${location.origin}/store/#s-shop`;

  const msgPreview =
    `Hi ${member.name.split(' ')[0]}, 24/7 AI Coach from *IRONPULSE GYM* here.\n\n` +
    `Your *${member.plan}* membership ` +
    (member.daysToExpiry >= 0
      ? `renews in *${member.daysToExpiry} day(s)* (${formatExpiryDate(member.daysToExpiry)}).`
      : `is overdue by *${Math.abs(member.daysToExpiry)} days* (Weekly Direct Link).`) +
    `\n\n• Direct 1-Tap UPI Renewal Link (${money(member.amount)}): ${payLink}` +
    `\n• Complete Supplement Set (10-Min Delivery): ${storeLink}` +
    `\n\nReply "PLAN" anytime for your updated Indoor + Outdoor Workout & Nutrition Plan!`;

  const stepRows = CADENCE_STEPS.map((st) => {
    let stateLabel = 'Scheduled';
    let chipKind = 'new';
    if (isPaid) {
      stateLabel = 'SUPPRESSED (Paid)';
      chipKind = 'ready';
    } else if (member.daysToExpiry <= Math.abs(st.offset) && st.offset <= 0) {
      stateLabel = 'Delivered + Direct Link ✓✓';
      chipKind = 'approved';
    } else if (st.offset > 0 && member.daysToExpiry < 0) {
      stateLabel = 'Weekly Link Active ✓✓';
      chipKind = 'out_for_delivery';
    }
    return el('div', {
      style: {
        display: 'grid',
        gridTemplateColumns: '64px minmax(0,1fr) auto',
        gap: '12px',
        alignItems: 'center',
        padding: '10px 12px',
        borderBottom: '1px solid var(--line)',
        fontSize: '13.5px',
      },
    }, [
      el('span', { class: 'mono', style: { fontWeight: '700' } }, st.tag),
      el('div', {}, [
        el('div', { style: { fontWeight: '600' } }, st.label),
        el('div', { class: 'muted', style: { fontSize: '12.5px' } }, st.template),
      ]),
      el('span', { class: 'chip', 'data-s': chipKind }, stateLabel),
    ]);
  });

  let closeModal;
  const body = el('div', { class: 'f-stack' }, [
    el('div', { class: 'notice', 'data-kind': isPaid ? 'go' : '' }, [
      el('div', { style: { display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' } }, [
        el('b', {}, `${member.name} (${member.code}) · ${member.plan}`),
        el('span', { class: 'mono', style: { fontWeight: '700' } }, `${money(member.amount)} · ${formatExpiryLabel(member.daysToExpiry)}`),
      ]),
      el('p', { style: { marginTop: '6px', fontSize: '13px' } },
        isPaid
          ? `Payment verified (${member.utr || 'Confirmed'}). Reminder suppression is ACTIVE — zero further renewal messages will be sent for this cycle.`
          : '24/7 AI Agent automatically dispatches Direct UPI Links on Day 7, Day 6, Day 3, Day 2, Day 1, and every 1 Week until verified paid.'),
    ]),
    el('div', {}, [
      el('p', { class: 'card-t', style: { marginBottom: '8px' } }, '24/7 AI Agent Direct Payment + Supplement Link Preview'),
      el('pre', {
        class: 'notice mono',
        style: { whiteSpace: 'pre-wrap', fontSize: '12.5px', background: '#eef8d6', borderColor: '#b1e743' },
      }, msgPreview),
    ]),
    el('div', {}, [
      el('p', { class: 'card-t', style: { marginBottom: '8px' } }, 'Countdown Schedule (D-7, D-6, D-3, D-2, D-1 + Weekly Direct Link)'),
      el('div', { style: { border: '1px solid var(--line)', borderRadius: '12px', overflow: 'hidden' } }, stepRows),
    ]),
  ]);

  closeModal = modal(`Direct Pay Link Cadence · ${member.name}`, body, [
    !isPaid ? button('Send Direct Payment Link Now', {
      kind: 'btn--ink',
      onclick: () => {
        member.lastReminder = `Direct Pay Link Sent (${nowTime()}) · Recorded by 24/7 Agent`;
        member.lastReminderState = 'delivered';
        getStore().recordedMessages.unshift({
          id: `MSG-${Date.now().toString().slice(-4)}`,
          time: `Just now (${nowTime()})`,
          member: `${member.name} (${member.code})`,
          phone: member.phone,
          channel: 'WhatsApp Direct Link Dispatch',
          inbound: '[Scheduled Countdown Trigger: Direct Payment Link Requested]',
          aiReply: `Dispatched Direct 1-Tap UPI Link (${money(member.amount)}) + 10-Min Supplement Set Offer to +91 ${readPhone(member.phone)}.`,
          latency: '0.8s',
          intent: 'DIRECT_PAY_LINK',
        });
        saveStore();
        toast(`Direct payment link sent & recorded for ${member.name}`);
        closeModal();
        onRender?.();
      },
    }) : null,
    !isPaid ? button('Simulate Instant UPI Payment (Suppress All Links)', {
      kind: 'btn--spring',
      icon: 'check',
      onclick: () => {
        closeModal();
        confirmMemberPayment(member.id, 'webhook', '', onRender);
      },
    }) : null,
  ].filter(Boolean));
}

function openPaymentConfirmModal(member, onRender) {
  const utrInput = el('input', {
    class: 'input mono',
    type: 'text',
    placeholder: 'e.g. UTR-431899201144 or CASH-REC-88',
    value: `UTR-${Math.floor(431800000000 + Math.random() * 99999999)}`,
  });

  let closeModal;
  const body = el('div', { class: 'f-stack' }, [
    el('div', { class: 'notice' }, [
      el('b', {}, 'Verified Direct Payment Confirmation'),
      el('p', { style: { marginTop: '4px', fontSize: '13px' } },
        'When a member pays via the D-7 / D-6 / D-3 / D-2 / D-1 or Weekly Direct Link, the webhook verifies the UTR and stops all remaining countdown messages automatically.'),
    ]),
    el('div', { class: 'job-items' }, [
      el('div', { class: 'job-item' }, [el('span', { class: 'n' }, 'Member'), el('b', {}, `${member.name} (${member.code})`)]),
      el('div', { class: 'job-item' }, [el('span', { class: 'n' }, 'Plan'), el('span', {}, member.plan)]),
      el('div', { class: 'job-item' }, [el('span', { class: 'n' }, 'Amount Due'), el('b', { class: 'mono' }, money(member.amount))]),
      el('div', { class: 'job-item' }, [el('span', { class: 'n' }, 'Action on Confirm'), el('span', {}, `+${member.durationDays} days & Suppress D-7..D-1 + Weekly reminders`)]),
    ]),
    field('UTR / Gateway Reference / Receipt Number', utrInput, 'Logged to immutable audit trail with operator timestamp.'),
  ]);

  closeModal = modal(`Confirm Payment · ${member.name}`, body, [
    button('1-Click Direct Link Webhook (TEST PAYMENT)', {
      kind: 'btn--spring',
      icon: 'check',
      onclick: () => {
        closeModal();
        confirmMemberPayment(member.id, 'webhook', `pay_DirectLink_${member.code}`, onRender);
      },
    }),
    button('Authorize Manual Staff Confirmation', {
      kind: 'btn--ink',
      onclick: () => {
        closeModal();
        confirmMemberPayment(member.id, 'staff', utrInput.value, onRender);
      },
    }),
  ]);
}

function openCsvImportModal(onRender) {
  const sampleCsv =
    `Full Name,Phone,Plan,Duration Days,Amount,Days To Expiry\n` +
    `Kiran Kumar,9849100200,3 Months Strength + Cardio,90,4500,3\n` +
    `Pooja Sharma,9885200300,1 Month Pro Access,30,2200,-2`;
  const area = el('textarea', { class: 'textarea mono', style: { fontSize: '12.5px' } }, sampleCsv);

  let closeModal;
  const body = el('div', { class: 'f-stack' }, [
    el('div', { class: 'notice' },
      'Import member spreadsheet (CSV). Duplicate phones are checked and D-7, D-6, D-3, D-2, D-1 + Weekly direct payment links schedule immediately.'),
    field('Paste CSV rows (Name, Phone, Plan, DurationDays, Amount, DaysToExpiry)', area),
  ]);

  closeModal = modal('Import Member Spreadsheet', body, [
    button('Import & Schedule D-7..D-1 Direct Links', {
      kind: 'btn--spring',
      icon: 'plus',
      onclick: () => {
        const s = getStore();
        const lines = area.value.trim().split('\n').slice(1);
        let added = 0;
        for (const line of lines) {
          const [name, phone, plan, dur, amt, days] = line.split(',').map((x) => x?.trim());
          if (!name || !phone) continue;
          const d = Number(days || 5);
          const idNum = 101 + s.members.length;
          s.members.unshift({
            id: `M-${idNum}`,
            code: `IP-M${idNum}`,
            name,
            phone: phone.replace(/\D/g, '').slice(-10),
            plan: plan || '3 Months Strength',
            durationDays: Number(dur || 90),
            amount: Number(amt || 4500),
            daysToExpiry: d,
            status: d < 0 ? 'overdue' : d <= 7 ? 'expiring' : 'active',
            paymentStatus: d < 0 ? 'overdue' : d <= 7 ? 'pending' : 'paid',
            remindersSuppressed: d > 7,
            lastReminder: d <= 7 ? 'Queued for D-7/D-6/D-3/D-2/D-1 Direct Link' : 'Active cycle',
            lastReminderState: 'sent',
            utr: '',
            insideNow: false,
            checkInMinsAgo: null,
          });
          added++;
        }
        saveStore();
        closeModal();
        toast(`Imported ${added} members into IRONPULSE AI OS™`);
        onRender?.();
      },
    }),
  ]);
}

// ===========================================================================
// 1 · RENEWALS TAB (D-7, D-6, D-3, D-2, D-1 + Weekly Direct Link Engine)
// ===========================================================================

export function renewalsScreen(ctx) {
  const s = getStore();
  const rerender = () => ctx.go('renewals');

  const activeCount = 134 + s.members.filter((m) => m.status === 'active').length;
  const expiringMembers = s.members.filter((m) => m.status === 'expiring');
  const overdueMembers = s.members.filter((m) => m.status === 'overdue');
  const disputedMembers = s.members.filter((m) => m.status === 'disputed');
  const suppressedCount = 18 + s.members.filter((m) => m.remindersSuppressed).length;
  const openExceptions = s.exceptions.filter((x) => !x.resolved);

  const expiringValue = expiringMembers.reduce((t, m) => t + m.amount, 0);
  const overdueRecoverable = overdueMembers.reduce((t, m) => t + m.amount, 0);
  const disputedValue = disputedMembers.reduce((t, m) => t + m.amount, 0);

  const demoBanner = el('div', {
    class: 'card card--ink rise',
    style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' },
  }, [
    el('div', {}, [
      el('div', { class: 'row row--wrap', style: { gap: '8px', marginBottom: '6px' } }, [
        el('span', { class: 'chip', 'data-s': 'ready' }, 'D-7 · D-6 · D-3 · D-2 · D-1 + WEEKLY PAY LINKS'),
        el('span', { class: 'chip', 'data-s': 'out_for_delivery' }, '24/7 AI AGENT ACTIVE'),
        el('span', { class: 'chip', 'data-s': 'out_for_delivery' }, '15-DAY 100% REFUND GUARANTEE'),
      ]),
      el('h2', { style: { fontSize: '19px', fontWeight: '700' } },
        'Automated Countdown Payment Engine: Day 7, Day 6, Day 3, Day 2, Day 1 & Weekly Direct Pay Links'),
      el('p', { style: { color: 'rgba(255,255,255,.72)', fontSize: '13.5px', marginTop: '4px' } },
        'Members receive a direct 1-tap payment link + complete supplement set offer automatically. Once paid, remaining countdown reminders stop immediately.'),
    ]),
    el('div', { class: 'row row--wrap' }, [
      button('24/7 AI Agent & Recorder', {
        kind: 'btn--spring btn--sm',
        onclick: () => ctx.go('agent'),
      }),
      button('Import CSV', {
        kind: 'btn--sm',
        icon: 'plus',
        onclick: () => openCsvImportModal(rerender),
      }),
      button('Reset Dataset', {
        kind: 'btn--sm',
        icon: 'refresh',
        onclick: () => resetRecoveryDemo(rerender),
      }),
    ]),
  ]);

  const kpiStrip = el('div', { class: 'grid grid--kpi rise' }, [
    card([
      el('div', { class: 'kpi' }, [
        el('p', { class: 'kpi-label' }, 'Active Verified Memberships'),
        el('div', { class: 'kpi-row' }, [
          el('span', { class: 'kpi-v' }, String(activeCount)),
          el('span', { class: 'delta' }, '94.8% Retained'),
        ]),
        el('p', { class: 'kpi-sub' }, `${suppressedCount} cycles paid via direct link & suppressed`),
      ]),
    ]),
    card([
      el('div', { class: 'kpi' }, [
        el('p', { class: 'kpi-label' }, '7-Day Countdown Queue (D-7..D-1)'),
        el('div', { class: 'kpi-row' }, [
          el('span', { class: 'kpi-v' }, `${expiringMembers.length} members`),
          el('span', { class: 'delta' }, money(expiringValue)),
        ]),
        el('p', { class: 'kpi-sub' }, 'D-7, D-6, D-3, D-2, D-1 direct pay links active'),
      ]),
    ]),
    card([
      el('div', { class: 'kpi' }, [
        el('p', { class: 'kpi-label' }, 'Weekly Direct-Link Recovery'),
        el('div', { class: 'kpi-row' }, [
          el('span', { class: 'kpi-v' }, money(overdueRecoverable)),
          el('span', { class: 'delta', 'data-dir': overdueMembers.length ? 'down' : 'flat' }, `${overdueMembers.length} weekly links`),
        ]),
        el('p', { class: 'kpi-sub' }, `Separated from ${money(disputedValue)} paused/hold`),
      ]),
    ]),
    card([
      el('div', { class: 'kpi' }, [
        el('p', { class: 'kpi-label' }, 'Collected Revenue (This Month)'),
        el('div', { class: 'kpi-row' }, [
          el('span', { class: 'kpi-v' }, money(s.baseCollectedMonth)),
          el('span', { class: 'delta' }, 'Verified Only'),
        ]),
        el('p', { class: 'kpi-sub' }, `${openExceptions.length} exceptions awaiting staff review`),
      ]),
    ]),
  ]);

  const filters = [
    { key: 'all',        label: `All (${s.members.length})` },
    { key: 'expiring',   label: `D-7..D-1 Countdown (${expiringMembers.length})` },
    { key: 'overdue',    label: `Weekly Link Queue (${overdueMembers.length})` },
    { key: 'active',     label: `Paid & Suppressed (${s.members.filter((m) => m.status === 'active').length})` },
    { key: 'exceptions', label: `Exceptions (${openExceptions.length})` },
  ];

  const searchBox = el('input', {
    class: 'input',
    type: 'search',
    placeholder: 'Search member, phone, ID or UTR…',
    value: s.renewalSearch,
    style: { maxWidth: '280px', minHeight: '38px', padding: '6px 12px' },
    oninput: (e) => {
      s.renewalSearch = e.target.value;
      rerender();
    },
  });

  const filteredMembers = s.members.filter((m) => {
    if (s.renewalFilter === 'expiring' && m.status !== 'expiring') return false;
    if (s.renewalFilter === 'overdue' && m.status !== 'overdue') return false;
    if (s.renewalFilter === 'active' && m.status !== 'active') return false;
    if (s.renewalFilter === 'exceptions' && m.lastReminderState !== 'exception' && !(m.status === 'overdue' && m.insideNow)) return false;
    if (s.renewalSearch.trim()) {
      const q = s.renewalSearch.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        m.code.toLowerCase().includes(q) ||
        m.plan.toLowerCase().includes(q) ||
        (m.utr && m.utr.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const memberTable = card([
    el('div', { class: 'card-head', style: { flexWrap: 'wrap', padding: '20px 22px 0' } }, [
      el('div', {}, [
        el('p', { class: 'card-t' }, 'AUTOMATED MEMBER & DIRECT PAYMENT REGISTRY'),
        el('h2', {}, 'D-7, D-6, D-3, D-2, D-1 Countdown Links, Weekly Recovery & Instant Suppression'),
      ]),
      el('div', { class: 'spacer row row--wrap' }, [
        ...filters.map((f) =>
          el('button', {
            class: `btn btn--sm ${s.renewalFilter === f.key ? 'btn--ink' : ''}`,
            onclick: () => { s.renewalFilter = f.key; rerender(); },
          }, f.label)
        ),
        searchBox,
      ]),
    ]),
    el('div', { class: 'table-wrap', style: { marginTop: '14px' } },
      el('table', { class: 'table' }, [
        el('thead', {}, el('tr', {}, [
          el('th', {}, 'Member / ID'),
          el('th', {}, 'Plan & Dues'),
          el('th', {}, 'Expiry Countdown'),
          el('th', {}, 'Status'),
          el('th', {}, 'Direct Payment Link & Cadence State'),
          el('th', { class: 'num' }, 'Actions'),
        ])),
        el('tbody', {}, filteredMembers.map((m) => {
          const isPaid = m.paymentStatus === 'paid';
          return el('tr', {}, [
            el('td', {}, [
              el('div', { class: 'row' }, [
                el('div', { class: `avatar ${isPaid ? '' : 'avatar--ink'}` }, initials(m.name)),
                el('div', {}, [
                  el('div', { class: 'strong' }, [
                    m.name,
                    m.insideNow ? el('span', { class: 'chip', 'data-s': 'ready', style: { marginLeft: '8px', padding: '2px 8px', fontSize: '11px' } }, 'CCTV: On Floor') : null,
                  ]),
                  el('div', { class: 'muted mono', style: { fontSize: '12.5px' } }, `${m.code} · +91 ${readPhone(m.phone)}`),
                ]),
              ]),
            ]),
            el('td', {}, [
              el('div', { class: 'strong' }, money(m.amount)),
              el('div', { class: 'muted', style: { fontSize: '12.5px' } }, m.plan),
            ]),
            el('td', {}, [
              el('div', { class: 'strong mono' }, formatExpiryLabel(m.daysToExpiry)),
              el('div', { class: 'muted', style: { fontSize: '12.5px' } }, formatExpiryDate(m.daysToExpiry)),
            ]),
            el('td', {}, statusChip(m.status, m.remindersSuppressed)),
            el('td', {}, [
              el('div', { style: { fontWeight: m.remindersSuppressed ? '700' : '500', fontSize: '13.5px' } }, m.lastReminder),
              m.utr ? el('div', { class: 'muted mono', style: { fontSize: '12px' } }, `Verified Ref: ${m.utr}`) : null,
            ]),
            el('td', { class: 'num' },
              el('div', { class: 'row', style: { justifyContent: 'flex-end' } }, [
                button('D-7..D-1 Direct Link', {
                  kind: 'btn--sm',
                  onclick: () => openCadenceModal(m, rerender),
                }),
                !isPaid ? button('Confirm Payment', {
                  kind: 'btn--spring btn--sm',
                  icon: 'check',
                  onclick: () => openPaymentConfirmModal(m, rerender),
                }) : el('span', { class: 'chip', 'data-s': 'ready' }, 'Reminders Suppressed'),
              ])),
          ]);
        })),
      ])),
  ], { class: 'card--flush rise' });

  const exceptionCard = card([
    cardHead(
      'Staff Review & Exception Queue',
      el('span', { class: 'chip', 'data-s': openExceptions.length ? 'out_for_delivery' : 'ready' },
        `${openExceptions.length} Open`)
    ),
    el('p', { class: 'muted', style: { fontSize: '13.5px', marginBottom: '14px' } },
      'Unmatched UPI payments and CCTV head-tracking expired-entry alerts route here automatically.'),
    el('div', { class: 'f-stack' },
      s.exceptions.map((ex) =>
        el('div', {
          class: 'job-items',
          style: {
            border: ex.resolved ? '1px solid var(--line)' : '1.5px solid var(--c-ink)',
            opacity: ex.resolved ? '0.62' : '1',
          },
        }, [
          el('div', { class: 'row row--wrap', style: { justifyContent: 'space-between' } }, [
            el('b', {}, ex.title),
            el('span', { class: 'chip', 'data-s': ex.resolved ? 'ready' : 'out_for_delivery' },
              ex.resolved ? 'Resolved' : ex.time),
          ]),
          el('p', { style: { fontSize: '13.5px', color: 'var(--n-700)' } }, ex.detail),
          !ex.resolved ? el('div', { class: 'row row--wrap', style: { marginTop: '6px' } }, [
            ex.kind === 'unmatched_payment'
              ? button(`Match & Verify to ${ex.suggestedMemberName}`, {
                  kind: 'btn--spring btn--sm',
                  icon: 'check',
                  onclick: () => {
                    ex.resolved = true;
                    confirmMemberPayment(ex.suggestedMemberId, 'staff', ex.utr, rerender);
                  },
                })
              : null,
            ex.kind === 'expired_gate_entry'
              ? button(`Collect ${money(ex.amount)} at Desk & Renew`, {
                  kind: 'btn--spring btn--sm',
                  icon: 'check',
                  onclick: () => {
                    ex.resolved = true;
                    confirmMemberPayment(ex.suggestedMemberId, 'staff', `DESK-UPI-${Date.now().toString().slice(-6)}`, rerender);
                  },
                })
              : null,
          ].filter(Boolean)) : null,
        ])
      )),
  ], { class: 'rise' });

  const auditCard = card([
    cardHead('Immutable Automation & Payment Audit Trail', el('span', { class: 'card-t' }, 'LIVE EVENT LOG')),
    el('div', { class: 'feed' },
      s.auditLogs.slice(0, 8).map((log) =>
        el('div', { class: 'feed-row' }, [
          el('div', { class: 'avatar avatar--ink', style: { width: '34px', height: '34px', fontSize: '11px' } }, log.actor.slice(0, 2)),
          el('div', { style: { minWidth: 0, flex: 1 } }, [
            el('div', { class: 'who mono', style: { fontSize: '12.5px' } }, `${log.actor} · ${log.event}`),
            el('div', { class: 'what' }, log.detail),
          ]),
          el('div', { class: 'when' }, log.time),
        ])
      )),
  ], { class: 'rise' });

  return el('div', { class: 'view grid', id: 'view' }, [
    demoBanner,
    kpiStrip,
    memberTable,
    el('div', { class: 'grid grid--half' }, [exceptionCard, auditCard]),
  ]);
}

// ===========================================================================
// 2 · 24/7 AI AGENT BUILDER, MESSAGE RECORDER & INDOOR+OUTDOOR WORKOUT PLANNER
// ===========================================================================

export function agentScreen(ctx) {
  const s = getStore();
  const rerender = () => ctx.go('agent');

  const banner = el('div', {
    class: 'card card--ink rise',
    style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' },
  }, [
    el('div', {}, [
      el('div', { class: 'row row--wrap', style: { gap: '8px', marginBottom: '6px' } }, [
        el('span', { class: 'chip', 'data-s': 'ready' }, '24/7 AI GYM AGENT + MESSAGE RECORDER'),
        el('span', { class: 'chip', 'data-s': 'out_for_delivery' }, 'INDOOR + OUTDOOR WORKOUT PLANNER'),
        el('span', { class: 'chip', 'data-s': 'out_for_delivery' }, '10-MIN SUPPLEMENT SET DISPATCH'),
      ]),
      el('h2', { style: { fontSize: '19px', fontWeight: '700' } },
        '24/7 Autonomous Member Support, Live Message Recording & Indoor/Outdoor Workout + Supplement Builder'),
      el('p', { style: { color: 'rgba(255,255,255,.72)', fontSize: '13.5px', marginTop: '4px' } },
        'Every incoming WhatsApp, voice note, and Instagram message is recorded automatically. The 24/7 AI Agent replies in <1.5s with direct payment links, custom indoor+outdoor workouts, and 10-minute supplement set delivery.'),
    ]),
    el('div', { class: 'row row--wrap' }, [
      button('+ Simulate Member Message & Recording', {
        kind: 'btn--spring btn--sm',
        icon: 'plus',
        onclick: () => {
          const samples = [
            {
              member: 'Karthik Nair (IP-M104)',
              phone: '9948344556',
              channel: 'WhatsApp Voice Note Recorded (0:18)',
              inbound: '"Coach, I am travelling outdoors for 2 days and in the gym for 4 days. Update my workout plan and send my D-6 renewal link."',
              aiReply: 'Generated 4-Day Indoor Barbell + 2-Day Outdoor Hill Sprint/Calisthenics Plan, attached Pro Muscle Supplement Set (10-min delivery), and sent Direct UPI Link (₹8,500).',
              intent: 'INDOOR_OUTDOOR_PLAN + D6_LINK',
            },
            {
              member: 'Ananya Choudhary (IP-M107)',
              phone: '9000677889',
              channel: 'WhatsApp Message Recorded',
              inbound: '"Need the Complete Recovery Supplement Stack delivered to Banjara Hills in 10 minutes."',
              aiReply: 'Order #IP-1094 confirmed! Complete Recovery Set (Whey Isolate + Creatine + Electrolytes) dispatched from nearby hub — ETA 9 mins with 6-digit OTP.',
              intent: '10MIN_SUPPLEMENT_DISPATCH',
            },
          ];
          const pick = samples[Math.floor(Math.random() * samples.length)];
          s.recordedMessages.unshift({
            id: `MSG-${Date.now().toString().slice(-4)}`,
            time: `Just now (${nowTime()})`,
            ...pick,
            latency: '1.1s',
          });
          saveStore();
          toast(`Recorded new message from ${pick.member} & dispatched 24/7 AI reply!`);
          rerender();
        },
      }),
      button('Open 10-Min Supplement Store', {
        kind: 'btn--sm',
        onclick: () => window.open('../store/', '_blank', 'noopener'),
      }),
    ]),
  ]);

  // Complete 24/7 Agent Builder (Indoor + Outdoor Workout + Supplement Stack)
  const goalSelect = el('select', {
    class: 'select',
    onchange: (e) => { s.agentGoal = e.target.value; saveStore(); rerender(); },
  }, [
    'Muscle Hypertrophy + Strength',
    'Fat Loss & Athletic Conditioning',
    'Beginner Full-Body Transformation',
    'Powerlifting & Endurance Hybrid',
  ].map((g) => el('option', { value: g, selected: s.agentGoal === g }, g)));

  const envSelect = el('select', {
    class: 'select',
    onchange: (e) => { s.agentEnv = e.target.value; saveStore(); rerender(); },
  }, [
    'Complete Indoor + Outdoor Hybrid',
    'Indoor Gym Floor (Racks + Machines)',
    'Outdoor Calisthenics, Track & Conditioning',
  ].map((e) => el('option', { value: e, selected: s.agentEnv === e }, e)));

  const stackSelect = el('select', {
    class: 'select',
    onchange: (e) => { s.agentStack = e.target.value; saveStore(); rerender(); },
  }, [
    'Pro Muscle Complete Set (Whey Isolate + Creatine + Pre-Workout · ₹7,499 · 10-Min Delivery)',
    'Lean Cut Complete Set (Zero-Carb Isolate + L-Carnitine + Electrolytes · ₹6,299 · 10-Min Delivery)',
    'Daily Recovery Complete Set (Whey Blend + Micronized Creatine + Omega-3 · ₹4,999 · 10-Min Delivery)',
  ].map((st) => el('option', { value: st, selected: s.agentStack === st }, st)));

  const generatedPlanText =
    `=== IRONPULSE 24/7 AI COACH · CUSTOM MEMBER BLUEPRINT ===\n` +
    `• Goal Focus: ${s.agentGoal}\n` +
    `• Training Mode: ${s.agentEnv}\n\n` +
    `[INDOOR GYM SESSIONS — MON / TUE / THU / FRI]\n` +
    `  1. Primary Compound: Barbell Back Squat / Incline Press (4 × 6-8 reps @ RPE 8)\n` +
    `  2. Hypertrophy Superset: Romanian Deadlift + Lat Pulldown (3 × 10-12 reps)\n` +
    `  3. Metabolic Finisher: Prowler Sled Push (4 × 30m)\n\n` +
    `[OUTDOOR CONDITIONING SESSIONS — WED / SAT]\n` +
    `  1. Outdoor Track / Park: 6 × 200m Tempo Runs + Pull-Up/Push-Up EMOM (20 mins)\n` +
    `  2. Mobility & Core: Hanging Leg Raises + 45-min Zone-2 Outdoor Ruck/Walk\n\n` +
    `[COMPLETE SUPPLEMENT SET — 10-MINUTE HYPERLOCAL DELIVERY]\n` +
    `  • Recommended Stack: ${s.agentStack}\n` +
    `  • Order Link (10-Min Delivery Wherever You Are): ${location.origin}/store/#s-shop\n` +
    `  • Direct Weekly/Countdown Renewal Link: https://ironpulse.os/pay/direct`;

  const builderCard = card([
    cardHead(
      '24/7 AI Agent Builder — Indoor + Outdoor Workout & Complete Supplement Set Generator',
      el('span', { class: 'chip', 'data-s': 'ready' }, 'LIVE AGENT BUILDER')
    ),
    el('div', { class: 'grid grid--half', style: { gap: '18px' } }, [
      el('div', { class: 'f-stack' }, [
        field('1. Member Transformation Goal', goalSelect),
        field('2. Indoor + Outdoor Training Environment', envSelect),
        field('3. Complete Supplement Set (10-Minute Delivery)', stackSelect),
        el('div', { class: 'row row--wrap', style: { marginTop: '6px' } }, [
          button('Dispatch Workout + Supplement Set to Member WhatsApp', {
            kind: 'btn--spring',
            icon: 'check',
            onclick: () => {
              s.recordedMessages.unshift({
                id: `MSG-${Date.now().toString().slice(-4)}`,
                time: `Just now (${nowTime()})`,
                member: 'Aarav Reddy (IP-M101)',
                phone: '9849011223',
                channel: '24/7 AI Agent Builder Dispatch',
                inbound: `[Owner/AI Triggered: ${s.agentGoal} · ${s.agentEnv}]`,
                aiReply: `Sent Indoor+Outdoor Workout Blueprint + ${s.agentStack} (10-min delivery link) + Direct Pay Link.`,
                latency: '0.7s',
                intent: 'WORKOUT_AND_SUPPLEMENT_SET',
              });
              saveStore();
              toast('Dispatched Indoor+Outdoor Workout Plan & 10-Min Supplement Set link!');
              rerender();
            },
          }),
        ]),
      ]),
      el('div', {}, [
        el('p', { class: 'card-t', style: { marginBottom: '8px' } }, 'Live AI Agent Output Preview (Sent on WhatsApp in <1.5s)'),
        el('pre', {
          class: 'notice mono',
          style: { whiteSpace: 'pre-wrap', fontSize: '12px', lineHeight: '1.55', maxHeight: '310px', overflow: 'auto' },
        }, generatedPlanText),
      ]),
    ]),
  ], { class: 'rise' });

  const recorderCard = card([
    cardHead(
      'Live 24/7 Message Recording Log (WhatsApp, Voice Notes, Instagram & Direct Payment Links)',
      el('span', { class: 'chip', 'data-s': 'ready' }, `${s.recordedMessages.length} Recorded Conversations`)
    ),
    el('div', { class: 'table-wrap' },
      el('table', { class: 'table' }, [
        el('thead', {}, el('tr', {}, [
          el('th', {}, 'Time & Member'),
          el('th', {}, 'Recorded Member Message (Inbound)'),
          el('th', {}, '24/7 AI Agent Response + Direct Link Sent'),
          el('th', {}, 'Intent & Speed'),
        ])),
        el('tbody', {}, s.recordedMessages.map((msg) =>
          el('tr', {}, [
            el('td', {}, [
              el('div', { class: 'strong' }, msg.member),
              el('div', { class: 'muted mono', style: { fontSize: '12px' } }, `${msg.time} · ${msg.channel}`),
            ]),
            el('td', { style: { maxWidth: '320px', fontSize: '13.5px' } }, msg.inbound),
            el('td', { style: { maxWidth: '360px', fontSize: '13.5px', fontWeight: '500' } }, msg.aiReply),
            el('td', {}, [
              el('span', { class: 'chip', 'data-s': 'ready' }, msg.intent),
              el('div', { class: 'muted mono', style: { fontSize: '11.5px', marginTop: '4px' } }, `Reply latency: ${msg.latency}`),
            ]),
          ])
        )),
      ])),
  ], { class: 'card--flush rise' });

  return el('div', { class: 'view grid', id: 'view' }, [
    banner,
    builderCard,
    recorderCard,
  ]);
}

// ===========================================================================
// 3 · LIVE GATE & CCTV AI HEAD-TRACKING STREAM ("Coming & Going" IN/OUT)
// ===========================================================================

export function simulateGateEvent(kind, onRender) {
  const s = getStore();
  const namesPool = [
    { name: 'Rishi Khandelwal', code: 'IP-M114', headId: '#HT-114', planState: 'active', note: 'Active · 3 Months Strength (61d left) · Website +1' },
    { name: 'Tanvi Agarwal', code: 'IP-M119', headId: '#HT-119', planState: 'active', note: 'Active · 6 Months Transformation (118d left) · Website +1' },
    { name: 'Naveen Bhaskar', code: 'IP-M122', headId: '#HT-122', planState: 'expiring', note: 'Expiring in 3 days · D-3 Direct Pay Link Sent' },
    { name: 'Zoya Mirza', code: 'IP-M128', headId: '#HT-128', planState: 'active', note: 'Active · Annual Pass (240d left) · Website +1' },
  ];
  const pick = namesPool[Math.floor(Math.random() * namesPool.length)];

  if (kind === 'in') {
    s.gateStats.insideCount = Math.min(s.capacity, s.gateStats.insideCount + 1);
    s.gateStats.entriesToday += 1;
    s.gateFeed.unshift({
      id: `G-${Date.now()}`,
      time: `Just now (${nowTime()})`,
      name: pick.name,
      code: pick.code,
      headId: pick.headId,
      dir: 'in',
      method: 'CCTV Cam-01 AI Head-Track',
      planState: pick.planState,
      note: pick.note,
      flagged: false,
    });
    toast(`CCTV HEAD-TRACK IN → ${pick.name} (${pick.headId}) · Live Website: ${s.gateStats.insideCount}/${s.capacity}`);
  } else if (kind === 'out') {
    s.gateStats.insideCount = Math.max(1, s.gateStats.insideCount - 1);
    s.gateStats.exitsToday += 1;
    const mins = Math.floor(48 + Math.random() * 42);
    s.gateFeed.unshift({
      id: `G-${Date.now()}`,
      time: `Just now (${nowTime()})`,
      name: pick.name,
      code: pick.code,
      headId: pick.headId,
      dir: 'out',
      method: 'CCTV Cam-01 Exit Tripwire',
      planState: 'active',
      note: `Tracked OUT · ${mins} mins on floor · Live Website Updated`,
      flagged: false,
    });
    toast(`CCTV HEAD-TRACK OUT ← ${pick.name} (${pick.headId}) · Live Website: ${s.gateStats.insideCount}/${s.capacity}`);
  } else if (kind === 'expired_alert') {
    s.gateStats.insideCount = Math.min(s.capacity, s.gateStats.insideCount + 1);
    s.gateStats.entriesToday += 1;
    const overdueM = s.members.find((m) => m.status === 'overdue') || s.members[2];
    overdueM.insideNow = true;
    s.gateFeed.unshift({
      id: `G-${Date.now()}`,
      time: `Just now (${nowTime()})`,
      name: overdueM.name,
      code: overdueM.code,
      headId: '#HT-103',
      dir: 'in',
      method: 'CCTV Cam-01 AI Head-Track + Gate',
      planState: 'overdue',
      note: `MEMBERSHIP EXPIRED (${Math.abs(overdueM.daysToExpiry)}d overdue · ${money(overdueM.amount)} due) — Instant Direct Pay Link Sent`,
      flagged: true,
    });
    s.auditLogs.unshift({
      id: `L-${Date.now()}`,
      time: nowTime(),
      actor: 'CCTV_AI_HEADTRACK',
      event: 'EXPIRED_MEMBER_CHECKIN',
      detail: `${overdueM.name} (${overdueM.code}) tracked IN on Cam-01 while ${Math.abs(overdueM.daysToExpiry)}d overdue. Flagged on Front Desk Console.`,
    });
    toast(`ALERT: CCTV Head-Tracker detected overdue member ${overdueM.name} — flagged for front desk`, 'bad');
  }

  saveStore();
  onRender?.();
}

export function gateScreen(ctx) {
  const s = getStore();
  const rerender = () => { if (ctx.state.tab === 'gate') ctx.go('gate'); };

  const pct = Math.round((s.gateStats.insideCount / s.capacity) * 100);
  const flaggedGateEvents = s.gateFeed.filter((g) => g.flagged);

  const controlBanner = el('div', {
    class: 'card card--ink rise',
    style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' },
  }, [
    el('div', {}, [
      el('div', { class: 'row row--wrap', style: { gap: '8px', marginBottom: '6px' } }, [
        el('span', { class: 'chip', 'data-s': 'ready' }, 'CCTV AI HEAD-TRACKING SOFTWARE'),
        el('span', { class: 'chip', 'data-s': 'out_for_delivery' }, 'SYNCED TO LIVE 3D WEBSITE'),
      ]),
      el('h2', { style: { fontSize: '19px', fontWeight: '700' } },
        'Existing CCTV Camera Head-Tracking: Automatic IN / OUT Count Synced to Your Live Website'),
      el('p', { style: { color: 'rgba(255,255,255,.72)', fontSize: '13.5px', marginTop: '4px' } },
        'Works with the gym\'s existing CCTV cameras — installs computer-vision head-tracking software that counts every person coming IN and going OUT and shows live occupancy on your 3D website.'),
    ]),
    el('div', { class: 'row row--wrap' }, [
      button('+ Camera Track IN (Coming)', {
        kind: 'btn--spring btn--sm',
        onclick: () => simulateGateEvent('in', rerender),
      }),
      button('− Camera Track OUT (Going)', {
        kind: 'btn--sm',
        onclick: () => simulateGateEvent('out', rerender),
      }),
      button('! Simulate Expired Member Entry', {
        kind: 'btn--sm',
        style: { background: '#ff4d4d', color: '#fff', borderColor: '#ff4d4d' },
        onclick: () => simulateGateEvent('expired_alert', rerender),
      }),
      button(s.autoGate ? 'Live Camera Stream: ON (Stop)' : 'Start Live Camera Simulation', {
        kind: 'btn--sm',
        onclick: () => {
          s.autoGate = !s.autoGate;
          saveStore();
          if (gateInterval) { clearInterval(gateInterval); gateInterval = null; }
          if (s.autoGate) {
            gateInterval = setInterval(() => {
              if (document.hidden || ctx.state.tab !== 'gate') return;
              simulateGateEvent(Math.random() > 0.38 ? 'in' : 'out', rerender);
            }, 4500);
          }
          rerender();
        },
      }),
    ]),
  ]);

  // Simulated CCTV Head-Tracking Viewport
  const cctvViewport = card([
    cardHead(
      'CCTV Camera 01 (Main Entrance Tripwire) & Camera 02 (Indoor Gym Floor) — AI Head-Tracking Overlay',
      el('span', { class: 'chip', 'data-s': 'ready' }, `LIVE · 30 FPS · ${s.gateStats.insideCount} HEADS TRACKED ON FLOOR`)
    ),
    el('div', {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '14px',
      },
    }, [
      el('div', {
        style: {
          background: '#111312',
          color: '#f5f6f3',
          borderRadius: '14px',
          padding: '18px',
          border: '1px solid #2b302c',
          position: 'relative',
        },
      }, [
        el('div', { class: 'row', style: { justifyContent: 'space-between', marginBottom: '12px' } }, [
          el('span', { class: 'mono', style: { fontSize: '12px', color: '#b1e743' } }, '● CAM-01 · ENTRY/EXIT OPTICAL TRIPWIRE'),
          el('span', { class: 'mono', style: { fontSize: '12px', color: '#9ca3af' } }, `IN: ${s.gateStats.entriesToday} | OUT: ${s.gateStats.exitsToday}`),
        ]),
        el('div', {
          style: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            padding: '12px',
            border: '1px dashed rgba(177,231,67,0.45)',
            borderRadius: '10px',
          },
        }, [
          el('div', { style: { border: '1.5px solid #b1e743', borderRadius: '8px', padding: '10px' } }, [
            el('div', { class: 'mono', style: { fontSize: '11px', color: '#b1e743' } }, 'HEAD-BOX #HT-101 [IN]'),
            el('div', { style: { fontWeight: '700', marginTop: '4px' } }, 'Aarav Reddy (IP-M101)'),
            el('div', { style: { fontSize: '12px', color: '#9ca3af' } }, 'Confidence 99.2% · Active Plan'),
          ]),
          el('div', { style: { border: '1.5px solid #ff5a36', borderRadius: '8px', padding: '10px' } }, [
            el('div', { class: 'mono', style: { fontSize: '11px', color: '#ff5a36' } }, 'HEAD-BOX #HT-103 [ALERT]'),
            el('div', { style: { fontWeight: '700', marginTop: '4px' } }, 'Vikram Varma (IP-M103)'),
            el('div', { style: { fontSize: '12px', color: '#ffb4a2' } }, '4d Overdue · Desk Flagged'),
          ]),
        ]),
        el('p', { class: 'mono', style: { fontSize: '11.5px', color: '#9ca3af', marginTop: '10px' } },
          'Optical Line Crossing → Auto-increments on IN, auto-decrements on OUT, pushes live count to 3D Website.'),
      ]),
      el('div', {
        style: {
          background: '#111312',
          color: '#f5f6f3',
          borderRadius: '14px',
          padding: '18px',
          border: '1px solid #2b302c',
        },
      }, [
        el('div', { class: 'row', style: { justifyContent: 'space-between', marginBottom: '12px' } }, [
          el('span', { class: 'mono', style: { fontSize: '12px', color: '#b1e743' } }, '● CAM-02 · FREE WEIGHTS & CARDIO ZONE'),
          el('span', { class: 'mono', style: { fontSize: '12px', color: '#b1e743' } }, `${s.gateStats.insideCount} / ${s.capacity} ON FLOOR (${pct}%)`),
        ]),
        el('div', { class: 'job-items', style: { background: '#1a1d1b', borderColor: '#2b302c', color: '#f5f6f3' } }, [
          el('div', { class: 'job-item' }, [el('span', {}, 'Squat Racks & Platforms'), el('b', { class: 'mono', style: { color: '#b1e743' } }, '14 Heads Tracked')]),
          el('div', { class: 'job-item' }, [el('span', {}, 'Dumbbell & Cable Bay'), el('b', { class: 'mono', style: { color: '#b1e743' } }, '16 Heads Tracked')]),
          el('div', { class: 'job-item' }, [el('span', {}, 'Cardio & Outdoor Turf'), el('b', { class: 'mono', style: { color: '#b1e743' } }, `${Math.max(2, s.gateStats.insideCount - 30)} Heads Tracked`)]),
        ]),
        el('p', { class: 'mono', style: { fontSize: '11.5px', color: '#9ca3af', marginTop: '10px' } },
          'Zero extra hardware needed — connects directly to RTSP stream of existing Hikvision / CP Plus / Dahua CCTV cameras.'),
      ]),
    ]),
  ], { class: 'rise' });

  const kpis = el('div', { class: 'grid grid--kpi rise' }, [
    card([
      el('div', { class: 'kpi' }, [
        el('div', { class: 'kpi-top' }, [
          el('div', {}, [
            el('p', { class: 'kpi-label' }, 'Members Inside Right Now'),
            el('div', { class: 'kpi-row', style: { marginTop: '10px' } }, [
              el('span', { class: 'kpi-v' }, `${s.gateStats.insideCount} / ${s.capacity}`),
              el('span', { class: 'delta' }, `${pct}% Full`),
            ]),
          ]),
          el('div', { class: 'kpi-art' }, donut(pct, { size: 62, stroke: 11, center: false, label: 'Floor occupancy' })),
        ]),
        el('p', { class: 'kpi-sub' }, 'Shown live on the gym\'s 3D website'),
      ]),
    ]),
    card([
      el('div', { class: 'kpi' }, [
        el('p', { class: 'kpi-label' }, 'Tracked IN Today (Coming)'),
        el('div', { class: 'kpi-row', style: { marginTop: '10px' } }, [
          el('span', { class: 'kpi-v' }, String(s.gateStats.entriesToday)),
          el('span', { class: 'delta' }, '+14% vs avg'),
        ]),
        el('p', { class: 'kpi-sub' }, 'CCTV Head-Tracking + QR Turnstile'),
      ]),
    ]),
    card([
      el('div', { class: 'kpi' }, [
        el('p', { class: 'kpi-label' }, 'Tracked OUT Today (Going)'),
        el('div', { class: 'kpi-row', style: { marginTop: '10px' } }, [
          el('span', { class: 'kpi-v' }, String(s.gateStats.exitsToday)),
          el('span', { class: 'delta', 'data-dir': 'flat' }, `${s.gateStats.avgDurationMins}m avg stay`),
        ]),
        el('p', { class: 'kpi-sub' }, 'Optical exit line + 120m auto-timeout'),
      ]),
    ]),
    card([
      el('div', { class: 'kpi' }, [
        el('p', { class: 'kpi-label' }, 'Expired Member Gate Flags'),
        el('div', { class: 'kpi-row', style: { marginTop: '10px' } }, [
          el('span', { class: 'kpi-v' }, String(flaggedGateEvents.length)),
          el('span', { class: 'delta', 'data-dir': flaggedGateEvents.length ? 'down' : 'flat' },
            flaggedGateEvents.length ? 'Staff Action Due' : 'All Clear'),
        ]),
        el('p', { class: 'kpi-sub' }, 'Instant front-desk alert + direct UPI link sent'),
      ]),
    ]),
  ]);

  const bars = s.gateStats.hourly.map((h) => ({
    label: h.hour,
    value: h.count,
    ghost: s.capacity,
    tip: [
      { label: `Window ${h.hour}`, value: '' },
      { dot: true, label: 'Floor Count', value: `${h.count} members` },
      { dot: 'mute', label: 'Capacity', value: `${s.capacity} max` },
    ],
  }));

  const feedCard = card([
    cardHead(
      'Live Coming & Going CCTV Head-Tracking Stream',
      el('span', { class: 'chip', 'data-s': 'ready' }, `${s.gateFeed.length} recent events`)
    ),
    el('div', { class: 'feed' },
      s.gateFeed.slice(0, 10).map((g) =>
        el('div', {
          class: 'feed-row',
          style: g.flagged ? { background: 'var(--c-spring-wash)', padding: '13px 12px', borderRadius: '12px', marginBottom: '6px' } : {},
        }, [
          el('div', {
            class: `avatar ${g.dir === 'in' ? 'avatar--ink' : ''}`,
            style: g.flagged ? { background: '#22201f', color: '#b1e743' } : {},
          }, g.dir === 'in' ? 'IN' : 'OUT'),
          el('div', { style: { minWidth: 0, flex: 1 } }, [
            el('div', { class: 'row row--wrap', style: { gap: '8px' } }, [
              el('span', { class: 'who' }, `${g.name} (${g.code} · ${g.headId || '#HT-100'})`),
              el('span', { class: 'chip', 'data-s': g.dir === 'in' ? 'ready' : 'approved' },
                g.dir === 'in' ? 'COMING → Tracked IN' : '← GOING · Tracked OUT'),
              g.flagged ? el('span', { class: 'chip', 'data-s': 'out_for_delivery' }, 'EXPIRED PLAN FLAG') : null,
            ]),
            el('div', { class: 'what', style: { marginTop: '3px' } }, `${g.method} · ${g.note}`),
          ]),
          el('div', { class: 'row' }, [
            g.flagged ? button('Collect & Renew Now', {
              kind: 'btn--spring btn--sm',
              icon: 'check',
              onclick: () => {
                const m = s.members.find((x) => x.code === g.code) || s.members[2];
                confirmMemberPayment(m.id, 'staff', `GATE-UPI-${Date.now().toString().slice(-5)}`, rerender);
              },
            }) : null,
            el('span', { class: 'when' }, g.time),
          ]),
        ])
      )),
  ], { class: 'rise' });

  const hourlyCard = card([
    cardHead('Hourly Floor Crowd Curve (06:00 – 20:00)', el('span', { class: 'card-t' }, 'PEAK WINDOW: 18:00–20:00')),
    barChart(bars, { height: 240, formatY: (v) => `${Math.round(v)}` }),
    el('div', { class: 'notice', style: { marginTop: '16px', fontSize: '13px' } }, [
      el('b', {}, 'Live Website Crowd Sync: '),
      'Members check live floor occupancy on your 3D website before leaving home — eliminating peak-hour crowding complaints.',
    ]),
  ], { class: 'rise' });

  return el('div', { class: 'view grid', id: 'view' }, [
    controlBanner,
    cctvViewport,
    kpis,
    el('div', { class: 'grid grid--board' }, [hourlyCard, feedCard]),
  ]);
}

// ===========================================================================
// 4 · LEAD RECORDER, MOBILE/LAPTOP AUTOMATION COMMAND & LOCAL SEO RADAR
// ===========================================================================

export function leadsScreen(ctx) {
  const s = getStore();
  const rerender = () => ctx.go('leads');

  const switchItems = [
    { key: 'aiAgent24x7',              title: '24/7 AI Gym Agent & Message Recorder', sub: 'Records every WhatsApp/Instagram message & sends instant workout + payment replies' },
    { key: 'countdownCadence',         title: 'D-7, D-6, D-3, D-2, D-1 + Weekly Pay Links', sub: 'Sends direct 1-tap UPI links automatically and suppresses on verified payment' },
    { key: 'cctvHeadTracking',         title: 'CCTV Camera AI Head-Tracking (IN/OUT)', sub: 'Counts people coming & going via existing cameras and updates live 3D website' },
    { key: 'tenMinSupplementDelivery', title: 'Complete Supplement Sets (10-Min Delivery)', sub: 'Auto-dispatches rider with 6-digit OTP when a member orders a supplement stack' },
    { key: 'localSeoRadar',            title: 'Nearby Area Local SEO Traffic Engine', sub: 'Captures nearby "gym near me" search traffic within 5km radius' },
    { key: 'freeTrial15DayRefund',     title: 'Free Trial + 15-Day 100% Refund Guarantee', sub: 'Auto-offers free trial pass to leads & displays 15-day refund guarantee' },
  ];

  const commandCard = card([
    cardHead(
      'Mobile & Laptop Master Automation Control Center (Control Everything From Anywhere)',
      el('span', { class: 'chip', 'data-s': 'ready' }, 'SYNCED ACROSS PHONE & LAPTOP')
    ),
    el('div', {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
        gap: '12px',
      },
    }, switchItems.map((item) => {
      const isOn = s.switches?.[item.key] !== false;
      return el('div', {
        class: 'job-items',
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          border: isOn ? '1.5px solid #22201f' : '1px solid var(--line)',
        },
      }, [
        el('div', {}, [
          el('div', { style: { fontWeight: '700', fontSize: '14px' } }, item.title),
          el('div', { class: 'muted', style: { fontSize: '12.5px', marginTop: '3px' } }, item.sub),
        ]),
        button(isOn ? 'ON · Active' : 'Paused', {
          kind: isOn ? 'btn--spring btn--sm' : 'btn--sm',
          onclick: () => {
            s.switches[item.key] = !isOn;
            saveStore();
            toast(`${item.title}: ${!isOn ? 'ENABLED' : 'PAUSED'} (Synced to Mobile & Laptop)`);
            rerender();
          },
        }),
      ]);
    })),
  ], { class: 'rise' });

  const stages = [
    { key: 'new',          label: 'Recorded Enquiry (<2s Ack)' },
    { key: 'contacted',    label: '24/7 Agent Engaged' },
    { key: 'trial_booked', label: 'Free Trial Booked' },
    { key: 'joined',       label: 'Joined (Paid Member)' },
  ];

  const pipe = el('div', { class: 'pipe rise' },
    stages.map((st) => {
      const count = s.leads.filter((l) => l.stage === st.key).length;
      return el('button', {
        class: `pipe-step${s.leadFilter === st.key ? ' is-hot' : ''}`,
        onclick: () => { s.leadFilter = s.leadFilter === st.key ? 'all' : st.key; rerender(); },
      }, [el('b', {}, String(count)), el('span', {}, st.label)]);
    }));

  const rows = s.leads.filter((l) => s.leadFilter === 'all' || l.stage === s.leadFilter);

  const tableCard = card([
    cardHead(
      'Omni-Channel Lead Recorder (WhatsApp, Google Maps SEO, Instagram & Free Trial Pipeline)',
      button('+ Simulate Nearby Area SEO Lead', {
        kind: 'btn--spring btn--sm',
        icon: 'plus',
        onclick: () => {
          const sampleNames = ['Rohit Vemula', 'Shruti Nambiar', 'Aditya Bhupathi', 'Neha Reddy'];
          const picked = sampleNames[Math.floor(Math.random() * sampleNames.length)];
          s.leads.unshift({
            id: `LD-${Date.now().toString().slice(-4)}`,
            name: picked,
            phone: `9849${Math.floor(100000 + Math.random() * 899999)}`,
            source: 'Nearby Area Local SEO (2.1 km away)',
            interest: 'Free Trial + 3M Strength + Supplement Set',
            stage: 'new',
            time: 'Just now',
            note: '24/7 Agent recorded enquiry, sent Free Trial Pass + Indoor/Outdoor starter workout in 1.1s',
          });
          saveStore();
          toast(`Recorded new Local SEO lead from ${picked} & dispatched Free Trial pass!`);
          rerender();
        },
      }),
      s.leadFilter !== 'all' ? button('Show All', { kind: 'btn--sm', onclick: () => { s.leadFilter = 'all'; rerender(); } }) : null
    ),
    el('div', { class: 'table-wrap' },
      el('table', { class: 'table' }, [
        el('thead', {}, el('tr', {}, [
          el('th', {}, 'Lead / Phone'),
          el('th', {}, 'Nearby Source & Interest'),
          el('th', {}, 'Current Stage'),
          el('th', {}, '24/7 Agent Recorded Trail'),
          el('th', { class: 'num' }, 'Next Step'),
        ])),
        el('tbody', {}, rows.map((l) =>
          el('tr', {}, [
            el('td', {}, [
              el('div', { class: 'strong' }, l.name),
              el('div', { class: 'muted mono', style: { fontSize: '12.5px' } }, `+91 ${readPhone(l.phone)} · ${l.time}`),
            ]),
            el('td', {}, [
              el('div', { class: 'strong' }, l.interest),
              el('div', { class: 'muted', style: { fontSize: '12.5px' } }, l.source),
            ]),
            el('td', {}, el('span', {
              class: 'chip',
              'data-s': l.stage === 'joined' ? 'ready' : l.stage === 'trial_booked' ? 'preparing' : 'approved',
            }, l.stage.replace('_', ' ').toUpperCase())),
            el('td', {}, el('span', { style: { fontSize: '13.5px' } }, l.note)),
            el('td', { class: 'num' },
              el('div', { class: 'row', style: { justifyContent: 'flex-end' } }, [
                l.stage === 'new' ? button('Book Free Trial', {
                  kind: 'btn--sm',
                  onclick: () => {
                    l.stage = 'trial_booked';
                    l.note = 'Free Trial booked for 6:00 PM today · WhatsApp pin + workout plan sent';
                    saveStore();
                    toast(`Free Trial booked for ${l.name}`);
                    rerender();
                  },
                }) : null,
                l.stage !== 'joined' ? button('Convert to Paid Member', {
                  kind: 'btn--spring btn--sm',
                  icon: 'check',
                  onclick: () => {
                    l.stage = 'joined';
                    l.note = 'Converted to Active Member · Added to D-7..D-1 Countdown Registry';
                    const idNum = 101 + s.members.length;
                    s.members.unshift({
                      id: `M-${idNum}`,
                      code: `IP-M${idNum}`,
                      name: l.name,
                      phone: l.phone,
                      plan: '3 Months Strength + Cardio',
                      durationDays: 90,
                      amount: 4500,
                      daysToExpiry: 90,
                      status: 'active',
                      paymentStatus: 'paid',
                      remindersSuppressed: true,
                      lastReminder: 'SUPPRESSED — New Member Joined Today',
                      lastReminderState: 'suppressed',
                      utr: `UTR-NEW-${idNum}`,
                      insideNow: true,
                      checkInMinsAgo: 1,
                    });
                    s.baseCollectedMonth += 4500;
                    saveStore();
                    toast(`${l.name} converted to Paid Member (+₹4,500)!`);
                    rerender();
                  },
                }) : el('span', { class: 'chip', 'data-s': 'ready' }, 'Member Active'),
              ].filter(Boolean))),
          ])
        )),
      ])),
  ], { class: 'card--flush rise' });

  const seoCard = card([
    cardHead(
      'Nearby Area Local SEO & Hyperlocal Traffic Radar (Know Everyone Searching in Your Area)',
      el('span', { class: 'chip', 'data-s': 'ready' }, '6,100+ MONTHLY NEARBY SEARCHES')
    ),
    el('p', { class: 'muted', style: { fontSize: '13.5px', marginBottom: '12px' } },
      'Even if a gym chooses not to run 10-minute delivery, the 3D Website + Local SEO Engine ranks across nearby neighbourhoods and captures high-intent prospects into the Lead Recorder.'),
    el('div', { class: 'table-wrap' },
      el('table', { class: 'table' }, [
        el('thead', {}, el('tr', {}, [
          el('th', {}, 'Nearby Corridor (5km Radius)'),
          el('th', {}, 'Monthly Search Traffic'),
          el('th', {}, 'Top Ranking Keyword'),
          el('th', {}, 'Leads Captured This Month'),
          el('th', {}, 'Trial Conversion'),
        ])),
        el('tbody', {}, (s.seoAreas || []).map((a) =>
          el('tr', {}, [
            el('td', { class: 'strong' }, a.corridor),
            el('td', { class: 'mono strong' }, a.searches),
            el('td', { class: 'mono', style: { fontSize: '12.5px' } }, a.topKeyword),
            el('td', {}, el('span', { class: 'chip', 'data-s': 'ready' }, `${a.leadsCaptured} Recorded Leads`)),
            el('td', { class: 'mono strong' }, a.conversion),
          ])
        )),
      ])),
  ], { class: 'card--flush rise' });

  return el('div', { class: 'view grid', id: 'view' }, [commandCard, pipe, tableCard, seoCard]);
}

// ===========================================================================
// 5 · OUTREACH & ₹60,000 CLOSER BOARD (Fastest Deal-Closing Scripts)
// ===========================================================================

function openScriptModal(lead) {
  const pitchUrl = `${location.origin}/`;
  const demoUrl = `${location.origin}/admin/?demo=1#/renewals`;

  const firstTouchText =
    `Hi ${lead.owner}, Koushik here from Hyderabad. Quick question about *${lead.gym}* — ` +
    `when members are 7 days away from expiry, does your system automatically message them on Day 7, Day 6, Day 3, Day 2, and Day 1 with a direct payment link, or is your desk still chasing them manually?\n\n` +
    `I built *IRONPULSE AI OS™* — a complete 24/7 AI Agent + Message Recorder, Indoor/Outdoor Workout Planner, CCTV AI Head-Tracking live floor count, and 10-Minute Supplement E-Commerce Store (${pitchUrl}).\n\n` +
    `We offer a *Free Live Trial* + a *15-Day 100% Unconditional Refund Guarantee*. Can I show you the 60-second live demo?`;

  const callOpener =
    `"Hi Brother, Koushik here from Hyderabad. I just sent you a live system link on WhatsApp for ${lead.gym}.\n\n` +
    `Look, I know every month 30–50 members delay paying their renewal because nobody messages them on Day 7, Day 6, Day 3, Day 2, and Day 1 with a direct 1-tap UPI link.\n\n` +
    `We install a complete ₹1,00,000 AI Gym Operating System for ₹19,999 one-time:\n` +
    `1. 24/7 AI Agent that records every message, sends D-7/6/3/2/1 + Weekly direct payment links, and builds custom Indoor + Outdoor workout plans for your members.\n` +
    `2. Software on your existing CCTV camera that tracks every head coming IN and going OUT and shows live crowd count on your new 3D Website.\n` +
    `3. Complete Supplement Set E-Commerce Store with 10-minute delivery (or Local SEO radar to capture every person searching for a gym in ${lead.area}).\n\n` +
    `Best part: You get a Free Trial first, and a written 15-Day 100% Unconditional Refund Guarantee if anything doesn't work. Open the link on your phone right now — let me show you the button in 30 seconds."`;

  const body = el('div', { class: 'f-stack' }, [
    el('div', { class: 'notice', 'data-kind': 'go' }, [
      el('b', {}, `${lead.gym} · ${lead.area}`),
      el('p', { style: { fontSize: '13px', marginTop: '4px' } }, `Identified Pain: ${lead.pain}`),
    ]),
    el('div', {}, [
      el('p', { class: 'card-t', style: { marginBottom: '6px' } }, '1. Irresistible WhatsApp Opener (Send With 4-Page PDF)'),
      el('pre', { class: 'notice mono', style: { whiteSpace: 'pre-wrap', fontSize: '12.5px' } }, firstTouchText),
    ]),
    el('div', {}, [
      el('p', { class: 'card-t', style: { marginBottom: '6px' } }, '2. 30-Second Fastest Deal-Closer Phone Script'),
      el('pre', { class: 'notice mono', style: { whiteSpace: 'pre-wrap', fontSize: '12.5px' } }, callOpener),
    ]),
    el('div', {}, [
      el('p', { class: 'card-t', style: { marginBottom: '6px' } }, '3. Instant Deal-Closing Lever (Zero Risk to Owner)'),
      el('div', { class: 'job-items', style: { fontSize: '13px' } }, [
        el('div', {}, [el('b', {}, 'The "Free Trial + 15-Day 100% Refund" Close: '), '"Brother, don\'t trust my words. Let\'s turn on the 7-Day Free Trial on your last 50 expiring members today. Even after we deploy, you are protected by a written 15-Day 100% Unconditional Refund Guarantee. If it doesn\'t recover your investment in the first 2 weeks, I refund 100% on the spot."']),
      ]),
    ]),
  ]);

  modal(`Fastest Closer Script · ${lead.gym}`, body, [
    button('Open WhatsApp with Message', {
      kind: 'btn--spring',
      onclick: () => {
        window.open(`https://wa.me/${lead.phone}?text=${encodeURIComponent(firstTouchText)}`, '_blank', 'noopener');
      },
    }),
    button('Copy Pitch + Live Demo Link', {
      kind: 'btn--ink',
      onclick: () => {
        navigator.clipboard?.writeText(`${firstTouchText}\n\nLive Console: ${demoUrl}`);
        toast('Copied personalized WhatsApp message + demo link');
      },
    }),
  ]);
}

export function outreachScreen(ctx) {
  const s = getStore();
  const rerender = () => ctx.go('outreach');

  const closedDeals = s.outreachLeads.filter((l) => l.status === 'closed');
  const closedTotal = closedDeals.reduce((t, l) => t + l.dealValue, 0);
  const targetTotal = 60000;
  const pct = Math.min(100, Math.round((closedTotal / targetTotal) * 100));

  const headerCard = el('div', {
    class: 'card card--ink rise',
    style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' },
  }, [
    el('div', {}, [
      el('div', { class: 'row row--wrap', style: { gap: '8px', marginBottom: '6px' } }, [
        el('span', { class: 'chip', 'data-s': 'ready' }, 'DAILY TARGET: ₹60,000 (3 × ₹20,000 CLOSES)'),
        el('span', { class: 'chip', 'data-s': 'out_for_delivery' }, `${closedValueLabel(closedTotal)} / ₹60,000 CLOSED (${pct}%)`),
      ]),
      el('h2', { style: { fontSize: '19px', fontWeight: '700' } },
        'Hyderabad Gym Closer Desk — Free Trial + 15-Day 100% Refund Pitch Scripts'),
      el('p', { style: { color: 'rgba(255,255,255,.72)', fontSize: '13.5px', marginTop: '4px' } },
        'Pitch the 5-in-1 IRONPULSE AI OS™ stack (24/7 Agent + D-7/6/3/2/1 Pay Links + CCTV Head-Tracking + 10-Min Supplement Store + Local SEO) with a 15-Day 100% Refund Guarantee.'),
    ]),
    el('div', { class: 'row row--wrap' }, [
      button('Open Owner Blueprint LP (/)', {
        kind: 'btn--spring btn--sm',
        onclick: () => window.open('../', '_blank', 'noopener'),
      }),
      button('Download 4-Page Quotation PDF', {
        kind: 'btn--sm',
        onclick: () => window.open('../pitch/Koushik_Gym_Revenue_Recovery_OS_Quotation.pdf', '_blank', 'noopener'),
      }),
    ]),
  ]);

  const table = card([
    cardHead('Qualified Independent Gyms (Hyderabad High-Volume Corridors)', el('span', { class: 'card-t' }, 'QUALIFICATION SCORE / 10')),
    el('div', { class: 'table-wrap' },
      el('table', { class: 'table' }, [
        el('thead', {}, el('tr', {}, [
          el('th', {}, 'Gym & Corridor'),
          el('th', {}, 'Est. Members / Fit Score'),
          el('th', {}, 'Identified Operational Pain'),
          el('th', {}, 'Recommended Package'),
          el('th', {}, 'Status'),
          el('th', { class: 'num' }, 'Outreach Actions'),
        ])),
        el('tbody', {}, s.outreachLeads.map((l) =>
          el('tr', {}, [
            el('td', {}, [
              el('div', { class: 'strong' }, l.gym),
              el('div', { class: 'muted', style: { fontSize: '12.5px' } }, `${l.area} · +${l.phone}`),
            ]),
            el('td', {}, [
              el('div', { class: 'strong mono' }, `${l.membersEst} members`),
              el('div', { class: 'muted mono', style: { fontSize: '12px' } }, `Fit Score: ${l.score}/10`),
            ]),
            el('td', { style: { maxWidth: '300px', fontSize: '13.5px' } }, l.pain),
            el('td', {}, [
              el('div', { class: 'strong mono' }, money(l.dealValue)),
              el('div', { class: 'muted', style: { fontSize: '12px' } }, l.dealValue > 20000 ? 'Full ₹1L AI OS Suite' : 'IRONPULSE Core OS'),
            ]),
            el('td', {}, el('span', {
              class: 'chip',
              'data-s': l.status === 'closed' ? 'ready' : l.status === 'demo_sent' ? 'preparing' : 'new',
            }, l.status === 'closed' ? 'CLOSED ✓' : l.status === 'demo_sent' ? 'Demo Sent' : 'Ready to Call')),
            el('td', { class: 'num' },
              el('div', { class: 'row', style: { justifyContent: 'flex-end' } }, [
                button('Call & WhatsApp Script', {
                  kind: 'btn--sm',
                  onclick: () => openScriptModal(l),
                }),
                l.status !== 'closed' ? button('Mark Closed', {
                  kind: 'btn--spring btn--sm',
                  icon: 'check',
                  onclick: () => {
                    l.status = 'closed';
                    saveStore();
                    toast(`Closed ${l.gym} for ${money(l.dealValue)}!`);
                    rerender();
                  },
                }) : button('Reopen', {
                  kind: 'btn--ghost btn--sm',
                  onclick: () => { l.status = 'to_call'; saveStore(); rerender(); },
                }),
              ])),
          ])
        )),
      ])),
  ], { class: 'card--flush rise' });

  return el('div', { class: 'view grid', id: 'view' }, [headerCard, table]);
}

function closedValueLabel(v) {
  return `₹${Number(v || 0).toLocaleString('en-IN')}`;
}
