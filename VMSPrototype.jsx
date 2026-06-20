import React, { useState, useMemo, useEffect } from "react";
import {
  LayoutDashboard, Users, Building2, Car, ArrowLeftRight, CreditCard,
  Video, FileBarChart, ScrollText, ChevronDown, Search, Plus, Pencil,
  Trash2, X, Camera, DoorOpen, Save, CheckCircle2, Bell, Clock,
  CircleUser, ShieldCheck, Building, HardHat, Truck, Bus, Printer,
  AlertTriangle, MapPin, Filter, RotateCcw, Terminal,
  Lock, Mail, User as UserIcon, LogOut, Eye, EyeOff, AlertCircle, Menu,
  ChevronLeft, ChevronRight, SlidersHorizontal, ArrowDownUp,
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
  doc.text("CAINIAO SMART GATEWAY", M, 30);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  doc.text("Smart Cainiao Hub · Carpark Payment Receipt", M, 46);
  doc.setFontSize(8); doc.text("智慧菜鳥港", M, 60);

  // Title
  doc.setTextColor(30); doc.setFont("helvetica", "bold"); doc.setFontSize(13);
  doc.text("OFFICIAL RECEIPT", M, 100);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(120);
  doc.text(`Receipt No: CN-${(r.id ?? 0).toString().padStart(6, "0")}`, M, 116);

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
  users:      ["BMO"],
  tenants:    ["BMO", "FM"],
  vehicles:   ["BMO", "Tenant"],
  records:    ["BMO", "Guard", "FM"],
  pos:        ["BMO", "FM"],
  cctv:       ["BMO", "Guard"],
  reports:    ["BMO", "FM"],
  audit:      ["BMO"],
  syslog:     ["BMO"],
};

/* ------------------------------- Mock Data ------------------------------- */
const TENANTS = [
  { id: 1, en: "Cainiao Logistics HK", zh: "菜鳥物流香港", email: "ops@cainiao.hk", phone: "+852 2888 1000", floor: "L3", gate: "North Gate", whitelist: 50, spaceLimit: 30, used: 24 },
  { id: 2, en: "DHL Express Asia", zh: "敦豪速遞亞洲", email: "hub@dhl.com", phone: "+852 2400 3388", floor: "L4", gate: "South Gate", whitelist: 40, spaceLimit: 25, used: 19 },
  { id: 3, en: "SF Express", zh: "順豐速運", email: "depot@sf-express.com", phone: "+852 2730 0273", floor: "L2", gate: "North Gate", whitelist: 35, spaceLimit: 20, used: 18 },
  { id: 4, en: "Kerry Logistics", zh: "嘉里物流", email: "fleet@kerrylogistics.com", phone: "+852 2410 3600", floor: "L6", gate: "South Gate", whitelist: 30, spaceLimit: 18, used: 8 },
  { id: 5, en: "JD Logistics HK", zh: "京東物流香港", email: "hk@jdl.com", phone: "+852 3622 1200", floor: "L7", gate: "South Gate", whitelist: 28, spaceLimit: 15, used: 12 },
  { id: 6, en: "Yamato Transport", zh: "大和運輸", email: "hub@yamato.hk", phone: "+852 2865 0000", floor: "L5", gate: "South Gate", whitelist: 22, spaceLimit: 12, used: 7 },
  { id: 7, en: "FedEx Trade Networks", zh: "聯邦快遞", email: "ops@fedex.com", phone: "+852 2730 3333", floor: "L9", gate: "South Gate", whitelist: 20, spaceLimit: 10, used: 9 },
  { id: 8, en: "Lalamove Fleet", zh: "貨拉拉車隊", email: "fleet@lalamove.com", phone: "+852 3008 0000", floor: "L11", gate: "South Gate", whitelist: 18, spaceLimit: 8, used: 3 },
];

const USERS = [
  { id: 1, name: "Andy Chan", account: "andy.chan", role: "BMO", status: "Active" },
  { id: 2, name: "Tenant Admin (Cainiao)", account: "cainiao.admin", role: "Tenant", status: "Active" },
  { id: 3, name: "Wong Ka Ho", account: "kaho.wong", role: "Guard", status: "Active" },
  { id: 4, name: "Priya Sharma", account: "priya.fm", role: "FM", status: "Active" },
  { id: 5, name: "Tenant Admin (DHL)", account: "dhl.admin", role: "Tenant", status: "Inactive" },
  { id: 6, name: "Lau Chi Keung", account: "ck.lau", role: "Guard", status: "Active" },
];

