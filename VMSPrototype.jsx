import React, { useState, useMemo, useEffect } from "react";
import {
  LayoutDashboard, Users, Building2, Car, ArrowLeftRight, CreditCard,
  Video, FileBarChart, ScrollText, ChevronDown, Search, Plus, Pencil,
  Trash2, X, Camera, DoorOpen, Save, CheckCircle2, Bell, Clock,
  CircleUser, ShieldCheck, Building, HardHat, Truck, Bus, Printer,
  AlertTriangle, MapPin, Filter, RotateCcw, Terminal,
  Lock, Mail, User as UserIcon, LogOut, Eye, EyeOff, AlertCircle, Menu,
  ChevronLeft, ChevronRight, SlidersHorizontal, ArrowDownUp, Link2, CornerDownRight,
} from "lucide-react";

/* =========================================================================
   CAINIAO SMART GATEWAY — VMS Portal Prototype (Smart Cainiao Hub 智慧菜鳥港)
   Single-file interactive prototype for client approval.
   Theme: Light / white surfaces · Cainiao Blue (#1A5CFF) primary accent.
   Stack: React + Tailwind CSS + lucide-react. All data is mock / in-memory.
   ========================================================================= */

// Cainiao brand blue (sampled from logo). Use as primary action / accent.
const CN = {
  solid: "bg-[#1A5CFF] hover:bg-[#1550e6] text-white",
  text: "text-[#1A5CFF]",
  softBg: "bg-[#1A5CFF]/10",
  softRing: "ring-[#1A5CFF]/25",
};

/* =========================================================================
   BACKEND / HARDWARE INTEGRATION PLACEHOLDERS
   -------------------------------------------------------------------------
   Everything below is stubbed for the prototype. Each method marks WHERE the
   real backend / hardware call goes. Swap the mock bodies for live calls
   during development — the UI already calls these, so wiring is centralised.
   ========================================================================= */
const API_BASE = "/api"; // TODO: point to real gateway base URL / env var

const api = {
  /* --- Authentication backend (replace front-end memory with real auth) ---
     TODO: password hashing (bcrypt/argon2), JWT or server session, refresh
     tokens, "remember me" persistence, RBAC claims from server. */
  login:    async (login, password) => { /* TODO POST `${API_BASE}/auth/login` */ return null; },
  register: async (payload)          => { /* TODO POST `${API_BASE}/auth/register` */ return null; },
  logout:   async ()                 => { /* TODO POST `${API_BASE}/auth/logout` */ },

  /* --- Live data (replace static mock with REST + WebSocket streaming) ---
     TODO: REST for tables; WebSocket/MQTT for real-time ANPR plate reads,
     loop-detector occupancy and gate state events. */
  getFloorOccupancy:   async ()   => { /* TODO GET `${API_BASE}/occupancy` */ return FLOOR_OCC; },
  getRecords:          async (q)  => { /* TODO GET `${API_BASE}/records` (filters in q) */ },
  subscribeGateEvents: (onEvent)  => { /* TODO ws://… ANPR / loop-detector / barrier events */ return () => {}; },

  /* --- Real gate control (replace toast with relay / PLC / barrier command) ---
     TODO: POST to gate controller -> trigger barrier relay; persist manual-open
     reason + operator to audit trail. */
  openGate: async (floor, gate, reason, remark) => { /* TODO POST `${API_BASE}/gate/open` */ return true; },

  /* --- Charts data feed (replace CSS bars with a charting library) ---
     TODO: GET time-series for dashboard; render with Recharts / Chart.js. */
  getDashboardSeries: async () => { /* TODO GET `${API_BASE}/dashboard/series` */ },

  /* --- Reports / Excel export (replace toast with server-side generation) ---
     TODO: GET report as .xlsx stream and download. */
  exportReport: async (type, range) => { /* TODO GET `${API_BASE}/reports/${type}.xlsx` */ },
};

/* Lazy-load a script once (used for client-side PDF generation). */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src; s.onload = () => resolve(); s.onerror = reject;
    document.head.appendChild(s);
  });
}

/* Bilingual (中英對照) receipt printed via the browser — drives a real/thermal
   receipt printer through the print dialog (and supports "Save as PDF"). Chinese
   renders natively, unlike jsPDF's Latin-only built-in fonts. 80mm layout. */
function printReceiptDoc(r) {
  const money = `HK$ ${Number(r.amount).toFixed(2)}`;
  const rows = [
    ["License Plate", "車牌", r.lpn],
    ["Tenant", "租戶", r.tenant],
    ["Floor / Gate", "樓層 / 閘口", `${r.floor} · ${r.gate}`],
    ["Vehicle Type", "車種", r.vehicleType],
    ["Entry Time", "入場時間", r.entry],
    ["Exit Time", "出場時間", r.exit],
    ["Payment Time", "付款時間", r.payTime],
    ["Payment Method", "付款方式", r.method],
    ["Transaction No", "交易編號", r.txnNo || "-"],
  ];
  const rowsHtml = rows.map(([en, zh, v]) =>
    `<tr><td class="k"><div>${en}</div><div class="zh">${zh}</div></td><td class="v">${v}</td></tr>`
  ).join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Receipt ${r.receiptNo || ""}</title>
  <style>
    @page { size: 80mm auto; margin: 4mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { width: 72mm; margin: 0 auto; font-family: "Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif; color: #111; font-size: 12px; }
    .hd { text-align:center; border-bottom:2px solid #1A5CFF; padding-bottom:6px; margin-bottom:8px; }
    .hd .b { font-weight:700; font-size:14px; color:#1A5CFF; letter-spacing:.5px; }
    .hd .s { font-size:11px; color:#444; margin-top:2px; }
    .ttl { text-align:center; font-weight:700; margin:6px 0; }
    .ttl .zh { font-weight:400; font-size:11px; color:#555; }
    .rno { text-align:center; font-size:11px; color:#666; margin-bottom:6px; }
    table { width:100%; border-collapse:collapse; }
    td { padding:4px 0; vertical-align:top; border-bottom:1px dotted #ccc; }
    td.k { color:#555; font-size:11px; }
    td.k .zh { color:#999; font-size:10px; }
    td.v { text-align:right; font-weight:600; font-family:"Courier New",monospace; }
    .total { display:flex; justify-content:space-between; align-items:center; margin-top:8px; padding:8px; background:#eef3ff; border-radius:6px; font-weight:700; color:#1A5CFF; }
    .total .zh { font-size:10px; color:#5577cc; font-weight:400; }
    .ft { text-align:center; color:#888; font-size:9.5px; margin-top:10px; line-height:1.5; }
  </style></head><body>
    <div class="hd"><div class="b">CAINIAO SMART GATEWAY</div><div class="s">Smart Cainiao Hub · 智慧菜鳥港</div></div>
    <div class="ttl">OFFICIAL RECEIPT<div class="zh">正式收據</div></div>
    <div class="rno">Receipt No / 收據編號: ${r.receiptNo || "CN-" + (r.id ?? 0)}</div>
    <table>${rowsHtml}</table>
    <div class="total"><span>TOTAL PAID<div class="zh">應付總額</div></span><span>${money}</span></div>
    <div class="ft">This is a computer-generated receipt · 此乃電腦列印收據<br/>CBRE Facility Operations · VMS Prototype</div>
  </body></html>`;

  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(iframe);
  const d = iframe.contentWindow.document;
  d.open(); d.write(html); d.close();
  iframe.contentWindow.focus();
  setTimeout(() => { iframe.contentWindow.print(); setTimeout(() => iframe.remove(), 1500); }, 300);
}

/* Client-side PDF receipt/invoice export with sample data (jsPDF via CDN). */
async function exportReceiptPDF(r) {
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: [320, 460] });
  const blue = [26, 92, 255];
  const M = 24;

  // Header band
  doc.setFillColor(...blue); doc.rect(0, 0, 320, 70, "F");
  doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.setFontSize(16);
  doc.text("CAINIAO SMART GATEWAY", M, 32);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  // NOTE: jsPDF's built-in fonts are Latin-only — CJK text would render as garbled
  // boxes, so the receipt is kept English-only.
  doc.text("Smart Cainiao Hub - Carpark Payment Receipt", M, 50);

  // Customer-facing receipt — always a clean OFFICIAL RECEIPT with the correct plate.
  // Plate corrections are internal/audit only and never disclosed to the customer.
  doc.setTextColor(30); doc.setFont("helvetica", "bold"); doc.setFontSize(13);
  doc.text("OFFICIAL RECEIPT", M, 100);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(120);
  doc.text(`Receipt No: ${r.receiptNo ?? "CN-" + (r.id ?? 0).toString().padStart(6, "0")}`, M, 116);

  // Rows
  const rows = [
    ["License Plate (LPN)", r.lpn],
    ["Tenant", r.tenant],
    ["Floor / Gate", `${r.floor} · ${r.gate}`],
    ["Vehicle Type", r.vehicleType],
    ["Entry Time", r.entry],
    ["Exit Time", r.exit],
    ["Payment Time", r.payTime],
    ["Payment Method", r.method],
    ["Transaction No", r.txnNo || "-"],
  ];
  let y = 142; doc.setFontSize(10);
  rows.forEach(([k, v]) => {
    doc.setTextColor(120); doc.setFont("helvetica", "normal"); doc.text(String(k), M, y);
    doc.setTextColor(30); doc.setFont("helvetica", "bold"); doc.text(String(v), 320 - M, y, { align: "right" });
    doc.setDrawColor(235); doc.line(M, y + 8, 320 - M, y + 8);
    y += 26;
  });

  // Total
  y += 6; doc.setFillColor(240, 245, 255); doc.rect(M, y, 320 - M * 2, 36, "F");
  doc.setTextColor(...blue); doc.setFont("helvetica", "bold"); doc.setFontSize(12);
  doc.text("TOTAL PAID", M + 10, y + 23);
  doc.text(`HK$ ${Number(r.amount).toFixed(2)}`, 320 - M - 10, y + 23, { align: "right" });

  // Footer
  doc.setTextColor(150); doc.setFont("helvetica", "normal"); doc.setFontSize(7.5);
  doc.text("This is a computer-generated receipt. CBRE Facility Operations.", M, 440);
  doc.text("Retention: 7 years · VMS Prototype sample data", M, 451);

  doc.save(`receipt_${r.lpn}.pdf`);
}

/* ----------------------------- Business Logic ---------------------------- */
// Floor gate rules:
//  L1            -> Main gates (Main Gate A / Main Gate B)
//  L2 - L5       -> North Gate + South Gate
//  L6 - L12      -> South Gate only
const FLOORS = Array.from({ length: 12 }, (_, i) => `L${i + 1}`);

function gatesForFloor(floor) {
  if (floor === "L1") return ["Main Gate A", "Main Gate B"];
  const n = parseInt(floor.slice(1), 10);
  if (n >= 2 && n <= 5) return ["North Gate", "South Gate"];
  return ["South Gate"]; // L6 - L12
}

// Role-Based Access Control — which modules each role may open.
const ROLES = {
  BMO:    { label: "BMO", sub: "Cainiao Employee", icon: ShieldCheck, color: "blue" },
  Tenant: { label: "Tenant", sub: "Office Renter", icon: Building, color: "violet" },
  Guard:  { label: "Guard", sub: "CBRE Security", icon: HardHat, color: "amber" },
  FM:     { label: "FM", sub: "CBRE Facility Mgmt", icon: Users, color: "emerald" },
};

const MODULE_ACCESS = {
  dashboard:  ["BMO", "Tenant", "Guard", "FM"],
  users:      ["BMO", "Tenant"], // Tenant admins manage their own tenant's users

  tenants:    ["BMO", "FM"],
  vehicles:   ["BMO", "Tenant"],
  records:    ["BMO", "Guard", "FM"],
  pos:        ["BMO", "FM"],
  cctv:       ["BMO", "Guard"],
  reports:    ["BMO", "FM", "Tenant"],
  audit:      ["BMO"],
  syslog:     ["BMO"],
};

/* ------------------------------- Mock Data ------------------------------- */
// floors[] = carpark floors assigned to the tenant (no gate needed at tenant level).
// status + activeFrom/activeTo control whether the tenant (and its users) may log in.
const TENANTS = [
  { id: 1, en: "Cainiao Logistics HK", zh: "菜鳥物流香港", email: "ops@cainiao.hk", phone: "+852 2888 1000", floor: "L3", gate: "North Gate", floors: ["L3", "L8"], whitelist: 50, spaceLimit: 30, used: 24, status: "Active", activeFrom: "2026-01-01", activeTo: "2026-12-31", logo: null, whitelistPlates: ["RA1234", "TM5566", "CN8888"], blacklistPlates: ["BX0001"] },
  { id: 2, en: "DHL Express Asia", zh: "敦豪速遞亞洲", email: "hub@dhl.com", phone: "+852 2400 3388", floor: "L4", gate: "South Gate", floors: ["L4"], whitelist: 40, spaceLimit: 25, used: 19, status: "Active", activeFrom: "2026-01-01", activeTo: "2026-12-31", logo: null },
  { id: 3, en: "SF Express", zh: "順豐速運", email: "depot@sf-express.com", phone: "+852 2730 0273", floor: "L2", gate: "North Gate", floors: ["L2"], whitelist: 35, spaceLimit: 20, used: 18, status: "Active", activeFrom: "2026-01-01", activeTo: "2026-12-31", logo: null },
  { id: 4, en: "Kerry Logistics", zh: "嘉里物流", email: "fleet@kerrylogistics.com", phone: "+852 2410 3600", floor: "L6", gate: "South Gate", floors: ["L6"], whitelist: 30, spaceLimit: 18, used: 8, status: "Active", activeFrom: "2026-01-01", activeTo: "2026-12-31", logo: null },
  { id: 5, en: "JD Logistics HK", zh: "京東物流香港", email: "hk@jdl.com", phone: "+852 3622 1200", floor: "L7", gate: "South Gate", floors: ["L7", "L10"], whitelist: 28, spaceLimit: 15, used: 12, status: "Active", activeFrom: "2026-01-01", activeTo: "2026-12-31", logo: null },
  { id: 6, en: "Yamato Transport", zh: "大和運輸", email: "hub@yamato.hk", phone: "+852 2865 0000", floor: "L5", gate: "South Gate", floors: ["L5"], whitelist: 22, spaceLimit: 12, used: 7, status: "Active", activeFrom: "2026-01-01", activeTo: "2026-12-31", logo: null },
  { id: 7, en: "FedEx Trade Networks", zh: "聯邦快遞", email: "ops@fedex.com", phone: "+852 2730 3333", floor: "L9", gate: "South Gate", floors: ["L9"], whitelist: 20, spaceLimit: 10, used: 9, status: "Active", activeFrom: "2026-01-01", activeTo: "2026-12-31", logo: null },
  { id: 8, en: "Lalamove Fleet", zh: "貨拉拉車隊", email: "fleet@lalamove.com", phone: "+852 3008 0000", floor: "L11", gate: "South Gate", floors: ["L11", "L12"], whitelist: 18, spaceLimit: 8, used: 3, status: "Inactive", activeFrom: "2026-01-01", activeTo: "2026-05-31", logo: null },
];

// A tenant (and therefore its users) can sign in only while it is Active and within its period.
function isTenantActive(t) {
  if (!t) return false;
  if (t.status !== "Active") return false;
  if (t.activeFrom && TODAY < t.activeFrom) return false;
  if (t.activeTo && TODAY > t.activeTo) return false;
  return true;
}

// "Today" reference for activation-date logic (accounts active in the future show as Scheduled).
const TODAY = "2026-06-19";
// Capabilities a Tenant admin can grant to the sub-users they create.
const TENANT_PERMISSIONS = ["View In/Out Records", "Manage Vehicle Whitelist", "View CCTV", "View POS / Payments"];

const USERS = [
  { id: 1, name: "Andy Chan", account: "andy.chan", role: "BMO", status: "Active", tenant: "", activeFrom: "2026-01-01", permissions: [] },
  { id: 2, name: "Tenant Admin (Cainiao)", account: "cainiao.admin", role: "Tenant", status: "Active", tenant: "Cainiao Logistics HK", activeFrom: "2026-01-15", permissions: [...TENANT_PERMISSIONS] },
  { id: 3, name: "Wong Ka Ho", account: "kaho.wong", role: "Guard", status: "Active", tenant: "", activeFrom: "2026-02-01", permissions: [] },
  { id: 4, name: "Priya Sharma", account: "priya.fm", role: "FM", status: "Active", tenant: "", activeFrom: "2026-01-20", permissions: [] },
  { id: 5, name: "Tenant Admin (DHL)", account: "dhl.admin", role: "Tenant", status: "Inactive", tenant: "DHL Express Asia", activeFrom: "2026-07-01", permissions: ["View In/Out Records", "View CCTV"] },
  { id: 6, name: "Lau Chi Keung", account: "ck.lau", role: "Guard", status: "Active", tenant: "", activeFrom: "2026-03-01", permissions: [] },
  { id: 7, name: "Cainiao Gate Operator", account: "cn.gate01", role: "Tenant", status: "Active", tenant: "Cainiao Logistics HK", activeFrom: "2026-03-10", permissions: ["View In/Out Records", "Manage Vehicle Whitelist"] },
];

// Mock credential store for the login / register flow (prototype only — not secure).
// Default password for every seeded account: "cainiao123".
const SEED_ACCOUNTS = [
  { login: "andy.chan", password: "cainiao123", name: "Andy Chan", role: "BMO", email: "andy.chan@cainiao.hk" },
  { login: "kaho.wong", password: "cainiao123", name: "Wong Ka Ho", role: "Guard", email: "kaho.wong@cbre.com" },
  { login: "priya.fm", password: "cainiao123", name: "Priya Sharma", role: "FM", email: "priya.sharma@cbre.com" },
  { login: "cainiao.admin", password: "cainiao123", name: "Tenant Admin (Cainiao)", role: "Tenant", email: "admin@cainiao.hk", tenant: "Cainiao Logistics HK" },
];

const VEHICLE_TYPES = ["Private Car", "Van", "Truck"];
const VEHICLE_CATEGORIES = ["Whitelist", "Monthly Parking", "Temp", "Blacklist", "BMO"];
// Category options on the Add Vehicle form. Picking "Tenant" reveals a parking
// sub-type + tenant name; the other options are stored as the category directly.
const VEHICLE_TOP_CATEGORIES = ["BMO", "Temp", "Tenant", "Whitelist", "Blacklist", "Monthly Parking"];
const TENANT_PARKING_TYPES = ["Whitelist", "Blacklist", "Monthly Parking"];

// P4: soft-delete + audit — each record carries status & DB audit timestamps.
const VEHICLES = [
  { id: 1, lpn: "RA1234", vehicleType: "Private Car", tenant: "Cainiao Logistics HK", category: "Whitelist", gate: "North Gate", floor: "L3", from: "2026-01-01", to: "2026-12-31", priority: 1, status: "Active", createdAt: "2026-01-01 08:00", modifiedAt: "2026-06-10 14:22", deletedAt: null },
  { id: 2, lpn: "VP8821", vehicleType: "Van", tenant: "DHL Express Asia", category: "Monthly Parking", gate: "South Gate", floor: "L4", from: "2026-06-01", to: "2026-06-30", priority: 1, status: "Active", createdAt: "2026-06-01 09:10", modifiedAt: "2026-06-01 09:10", deletedAt: null },
  { id: 3, lpn: "TM5566", vehicleType: "Truck", tenant: "SF Express", category: "Whitelist", gate: "North Gate", floor: "L2", from: "2026-03-15", to: "2026-09-15", priority: 2, status: "Active", createdAt: "2026-03-15 11:30", modifiedAt: "2026-05-02 16:05", deletedAt: null },
  { id: 4, lpn: "GK4099", vehicleType: "Truck", tenant: "Kerry Logistics", category: "Temp", gate: "South Gate", floor: "L6", from: "2026-06-19", to: "2026-06-19", priority: 1, status: "Deleted", createdAt: "2026-06-19 07:40", modifiedAt: "2026-06-19 07:40", deletedAt: "2026-06-19 07:58 · andy.chan" },
  { id: 5, lpn: "BX0001", vehicleType: "Private Car", tenant: "—", category: "Blacklist", gate: "—", floor: "—", from: "—", to: "—", priority: 0, status: "Active", createdAt: "2026-02-20 10:00", modifiedAt: "2026-02-20 10:00", deletedAt: null },
  { id: 6, lpn: "JD7012", vehicleType: "Van", tenant: "JD Logistics HK", category: "Whitelist", gate: "South Gate", floor: "L7", from: "2026-01-10", to: "2026-12-31", priority: 1, status: "Active", createdAt: "2026-01-10 13:15", modifiedAt: "2026-04-18 09:44", deletedAt: null, correctedFrom: null },
  // Example correction: ANPR mis-read "KL2O88" (O vs 0); guard manual-opened the gate,
  // and after the vehicle left, a corrected record was added and linked back for audit.
  { id: 7, lpn: "KL2088", vehicleType: "Truck", tenant: "Kerry Logistics", category: "Whitelist", gate: "South Gate", floor: "L6", from: "2026-06-19", to: "2026-12-31", priority: 1, status: "Active", createdAt: "2026-06-19 09:25", modifiedAt: "2026-06-19 09:25", deletedAt: null,
    correctedFrom: { plate: "KL2O88", ref: "Manual Gate Open · South Gate · L6 · 2026-06-19 08:50", reason: "ANPR mis-read (O↔0)", at: "2026-06-19 09:25 · kaho.wong" } },
];

const GATE_REASONS = ["ANPR Mis-read", "Emergency Vehicle", "VIP", "Delivery / Goods Vehicle", "Refuse Collection", "Visitor (Authorised)", "Barrier Malfunction", "Maintenance / Contractor", "Others"];

// Manual gate-open events — shared across CCTV / In-Out, and referenced by Vehicle
// Management corrections so the whole audit chain links up.
const SEED_GATE_EVENTS = [
  { id: "MG-1001", time: "2026-06-19 08:50", floor: "L6", gate: "South Gate", plate: "KL2O88", reason: "ANPR mis-read", by: "kaho.wong" },
  { id: "MG-1002", time: "2026-06-19 09:05", floor: "L3", gate: "North Gate", plate: "(unread)", reason: "No plate detected", by: "kaho.wong" },
];
const gateEventLabel = (ev) => `${ev.id} · ${ev.gate} · ${ev.floor} · ${ev.time} (${ev.plate})`;
const PAYMENT_METHODS = ["Octopus", "WeChat", "Alipay", "Visa / Master"];

// Each payment gateway returns its own transaction-reference format.
function gatewayTxn(method, i) {
  switch (method) {
    case "Octopus":      return `OCT-${5100000 + i * 137}`;
    case "WeChat":       return `WX2026${String(100000 + i * 7)}`;
    case "Alipay":       return `ALI2026${String(200000 + i * 11)}`;
    case "Visa / Master": return `VM-AUTH-${300000 + i * 53}`;
    default:             return "—";
  }
}

// Single source of truth: a set of vehicle journeys through the hub. In / Out / POS
// records and Truck Trips are all derived from these, so the same LPN appears
// everywhere and pairs up (in ↔ out ↔ payment ↔ trip).
function genJourneys() {
  const out = [];
  for (let i = 0; i < 18; i++) {
    const t = TENANTS[i % TENANTS.length];
    const gs = gatesForFloor(t.floor);
    const gate = gs[i % gs.length];
    const vt = VEHICLE_TYPES[(i * 2) % 3]; // mix incl. several trucks
    const hh = String(7 + (i % 10)).padStart(2, "0");
    const mm = String((i * 13) % 60).padStart(2, "0");
    const entry = `2026-06-19 ${hh}:${mm}`;
    const exited = i % 5 !== 0; // ~80% have exited
    const exHh = String(Math.min(21, 9 + (i % 10))).padStart(2, "0");
    const exit = exited ? `2026-06-19 ${exHh}:${mm}` : "—";
    const paid = exited && i % 4 !== 1;
    const method = PAYMENT_METHODS[i % PAYMENT_METHODS.length];
    out.push({
      id: i,
      lpn: ["RA", "VP", "TM", "GK", "JD", "LX", "PK", "HV"][i % 8] + String(1000 + i * 173),
      vehicleType: vt, gate, floor: t.floor, tenant: t.en,
      entry, exit, exited, paid,
      payTime: paid ? exit : "—", method: paid ? method : "—", amount: 25 + (i % 6) * 15,
    });
  }
  return out;
}
const JOURNEYS = genJourneys();

function genRecords(kind) {
  if (kind === "manual") {
    return JOURNEYS.slice(0, 6).map((j) => ({ id: `mg-${j.id}`, lpn: j.lpn, vehicleType: j.vehicleType, gate: j.gate, floor: j.floor, tenant: j.tenant, entry: j.entry, exit: "—" }));
  }
  if (kind === "out") {
    return JOURNEYS.filter((j) => j.exited).map((j) => ({ id: `out-${j.id}`, lpn: j.lpn, vehicleType: j.vehicleType, gate: j.gate, floor: j.floor, tenant: j.tenant, entry: j.entry, exit: j.exit }));
  }
  return JOURNEYS.map((j) => ({ id: `in-${j.id}`, lpn: j.lpn, vehicleType: j.vehicleType, gate: j.gate, floor: j.floor, tenant: j.tenant, entry: j.entry, exit: "—" }));
}

// paid = settled (receipt issued). status: Original | Corrected (superseded) | Amended (reissue).
// Derived from the same JOURNEYS as the In/Out records, so an LPN's payment links
// back to its in/out entries and truck trip.
const POS_RECORDS = JOURNEYS.filter((j) => j.exited).map((j, i) => ({
  id: i, receiptNo: `CN-${String(100200 + i)}`, lpn: j.lpn,
  gate: j.gate, vehicleType: j.vehicleType, floor: j.floor, tenant: j.tenant,
  entry: j.entry, exit: j.exit,
  payTime: j.paid ? j.payTime : "—", method: j.paid ? j.method : "—",
  txnNo: j.paid ? gatewayTxn(j.method, i) : "—",
  amount: j.amount, paid: j.paid, status: "Original", correctedFrom: null, amends: null, supersededBy: null,
}));

// Truck Trip Record — pairs each truck's full journey: which gates it passed
// and any payment action, in time order. (One trip = entry → floor gates → pay → exit.)
const AUDIT_LOG = [
  { id: 1, time: "2026-06-19 09:42:11", user: "andy.chan", role: "BMO", action: "Updated whitelist limit for Cainiao Logistics HK (45 → 50)" },
  { id: 2, time: "2026-06-19 09:31:05", user: "kaho.wong", role: "Guard", action: "Manual gate open · North Gate · L3 · Reason: VIP" },
  { id: 3, time: "2026-06-19 08:55:48", user: "priya.fm", role: "FM", action: "Edited Rate Table for South Gate (Truck rate $30/hr)" },
  { id: 4, time: "2026-06-19 08:40:22", user: "andy.chan", role: "BMO", action: "Created user account: ck.lau (Guard)" },
  { id: 5, time: "2026-06-19 08:12:09", user: "dhl.admin", role: "Tenant", action: "Added vehicle VP8821 to whitelist (L4)" },
  { id: 6, time: "2026-06-19 07:58:30", user: "andy.chan", role: "BMO", action: "Soft-deleted vehicle GK4099 (Temp · L6) — retained for audit" },
];

// P3: System Log kept separate from Audit Log — system / device / API events.
const SYSTEM_LOG = [
  { id: 1, time: "2026-06-19 09:45:02", level: "INFO", source: "ANPR · North Gate L3", msg: "Plate recognised RA1234 — barrier opened" },
  { id: 2, time: "2026-06-19 09:44:51", level: "WARN", source: "CCTV · South Gate L7", msg: "Frame drop detected, auto-reconnect succeeded" },
  { id: 3, time: "2026-06-19 09:40:12", level: "INFO", source: "POS API", msg: "Octopus transaction settled (txn #88213)" },
  { id: 4, time: "2026-06-19 09:31:07", level: "ERROR", source: "IoT Gateway", msg: "Loop detector L4 timeout — retry 1/3" },
  { id: 5, time: "2026-06-19 09:30:00", level: "INFO", source: "Scheduler", msg: "Nightly CCTV purge job — 30-day retention enforced" },
];

/* ------------------------------ UI Helpers ------------------------------- */
// Light-theme badge palettes.
const ACCENT = {
  blue:    "bg-[#1A5CFF]/10 text-[#1A5CFF] ring-[#1A5CFF]/20",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber:   "bg-amber-50 text-amber-700 ring-amber-200",
  violet:  "bg-violet-50 text-violet-700 ring-violet-200",
  slate:   "bg-slate-100 text-slate-600 ring-slate-200",
  red:     "bg-red-50 text-red-700 ring-red-200",
};

function Badge({ children, color = "slate" }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${ACCENT[color]}`}>{children}</span>;
}

function Card({ children, className = "" }) {
  return <div className={`rounded-xl bg-white ring-1 ring-slate-200 shadow-sm ${className}`}>{children}</div>;
}

function Input(props) {
  return <input {...props} className={`w-full rounded-lg bg-white px-3 py-2 text-sm text-slate-800 ring-1 ring-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1A5CFF]/60 ${props.className || ""}`} />;
}

function Select({ children, ...props }) {
  return (
    <div className="relative">
      <select {...props} className={`w-full appearance-none rounded-lg bg-white px-3 py-2 pr-8 text-sm text-slate-800 ring-1 ring-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1A5CFF]/60 ${props.className || ""}`}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-slate-400" />
    </div>
  );
}

function Btn({ children, variant = "primary", className = "", ...props }) {
  const styles = {
    primary: CN.solid,
    ghost: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    danger: "bg-red-500 text-white hover:bg-red-600",
    outline: "ring-1 ring-slate-300 text-slate-700 hover:bg-slate-50",
  };
  return <button {...props} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${styles[variant]} ${className}`}>{children}</button>;
}

function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-xl bg-white ring-1 ring-slate-200 shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 rounded-xl bg-[#1A5CFF] px-4 py-3 text-sm font-medium text-white shadow-2xl ring-1 ring-[#1A5CFF]/40 animate-[fadein_.2s_ease]">
      <CheckCircle2 className="h-5 w-5" /> {msg}
    </div>
  );
}

function SectionTitle({ icon: Icon, title, desc, children }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-800"><Icon className={`h-5 w-5 ${CN.text}`} /> {title}</h2>
        {desc && <p className="mt-1 text-sm text-slate-500">{desc}</p>}
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

/* ---------------------------- Occupancy helpers -------------------------- */
function occColor(pct) {
  if (pct >= 90) return { ring: "ring-red-300", bar: "bg-red-500", text: "text-red-600", tag: "red", label: "Full" };
  if (pct >= 60) return { ring: "ring-amber-300", bar: "bg-amber-400", text: "text-amber-600", tag: "amber", label: "Busy" };
  return { ring: "ring-emerald-300", bar: "bg-emerald-500", text: "text-emerald-600", tag: "emerald", label: "Available" };
}

const FLOOR_OCC = FLOORS.map((f, i) => ({ floor: f, pct: [42, 71, 88, 95, 58, 33, 64, 79, 91, 47, 22, 55][i] }));

/* ================================ Pages ================================== */
function Dashboard() {
  const totalIn = 384, totalOut = 351, alerts = 3;
  const avgOcc = Math.round(FLOOR_OCC.reduce((a, b) => a + b.pct, 0) / FLOOR_OCC.length);
  const split = { "Private Car": 58, Van: 27, Truck: 15 };
  const whitelistRatio = 68;

  return (
    <div>
      <SectionTitle icon={LayoutDashboard} title="Operations Dashboard" desc="Real-time carpark overview · Smart Cainiao Hub" />
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total In (Today)", value: totalIn, icon: ArrowLeftRight, color: "blue" },
          { label: "Total Out (Today)", value: totalOut, icon: ArrowLeftRight, color: "violet" },
          { label: "Avg Occupancy", value: `${avgOcc}%`, icon: Car, color: avgOcc >= 90 ? "red" : avgOcc >= 60 ? "amber" : "emerald" },
          { label: "Active Alerts", value: alerts, icon: AlertTriangle, color: "amber" },
        ].map((c) => (
          <Card key={c.label} className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{c.label}</span>
              <span className={`rounded-lg p-1.5 ring-1 ${ACCENT[c.color]}`}><c.icon className="h-4 w-4" /></span>
            </div>
            <div className="mt-3 text-3xl font-bold text-slate-900">{c.value}</div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Floor occupancy grid */}
        <Card className="p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Occupancy Status by Floor</h3>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500" />&lt;60%</span>
              <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-amber-400" />60–90%</span>
              <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-red-500" />&gt;90%</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {FLOOR_OCC.map((f) => {
              const c = occColor(f.pct);
              return (
                <div key={f.floor} className={`rounded-xl bg-slate-50 p-3 ring-1 ${c.ring}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800">{f.floor}</span>
                    <span className={`text-xs font-semibold ${c.text}`}>{f.pct}%</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div className={`h-full ${c.bar}`} style={{ width: `${f.pct}%` }} />
                  </div>
                  <div className="mt-1.5 text-[10px] text-slate-400">{c.label}</div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Vehicle split + whitelist */}
        <div className="grid grid-cols-1 gap-6">
          <Card className="p-5">
            <h3 className="mb-4 font-semibold text-slate-800">Vehicle Type Split</h3>
            {Object.entries(split).map(([k, v]) => {
              const Icon = k === "Truck" ? Truck : k === "Van" ? Bus : Car;
              return (
                <div key={k} className="mb-3 last:mb-0">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-slate-600"><Icon className={`h-4 w-4 ${CN.text}`} />{k}</span>
                    <span className="text-slate-400">{v}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full bg-gradient-to-r from-[#1A5CFF] to-[#5b8bff]" style={{ width: `${v}%` }} />
                  </div>
                </div>
              );
            })}
          </Card>
          <Card className="p-5">
            <h3 className="mb-3 font-semibold text-slate-800">Whitelist vs Non-whitelist</h3>
            <div className="flex h-4 overflow-hidden rounded-full ring-1 ring-slate-200">
              <div className="bg-[#1A5CFF]" style={{ width: `${whitelistRatio}%` }} />
              <div className="bg-slate-300" style={{ width: `${100 - whitelistRatio}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-xs text-slate-500">
              <span className={CN.text}>Whitelist {whitelistRatio}%</span>
              <span>Non-whitelist {100 - whitelistRatio}%</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Tenant space allocation */}
      <Card className="mt-6 p-5">
        <h3 className="mb-4 font-semibold text-slate-800">Tenant Space Allocation</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 pr-4">Tenant</th><th className="pb-2 pr-4">Floor</th>
                <th className="pb-2 pr-4">Gate</th><th className="pb-2 pr-4 w-1/3">Space Utilisation</th>
              </tr>
            </thead>
            <tbody>
              {TENANTS.map((t) => {
                const pct = Math.round((t.used / t.spaceLimit) * 100);
                const c = occColor(pct);
                return (
                  <tr key={t.id} className="border-b border-slate-100">
                    <td className="py-2.5 pr-4"><div className="font-medium text-slate-800">{t.en}</div><div className="text-xs text-slate-400">{t.zh}</div></td>
                    <td className="py-2.5 pr-4"><Badge color="blue">{t.floor}</Badge></td>
                    <td className="py-2.5 pr-4 text-slate-600">{t.gate}</td>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200"><div className={`h-full ${c.bar}`} style={{ width: `${pct}%` }} /></div>
                        <span className={`w-20 text-right text-xs ${c.text}`}>{t.used}/{t.spaceLimit} ({pct}%)</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function UserManagement({ toast, role, authUser }) {
  const [users, setUsers] = useState(USERS);
  const [modal, setModal] = useState(null); // {mode, user}
  const [form, setForm] = useState({ name: "", account: "", role: "BMO", status: "Active", tenant: "", activeFrom: TODAY, permissions: [] });
  const roleColor = { BMO: "blue", Tenant: "violet", Guard: "amber", FM: "emerald" };

  // A Tenant admin only manages users within their own tenant.
  const isTenantAdmin = role === "Tenant";
  const myTenant = authUser?.tenant || "";
  const visibleUsers = isTenantAdmin ? users.filter((u) => u.tenant === myTenant) : users;

  const blankUser = isTenantAdmin
    ? { name: "", account: "", role: "Tenant", status: "Active", tenant: myTenant, activeFrom: TODAY, permissions: [] }
    : { name: "", account: "", role: "BMO", status: "Active", tenant: "", activeFrom: TODAY, permissions: [] };

  const openModal = (mode, user) => {
    setForm({
      name: user.name, account: user.account, role: user.role, status: user.status,
      tenant: user.tenant || "", activeFrom: user.activeFrom || TODAY, permissions: user.permissions || [],
    });
    setModal({ mode, user });
  };
  const save = () => { toast(modal.mode === "add" ? "User account created" : "User account updated"); setModal(null); };
  const del = (id) => { setUsers((u) => u.filter((x) => x.id !== id)); toast("User account deleted"); };
  const togglePerm = (p) => setForm((f) => ({ ...f, permissions: f.permissions.includes(p) ? f.permissions.filter((x) => x !== p) : [...f.permissions, p] }));

  // Future activation date => account is scheduled, not yet active.
  const effStatus = (u) => (u.activeFrom && u.activeFrom > TODAY ? "Scheduled" : u.status);
  const showPermsField = form.role === "Tenant"; // permissions apply to tenant sub-accounts

  return (
    <div>
      <SectionTitle icon={Users}
        title="User Management"
        desc={isTenantAdmin ? `Manage your tenant users · ${myTenant}` : "Account directory · Role-based access control"}>
        <Btn onClick={() => openModal("add", blankUser)}><Plus className="h-4 w-4" /> Add User</Btn>
      </SectionTitle>
      <DataTable
        columns={["Account Name", "Role", "Tenant Name", "Status", ""]}
        rows={visibleUsers}
        searchKeys={["name", "account", "role", "tenant"]}
        sortKeys={[{ key: "name", label: "Name", cmp: (a, b) => a.name.localeCompare(b.name) }, { key: "role", label: "Role", cmp: (a, b) => a.role.localeCompare(b.role) }]}
        renderRow={(u) => {
          const st = effStatus(u);
          return (
            <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-3"><div className="flex items-center gap-2"><CircleUser className="h-7 w-7 text-slate-300" /><span className="font-medium text-slate-800">{u.name}</span></div></td>
              <td className="px-4 py-3"><Badge color={roleColor[u.role]}>{u.role}</Badge></td>
              <td className="px-4 py-3">{u.tenant ? <span className="text-slate-600">{u.tenant}</span> : <span className="text-slate-300">—</span>}</td>
              <td className="px-4 py-3"><Badge color={st === "Active" ? "emerald" : st === "Scheduled" ? "amber" : "slate"}>{st}</Badge></td>
              <td className="px-4 py-3"><div className="flex justify-end gap-2">
                <Btn variant="outline" onClick={() => openModal("edit", u)}><Pencil className="h-3.5 w-3.5" /> Edit</Btn>
                <Btn variant="danger" onClick={() => del(u.id)}><Trash2 className="h-3.5 w-3.5" /></Btn>
              </div></td>
            </tr>
          );
        }}
      />

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === "add" ? "Add User" : "Edit User"} wide={showPermsField}>
        {modal && (
          <div className="space-y-3">
            {isTenantAdmin && (
              <div className="rounded-lg bg-[#1A5CFF]/5 px-3 py-2 text-xs text-[#1A5CFF] ring-1 ring-[#1A5CFF]/15">
                Creating a user for your tenant: <span className="font-semibold">{myTenant}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><label className="mb-1 block text-xs text-slate-500">Account Name</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Andy Chan" /></div>
              <div><label className="mb-1 block text-xs text-slate-500">Login ID</label><Input value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })} placeholder="e.g. andy.chan" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="mb-1 block text-xs text-slate-500">Role</label>
                {isTenantAdmin
                  ? <Input value="Tenant" disabled className="cursor-not-allowed bg-slate-50 text-slate-500" />
                  : <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value, tenant: e.target.value === "Tenant" ? form.tenant : "", permissions: e.target.value === "Tenant" ? form.permissions : [] })}>{Object.keys(ROLES).map((r) => <option key={r}>{r}</option>)}</Select>}
              </div>
              <div><label className="mb-1 block text-xs text-slate-500">Status</label><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>Active</option><option>Inactive</option></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {form.role === "Tenant" && (
                <div><label className="mb-1 block text-xs text-slate-500">Tenant</label>
                  {isTenantAdmin
                    ? <Input value={myTenant} disabled className="cursor-not-allowed bg-slate-50 text-slate-500" />
                    : <Select value={form.tenant} onChange={(e) => setForm({ ...form, tenant: e.target.value })}>
                        <option value="">Select tenant…</option>
                        {TENANTS.map((t) => <option key={t.id} value={t.en}>{t.en} · {t.zh}</option>)}
                      </Select>}
                </div>
              )}
              <div><label className="mb-1 block text-xs text-slate-500">Active From</label><Input type="date" value={form.activeFrom} onChange={(e) => setForm({ ...form, activeFrom: e.target.value })} />
                {form.activeFrom > TODAY && <p className="mt-1 text-[11px] text-amber-600">Scheduled — account activates on this date.</p>}
              </div>
            </div>
            {showPermsField && (
              <div>
                <label className="mb-1 block text-xs text-slate-500">Permissions</label>
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
                  {TENANT_PERMISSIONS.map((p) => (
                    <label key={p} className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" checked={form.permissions.includes(p)} onChange={() => togglePerm(p)} className="accent-[#1A5CFF]" /> {p}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2"><Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn><Btn onClick={save}><Save className="h-4 w-4" /> Save</Btn></div>
          </div>
        )}
      </Modal>
    </div>
  );
}

const BLANK_TENANT = { en: "", zh: "", email: "", phone: "", floors: [], whitelist: 30, spaceLimit: 20, used: 0, status: "Active", activeFrom: TODAY, activeTo: "2026-12-31", logo: null, whitelistPlates: [], blacklistPlates: [] };

function TenantManagement({ toast, tenants, setTenants }) {
  const [modal, setModal] = useState(null); // { mode, id }
  const [form, setForm] = useState(BLANK_TENANT);
  const [wlInput, setWlInput] = useState("");
  const [blInput, setBlInput] = useState("");

  const openAdd = () => { setForm({ ...BLANK_TENANT, whitelistPlates: [], blacklistPlates: [] }); setWlInput(""); setBlInput(""); setModal({ mode: "add" }); };
  const openEdit = (t) => { setForm({ ...t, whitelistPlates: t.whitelistPlates || [], blacklistPlates: t.blacklistPlates || [] }); setWlInput(""); setBlInput(""); setModal({ mode: "edit", id: t.id }); };

  const addPlate = (kind) => {
    const raw = (kind === "wl" ? wlInput : blInput).trim().toUpperCase();
    if (!raw) return;
    const key = kind === "wl" ? "whitelistPlates" : "blacklistPlates";
    if (form[key].includes(raw)) { toast("Plate already in list"); return; }
    if (kind === "wl" && form.whitelistPlates.length >= form.whitelist) { toast(`Whitelist limit reached (max ${form.whitelist})`); return; }
    setForm((s) => ({ ...s, [key]: [...s[key], raw] }));
    kind === "wl" ? setWlInput("") : setBlInput("");
  };
  const removePlate = (kind, plate) => {
    const key = kind === "wl" ? "whitelistPlates" : "blacklistPlates";
    setForm((s) => ({ ...s, [key]: s[key].filter((p) => p !== plate) }));
  };

  const toggleFloor = (f) => setForm((s) => ({ ...s, floors: s.floors.includes(f) ? s.floors.filter((x) => x !== f) : [...s.floors, f].sort((a, b) => +a.slice(1) - +b.slice(1)) }));

  const onLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((s) => ({ ...s, logo: reader.result }));
    reader.readAsDataURL(file);
  };

  const save = () => {
    if (modal.mode === "add") {
      const id = Math.max(0, ...tenants.map((t) => t.id)) + 1;
      const primary = form.floors[0] || "L1";
      setTenants((ts) => [...ts, { ...form, id, floor: primary, gate: gatesForFloor(primary)[0] }]);
      toast("Tenant created");
    } else {
      setTenants((ts) => ts.map((t) => (t.id === modal.id ? { ...t, ...form, floor: form.floors[0] || t.floor } : t)));
      toast("Tenant profile updated");
    }
    setModal(null);
  };

  return (
    <div>
      <SectionTitle icon={Building2} title="Tenant Management" desc="Tenant profiles · logo · active period · assigned carpark floors">
        <Btn onClick={openAdd}><Plus className="h-4 w-4" /> Add Tenant</Btn>
      </SectionTitle>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {tenants.map((t) => {
          const active = isTenantActive(t);
          return (
            <Card key={t.id} className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#1A5CFF]/10 ring-1 ring-[#1A5CFF]/20">
                  {t.logo ? <img src={t.logo} alt={t.en} className="h-full w-full object-cover" /> : <Building2 className={`h-7 w-7 ${CN.text}`} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div><h3 className="truncate font-semibold text-slate-800">{t.en}</h3><p className="text-sm text-slate-500">{t.zh}</p></div>
                    <Btn variant="outline" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5" /> Edit</Btn>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                    <div className="text-slate-400">Email</div><div className="truncate text-slate-600">{t.email}</div>
                    <div className="text-slate-400">Phone</div><div className="text-slate-600">{t.phone}</div>
                    <div className="text-slate-400">Carpark Floors</div><div className="text-slate-600">{(t.floors || []).join(", ") || "—"}</div>
                    <div className="text-slate-400">Active Period</div><div className="text-slate-600">{t.activeFrom} → {t.activeTo}</div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge color={active ? "emerald" : "red"}>{active ? "Active" : t.status === "Inactive" ? "Inactive" : "Expired"}</Badge>
                    <Badge color="emerald">Whitelist {(t.whitelistPlates || []).length}/{t.whitelist}</Badge>
                    <Badge color="red">Blacklist {(t.blacklistPlates || []).length}</Badge>
                    <Badge color="violet">Space Max {t.spaceLimit}</Badge>
                  </div>
                  {!active && <p className="mt-2 text-xs text-red-500">Inactive/expired — users of this tenant cannot sign in.</p>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === "add" ? "Add Tenant" : "Edit Tenant"} wide>
        {modal && (
          <div className="space-y-3">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#1A5CFF]/10 ring-1 ring-[#1A5CFF]/20">
                {form.logo ? <img src={form.logo} alt="logo" className="h-full w-full object-cover" /> : <Building2 className={`h-8 w-8 ${CN.text}`} />}
              </div>
              <div className="flex gap-2">
                <label className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium ring-1 ring-slate-300 hover:bg-slate-50">
                  Upload Logo<input type="file" accept="image/*" onChange={onLogo} className="hidden" />
                </label>
                {form.logo && <Btn variant="ghost" onClick={() => setForm({ ...form, logo: null })}>Remove</Btn>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><label className="mb-1 block text-xs text-slate-500">Tenant Name (Eng)</label><Input value={form.en} onChange={(e) => setForm({ ...form, en: e.target.value })} placeholder="e.g. Cainiao Logistics HK" /></div>
              <div><label className="mb-1 block text-xs text-slate-500">Tenant Name (Chi)</label><Input value={form.zh} onChange={(e) => setForm({ ...form, zh: e.target.value })} placeholder="例如 菜鳥物流香港" /></div>
              <div><label className="mb-1 block text-xs text-slate-500">Email</label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><label className="mb-1 block text-xs text-slate-500">Phone</label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><label className="mb-1 block text-xs text-slate-500">Whitelist Limit</label><Input type="number" value={form.whitelist} onChange={(e) => setForm({ ...form, whitelist: +e.target.value })} /></div>
              <div><label className="mb-1 block text-xs text-slate-500">Parking Space Limit</label><Input type="number" value={form.spaceLimit} onChange={(e) => setForm({ ...form, spaceLimit: +e.target.value })} /></div>
              <div><label className="mb-1 block text-xs text-slate-500">Status</label><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>Active</option><option>Inactive</option></Select></div>
              <div></div>
              <div><label className="mb-1 block text-xs text-slate-500">Active From</label><Input type="date" value={form.activeFrom} onChange={(e) => setForm({ ...form, activeFrom: e.target.value })} /></div>
              <div><label className="mb-1 block text-xs text-slate-500">Active To</label><Input type="date" value={form.activeTo} onChange={(e) => setForm({ ...form, activeTo: e.target.value })} /></div>
            </div>

            {/* Carpark floors — floors only, no gate */}
            <div>
              <label className="mb-1 block text-xs text-slate-500">Assigned Carpark Floors (no gate needed)</label>
              <div className="grid grid-cols-6 gap-2 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
                {FLOORS.map((f) => {
                  const on = form.floors.includes(f);
                  return (
                    <button key={f} type="button" onClick={() => toggleFloor(f)} className={`rounded-lg py-1.5 text-sm font-medium ring-1 transition ${on ? "bg-[#1A5CFF] text-white ring-[#1A5CFF]" : "bg-white text-slate-600 ring-slate-300 hover:bg-slate-100"}`}>{f}</button>
                  );
                })}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Selected: {form.floors.join(", ") || "none"}</p>
            </div>

            {form.activeTo && form.activeTo < TODAY && <p className="text-xs text-red-500">Active period already expired — this tenant's users will be blocked from signing in.</p>}

            {/* Whitelist / Blacklist plates */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { kind: "wl", key: "whitelistPlates", label: "Whitelist Plates", color: "emerald", val: wlInput, setVal: setWlInput, hint: `${form.whitelistPlates.length} / ${form.whitelist}` },
                { kind: "bl", key: "blacklistPlates", label: "Blacklist Plates", color: "red", val: blInput, setVal: setBlInput, hint: `${form.blacklistPlates.length}` },
              ].map((c) => (
                <div key={c.kind} className="rounded-lg ring-1 ring-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                    <span className="text-xs font-medium text-slate-600">{c.label}</span>
                    <Badge color={c.color}>{c.hint}</Badge>
                  </div>
                  <div className="flex gap-2 p-3">
                    <Input value={c.val} onChange={(e) => c.setVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPlate(c.kind); } }} placeholder="e.g. RA1234" className="font-mono uppercase" />
                    <Btn variant="outline" onClick={() => addPlate(c.kind)}><Plus className="h-3.5 w-3.5" /> Add</Btn>
                  </div>
                  <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto px-3 pb-3">
                    {form[c.key].length === 0 && <span className="text-xs text-slate-400">No plates yet.</span>}
                    {form[c.key].map((p) => (
                      <span key={p} className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-xs ring-1 ${ACCENT[c.color]}`}>
                        {p}<button onClick={() => removePlate(c.kind, p)} className="hover:opacity-60"><X className="h-3 w-3" /></button>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-1"><Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn><Btn onClick={save}><Save className="h-4 w-4" /> {modal.mode === "add" ? "Create Tenant" : "Save Changes"}</Btn></div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function VehicleManagement({ toast, role }) {
  const [cat, setCat] = useState("All");
  const [showDeleted, setShowDeleted] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [vehicles, setVehicles] = useState(VEHICLES);
  const [addModal, setAddModal] = useState(false);
  const [linkView, setLinkView] = useState(null); // vehicle whose correction linkage is shown
  const BLANK_ADD = { lpn: "", vehicleType: "Private Car", cat: "Tenant", tenant: TENANTS[0].en, parkingType: "Whitelist" };
  const [addForm, setAddForm] = useState(BLANK_ADD);
  const readOnly = role === "Tenant"; // Tenant: limited edit within whitelist limit (mock)
  const catColor = { Whitelist: "emerald", "Monthly Parking": "blue", Temp: "amber", Blacklist: "red", BMO: "violet" };

  // Functional filters: category/whitelist/BMO chip + LPN/tenant search + activation date overlap.
  const rows = vehicles.filter((v) => {
    if (!(cat === "All" || v.category === cat)) return false;
    if (!showDeleted && v.status === "Deleted") return false;
    if (search) {
      const q = search.toLowerCase();
      if (!v.lpn.toLowerCase().includes(q) && !v.tenant.toLowerCase().includes(q)) return false;
    }
    if (dateFrom && v.to !== "—" && v.to < dateFrom) return false;   // activation ended before range
    if (dateTo && v.from !== "—" && v.from > dateTo) return false;   // activation starts after range
    return true;
  });
  const clearFilters = () => { setCat("All"); setSearch(""); setDateFrom(""); setDateTo(""); };

  const saveAdd = () => {
    if (!addForm.lpn.trim()) { toast("Enter the LPN"); return; }
    const isTenant = addForm.cat === "Tenant";
    const category = isTenant ? addForm.parkingType : addForm.cat;
    const tenant = isTenant ? addForm.tenant : "—";
    const tObj = TENANTS.find((t) => t.en === tenant);
    const floor = tObj ? tObj.floor : "—";
    const gate = tObj ? tObj.gate : "—";
    const id = Math.max(0, ...vehicles.map((v) => v.id)) + 1;
    setVehicles((vs) => [...vs, {
      id, lpn: addForm.lpn.trim().toUpperCase(), vehicleType: addForm.vehicleType, tenant, category, gate, floor,
      from: TODAY, to: "2026-12-31", priority: 1, status: "Active", createdAt: `${TODAY} 09:42`, modifiedAt: `${TODAY} 09:42`, deletedAt: null, correctedFrom: null,
    }]);
    toast("Vehicle added"); setAddModal(false); setAddForm(BLANK_ADD);
  };

  const stamp = () => new Date("2026-06-19T09:42:00").toLocaleString("en-GB").replace(",", "");
  const softDelete = (id) => {
    setVehicles((vs) => vs.map((v) => (v.id === id ? { ...v, status: "Deleted", deletedAt: `${stamp()} · ${role.toLowerCase()}.user` } : v)));
    toast("Vehicle soft-deleted — record retained for audit");
  };
  const restore = (id) => {
    setVehicles((vs) => vs.map((v) => (v.id === id ? { ...v, status: "Active", deletedAt: null, modifiedAt: stamp() } : v)));
    toast("Vehicle restored");
  };

  return (
    <div>
      <SectionTitle icon={Car} title="Vehicle Management" desc="Whitelist · Monthly · Temp · Blacklist · checked against tenant whitelist limit">
        <label className="flex items-center gap-1.5 text-xs text-slate-500"><input type="checkbox" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} className="accent-[#1A5CFF]" /> Show deleted</label>
        <Btn onClick={() => { setAddForm(BLANK_ADD); setAddModal(true); }}><Plus className="h-4 w-4" /> Add Vehicle</Btn>
      </SectionTitle>
      <DataTable
        columns={["LPN", "Type", "Category", "Tenant", "Gate", "Floor", "Activation Period", "Priority", "Status", "Audit (DB)", ""]}
        rows={rows}
        searchKeys={["lpn", "tenant", "vehicleType"]}
        sortKeys={[{ key: "lpn", label: "LPN", cmp: (a, b) => a.lpn.localeCompare(b.lpn) }, { key: "category", label: "Category", cmp: (a, b) => a.category.localeCompare(b.category) }]}
        filterPanel={
          <div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div><label className="mb-1 block text-xs text-slate-500">Activation From</label><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></div>
              <div><label className="mb-1 block text-xs text-slate-500">Activation To</label><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></div>
              <div className="flex items-end"><Btn variant="outline" className="w-full justify-center" onClick={clearFilters}><Filter className="h-4 w-4" /> Clear Filters</Btn></div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {["All", ...VEHICLE_CATEGORIES].map((c) => (
                <button key={c} onClick={() => setCat(c)} className={`rounded-lg px-3 py-1.5 text-sm font-medium ring-1 transition ${cat === c ? "bg-[#1A5CFF] text-white ring-[#1A5CFF]" : "bg-white text-slate-600 ring-slate-300 hover:bg-slate-50"}`}>{c}</button>
              ))}
            </div>
          </div>
        }
        renderRow={(v) => {
          const deleted = v.status === "Deleted";
          return (
            <tr key={v.id} className={`border-b border-slate-100 hover:bg-slate-50 ${deleted ? "opacity-60" : ""}`}>
              <td className="px-4 py-3">
                <div className="font-mono font-semibold text-slate-800">{v.lpn}</div>
                {v.correctedFrom && (
                  <button onClick={() => setLinkView(v)} className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-[#1A5CFF] hover:underline">
                    <Link2 className="h-3 w-3" /> from {v.correctedFrom.plate}
                  </button>
                )}
              </td>
              <td className="px-4 py-3 text-slate-500">{v.vehicleType || "—"}</td>
              <td className="px-4 py-3"><Badge color={catColor[v.category]}>{v.category}</Badge></td>
              <td className="px-4 py-3 text-slate-600">{v.tenant}</td>
              <td className="px-4 py-3 text-slate-500">{v.gate}</td>
              <td className="px-4 py-3 text-slate-500">{v.floor}</td>
              <td className="px-4 py-3 text-slate-500">{v.from} → {v.to}</td>
              <td className="px-4 py-3"><Badge color="slate">P{v.priority}</Badge></td>
              <td className="px-4 py-3"><Badge color={deleted ? "red" : "emerald"}>{v.status}</Badge></td>
              <td className="px-4 py-3 text-[11px] leading-tight text-slate-400">
                <div>Created {v.createdAt}</div>
                <div>Modified {v.modifiedAt}</div>
                {v.deletedAt && <div className="text-red-500/80">Deleted {v.deletedAt}</div>}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-1.5">
                  {deleted
                    ? <Btn variant="ghost" onClick={() => restore(v.id)} title="Restore"><RotateCcw className="h-3.5 w-3.5" /></Btn>
                    : <Btn variant="danger" onClick={() => softDelete(v.id)} title="Soft-delete"><Trash2 className="h-3.5 w-3.5" /></Btn>}
                </div>
              </td>
            </tr>
          );
        }}
      />
      <p className="mt-3 text-xs text-slate-400">Soft-delete: records are marked inactive and retained in DB with Create / Modify / Delete timestamps for audit. Single tenant can span multiple floors with priority ordering.</p>

      {/* Add Vehicle modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add Vehicle">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-xs text-slate-500">LPN</label><Input value={addForm.lpn} onChange={(e) => setAddForm({ ...addForm, lpn: e.target.value })} placeholder="e.g. RA1234" className="font-mono uppercase" /></div>
            <div><label className="mb-1 block text-xs text-slate-500">Vehicle Type</label><Select value={addForm.vehicleType} onChange={(e) => setAddForm({ ...addForm, vehicleType: e.target.value })}>{VEHICLE_TYPES.map((v) => <option key={v}>{v}</option>)}</Select></div>
            <div><label className="mb-1 block text-xs text-slate-500">Category</label><Select value={addForm.cat} onChange={(e) => setAddForm({ ...addForm, cat: e.target.value })}>{VEHICLE_TOP_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select></div>
            {addForm.cat === "Tenant" && (
              <div><label className="mb-1 block text-xs text-slate-500">Parking Type</label><Select value={addForm.parkingType} onChange={(e) => setAddForm({ ...addForm, parkingType: e.target.value })}>{TENANT_PARKING_TYPES.map((p) => <option key={p}>{p}</option>)}</Select></div>
            )}
          </div>
          {addForm.cat === "Tenant" && (
            <div><label className="mb-1 block text-xs text-slate-500">Tenant Name</label><Select value={addForm.tenant} onChange={(e) => setAddForm({ ...addForm, tenant: e.target.value })}>{TENANTS.map((t) => <option key={t.id} value={t.en}>{t.en} · {t.zh}</option>)}</Select></div>
          )}
          <div className="flex justify-end gap-2 pt-1"><Btn variant="ghost" onClick={() => setAddModal(false)}>Cancel</Btn><Btn onClick={saveAdd}><Save className="h-4 w-4" /> Add Vehicle</Btn></div>
        </div>
      </Modal>

      {/* Linkage audit view */}
      <Modal open={!!linkView} onClose={() => setLinkView(null)} title="Record Linkage — Audit">
        {linkView && (
          <div className="space-y-3">
            <div className="rounded-lg p-3 ring-1 ring-red-200 bg-red-50">
              <div className="text-xs font-medium text-red-700">Original — ANPR mis-read</div>
              <div className="mt-1 font-mono text-lg font-bold text-red-700">{linkView.correctedFrom.plate}</div>
              <div className="text-xs text-red-600/80">{linkView.correctedFrom.ref}</div>
              <div className="text-xs text-red-600/80">Reason: {linkView.correctedFrom.reason}</div>
            </div>
            <div className="flex items-center justify-center text-slate-400"><CornerDownRight className="h-5 w-5" /></div>
            <div className="rounded-lg p-3 ring-1 ring-emerald-200 bg-emerald-50">
              <div className="text-xs font-medium text-emerald-700">Corrected record</div>
              <div className="mt-1 font-mono text-lg font-bold text-emerald-700">{linkView.lpn}</div>
              <div className="text-xs text-emerald-700/80">{linkView.tenant} · {linkView.floor} · {linkView.category}</div>
              <div className="text-xs text-emerald-700/80">Added: {linkView.correctedFrom.at}</div>
            </div>
            <div className="flex justify-end pt-1"><Btn variant="ghost" onClick={() => setLinkView(null)}>Close</Btn></div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ---------------------------- In / Out Records --------------------------- */
// Generate a realistic gate-camera snapshot as a JPEG data URL (no real camera in
// the prototype). Used by the Manual Gate Open "Screen Capture" flow.
function makeSnapshot({ plate, gate, floor, time }) {
  const c = document.createElement("canvas");
  c.width = 480; c.height = 270;
  const x = c.getContext("2d");
  x.fillStyle = "#0b1220"; x.fillRect(0, 0, 480, 270);
  x.fillStyle = "#0f172a"; x.fillRect(40, 60, 400, 150);
  x.strokeStyle = "#334155"; x.lineWidth = 2; x.strokeRect(40, 60, 400, 150);
  x.fillStyle = "#ef4444"; x.beginPath(); x.arc(22, 22, 6, 0, 7); x.fill();
  x.fillStyle = "#ffffff"; x.font = "bold 13px Arial"; x.fillText("REC", 34, 27);
  x.fillStyle = "#cbd5e1"; x.font = "12px monospace"; x.textAlign = "right"; x.fillText(time, 462, 26);
  x.fillStyle = "#e2e8f0"; x.font = "bold 46px monospace"; x.textAlign = "center"; x.fillText(plate || "—", 240, 150);
  x.fillStyle = "#64748b"; x.font = "12px Arial"; x.fillText("ANPR PLATE CAPTURE", 240, 90);
  x.textAlign = "left"; x.fillStyle = "#94a3b8"; x.font = "13px Arial"; x.fillText(`${floor || ""} · ${gate || ""}`, 14, 256);
  x.textAlign = "right"; x.fillText("Gate Camera · 1080p", 466, 256);
  return c.toDataURL("image/jpeg", 0.82);
}

function PhotoViewModal({ open, onClose, record }) {
  if (!open || !record) return null;
  return (
    <Modal open onClose={onClose} title="Gate Entry Snapshot" wide>
      <div className="overflow-hidden rounded-xl ring-1 ring-slate-200">
        <img src={record.photo} alt="snapshot" className="w-full" />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>{record.floor} · {record.gate} · {record.entry}</span>
        <span>Resolution: 1080p · DB Retention: 30 days</span>
      </div>
    </Modal>
  );
}

function CCTVModal({ open, onClose, lpn }) {
  return (
    <Modal open={open} onClose={onClose} title="CCTV Snapshot" wide>
      <div className="overflow-hidden rounded-xl ring-1 ring-slate-200">
        <div className="relative flex aspect-video items-center justify-center bg-slate-900">
          <div className="text-center">
            <Camera className="mx-auto h-12 w-12 text-slate-600" />
            <p className="mt-2 font-mono text-2xl font-bold tracking-widest text-slate-200">{lpn}</p>
            <p className="text-xs text-slate-500">Simulated entry capture</p>
          </div>
          <span className="absolute left-3 top-3 rounded bg-red-500/90 px-2 py-0.5 text-xs font-semibold text-white">● REC</span>
          <span className="absolute right-3 top-3 rounded bg-slate-800/80 px-2 py-0.5 text-xs text-slate-200">2026-06-19 09:42:11</span>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>Resolution: 1080p · Source: Gate ANPR Camera</span>
        <span>DB Retention: 30 days</span>
      </div>
    </Modal>
  );
}

// Manual Gate Open: a LIVE camera view + "Screen Capture" → the snapshot is
// attached to the record, then the gate is opened (capture is the evidence).
function ManualGateModal({ open, record, vehicles, onClose, onConfirm }) {
  const rec = record || {};
  const pick = !!rec.pick; // true = operator chooses floor + gate (no fixed context)
  const [reason, setReason] = useState(GATE_REASONS[0]);
  const [remark, setRemark] = useState("");
  const [photo, setPhoto] = useState(null);
  const [shotTime, setShotTime] = useState("");
  const [pf, setPf] = useState("L1");
  const [pg, setPg] = useState("South Gate");
  const [linkId, setLinkId] = useState(""); // linked Vehicle Management record (optional)
  useEffect(() => {
    if (open) {
      setReason(GATE_REASONS[0]); setRemark(""); setPhoto(null); setShotTime(""); setLinkId("");
      const f = rec.floor || "L1"; setPf(f); setPg(rec.gate || gatesForFloor(f)[0]);
    }
  }, [open]); // eslint-disable-line
  if (!open) return null;
  const floor = pick ? pf : rec.floor;
  const gate = pick ? pg : rec.gate;
  const linkedVehicle = (vehicles || []).find((v) => String(v.id) === linkId);
  const effPlate = linkedVehicle ? linkedVehicle.lpn : rec.lpn;

  const capture = () => {
    const t = `2026-06-19 09:42:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`;
    setShotTime(t);
    setPhoto(makeSnapshot({ plate: effPlate, gate: gate || "Gate", floor: floor || "", time: t }));
  };

  return (
    <Modal open onClose={onClose} title="Manual Gate Open" wide>
      <div className="space-y-3">
        {vehicles && (
          <div>
            <label className="mb-1 block text-xs text-slate-500">Link to vehicle record (optional)</label>
            <div className="max-h-44 overflow-y-auto rounded-lg ring-1 ring-slate-200">
              <button type="button" onClick={() => { setLinkId(""); setPhoto(null); }} className={`flex w-full items-center justify-between border-b border-slate-100 px-3 py-2 text-left text-sm hover:bg-slate-50 ${linkId === "" ? "bg-[#1A5CFF]/5" : ""}`}>
                <span className="text-slate-500">No link — unidentified vehicle</span>
                {linkId === "" && <CheckCircle2 className="h-4 w-4 text-[#1A5CFF]" />}
              </button>
              {vehicles.map((v) => {
                const on = linkId === String(v.id);
                return (
                  <button key={v.id} type="button" onClick={() => { setLinkId(String(v.id)); setPhoto(null); }} className={`flex w-full items-center justify-between border-b border-slate-100 px-3 py-2 text-left last:border-0 hover:bg-slate-50 ${on ? "bg-[#1A5CFF]/5" : ""}`}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-slate-800">{v.lpn}</span>
                        <Badge color={v.category === "Blacklist" ? "red" : v.category === "BMO" ? "violet" : "emerald"}>{v.category}</Badge>
                      </div>
                      <div className="truncate text-xs text-slate-500">{v.tenant} · {v.floor} · {v.gate}</div>
                    </div>
                    <div className="ml-2 shrink-0 text-right">
                      <div className="text-[11px] text-slate-400">Entry time</div>
                      <div className="font-mono text-xs text-slate-600">{v.entryTime || "—"}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            {linkedVehicle && <p className="mt-1 text-[11px] text-[#1A5CFF]">Linked to {linkedVehicle.lpn} — the gate-open event references this vehicle record.</p>}
          </div>
        )}
        {pick && (
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-xs text-slate-500">Floor</label>
              <Select value={pf} onChange={(e) => { setPf(e.target.value); setPg(gatesForFloor(e.target.value)[0]); setPhoto(null); }}>{FLOORS.map((f) => <option key={f}>{f}</option>)}</Select></div>
            <div><label className="mb-1 block text-xs text-slate-500">Gate</label>
              <Select value={pg} onChange={(e) => { setPg(e.target.value); setPhoto(null); }}>{gatesForFloor(pf).map((g) => <option key={g}>{g}</option>)}</Select></div>
          </div>
        )}
        {/* Live view / captured snapshot */}
        <div className="overflow-hidden rounded-xl ring-1 ring-slate-200">
          <div className="relative flex aspect-video items-center justify-center bg-slate-900">
            {photo ? (
              <img src={photo} alt="snapshot" className="h-full w-full object-cover" />
            ) : (
              <>
                <Video className="h-10 w-10 text-slate-600" />
                <span className="absolute left-3 top-3 flex items-center gap-1 rounded bg-red-500/90 px-2 py-0.5 text-xs font-semibold text-white"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> LIVE</span>
                <span className="absolute bottom-3 left-3 rounded bg-slate-800/80 px-2 py-0.5 text-xs text-slate-200">{floor} · {gate}</span>
                <span className="absolute bottom-3 right-3 rounded bg-slate-800/80 px-2 py-0.5 text-xs text-slate-400">1080p</span>
              </>
            )}
            {photo && <span className="absolute right-3 top-3 rounded bg-emerald-500/90 px-2 py-0.5 text-xs font-semibold text-white">CAPTURED</span>}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">{photo ? `Snapshot captured (${shotTime}) — will be attached to the record.` : "Live view · capture a snapshot before opening the gate."}</span>
          {photo
            ? <Btn variant="ghost" onClick={() => setPhoto(null)}><Camera className="h-3.5 w-3.5" /> Retake</Btn>
            : <Btn variant="outline" onClick={capture}><Camera className="h-4 w-4" /> Screen Capture</Btn>}
        </div>

        <div><label className="mb-1 block text-xs text-slate-500">Reason</label>
          <Select value={reason} onChange={(e) => setReason(e.target.value)}>{GATE_REASONS.map((r) => <option key={r}>{r}</option>)}</Select>
        </div>
        <div><label className="mb-1 block text-xs text-slate-500">Remark</label>
          <textarea value={remark} onChange={(e) => setRemark(e.target.value)} rows={2} placeholder="Optional remark…" className="w-full rounded-lg bg-white px-3 py-2 text-sm text-slate-800 ring-1 ring-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1A5CFF]/60" />
        </div>
        {!photo && <p className="text-[11px] text-amber-600">Capture a snapshot first — it is recorded as evidence for the manual open.</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={() => onConfirm({ reason, remark, photo, time: shotTime, floor, gate, linkedVehicleId: linkedVehicle?.id || null, plate: effPlate })} className={!photo ? "pointer-events-none opacity-50" : ""}><DoorOpen className="h-4 w-4" /> Open Gate</Btn>
        </div>
      </div>
    </Modal>
  );
}

// Reference-style controls: rounded pill buttons (Filters / Sort).
function ControlBtn({ icon: Icon, children, active, ...props }) {
  return (
    <button {...props} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${active ? "border-[#1A5CFF] text-[#1A5CFF] bg-[#1A5CFF]/5" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
      {Icon && <Icon className="h-4 w-4 text-[#1A5CFF]" />} {children}
    </button>
  );
}

// Reference-style toolbar: search (left) + show-results + pagination (right).
function TableToolbar({ search, onSearch, total, pageSize, onPageSize, page, pages, onPage }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4">
      <div className="relative min-w-[200px] flex-1 sm:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search" className="w-full rounded-lg bg-white px-3 py-2 pl-9 text-sm text-slate-800 ring-1 ring-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1A5CFF]/60" />
      </div>
      <div className="flex items-center gap-2.5">
        <div className="relative">
          <select value={pageSize} onChange={(e) => onPageSize(+e.target.value)} className="appearance-none rounded-lg bg-white py-2 pl-3 pr-8 text-sm text-slate-600 ring-1 ring-slate-300 focus:outline-none">
            {[5, 10, 20].map((n) => <option key={n} value={n}>Show {n} results</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-slate-400" />
        </div>
        <div className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-slate-600 ring-1 ring-slate-300">
          <span>{page}</span> of <span>{pages}</span>
          <button onClick={() => onPage(Math.max(1, page - 1))} className="px-1 text-slate-400 hover:text-slate-600"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={() => onPage(Math.min(pages, page + 1))} className="px-1 text-[#1A5CFF] hover:opacity-70"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}

// Reusable data table with the reference toolbar: optional Filters panel + Sort,
// search, show-N-results and pagination. Parent pre-filters `rows`; DataTable
// handles search/sort/pagination and renders each row via renderRow.
function DataTable({ columns, rows, searchKeys = [], sortKeys, renderRow, filterPanel }) {
  const [q, setQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortIdx, setSortIdx] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);

  let data = rows.filter((r) => !q || searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(q.toLowerCase())));
  if (sortKeys && sortKeys[sortIdx]?.cmp) data = [...data].sort(sortKeys[sortIdx].cmp);

  const pages = Math.max(1, Math.ceil(data.length / pageSize));
  const cur = Math.min(page, pages);
  const pageRows = data.slice((cur - 1) * pageSize, cur * pageSize);

  return (
    <div>
      {(filterPanel || sortKeys) && (
        <div className="mb-3 flex items-center justify-end gap-2.5">
          {filterPanel && <ControlBtn icon={SlidersHorizontal} active={showFilters} onClick={() => setShowFilters((s) => !s)}>Filters</ControlBtn>}
          {sortKeys && <ControlBtn icon={ArrowDownUp} onClick={() => setSortIdx((i) => (i + 1) % sortKeys.length)}>Sort by: {sortKeys[sortIdx].label}</ControlBtn>}
        </div>
      )}
      {filterPanel && showFilters && <Card className="mb-4 p-4">{filterPanel}</Card>}
      <Card>
        <TableToolbar search={q} onSearch={(v) => { setQ(v); setPage(1); }} total={data.length}
          pageSize={pageSize} onPageSize={(n) => { setPageSize(n); setPage(1); }} page={cur} pages={pages} onPage={setPage} />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
              {columns.map((c, i) => <th key={i} className="px-4 py-3">{c}</th>)}
            </tr></thead>
            <tbody>
              {pageRows.map((r, i) => renderRow(r, i))}
              {pageRows.length === 0 && <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-slate-400">No records found.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function RecordTable({ kind, rows, setRows, toast, addGateEvent, gateEvents = [] }) {
  const [photoView, setPhotoView] = useState(null);
  const BLANK_REC = { lpn: "", vehicleType: "Private Car", floor: "L1", tenant: TENANTS[0].en, entry: "2026-06-19 09:42", exit: "2026-06-19 11:42", isCorrection: false, origPlate: "", linkedEventId: "", reason: "ANPR mis-read" };
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(BLANK_REC);
  const [linkView, setLinkView] = useState(null); // record whose correction linkage is shown

  const saveRecord = () => {
    if (!addForm.lpn.trim()) { toast("Enter the LPN"); return; }
    const linkedEv = gateEvents.find((e) => e.id === addForm.linkedEventId);
    const newRow = {
      id: `${kind}-new-${Date.now()}`, _added: Date.now(), lpn: addForm.lpn.trim().toUpperCase(), gate: gatesForFloor(addForm.floor)[0],
      vehicleType: addForm.vehicleType, floor: addForm.floor, tenant: addForm.tenant, entry: addForm.entry,
      exit: kind === "out" ? addForm.exit : "—", manualReason: kind === "manual" ? addForm.reason : undefined,
      correctedFrom: addForm.isCorrection && addForm.origPlate.trim()
        ? { plate: addForm.origPlate.trim().toUpperCase(), ref: linkedEv ? gateEventLabel(linkedEv) : "Manual Gate Open (unspecified)", eventId: addForm.linkedEventId || null, reason: addForm.reason, at: `${TODAY} 09:42` }
        : null,
    };
    setRows((rs) => [newRow, ...rs]);
    // Make the new row visible: jump to the first page and clear filters that might hide it.
    setPage(1); setFloor("All"); setGate("All"); setTenant("All"); setDate(""); setLpnq("");
    toast(addForm.isCorrection ? "Record added & linked to mis-read event" : "In/Out record added");
    setAddOpen(false); setAddForm(BLANK_REC);
  };
  const [floor, setFloor] = useState("All");
  const [gate, setGate] = useState("All");
  const [tenant, setTenant] = useState("All");
  const [date, setDate] = useState("");
  const [lpnq, setLpnq] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortKey, setSortKey] = useState("entry"); // entry | lpn
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // id of LPN being edited
  const [cctv, setCctv] = useState(null);
  const [manual, setManual] = useState(null);

  const gates = floor === "All" ? null : gatesForFloor(floor);
  // Functional multi-field filter (floor / gate / tenant / date / LPN).
  const filtered = rows
    .filter((r) =>
      (floor === "All" || r.floor === floor) &&
      (gate === "All" || r.gate === gate) &&
      (tenant === "All" || r.tenant === tenant) &&
      (!date || r.entry.startsWith(date)) &&
      (!lpnq || r.lpn.toLowerCase().includes(lpnq.toLowerCase()))
    )
    .sort((a, b) => {
      // Newly added records float to the top so they're immediately visible.
      if ((a._added || 0) !== (b._added || 0)) return (b._added || 0) - (a._added || 0);
      return sortKey === "lpn" ? a.lpn.localeCompare(b.lpn) : b.entry.localeCompare(a.entry);
    });

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const curPage = Math.min(page, pages);
  const pageRows = filtered.slice((curPage - 1) * pageSize, curPage * pageSize);

  const cols = kind === "out"
    ? ["LPN", "Gate", "Type", "Entry", "Exit", "Floor", "Tenant", ""]
    : kind === "manual"
    ? ["LPN", "Gate", "Floor", "Time", "Reason", "Photo", ""]
    : ["LPN", "Gate", "Type", "Entry", "Floor", "Tenant", ""];

  const updateLpn = (id, val) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, lpn: val } : r)));
  const clearAll = () => { setFloor("All"); setGate("All"); setTenant("All"); setDate(""); setLpnq(""); };

  return (
    <div>
      {/* Add record + Filters / Sort controls */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
        <Btn onClick={() => { setAddForm(BLANK_REC); setAddOpen(true); }}><Plus className="h-4 w-4" /> Add In/Out Record</Btn>
        <div className="flex items-center gap-2.5">
          <ControlBtn icon={SlidersHorizontal} active={showFilters} onClick={() => setShowFilters((s) => !s)}>Filters</ControlBtn>
          <ControlBtn icon={ArrowDownUp} onClick={() => setSortKey((k) => (k === "entry" ? "lpn" : "entry"))}>Sort by: {sortKey === "entry" ? "Latest Entry" : "LPN"}</ControlBtn>
        </div>
      </div>

      {/* Collapsible advanced filters */}
      {showFilters && (
        <Card className="mb-4 p-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <div><label className="mb-1 block text-xs text-slate-500">Floor Level</label>
              <Select value={floor} onChange={(e) => { setFloor(e.target.value); setGate("All"); }}><option>All</option>{FLOORS.map((f) => <option key={f}>{f}</option>)}</Select></div>
            <div><label className="mb-1 block text-xs text-slate-500">Gate Number</label>
              <Select value={gate} onChange={(e) => setGate(e.target.value)}><option>All</option>{(gates || ["North Gate", "South Gate", "Main Gate A", "Main Gate B"]).map((g) => <option key={g}>{g}</option>)}</Select></div>
            <div><label className="mb-1 block text-xs text-slate-500">Tenant</label>
              <Select value={tenant} onChange={(e) => setTenant(e.target.value)}><option>All</option>{TENANTS.map((t) => <option key={t.id}>{t.en}</option>)}</Select></div>
            <div><label className="mb-1 block text-xs text-slate-500">Date</label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="flex items-end"><Btn variant="outline" className="w-full justify-center" onClick={clearAll}><Filter className="h-4 w-4" /> Clear</Btn></div>
          </div>
        </Card>
      )}

      <Card>
        <TableToolbar search={lpnq} onSearch={(v) => { setLpnq(v); setPage(1); }} total={filtered.length}
          pageSize={pageSize} onPageSize={(n) => { setPageSize(n); setPage(1); }} page={curPage} pages={pages} onPage={setPage} />
        <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
            {cols.map((h, i) => <th key={i} className="px-4 py-3">{h}</th>)}
          </tr></thead>
          <tbody>
            {pageRows.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2.5">
                  {editing === r.id ? (
                    <input autoFocus value={r.lpn} onChange={(e) => updateLpn(r.id, e.target.value)} onBlur={() => setEditing(null)}
                      className="w-28 rounded bg-white px-2 py-1 font-mono text-sm text-[#1A5CFF] ring-1 ring-[#1A5CFF]/60 focus:outline-none" />
                  ) : (
                    <button onClick={() => setEditing(r.id)} title="Click to edit LPN" className="font-mono font-semibold text-slate-800 underline decoration-dotted decoration-slate-300 underline-offset-4 hover:text-[#1A5CFF]">{r.lpn}</button>
                  )}
                  {r.correctedFrom && (
                    <button onClick={() => setLinkView(r)} className="mt-0.5 flex items-center gap-1 text-[11px] text-[#1A5CFF] hover:underline"><Link2 className="h-3 w-3" /> from {r.correctedFrom.plate}</button>
                  )}
                </td>
                <td className="px-4 py-2.5 text-slate-600">{r.gate}</td>
                {kind !== "manual" && <td className="px-4 py-2.5 text-slate-500">{r.vehicleType}</td>}
                {kind === "manual"
                  ? (<>
                      <td className="px-4 py-2.5 text-slate-500">{r.floor}</td>
                      <td className="px-4 py-2.5 text-slate-500">{r.entry}</td>
                      <td className="px-4 py-2.5"><Badge color="amber">{r.manualReason || "Others"}</Badge></td>
                      <td className="px-4 py-2.5">
                        {r.photo
                          ? <button onClick={() => setPhotoView(r)} title="View capture"><img src={r.photo} alt="capture" className="h-9 w-14 rounded object-cover ring-1 ring-slate-200 hover:ring-[#1A5CFF]" /></button>
                          : <span className="text-xs text-slate-300">—</span>}
                      </td>
                    </>)
                  : (<>
                      <td className="px-4 py-2.5 text-slate-500">{r.entry}</td>
                      {kind === "out" && <td className="px-4 py-2.5 text-slate-500">{r.exit}</td>}
                      <td className="px-4 py-2.5"><Badge color="blue">{r.floor}</Badge></td>
                      <td className="px-4 py-2.5 text-slate-600">{r.tenant}</td>
                    </>)}
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-1.5">
                    <Btn variant="outline" onClick={() => setManual(r)} title="Manual Gate Open"><DoorOpen className="h-3.5 w-3.5" /></Btn>
                    {kind !== "manual" && <Btn variant="outline" onClick={() => setCctv(r.lpn)} title="CCTV Photo"><Camera className="h-3.5 w-3.5" /></Btn>}
                    <Btn onClick={() => toast(`Record ${r.lpn} saved`)} title="Save"><Save className="h-3.5 w-3.5" /></Btn>
                  </div>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr><td colSpan={cols.length} className="px-4 py-10 text-center text-sm text-slate-400">No records match your filters.</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </Card>

      {/* Add In/Out Record modal (with optional ANPR mis-read correction link) */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add In / Out Record" wide={addForm.isCorrection}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-xs text-slate-500">LPN</label><Input value={addForm.lpn} onChange={(e) => setAddForm({ ...addForm, lpn: e.target.value })} placeholder="e.g. RA1234" className="font-mono uppercase" /></div>
            <div><label className="mb-1 block text-xs text-slate-500">Vehicle Type</label><Select value={addForm.vehicleType} onChange={(e) => setAddForm({ ...addForm, vehicleType: e.target.value })}>{VEHICLE_TYPES.map((v) => <option key={v}>{v}</option>)}</Select></div>
            <div><label className="mb-1 block text-xs text-slate-500">Floor</label><Select value={addForm.floor} onChange={(e) => setAddForm({ ...addForm, floor: e.target.value })}>{FLOORS.map((f) => <option key={f}>{f}</option>)}</Select></div>
            <div><label className="mb-1 block text-xs text-slate-500">Tenant</label><Select value={addForm.tenant} onChange={(e) => setAddForm({ ...addForm, tenant: e.target.value })}>{TENANTS.map((t) => <option key={t.id} value={t.en}>{t.en}</option>)}</Select></div>
            <div><label className="mb-1 block text-xs text-slate-500">Entry Time</label><Input value={addForm.entry} onChange={(e) => setAddForm({ ...addForm, entry: e.target.value })} /></div>
            {kind === "out" && <div><label className="mb-1 block text-xs text-slate-500">Exit Time</label><Input value={addForm.exit} onChange={(e) => setAddForm({ ...addForm, exit: e.target.value })} /></div>}
          </div>

          <label className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200">
            <input type="checkbox" checked={addForm.isCorrection} onChange={(e) => setAddForm({ ...addForm, isCorrection: e.target.checked })} className="accent-[#1A5CFF]" />
            This corrects a mis-read ANPR record (link for audit)
          </label>

          {addForm.isCorrection && (
            <div className="space-y-3 rounded-lg p-3 ring-1 ring-[#1A5CFF]/20">
              <p className="text-xs text-slate-500">When the guard manually opened the gate for a mis-read plate, link this corrected record to that event.</p>
              <div><label className="mb-1 block text-xs text-slate-500">Linked Manual Gate Open event</label>
                <Select value={addForm.linkedEventId} onChange={(e) => {
                  const ev = gateEvents.find((x) => x.id === e.target.value);
                  setAddForm({ ...addForm, linkedEventId: e.target.value, origPlate: ev && ev.plate && !ev.plate.startsWith("(") ? ev.plate : addForm.origPlate, reason: ev?.reason || addForm.reason });
                }}>
                  <option value="">Select a gate-open event…</option>
                  {gateEvents.map((ev) => <option key={ev.id} value={ev.id}>{gateEventLabel(ev)}</option>)}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs text-slate-500">Original (mis-read) LPN</label><Input value={addForm.origPlate} onChange={(e) => setAddForm({ ...addForm, origPlate: e.target.value })} placeholder="e.g. KL2O88" className="font-mono uppercase" /></div>
                <div><label className="mb-1 block text-xs text-slate-500">Reason</label><Select value={addForm.reason} onChange={(e) => setAddForm({ ...addForm, reason: e.target.value })}><option>ANPR mis-read</option><option>Plate obscured / dirty</option><option>No plate detected</option><option>Others</option></Select></div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-1"><Btn variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Btn><Btn onClick={saveRecord}><Save className="h-4 w-4" /> {addForm.isCorrection ? "Add & Link" : "Add Record"}</Btn></div>
        </div>
      </Modal>

      {/* Correction linkage audit view */}
      <Modal open={!!linkView} onClose={() => setLinkView(null)} title="Record Linkage — Audit">
        {linkView && (
          <div className="space-y-3">
            <div className="rounded-lg bg-red-50 p-3 ring-1 ring-red-200">
              <div className="text-xs font-medium text-red-700">Original — ANPR mis-read</div>
              <div className="mt-1 font-mono text-lg font-bold text-red-700">{linkView.correctedFrom.plate}</div>
              <div className="text-xs text-red-600/80">{linkView.correctedFrom.ref} · {linkView.correctedFrom.reason}</div>
            </div>
            <div className="flex items-center justify-center text-slate-400"><CornerDownRight className="h-5 w-5" /></div>
            <div className="rounded-lg bg-emerald-50 p-3 ring-1 ring-emerald-200">
              <div className="text-xs font-medium text-emerald-700">Corrected record</div>
              <div className="mt-1 font-mono text-lg font-bold text-emerald-700">{linkView.lpn}</div>
              <div className="text-xs text-emerald-700/80">{linkView.tenant} · {linkView.floor} · {linkView.entry}</div>
            </div>
            <div className="flex justify-end pt-1"><Btn variant="ghost" onClick={() => setLinkView(null)}>Close</Btn></div>
          </div>
        )}
      </Modal>

      <CCTVModal open={!!cctv} lpn={cctv} onClose={() => setCctv(null)} />
      <PhotoViewModal open={!!photoView} record={photoView} onClose={() => setPhotoView(null)} />
      <ManualGateModal open={!!manual} record={manual} onClose={() => setManual(null)} onConfirm={({ reason, remark, photo, time }) => {
        // HARDWARE: trigger barrier relay + write to audit trail. Snapshot is attached to the record.
        api.openGate(manual?.floor, manual?.gate, reason, remark);
        if (manual) setRows((rs) => rs.map((r) => (r.id === manual.id ? { ...r, photo: photo || r.photo, manualReason: reason, entry: time || r.entry } : r)));
        // Log the event with the ANPR-read plate so Vehicle Management can link a correction.
        addGateEvent?.({ time: time || manual?.entry, floor: manual?.floor, gate: manual?.gate, plate: manual?.lpn, reason });
        toast(`Gate opened · ${reason} · snapshot recorded`); setManual(null);
      }} />
    </div>
  );
}

function TruckTripRecord({ toast, ioRecords }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(null);
  const stepMeta = {
    in:   { icon: ArrowLeftRight, color: "emerald", label: "Entry" },
    gate: { icon: DoorOpen, color: "blue", label: "Gate Pass" },
    pay:  { icon: CreditCard, color: "violet", label: "Payment" },
    out:  { icon: ArrowLeftRight, color: "amber", label: "Exit" },
  };
  // Build trips from the live In/Out records (trucks) + matching POS payment.
  const ins = (ioRecords?.in || []).filter((r) => r.vehicleType === "Truck");
  const outs = ioRecords?.out || [];
  const allTrips = ins.map((inRec) => {
    const outRec = outs.find((o) => o.lpn === inRec.lpn);
    const pay = POS_RECORDS.find((p) => p.lpn === inRec.lpn && p.paid);
    const steps = [{ type: "in", gate: inRec.gate, floor: inRec.floor, time: inRec.entry, note: "ANPR entry" }];
    if (pay) steps.push({ type: "pay", gate: `POS · ${pay.method}`, floor: pay.floor, time: pay.payTime, note: pay.method, amount: pay.amount });
    if (outRec && outRec.exit && outRec.exit !== "—") steps.push({ type: "out", gate: outRec.gate, floor: outRec.floor, time: outRec.exit, note: "ANPR exit" });
    return { id: `TRP-${inRec.lpn}`, lpn: inRec.lpn, tenant: inRec.tenant, status: outRec ? "Completed" : "In Progress", steps };
  });
  const trips = allTrips.filter((t) => !q || t.lpn.toLowerCase().includes(q.toLowerCase()) || t.tenant.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by LPN or tenant…" className="w-72 max-w-full rounded-lg bg-white px-3 py-2 pl-9 text-sm text-slate-800 ring-1 ring-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1A5CFF]/60" />
        </div>
        <Btn variant="ghost" onClick={() => toast("Insert In/Out trip record")}><Plus className="h-4 w-4" /> Add Trip</Btn>
        <span className="text-xs text-slate-400">{trips.length} trip(s)</span>
      </div>

      <div className="space-y-3">
        {trips.map((t) => {
          const expanded = open === t.id;
          const paid = t.steps.filter((s) => s.type === "pay").reduce((a, s) => a + (s.amount || 0), 0);
          return (
            <Card key={t.id} className="overflow-hidden">
              <button onClick={() => setOpen(expanded ? null : t.id)} className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1A5CFF]/10"><Truck className={`h-5 w-5 ${CN.text}`} /></span>
                  <div>
                    <div className="flex items-center gap-2"><span className="font-mono font-semibold text-slate-800">{t.lpn}</span><Badge color={t.status === "Completed" ? "emerald" : "amber"}>{t.status}</Badge></div>
                    <div className="text-xs text-slate-500">{t.tenant} · Trip {t.id}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden text-right sm:block"><div className="text-xs text-slate-400">Gates passed</div><div className="text-sm font-semibold text-slate-700">{t.steps.filter((s) => s.type !== "pay").length}</div></div>
                  <div className="text-right"><div className="text-xs text-slate-400">Paid</div><div className="text-sm font-semibold text-slate-800">${paid}</div></div>
                  <ChevronDown className={`h-5 w-5 text-slate-400 transition ${expanded ? "rotate-180" : ""}`} />
                </div>
              </button>

              {expanded && (
                <div className="border-t border-slate-100 px-5 py-4">
                  <ol className="relative ml-2 border-l-2 border-slate-200">
                    {t.steps.map((s, i) => {
                      const m = stepMeta[s.type];
                      return (
                        <li key={i} className="mb-4 ml-5 last:mb-0">
                          <span className={`absolute -left-[11px] flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white ${ACCENT[m.color]}`}><m.icon className="h-3 w-3" /></span>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 text-sm font-medium text-slate-800">{m.label} · {s.gate}<Badge color="slate">{s.floor}</Badge></div>
                              <div className="text-xs text-slate-500">{s.note}{s.amount ? ` · HK$${s.amount}` : ""}</div>
                            </div>
                            <div className="font-mono text-xs text-slate-400">{s.time}</div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                  <div className="mt-2 flex justify-end gap-2">
                    <Btn variant="outline" onClick={() => toast(`Trip ${t.id} exported`)}><FileBarChart className="h-3.5 w-3.5" /> Export Trip</Btn>
                    <Btn onClick={() => toast(`Trip ${t.id} saved`)}><Save className="h-3.5 w-3.5" /> Save</Btn>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function InOutRecords({ toast, addGateEvent, gateEvents = [], ioRecords, setIoRecords }) {
  const tabs = [
    { id: "in", label: "In Record" },
    { id: "out", label: "Out Record" },
    { id: "manual", label: "Manual Gate Open" },
    { id: "truck", label: "Truck Trip Record" },
  ];
  const [tab, setTab] = useState("in");
  // Write back to the App-level store for the active kind.
  const setRows = (updater) => setIoRecords((prev) => ({ ...prev, [tab]: typeof updater === "function" ? updater(prev[tab]) : updater }));
  return (
    <div>
      <SectionTitle icon={ArrowLeftRight} title="In / Out Records" desc="Gate entry & exit logs · ANPR · manual gate audit" />
      <div className="mb-4 flex flex-wrap gap-6 border-b border-slate-200">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`-mb-px border-b-2 pb-2.5 text-sm transition focus:outline-none ${tab === t.id ? "border-[#1A5CFF] font-semibold text-[#1A5CFF]" : "border-transparent text-slate-500 hover:text-slate-700"}`}>{t.label}</button>
        ))}
      </div>
      {tab === "truck" ? (
        <TruckTripRecord toast={toast} ioRecords={ioRecords} />
      ) : (
        <RecordTable key={tab} kind={tab} rows={ioRecords[tab]} setRows={setRows} toast={toast} addGateEvent={addGateEvent} gateEvents={gateEvents} />
      )}
    </div>
  );
}

/* --------------------------- Carpark & POS ------------------------------- */
function PosManagement({ toast }) {
  const [tab, setTab] = useState("pos");
  const [pFloor, setPFloor] = useState("All");
  const [pTenant, setPTenant] = useState("All");
  const [pLpn, setPLpn] = useState("");
  const [pDate, setPDate] = useState("2026-06-19");
  const [records, setRecords] = useState(POS_RECORDS);
  const [corr, setCorr] = useState(null);   // record being corrected
  const [cform, setCform] = useState({ plate: "", reason: "ANPR mis-read", ref: "" });
  const [linkView, setLinkView] = useState(null);

  const posRows = records.filter((r) =>
    (pFloor === "All" || r.floor === pFloor) &&
    (pTenant === "All" || r.tenant === pTenant) &&
    (!pLpn || r.lpn.toLowerCase().includes(pLpn.toLowerCase())) &&
    (!pDate || r.entry.startsWith(pDate))
  );
  const printReceipt = (r) => { toast("Opening print dialog…"); printReceiptDoc(r); };

  const openCorrect = (r) => { setCform({ plate: "", reason: "ANPR mis-read", ref: "" }); setCorr(r); };
  const saveCorrect = () => {
    const newPlate = cform.plate.trim().toUpperCase();
    if (!newPlate) { toast("Enter the corrected plate"); return; }
    if (!corr.paid) {
      // Not settled yet — amend the plate in place (logged amendment), receipt prints corrected.
      setRecords((rs) => rs.map((r) => (r.id === corr.id ? { ...r, lpn: newPlate, amendNote: `Plate amended from ${corr.lpn} (${cform.reason})` } : r)));
      toast("Plate amended before settlement");
    } else {
      // Already settled — keep original (mark Corrected), issue a linked amended receipt.
      const id = Math.max(...records.map((r) => r.id)) + 1;
      const newReceipt = `CN-${100200 + id}`;
      setRecords((rs) => rs.flatMap((r) => {
        if (r.id !== corr.id) return [r];
        const corrected = { ...r, status: "Corrected", supersededBy: newReceipt };
        const amended = {
          ...r, id, receiptNo: newReceipt, lpn: newPlate, status: "Amended", amends: corr.receiptNo,
          correctedFrom: { plate: corr.lpn, ref: cform.ref.trim() || `Original receipt ${corr.receiptNo}`, reason: cform.reason, at: `${TODAY} 09:42 · fm.user` },
        };
        return [corrected, amended];
      }));
      toast("Amended receipt issued & linked to original");
    }
    setCorr(null);
  };

  return (
    <div>
      <SectionTitle icon={CreditCard} title="Carpark & POS Management" desc="Configuration · rate tables · payment records" />
      <div className="mb-4 flex gap-6 border-b border-slate-200">
        {[{ id: "pos", label: "POS Records" }, { id: "config", label: "Configuration" }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`-mb-px border-b-2 pb-2.5 text-sm focus:outline-none ${tab === t.id ? "border-[#1A5CFF] font-semibold text-[#1A5CFF]" : "border-transparent text-slate-500 hover:text-slate-700"}`}>{t.label}</button>
        ))}
      </div>

      {tab === "config" ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="mb-3 font-semibold text-slate-800">Rate Table — by Gate</h3>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400"><th className="pb-2">Gate</th><th className="pb-2">Rate / hr</th><th className="pb-2">Grace Period</th></tr></thead>
              <tbody>
                {["Main Gate A", "North Gate", "South Gate"].map((g, i) => (
                  <tr key={g} className="border-b border-slate-100"><td className="py-2 text-slate-700">{g}</td>
                    <td className="py-2"><Input className="w-24" defaultValue={["$18", "$22", "$20"][i]} /></td>
                    <td className="py-2"><Input className="w-24" defaultValue={["15 min", "10 min", "10 min"][i]} /></td></tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card className="p-5">
            <h3 className="mb-3 font-semibold text-slate-800">Rate Table — by Vehicle Type</h3>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400"><th className="pb-2">Vehicle Type</th><th className="pb-2">Rate / hr</th></tr></thead>
              <tbody>
                {VEHICLE_TYPES.map((v, i) => (
                  <tr key={v} className="border-b border-slate-100"><td className="py-2 text-slate-700">{v}</td>
                    <td className="py-2"><Input className="w-24" defaultValue={["$20", "$28", "$35"][i]} /></td></tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex justify-end"><Btn onClick={() => toast("Rate configuration saved")}><Save className="h-4 w-4" /> Save Configuration</Btn></div>
          </Card>
        </div>
      ) : (
        <>
          <DataTable
            columns={["Receipt / LPN", "Gate", "Floor", "Pay Time", "Method", "Txn No", "Amount", "Status", ""]}
            rows={posRows}
            searchKeys={["lpn", "tenant", "receiptNo", "txnNo"]}
            sortKeys={[{ key: "entry", label: "Latest Entry", cmp: (a, b) => b.entry.localeCompare(a.entry) }, { key: "amount", label: "Amount", cmp: (a, b) => b.amount - a.amount }]}
            filterPanel={
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Select value={pFloor} onChange={(e) => setPFloor(e.target.value)}><option value="All">All Floors</option>{FLOORS.map((f) => <option key={f}>{f}</option>)}</Select>
                <Select value={pTenant} onChange={(e) => setPTenant(e.target.value)}><option value="All">All Tenants</option>{TENANTS.map((t) => <option key={t.id}>{t.en}</option>)}</Select>
                <Input type="date" value={pDate} onChange={(e) => setPDate(e.target.value)} />
                <Btn variant="outline" className="justify-center" onClick={() => { setPFloor("All"); setPTenant("All"); setPLpn(""); setPDate(""); }}><Filter className="h-4 w-4" /> Clear</Btn>
              </div>
            }
            renderRow={(r) => {
              const corrected = r.status === "Corrected";
              return (
                <tr key={r.id} className={`border-b border-slate-100 hover:bg-slate-50 ${corrected ? "opacity-60" : ""}`}>
                  <td className="px-4 py-2.5">
                    <div className="text-[11px] text-slate-400">{r.receiptNo}</div>
                    <div className={`font-mono font-semibold ${corrected ? "text-slate-400 line-through" : "text-slate-800"}`}>{r.lpn}</div>
                    {r.correctedFrom && (
                      <button onClick={() => setLinkView(r)} className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-[#1A5CFF] hover:underline"><Link2 className="h-3 w-3" /> from {r.correctedFrom.plate}</button>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">{r.gate}</td>
                  <td className="px-4 py-2.5"><Badge color="blue">{r.floor}</Badge></td>
                  <td className="px-4 py-2.5 text-slate-500">{r.paid ? r.payTime : <span className="text-amber-600">Pending</span>}</td>
                  <td className="px-4 py-2.5">{r.paid ? <Badge color="emerald">{r.method}</Badge> : <span className="text-slate-400">—</span>}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{r.txnNo}</td>
                  <td className="px-4 py-2.5 font-semibold text-slate-800">${r.amount}</td>
                  <td className="px-4 py-2.5">
                    {r.status === "Amended" ? <Badge color="blue">Amended</Badge>
                      : corrected ? <Badge color="red">Corrected</Badge>
                      : <Badge color={r.paid ? "emerald" : "amber"}>{r.paid ? "Settled" : "Pending"}</Badge>}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {!corrected && <Btn variant="outline" onClick={() => openCorrect(r)} title="Correct plate"><Link2 className="h-3.5 w-3.5" /></Btn>}
                      <Btn variant="outline" onClick={() => printReceipt(r)} title="Export PDF receipt"><Printer className="h-3.5 w-3.5" /></Btn>
                    </div>
                  </td>
                </tr>
              );
            }}
          />
          <p className="mt-3 text-xs text-slate-400">Payment methods: Octopus · WeChat · Alipay · Visa / Master. Settled receipts are immutable — corrections issue a linked amended receipt.</p>
        </>
      )}

      {/* Correct plate modal — dual mode based on settlement status */}
      <Modal open={!!corr} onClose={() => setCorr(null)} title="Correct Plate">
        {corr && (
          <div className="space-y-3">
            <div className={`rounded-lg px-3 py-2 text-xs ring-1 ${corr.paid ? "bg-amber-50 text-amber-700 ring-amber-200" : "bg-[#1A5CFF]/5 text-[#1A5CFF] ring-[#1A5CFF]/15"}`}>
              {corr.paid
                ? <>This receipt <b>{corr.receiptNo}</b> is already settled and cannot be edited. An <b>amended receipt</b> will be issued and linked to this one for audit.</>
                : <>This transaction <b>{corr.receiptNo}</b> is <b>not yet settled</b> — the plate will be amended in place before payment.</>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="mb-1 block text-xs text-slate-500">Original (mis-read) LPN</label><Input value={corr.lpn} disabled className="cursor-not-allowed bg-slate-50 font-mono text-slate-500" /></div>
              <div><label className="mb-1 block text-xs text-slate-500">Corrected LPN</label><Input value={cform.plate} onChange={(e) => setCform({ ...cform, plate: e.target.value })} placeholder="e.g. KL2088" className="font-mono uppercase" /></div>
            </div>
            <div><label className="mb-1 block text-xs text-slate-500">Reason</label><Select value={cform.reason} onChange={(e) => setCform({ ...cform, reason: e.target.value })}><option>ANPR mis-read</option><option>Plate obscured / dirty</option><option>No plate detected</option><option>Others</option></Select></div>
            <div><label className="mb-1 block text-xs text-slate-500">Linked Record (Manual Gate / In-Out / Vehicle correction)</label><Input value={cform.ref} onChange={(e) => setCform({ ...cform, ref: e.target.value })} placeholder="e.g. Manual Gate Open · South Gate · 2026-06-19 08:50" /></div>
            <div className="flex justify-end gap-2 pt-1"><Btn variant="ghost" onClick={() => setCorr(null)}>Cancel</Btn><Btn onClick={saveCorrect}><Save className="h-4 w-4" /> {corr.paid ? "Issue Amended Receipt" : "Amend Plate"}</Btn></div>
          </div>
        )}
      </Modal>

      {/* POS linkage audit view */}
      <Modal open={!!linkView} onClose={() => setLinkView(null)} title="Receipt Linkage — Audit">
        {linkView && (
          <div className="space-y-3">
            <div className="rounded-lg bg-red-50 p-3 ring-1 ring-red-200">
              <div className="text-xs font-medium text-red-700">Original receipt — ANPR mis-read</div>
              <div className="mt-1 flex items-baseline justify-between"><span className="font-mono text-lg font-bold text-red-700">{linkView.correctedFrom.plate}</span><span className="text-xs text-red-600/80">{linkView.amends}</span></div>
              <div className="text-xs text-red-600/80">{linkView.correctedFrom.ref} · {linkView.correctedFrom.reason}</div>
            </div>
            <div className="flex items-center justify-center text-slate-400"><CornerDownRight className="h-5 w-5" /></div>
            <div className="rounded-lg bg-emerald-50 p-3 ring-1 ring-emerald-200">
              <div className="text-xs font-medium text-emerald-700">Amended receipt</div>
              <div className="mt-1 flex items-baseline justify-between"><span className="font-mono text-lg font-bold text-emerald-700">{linkView.lpn}</span><span className="text-xs text-emerald-700/80">{linkView.receiptNo}</span></div>
              <div className="text-xs text-emerald-700/80">{linkView.tenant} · {linkView.floor} · ${linkView.amount} · issued {linkView.correctedFrom.at}</div>
            </div>
            <div className="flex justify-end gap-2 pt-1"><Btn variant="outline" onClick={() => printReceipt(linkView)}><Printer className="h-3.5 w-3.5" /> Amended PDF</Btn><Btn variant="ghost" onClick={() => setLinkView(null)}>Close</Btn></div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ------------------------------- CCTV Live -------------------------------- */
function CctvLiveview({ toast, addGateEvent, addIoRecord }) {
  const [floor, setFloor] = useState("L3");
  const gates = gatesForFloor(floor);
  const [manualGate, setManualGate] = useState(null); // the specific gate being opened

  return (
    <div>
      <SectionTitle icon={Video} title="CCTV Liveview" desc="Gate cameras · 55″ wall display feed">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Floor</span>
          <Select value={floor} onChange={(e) => setFloor(e.target.value)} className="w-28">{FLOORS.map((f) => <option key={f}>{f}</option>)}</Select>
        </div>
      </SectionTitle>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {gates.map((g) => (
          <Card key={g} className="overflow-hidden">
            <div className="relative flex aspect-video items-center justify-center bg-slate-900">
              <Video className="h-10 w-10 text-slate-600" />
              <span className="absolute left-3 top-3 flex items-center gap-1 rounded bg-red-500/90 px-2 py-0.5 text-xs font-semibold text-white"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> LIVE</span>
              <span className="absolute bottom-3 left-3 rounded bg-slate-800/80 px-2 py-0.5 text-xs text-slate-200">{floor} · {g}</span>
              <span className="absolute bottom-3 right-3 rounded bg-slate-800/80 px-2 py-0.5 text-xs text-slate-400">1080p</span>
            </div>
            {/* Per-gate manual open — each camera controls its own barrier only */}
            <div className="flex items-center justify-between px-4 py-2.5">
              <div className="text-sm font-medium text-slate-700">{g}</div>
              <Btn variant="outline" onClick={() => setManualGate(g)}><DoorOpen className="h-3.5 w-3.5" /> Open this gate</Btn>
            </div>
          </Card>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-400">Each camera opens only its own gate. {gates.length > 1 ? `${floor} has ${gates.length} independent gates (${gates.join(" · ")}).` : `${floor} has a single gate (${gates[0]}).`}</p>

      <ManualGateModal open={!!manualGate} record={{ floor, gate: manualGate || "Gate", lpn: "(live)" }}
        vehicles={VEHICLES.filter((v) => v.status !== "Deleted" && v.gate !== "—").map((v) => ({ ...v, entryTime: `2026-06-19 0${7 + (v.id % 3)}:${String((v.id * 7) % 60).padStart(2, "0")}` }))}
        onClose={() => setManualGate(null)}
        onConfirm={({ reason, time, plate, linkedVehicleId, photo }) => {
          const t = time || `${TODAY} 09:42`;
          const v = VEHICLES.find((x) => x.id === linkedVehicleId);
          const lpn = linkedVehicleId ? plate : "(unread)";
          // Log the gate-open event and create persistent Manual + In records.
          addGateEvent?.({ time: t, floor, gate: manualGate, plate: lpn, reason, vehicleId: linkedVehicleId });
          const base = { lpn, gate: manualGate, floor, vehicleType: v?.vehicleType || "Private Car", tenant: v?.tenant || "—", entry: t };
          addIoRecord?.("manual", { ...base, id: `mg-${Date.now()}`, manualReason: reason, photo });
          addIoRecord?.("in", { ...base, id: `in-${Date.now() + 1}`, exit: "—" });
          toast(linkedVehicleId ? `Gate opened · linked to ${plate} · In record created` : `${floor} · ${manualGate} opened · record created`);
          setManualGate(null);
        }} />
    </div>
  );
}

/* -------------------------------- Reports -------------------------------- */
// money:true reports contain financial figures and are restricted to the BMO role.
const REPORTS = [
  { id: "space", title: "Parking Space Management Report", icon: LayoutDashboard, money: false, desc: "Occupancy & space utilisation by floor and tenant, incl. peak periods." },
  { id: "revenue", title: "Revenue Report", icon: CreditCard, money: true, desc: "Total parking revenue by gate, vehicle type and period." },
  { id: "vsummary", title: "Vehicle Summary Report", icon: Car, money: false, desc: "Vehicle counts by category — whitelist, monthly, temp, blacklist, BMO." },
  { id: "tenant", title: "Tenant Profile", icon: Building2, money: false, desc: "Tenant directory: floors, gates, whitelist/space limits and active period." },
  { id: "grouping", title: "Vehicle Grouping Report", icon: Filter, money: false, desc: "Vehicles grouped by tenant, floor and category for review." },
  { id: "financial", title: "Payment Status & Financial Report", icon: CreditCard, money: true, desc: "Settled vs pending, payment-method breakdown and financial summary." },
];

function Reports({ toast, role }) {
  const visible = REPORTS.filter((r) => !r.money || role === "BMO");
  return (
    <div>
      <SectionTitle icon={FileBarChart} title="Reports" desc="Operational & financial reporting" />
      {role !== "BMO" && (
        <p className="mb-4 text-xs text-slate-400">Financial reports (Revenue · Payment Status &amp; Financial) are visible to BMO only.</p>
      )}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((r) => (
          <Card key={r.id} className="flex flex-col p-5">
            <div className="flex items-start justify-between gap-2">
              <span className={`rounded-lg p-2 ring-1 ${r.money ? ACCENT.violet : ACCENT.blue}`}><r.icon className="h-5 w-5" /></span>
              {r.money && <Badge color="violet">BMO only</Badge>}
            </div>
            <h3 className="mt-3 font-semibold text-slate-800">{r.title}</h3>
            <p className="mt-1 flex-1 text-sm text-slate-500">{r.desc}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Input type="date" defaultValue="2026-06-01" /><Input type="date" defaultValue="2026-06-19" />
            </div>
            <div className="mt-3 flex gap-2">
              <Btn onClick={() => toast(`${r.title} generated`)}><FileBarChart className="h-4 w-4" /> Generate</Btn>
              <Btn variant="ghost" onClick={() => { api.exportReport(r.id, {}); toast("Exported to Excel"); }}>Export</Btn>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AuditLog() {
  return (
    <div>
      <SectionTitle icon={ScrollText} title="Audit Log" desc="System activity trail · who did what, when" />
      <DataTable
        columns={["Timestamp", "User", "Role", "Action"]}
        rows={AUDIT_LOG}
        searchKeys={["user", "role", "action"]}
        sortKeys={[{ key: "time", label: "Latest", cmp: (a, b) => b.time.localeCompare(a.time) }, { key: "user", label: "User", cmp: (a, b) => a.user.localeCompare(b.user) }]}
        renderRow={(a) => (
          <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
            <td className="px-4 py-3 font-mono text-xs text-slate-500">{a.time}</td>
            <td className="px-4 py-3 text-slate-700">{a.user}</td>
            <td className="px-4 py-3"><Badge color={{ BMO: "blue", Tenant: "violet", Guard: "amber", FM: "emerald" }[a.role]}>{a.role}</Badge></td>
            <td className="px-4 py-3 text-slate-600">{a.action}</td>
          </tr>
        )}
      />
      <p className="mt-3 text-xs text-slate-400">Audit Log records user actions. System / device / API events are kept separately under <span className="text-slate-600">System Log</span>.</p>
    </div>
  );
}

function SystemLog() {
  const levelColor = { INFO: "blue", WARN: "amber", ERROR: "red" };
  return (
    <div>
      <SectionTitle icon={Terminal} title="System Log" desc="System · device · API events (separate from Audit Log)" />
      <DataTable
        columns={["Timestamp", "Level", "Source", "Message"]}
        rows={SYSTEM_LOG}
        searchKeys={["level", "source", "msg"]}
        sortKeys={[{ key: "time", label: "Latest", cmp: (a, b) => b.time.localeCompare(a.time) }, { key: "level", label: "Level", cmp: (a, b) => a.level.localeCompare(b.level) }]}
        renderRow={(s) => (
          <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
            <td className="px-4 py-3 font-mono text-xs text-slate-500">{s.time}</td>
            <td className="px-4 py-3"><Badge color={levelColor[s.level]}>{s.level}</Badge></td>
            <td className="px-4 py-3 text-slate-600">{s.source}</td>
            <td className="px-4 py-3 text-slate-600">{s.msg}</td>
          </tr>
        )}
      />
    </div>
  );
}

/* ============================== Auth / Login ============================= */
function PasswordInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
      <input type={show ? "text" : "password"} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full rounded-lg bg-white px-3 py-2 pl-9 pr-9 text-sm text-slate-800 ring-1 ring-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1A5CFF]/60" />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function IconField({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
      <input {...props} className="w-full rounded-lg bg-white px-3 py-2 pl-9 text-sm text-slate-800 ring-1 ring-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1A5CFF]/60" />
    </div>
  );
}

function LoginScreen({ accounts, tenants, onLogin, onRegister }) {
  const [mode, setMode] = useState("login"); // login | register
  const [err, setErr] = useState("");
  // login fields
  const [login, setLogin] = useState("");
  const [pwd, setPwd] = useState("");
  const [remember, setRemember] = useState(true);
  // register fields
  const [reg, setReg] = useState({ name: "", login: "", email: "", role: "BMO", password: "", confirm: "" });

  const doLogin = (e) => {
    e?.preventDefault();
    const acc = accounts.find((a) => a.login.toLowerCase() === login.trim().toLowerCase());
    if (!acc || acc.password !== pwd) { setErr("Invalid login ID or password."); return; }
    // Tenant users are blocked when their tenant is inactive or its active period has expired.
    if (acc.role === "Tenant") {
      const t = (tenants || []).find((x) => x.en === acc.tenant);
      if (!isTenantActive(t)) { setErr("Your tenant account is inactive or its active period has expired. Please contact BMO."); return; }
    }
    setErr(""); onLogin(acc);
  };

  const doRegister = (e) => {
    e?.preventDefault();
    if (!reg.name || !reg.login || !reg.email) { setErr("Please complete all fields."); return; }
    if (accounts.some((a) => a.login.toLowerCase() === reg.login.trim().toLowerCase())) { setErr("This login ID already exists."); return; }
    if (reg.password.length < 6) { setErr("Password must be at least 6 characters."); return; }
    if (reg.password !== reg.confirm) { setErr("Passwords do not match."); return; }
    setErr("");
    onRegister({ login: reg.login.trim(), password: reg.password, name: reg.name.trim(), role: reg.role, email: reg.email.trim() });
    setMode("login"); setLogin(reg.login.trim()); setPwd(""); setReg({ name: "", login: "", email: "", role: "BMO", password: "", confirm: "" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 md:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden flex-col justify-between bg-[#1A5CFF] p-8 text-white md:flex">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 text-xl font-black">菜</div>
            <div><div className="text-sm font-bold leading-tight">CAINIAO SMART GATEWAY</div><div className="text-xs text-white/70">Vehicle Management System</div></div>
          </div>
          <div>
            <h2 className="text-2xl font-bold leading-snug">Smart Cainiao Hub<br />智慧菜鳥港</h2>
            <p className="mt-3 text-sm text-white/80">Centralised carpark, gate and tenant management across L1–L12. Secure role-based access for BMO, Tenant, Guard and FM.</p>
            <div className="mt-6 flex gap-2">
              {["ANPR Gates", "CCTV", "POS", "12 Floors"].map((t) => <span key={t} className="rounded-full bg-white/15 px-3 py-1 text-xs">{t}</span>)}
            </div>
          </div>
          <div className="text-xs text-white/60">© 2026 Cainiao · CBRE Facility Operations</div>
        </div>

        {/* Form panel */}
        <div className="p-8">
          <div className="mb-1 flex items-center gap-2 md:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1A5CFF] font-black text-white">菜</div>
            <span className="font-bold text-slate-800">Cainiao VMS</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800">{mode === "login" ? "Sign in to your account" : "Create an account"}</h1>
          <p className="mt-1 text-sm text-slate-500">{mode === "login" ? "Enter your VMS credentials to continue." : "Register a new VMS portal account."}</p>

          {err && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" /> {err}
            </div>
          )}

          {mode === "login" ? (
            <form onSubmit={doLogin} className="mt-5 space-y-3">
              <div><label className="mb-1 block text-xs font-medium text-slate-500">Login ID</label><IconField icon={UserIcon} value={login} onChange={(e) => setLogin(e.target.value)} placeholder="e.g. andy.chan" /></div>
              <div><label className="mb-1 block text-xs font-medium text-slate-500">Password</label><PasswordInput value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="••••••••" /></div>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-1.5 text-slate-500"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-[#1A5CFF]" /> Remember me</label>
                <button type="button" onClick={() => alert("Password reset link sent (mock).")} className="text-[#1A5CFF] hover:underline">Forgot password?</button>
              </div>
              <Btn className="mt-1 w-full justify-center" onClick={doLogin}><Lock className="h-4 w-4" /> Sign In</Btn>
              <p className="pt-1 text-center text-sm text-slate-500">No account? <button type="button" onClick={() => { setErr(""); setMode("register"); }} className="font-medium text-[#1A5CFF] hover:underline">Create one</button></p>
              <div className="mt-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-500 ring-1 ring-slate-200">
                <span className="font-medium text-slate-600">Demo accounts</span> — password <code className="rounded bg-white px-1 ring-1 ring-slate-200">cainiao123</code>:
                <div className="mt-1">andy.chan (BMO) · kaho.wong (Guard) · priya.fm (FM) · cainiao.admin (Tenant)</div>
              </div>
            </form>
          ) : (
            <form onSubmit={doRegister} className="mt-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs font-medium text-slate-500">Full Name</label><IconField icon={UserIcon} value={reg.name} onChange={(e) => setReg({ ...reg, name: e.target.value })} placeholder="e.g. Chan Tai Man" /></div>
                <div><label className="mb-1 block text-xs font-medium text-slate-500">Login ID</label><IconField icon={UserIcon} value={reg.login} onChange={(e) => setReg({ ...reg, login: e.target.value })} placeholder="e.g. taiman.chan" /></div>
              </div>
              <div><label className="mb-1 block text-xs font-medium text-slate-500">Email</label><IconField icon={Mail} type="email" value={reg.email} onChange={(e) => setReg({ ...reg, email: e.target.value })} placeholder="name@company.com" /></div>
              <div><label className="mb-1 block text-xs font-medium text-slate-500">Role</label><Select value={reg.role} onChange={(e) => setReg({ ...reg, role: e.target.value })}>{Object.keys(ROLES).map((r) => <option key={r} value={r}>{r} · {ROLES[r].sub}</option>)}</Select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs font-medium text-slate-500">Password</label><PasswordInput value={reg.password} onChange={(e) => setReg({ ...reg, password: e.target.value })} placeholder="Min 6 chars" /></div>
                <div><label className="mb-1 block text-xs font-medium text-slate-500">Confirm</label><PasswordInput value={reg.confirm} onChange={(e) => setReg({ ...reg, confirm: e.target.value })} placeholder="Re-enter" /></div>
              </div>
              <Btn className="mt-1 w-full justify-center" onClick={doRegister}><CheckCircle2 className="h-4 w-4" /> Create Account</Btn>
              <p className="pt-1 text-center text-sm text-slate-500">Already registered? <button type="button" onClick={() => { setErr(""); setMode("login"); }} className="font-medium text-[#1A5CFF] hover:underline">Sign in</button></p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================= Shell ================================== */
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "User Management", icon: Users },
  { id: "tenants", label: "Tenant Management", icon: Building2 },
  { id: "vehicles", label: "Vehicle Management", icon: Car },
  { id: "records", label: "In / Out Records", icon: ArrowLeftRight },
  { id: "pos", label: "Carpark & POS", icon: CreditCard },
  { id: "cctv", label: "CCTV Liveview", icon: Video },
  { id: "reports", label: "Reports", icon: FileBarChart },
  { id: "audit", label: "Audit Log", icon: ScrollText },
  { id: "syslog", label: "System Log", icon: Terminal },
];

function SidebarBody({ allowedNav, page, go, role }) {
  return (
    <>
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1A5CFF] font-black text-white">菜</div>
        <div><div className="text-sm font-bold leading-tight text-slate-800">Cainiao VMS</div><div className="text-[11px] text-slate-400">Smart Gateway</div></div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {allowedNav.map((n) => (
          <button key={n.id} onClick={() => go(n.id)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${page === n.id ? "bg-[#1A5CFF]/10 text-[#1A5CFF] ring-1 ring-[#1A5CFF]/20" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`}>
            <n.icon style={{ width: 18, height: 18 }} /> {n.label}
          </button>
        ))}
      </nav>
      <div className="border-t border-slate-200 px-4 py-3 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Smart Cainiao Hub · 智慧菜鳥港</div>
        <div className="mt-1">L1–L12 · {role} view</div>
      </div>
    </>
  );
}

export default function App() {
  const [accounts, setAccounts] = useState(SEED_ACCOUNTS);
  const [tenants, setTenants] = useState(TENANTS);
  const [gateEvents, setGateEvents] = useState(SEED_GATE_EVENTS);
  // In/Out records lifted to App state (per kind) so added records persist across
  // tab switches and re-renders instead of resetting with the component.
  const [ioRecords, setIoRecords] = useState(() => ({
    in: genRecords("in"),
    out: genRecords("out"),
    manual: genRecords("manual").map((r, i) => ({ ...r, manualReason: GATE_REASONS[i % GATE_REASONS.length], photo: makeSnapshot({ plate: r.lpn, gate: r.gate, floor: r.floor, time: r.entry }) })),
  }));
  const [authUser, setAuthUser] = useState(null); // logged-in account or null
  const [role, setRole] = useState("BMO");
  const [page, setPage] = useState("dashboard");
  const [toastMsg, setToastMsg] = useState("");
  const [roleOpen, setRoleOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [now, setNow] = useState(new Date("2026-06-19T09:42:00"));

  useEffect(() => { const t = setInterval(() => setNow((d) => new Date(d.getTime() + 1000)), 1000); return () => clearInterval(t); }, []);

  const toast = (m) => { setToastMsg(m); setTimeout(() => setToastMsg(""), 2200); };

  const handleLogin = (acc) => { setAuthUser(acc); setRole(acc.role); setPage("dashboard"); };
  const handleRegister = (acc) => { setAccounts((a) => [...a, acc]); };
  const handleLogout = () => { setAuthUser(null); setUserOpen(false); };
  const addGateEvent = (ev) => setGateEvents((g) => [{ id: `MG-${1001 + g.length}`, by: authUser?.login || "guard", ...ev }, ...g]);
  // Append a real In/Out record so every gate action leaves a persistent record.
  const addIoRecord = (kind, row) => setIoRecords((prev) => ({ ...prev, [kind]: [{ _added: Date.now(), ...row }, ...(prev[kind] || [])] }));

  const allowedNav = NAV.filter((n) => MODULE_ACCESS[n.id].includes(role));

  // If current page not allowed for role, fall back to first allowed page.
  // NOTE: this hook must stay ABOVE the early return below, otherwise the hook
  // count changes between the login screen and the app, crashing React.
  useEffect(() => { if (!MODULE_ACCESS[page].includes(role)) setPage(allowedNav[0]?.id || "dashboard"); }, [role]); // eslint-disable-line

  // Gate the whole portal behind authentication.
  if (!authUser) {
    return <LoginScreen accounts={accounts} tenants={tenants} onLogin={handleLogin} onRegister={handleRegister} />;
  }

  const RoleIcon = ROLES[role].icon;
  const fmtDate = now.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
  const fmtTime = now.toLocaleTimeString("en-GB");

  const render = () => {
    switch (page) {
      case "dashboard": return <Dashboard />;
      case "users": return <UserManagement toast={toast} role={role} authUser={authUser} />;
      case "tenants": return <TenantManagement toast={toast} tenants={tenants} setTenants={setTenants} />;
      case "vehicles": return <VehicleManagement toast={toast} role={role} />;
      case "records": return <InOutRecords toast={toast} addGateEvent={addGateEvent} gateEvents={gateEvents} ioRecords={ioRecords} setIoRecords={setIoRecords} />;
      case "pos": return <PosManagement toast={toast} />;
      case "cctv": return <CctvLiveview toast={toast} addGateEvent={addGateEvent} addIoRecord={addIoRecord} />;
      case "reports": return <Reports toast={toast} role={role} />;
      case "audit": return <AuditLog />;
      case "syslog": return <SystemLog />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 [font-feature-settings:'tnum']" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <SidebarBody allowedNav={allowedNav} page={page} go={setPage} role={role} />
      </aside>

      {/* Mobile sidebar drawer */}
      {mobileNav && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileNav(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-white shadow-xl">
            <SidebarBody allowedNav={allowedNav} page={page} go={(id) => { setPage(id); setMobileNav(false); }} role={role} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6 sm:gap-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileNav(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-800 sm:text-base">CAINIAO SMART GATEWAY <span className={CN.text}>VMS</span></h1>
              <p className="hidden text-xs text-slate-400 sm:block">Vehicle Management System · Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-600 ring-1 ring-slate-200 sm:flex">
              <Clock className={`h-3.5 w-3.5 ${CN.text}`} /> {fmtDate} · <span className="font-mono">{fmtTime}</span>
            </div>
            <button className="relative rounded-lg bg-slate-100 p-2 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-200"><Bell className="h-4 w-4" /><span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" /></button>

            {/* Role switcher */}
            <div className="relative">
              <button onClick={() => setRoleOpen((o) => !o)} className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm ring-1 ring-slate-300 hover:bg-slate-50">
                <span className={`rounded-md p-1 ring-1 ${ACCENT[ROLES[role].color]}`}><RoleIcon className="h-3.5 w-3.5" /></span>
                <div className="text-left leading-tight"><div className="font-semibold text-slate-800">{ROLES[role].label}</div><div className="text-[10px] text-slate-400">{ROLES[role].sub}</div></div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>
              {roleOpen && (
                <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 shadow-2xl">
                  <div className="px-3 py-2 text-[11px] uppercase tracking-wide text-slate-400">Preview as role</div>
                  {Object.entries(ROLES).map(([key, r]) => (
                    <button key={key} onClick={() => { setRole(key); setRoleOpen(false); }} className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-slate-50 ${role === key ? "bg-slate-50" : ""}`}>
                      <span className={`rounded-md p-1 ring-1 ${ACCENT[r.color]}`}><r.icon className="h-3.5 w-3.5" /></span>
                      <div className="text-left leading-tight"><div className="font-medium text-slate-800">{r.label}</div><div className="text-[10px] text-slate-400">{r.sub}</div></div>
                      {role === key && <CheckCircle2 className={`ml-auto h-4 w-4 ${CN.text}`} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Signed-in user menu */}
            <div className="relative">
              <button onClick={() => setUserOpen((o) => !o)} className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-slate-300 hover:bg-slate-50">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1A5CFF] text-xs font-bold text-white">{authUser.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>
              {userOpen && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 shadow-2xl">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <div className="text-sm font-semibold text-slate-800">{authUser.name}</div>
                    <div className="text-xs text-slate-400">{authUser.email}</div>
                    <div className="mt-1.5"><Badge color="blue">{authUser.role} · {authUser.login}</Badge></div>
                  </div>
                  <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{render()}</main>
      </div>

      <Toast msg={toastMsg} />
      <style>{`@keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