// Mock credential store for the login / register flow (prototype only — not secure).
// Default password for every seeded account: "cainiao123".
const SEED_ACCOUNTS = [
  { login: "andy.chan", password: "cainiao123", name: "Andy Chan", role: "BMO", email: "andy.chan@cainiao.hk" },
  { login: "kaho.wong", password: "cainiao123", name: "Wong Ka Ho", role: "Guard", email: "kaho.wong@cbre.com" },
  { login: "priya.fm", password: "cainiao123", name: "Priya Sharma", role: "FM", email: "priya.sharma@cbre.com" },
  { login: "cainiao.admin", password: "cainiao123", name: "Tenant Admin (Cainiao)", role: "Tenant", email: "admin@cainiao.hk" },
];

const VEHICLE_TYPES = ["Private Car", "Van", "Truck"];
const VEHICLE_CATEGORIES = ["Whitelist", "Monthly Parking", "Temp", "Blacklist", "BMO"];

// P4: soft-delete + audit — each record carries status & DB audit timestamps.
const VEHICLES = [
  { id: 1, lpn: "RA1234", tenant: "Cainiao Logistics HK", category: "Whitelist", gate: "North Gate", floor: "L3", from: "2026-01-01", to: "2026-12-31", priority: 1, status: "Active", createdAt: "2026-01-01 08:00", modifiedAt: "2026-06-10 14:22", deletedAt: null },
  { id: 2, lpn: "VP8821", tenant: "DHL Express Asia", category: "Monthly Parking", gate: "South Gate", floor: "L4", from: "2026-06-01", to: "2026-06-30", priority: 1, status: "Active", createdAt: "2026-06-01 09:10", modifiedAt: "2026-06-01 09:10", deletedAt: null },
  { id: 3, lpn: "TM5566", tenant: "SF Express", category: "Whitelist", gate: "North Gate", floor: "L2", from: "2026-03-15", to: "2026-09-15", priority: 2, status: "Active", createdAt: "2026-03-15 11:30", modifiedAt: "2026-05-02 16:05", deletedAt: null },
  { id: 4, lpn: "GK4099", tenant: "Kerry Logistics", category: "Temp", gate: "South Gate", floor: "L6", from: "2026-06-19", to: "2026-06-19", priority: 1, status: "Deleted", createdAt: "2026-06-19 07:40", modifiedAt: "2026-06-19 07:40", deletedAt: "2026-06-19 07:58 · andy.chan" },
  { id: 5, lpn: "BX0001", tenant: "—", category: "Blacklist", gate: "—", floor: "—", from: "—", to: "—", priority: 0, status: "Active", createdAt: "2026-02-20 10:00", modifiedAt: "2026-02-20 10:00", deletedAt: null },
  { id: 6, lpn: "JD7012", tenant: "JD Logistics HK", category: "Whitelist", gate: "South Gate", floor: "L7", from: "2026-01-10", to: "2026-12-31", priority: 1, status: "Active", createdAt: "2026-01-10 13:15", modifiedAt: "2026-04-18 09:44", deletedAt: null },
];

const GATE_REASONS = ["Rubbish Car", "Carpark Full", "VIP", "Delivery", "Others"];
const PAYMENT_METHODS = ["Octopus", "H5 (WeChat / Alipay)", "Visa / Master"];

function genRecords(kind) {
  const rows = [];
  const seed = kind === "out" ? 41 : kind === "manual" ? 73 : 11;
  for (let i = 0; i < 22; i++) {
    const tenant = TENANTS[(i + seed) % TENANTS.length];
    const gate = gatesForFloor(tenant.floor)[i % gatesForFloor(tenant.floor).length];
    const vt = VEHICLE_TYPES[(i + seed) % VEHICLE_TYPES.length];
    const hh = String(7 + (i % 12)).padStart(2, "0");
    const mm = String((i * 7) % 60).padStart(2, "0");
    rows.push({
      id: `${kind}-${i}`,
      lpn: ["RA", "VP", "TM", "GK", "JD", "LX", "PK", "HV"][(i + seed) % 8] + String(1000 + ((i * 137 + seed) % 8999)),
      gate, vehicleType: vt, floor: tenant.floor, tenant: tenant.en,
      entry: `2026-06-19 ${hh}:${mm}`,
      exit: kind === "out" ? `2026-06-19 ${String(+hh + 2).padStart(2, "0")}:${mm}` : "—",
      manual: i % 5 === 0,
    });
  }
  return rows;
}

const POS_RECORDS = Array.from({ length: 14 }, (_, i) => {
  const t = TENANTS[i % TENANTS.length];
  return {
    id: i, lpn: ["RA", "VP", "TM"][i % 3] + String(2200 + i * 31),
    gate: gatesForFloor(t.floor)[0], vehicleType: VEHICLE_TYPES[i % 3], floor: t.floor, tenant: t.en,
    entry: `2026-06-19 0${7 + (i % 3)}:1${i % 6}`, exit: `2026-06-19 ${10 + (i % 5)}:2${i % 6}`,
    payTime: `2026-06-19 ${10 + (i % 5)}:2${(i % 6) + 1}`,
    method: PAYMENT_METHODS[i % PAYMENT_METHODS.length],
    amount: 25 + (i % 6) * 15,
  };
});

// Truck Trip Record — pairs each truck's full journey: which gates it passed
// and any payment action, in time order. (One trip = entry → floor gates → pay → exit.)
const TRUCK_TRIPS = [
  {
    id: "TRP-1001", lpn: "GK4099", tenant: "Kerry Logistics", vehicleType: "Truck", status: "Completed",
    steps: [
      { type: "in",   gate: "South Gate", floor: "L1", time: "2026-06-19 07:42", note: "ANPR entry" },
      { type: "gate", gate: "South Gate", floor: "L6", time: "2026-06-19 07:55", note: "Loading bay access" },
      { type: "pay",  gate: "POS · MO Room", floor: "L1", time: "2026-06-19 09:10", note: "Octopus", amount: 70 },
      { type: "out",  gate: "South Gate", floor: "L1", time: "2026-06-19 09:18", note: "ANPR exit" },
    ],
  },
  {
    id: "TRP-1002", lpn: "TM5566", tenant: "SF Express", vehicleType: "Truck", status: "Completed",
    steps: [
      { type: "in",   gate: "North Gate", floor: "L1", time: "2026-06-19 08:05", note: "ANPR entry" },
      { type: "gate", gate: "North Gate", floor: "L2", time: "2026-06-19 08:14", note: "Dock 3" },
      { type: "pay",  gate: "POS · H5", floor: "L1", time: "2026-06-19 10:02", note: "H5 (WeChat / Alipay)", amount: 95 },
      { type: "out",  gate: "North Gate", floor: "L1", time: "2026-06-19 10:11", note: "ANPR exit" },
    ],
  },
  {
    id: "TRP-1003", lpn: "LX7788", tenant: "JD Logistics HK", vehicleType: "Truck", status: "In Progress",
    steps: [
      { type: "in",   gate: "South Gate", floor: "L1", time: "2026-06-19 09:20", note: "ANPR entry" },
      { type: "gate", gate: "South Gate", floor: "L7", time: "2026-06-19 09:31", note: "Manual gate · Delivery" },
    ],
  },
];

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

function UserManagement({ toast }) {
  const [users, setUsers] = useState(USERS);
  const [modal, setModal] = useState(null); // {mode, user}
  const roleColor = { BMO: "blue", Tenant: "violet", Guard: "amber", FM: "emerald" };

  const save = () => { toast(modal.mode === "add" ? "User account created" : "User account updated"); setModal(null); };
  const del = (id) => { setUsers((u) => u.filter((x) => x.id !== id)); toast("User account deleted"); };

  return (
    <div>
      <SectionTitle icon={Users} title="User Management" desc="Account directory · Role-based access control">
        <Btn onClick={() => setModal({ mode: "add", user: { name: "", account: "", role: "BMO", status: "Active" } })}><Plus className="h-4 w-4" /> Add User</Btn>
      </SectionTitle>
      <DataTable
        columns={["Account Name", "Login", "Role", "Status", ""]}
        rows={users}
        searchKeys={["name", "account", "role"]}
        sortKeys={[{ key: "name", label: "Name", cmp: (a, b) => a.name.localeCompare(b.name) }, { key: "role", label: "Role", cmp: (a, b) => a.role.localeCompare(b.role) }]}
        renderRow={(u) => (
          <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
            <td className="px-4 py-3"><div className="flex items-center gap-2"><CircleUser className="h-7 w-7 text-slate-300" /><span className="font-medium text-slate-800">{u.name}</span></div></td>
            <td className="px-4 py-3 text-slate-500">{u.account}</td>
            <td className="px-4 py-3"><Badge color={roleColor[u.role]}>{u.role}</Badge></td>
            <td className="px-4 py-3"><Badge color={u.status === "Active" ? "emerald" : "slate"}>{u.status}</Badge></td>
            <td className="px-4 py-3"><div className="flex justify-end gap-2">
              <Btn variant="outline" onClick={() => setModal({ mode: "edit", user: u })}><Pencil className="h-3.5 w-3.5" /> Edit</Btn>
              <Btn variant="danger" onClick={() => del(u.id)}><Trash2 className="h-3.5 w-3.5" /></Btn>
            </div></td>
          </tr>
        )}
      />

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === "add" ? "Add User" : "Edit User"}>
        {modal && (
          <div className="space-y-3">
            <div><label className="mb-1 block text-xs text-slate-500">Account Name</label><Input defaultValue={modal.user.name} placeholder="e.g. Andy Chan" /></div>
            <div><label className="mb-1 block text-xs text-slate-500">Login ID</label><Input defaultValue={modal.user.account} placeholder="e.g. andy.chan" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="mb-1 block text-xs text-slate-500">Role</label><Select defaultValue={modal.user.role}>{Object.keys(ROLES).map((r) => <option key={r}>{r}</option>)}</Select></div>
              <div><label className="mb-1 block text-xs text-slate-500">Status</label><Select defaultValue={modal.user.status}><option>Active</option><option>Inactive</option></Select></div>
            </div>
            <div className="flex justify-end gap-2 pt-2"><Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn><Btn onClick={save}><Save className="h-4 w-4" /> Save</Btn></div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function TenantManagement({ toast }) {
  const [edit, setEdit] = useState(null);
  return (
    <div>
      <SectionTitle icon={Building2} title="Tenant Management" desc="Tenant profiles · Whitelist & parking space limits" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {TENANTS.map((t) => (
          <Card key={t.id} className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#1A5CFF]/10 ring-1 ring-[#1A5CFF]/20"><Building2 className={`h-7 w-7 ${CN.text}`} /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div><h3 className="truncate font-semibold text-slate-800">{t.en}</h3><p className="text-sm text-slate-500">{t.zh}</p></div>
                  <Btn variant="outline" onClick={() => setEdit(t)}><Pencil className="h-3.5 w-3.5" /> Edit</Btn>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  <div className="text-slate-400">Email</div><div className="truncate text-slate-600">{t.email}</div>
                  <div className="text-slate-400">Phone</div><div className="text-slate-600">{t.phone}</div>
                  <div className="text-slate-400">Floor / Gate</div><div className="text-slate-600">{t.floor} · {t.gate}</div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Badge color="blue">Whitelist Max {t.whitelist}</Badge>
                  <Badge color="emerald">Space Max {t.spaceLimit}</Badge>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title="Edit Tenant" wide>
        {edit && (
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-xs text-slate-500">Tenant Name (Eng)</label><Input defaultValue={edit.en} /></div>
            <div><label className="mb-1 block text-xs text-slate-500">Tenant Name (Chi)</label><Input defaultValue={edit.zh} /></div>
            <div><label className="mb-1 block text-xs text-slate-500">Email</label><Input defaultValue={edit.email} /></div>
            <div><label className="mb-1 block text-xs text-slate-500">Phone</label><Input defaultValue={edit.phone} /></div>
            <div><label className="mb-1 block text-xs text-slate-500">Floor</label><Select defaultValue={edit.floor}>{FLOORS.map((f) => <option key={f}>{f}</option>)}</Select></div>
            <div><label className="mb-1 block text-xs text-slate-500">Gate Number</label><Select defaultValue={edit.gate}>{gatesForFloor(edit.floor).map((g) => <option key={g}>{g}</option>)}</Select></div>
            <div><label className="mb-1 block text-xs text-slate-500">Whitelist Limit</label><Input type="number" defaultValue={edit.whitelist} /></div>
            <div><label className="mb-1 block text-xs text-slate-500">Parking Space Limit</label><Input type="number" defaultValue={edit.spaceLimit} /></div>
            <div className="col-span-2 flex justify-end gap-2 pt-2"><Btn variant="ghost" onClick={() => setEdit(null)}>Cancel</Btn><Btn onClick={() => { toast("Tenant profile updated"); setEdit(null); }}><Save className="h-4 w-4" /> Save Changes</Btn></div>
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
        <Btn onClick={() => toast("Add vehicle (checked vs tenant whitelist limit)")}><Plus className="h-4 w-4" /> Add Vehicle</Btn>
      </SectionTitle>
      <DataTable
        columns={["LPN", "Category", "Tenant", "Gate", "Floor", "Activation Period", "Priority", "Status", "Audit (DB)", ""]}
        rows={rows}
        searchKeys={["lpn", "tenant"]}
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
              <td className="px-4 py-3 font-mono font-semibold text-slate-800">{v.lpn}</td>
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
                  <Btn variant="outline" onClick={() => toast(readOnly ? "Tenant edit (within limit) saved" : "Vehicle updated")}><Pencil className="h-3.5 w-3.5" /></Btn>
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
    </div>
  );
}

/* ---------------------------- In / Out Records --------------------------- */
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

function ManualGateModal({ open, onClose, onSave }) {
  const [reason, setReason] = useState(GATE_REASONS[0]);
  const [remark, setRemark] = useState("");
  return (
    <Modal open={open} onClose={onClose} title="Manual Gate Open — Reason">
      <div className="space-y-3">
        <div><label className="mb-1 block text-xs text-slate-500">Reason</label>
          <Select value={reason} onChange={(e) => setReason(e.target.value)}>{GATE_REASONS.map((r) => <option key={r}>{r}</option>)}</Select>
        </div>
        <div><label className="mb-1 block text-xs text-slate-500">Remark</label>
          <textarea value={remark} onChange={(e) => setRemark(e.target.value)} rows={3} placeholder="Optional remark…" className="w-full rounded-lg bg-white px-3 py-2 text-sm text-slate-800 ring-1 ring-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1A5CFF]/60" />
        </div>
        <div className="flex justify-end gap-2 pt-1"><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={() => onSave(reason)}><DoorOpen className="h-4 w-4" /> Open Gate</Btn></div>
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

function RecordTable({ kind, toast }) {
  const [rows, setRows] = useState(() => genRecords(kind));
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
    .sort((a, b) => (sortKey === "lpn" ? a.lpn.localeCompare(b.lpn) : b.entry.localeCompare(a.entry)));

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
      {/* Filters / Sort controls (top-right) */}
      <div className="mb-3 flex items-center justify-end gap-2.5">
        <ControlBtn icon={SlidersHorizontal} active={showFilters} onClick={() => setShowFilters((s) => !s)}>Filters</ControlBtn>
        <ControlBtn icon={ArrowDownUp} onClick={() => setSortKey((k) => (k === "entry" ? "lpn" : "entry"))}>Sort by: {sortKey === "entry" ? "Latest Entry" : "LPN"}</ControlBtn>
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
                </td>
                <td className="px-4 py-2.5 text-slate-600">{r.gate}</td>
                {kind !== "manual" && <td className="px-4 py-2.5 text-slate-500">{r.vehicleType}</td>}
                {kind === "manual"
                  ? (<>
                      <td className="px-4 py-2.5 text-slate-500">{r.floor}</td>
                      <td className="px-4 py-2.5 text-slate-500">{r.entry}</td>
                      <td className="px-4 py-2.5"><Badge color="amber">VIP / Delivery</Badge></td>
                    </>)
                  : (<>
                      <td className="px-4 py-2.5 text-slate-500">{r.entry}</td>
                      {kind === "out" && <td className="px-4 py-2.5 text-slate-500">{r.exit}</td>}
                      <td className="px-4 py-2.5"><Badge color="blue">{r.floor}</Badge></td>
                      <td className="px-4 py-2.5 text-slate-600">{r.tenant}</td>
                    </>)}
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-1.5">
                    <Btn variant="outline" onClick={() => setManual(r.id)} title="Manual Gate Open Reason"><DoorOpen className="h-3.5 w-3.5" /></Btn>
                    <Btn variant="outline" onClick={() => setCctv(r.lpn)} title="CCTV Photo"><Camera className="h-3.5 w-3.5" /></Btn>
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

      <CCTVModal open={!!cctv} lpn={cctv} onClose={() => setCctv(null)} />
      <ManualGateModal open={!!manual} onClose={() => setManual(null)} onSave={(reason) => {
        // HARDWARE: trigger barrier relay + write to audit trail.
        api.openGate(floor, gate, reason, "");
        toast(`Gate opened · ${reason}`); setManual(null);
      }} />
    </div>
  );
}

function TruckTripRecord({ toast }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(TRUCK_TRIPS[0]?.id);
  const trips = TRUCK_TRIPS.filter((t) => !q || t.lpn.toLowerCase().includes(q.toLowerCase()) || t.tenant.toLowerCase().includes(q.toLowerCase()));
  const stepMeta = {
    in:   { icon: ArrowLeftRight, color: "emerald", label: "Entry" },
    gate: { icon: DoorOpen, color: "blue", label: "Gate Pass" },
    pay:  { icon: CreditCard, color: "violet", label: "Payment" },
    out:  { icon: ArrowLeftRight, color: "amber", label: "Exit" },
  };
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

function InOutRecords({ toast }) {
  const tabs = [
    { id: "in", label: "In Record" },
    { id: "out", label: "Out Record" },
    { id: "manual", label: "Manual Gate Open" },
    { id: "truck", label: "Truck Trip Record" },
  ];
  const [tab, setTab] = useState("in");
  return (
    <div>
      <SectionTitle icon={ArrowLeftRight} title="In / Out Records" desc="Gate entry & exit logs · ANPR · manual gate audit" />
      <div className="mb-4 flex flex-wrap gap-6 border-b border-slate-200">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`-mb-px border-b-2 pb-2.5 text-sm transition focus:outline-none ${tab === t.id ? "border-[#1A5CFF] font-semibold text-[#1A5CFF]" : "border-transparent text-slate-500 hover:text-slate-700"}`}>{t.label}</button>
        ))}
      </div>
      {tab === "truck" ? (
        <TruckTripRecord toast={toast} />
      ) : (
        <RecordTable kind={tab} toast={toast} />
      )}
    </div>
  );
}

/* --------------------------- Carpark & POS ------------------------------- */
function PosManagement({ toast }) {
  const [tab, setTab] = useState("config");
  const [pFloor, setPFloor] = useState("All");
  const [pTenant, setPTenant] = useState("All");
  const [pLpn, setPLpn] = useState("");
  const [pDate, setPDate] = useState("2026-06-19");
  const posRows = POS_RECORDS.filter((r) =>
    (pFloor === "All" || r.floor === pFloor) &&
    (pTenant === "All" || r.tenant === pTenant) &&
    (!pLpn || r.lpn.toLowerCase().includes(pLpn.toLowerCase())) &&
    (!pDate || r.entry.startsWith(pDate))
  );
  const printReceipt = (r) => { toast("Generating PDF receipt…"); exportReceiptPDF(r).catch(() => toast("PDF export failed")); };
  return (
    <div>
      <SectionTitle icon={CreditCard} title="Carpark & POS Management" desc="Configuration · rate tables · payment records" />
      <div className="mb-4 flex gap-6 border-b border-slate-200">
        {[{ id: "config", label: "Configuration" }, { id: "pos", label: "POS Records" }].map((t) => (
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
            columns={["LPN", "Gate", "Type", "Entry", "Exit", "Floor", "Pay Time", "Method", "Amount", ""]}
            rows={posRows}
            searchKeys={["lpn", "tenant"]}
            sortKeys={[{ key: "entry", label: "Latest Entry", cmp: (a, b) => b.entry.localeCompare(a.entry) }, { key: "amount", label: "Amount", cmp: (a, b) => b.amount - a.amount }]}
            filterPanel={
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Select value={pFloor} onChange={(e) => setPFloor(e.target.value)}><option value="All">All Floors</option>{FLOORS.map((f) => <option key={f}>{f}</option>)}</Select>
                <Select value={pTenant} onChange={(e) => setPTenant(e.target.value)}><option value="All">All Tenants</option>{TENANTS.map((t) => <option key={t.id}>{t.en}</option>)}</Select>
                <Input type="date" value={pDate} onChange={(e) => setPDate(e.target.value)} />
                <Btn variant="outline" className="justify-center" onClick={() => { setPFloor("All"); setPTenant("All"); setPLpn(""); setPDate(""); }}><Filter className="h-4 w-4" /> Clear</Btn>
              </div>
            }
            renderRow={(r) => (
              <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2.5 font-mono font-semibold text-slate-800">{r.lpn}</td>
                <td className="px-4 py-2.5 text-slate-500">{r.gate}</td>
                <td className="px-4 py-2.5 text-slate-500">{r.vehicleType}</td>
                <td className="px-4 py-2.5 text-slate-500">{r.entry}</td>
                <td className="px-4 py-2.5 text-slate-500">{r.exit}</td>
                <td className="px-4 py-2.5"><Badge color="blue">{r.floor}</Badge></td>
                <td className="px-4 py-2.5 text-slate-500">{r.payTime}</td>
                <td className="px-4 py-2.5"><Badge color="emerald">{r.method}</Badge></td>
                <td className="px-4 py-2.5 font-semibold text-slate-800">${r.amount}</td>
                <td className="px-4 py-2.5 text-right"><Btn variant="outline" onClick={() => printReceipt(r)} title="Export PDF receipt"><Printer className="h-3.5 w-3.5" /> PDF</Btn></td>
              </tr>
            )}
          />
          <p className="mt-3 text-xs text-slate-400">Payment methods: Octopus · H5 (WeChat / Alipay) · Visa / Master.</p>
        </>
      )}
    </div>
  );
}

/* ------------------------------- CCTV Live -------------------------------- */
function CctvLiveview({ toast }) {
  const [floor, setFloor] = useState("L3");
  const gates = gatesForFloor(floor);
  const [manual, setManual] = useState(false);
  return (
    <div>
      <SectionTitle icon={Video} title="CCTV Liveview" desc="Gate cameras · 55″ wall display feed">
        <div className="flex items-center gap-2">
          <Select value={floor} onChange={(e) => setFloor(e.target.value)} className="w-28">{FLOORS.map((f) => <option key={f}>{f}</option>)}</Select>
          <Btn variant="ghost" onClick={() => setManual(true)}><DoorOpen className="h-4 w-4" /> Manual Gate Open</Btn>
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
          </Card>
        ))}
      </div>
      <ManualGateModal open={manual} onClose={() => setManual(false)} onSave={(reason) => { toast(`Gate opened · ${reason}`); setManual(false); }} />
    </div>
  );
}

/* -------------------------------- Reports -------------------------------- */
function Reports({ toast }) {
  return (
    <div>
      <SectionTitle icon={FileBarChart} title="Reports" desc="In/Out & Payment reporting" />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {[
          { t: "In / Out Report", d: "Daily / monthly entry & exit volume by floor, gate and tenant." },
          { t: "Payment Report", d: "POS revenue breakdown by method, vehicle type and tenant." },
        ].map((r) => (
          <Card key={r.t} className="p-5">
            <h3 className="font-semibold text-slate-800">{r.t}</h3>
            <p className="mt-1 text-sm text-slate-500">{r.d}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Input type="date" defaultValue="2026-06-01" /><Input type="date" defaultValue="2026-06-19" />
            </div>
            <div className="mt-3 flex gap-2"><Btn onClick={() => toast("Report generated")}><FileBarChart className="h-4 w-4" /> Generate</Btn><Btn variant="ghost" onClick={() => { api.exportReport(r.t, {}); toast("Exported to Excel"); }}>Export</Btn></div>
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

function LoginScreen({ accounts, onLogin, onRegister }) {
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

  // Gate the whole portal behind authentication.
  if (!authUser) {
    return <LoginScreen accounts={accounts} onLogin={handleLogin} onRegister={handleRegister} />;
  }
  const allowedNav = NAV.filter((n) => MODULE_ACCESS[n.id].includes(role));

  // If current page not allowed for role, fall back to first allowed page.
  useEffect(() => { if (!MODULE_ACCESS[page].includes(role)) setPage(allowedNav[0]?.id || "dashboard"); }, [role]); // eslint-disable-line

  const RoleIcon = ROLES[role].icon;
  const fmtDate = now.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
  const fmtTime = now.toLocaleTimeString("en-GB");

  const render = () => {
    switch (page) {
      case "dashboard": return <Dashboard />;
      case "users": return <UserManagement toast={toast} />;
      case "tenants": return <TenantManagement toast={toast} />;
      case "vehicles": return <VehicleManagement toast={toast} role={role} />;
      case "records": return <InOutRecords toast={toast} />;
      case "pos": return <PosManagement toast={toast} />;
      case "cctv": return <CctvLiveview toast={toast} />;
      case "reports": return <Reports toast={toast} />;
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
