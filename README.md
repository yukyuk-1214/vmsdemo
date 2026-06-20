# Cainiao Smart Gateway — VMS Prototype

Interactive single-page prototype of the Vehicle Management System for Smart Cainiao Hub (智慧菜鳥港).
React + Tailwind (Play CDN) + lucide-react. All data is mock / in-memory (no backend).
Light theme · Cainiao blue (`#1A5CFF`).

> Demo login (password `cainiao123`): `andy.chan` (BMO), `kaho.wong` (Guard), `priya.fm` (FM), `cainiao.admin` (Tenant).

## Features

Login & RBAC
- Login + create-account; role switcher (BMO / Tenant / Guard / FM); sidebar adapts per role.
- A tenant whose account is inactive or whose active period expired cannot sign in.

Modules
- **Dashboard** — floor occupancy (green/amber/red), vehicle split, whitelist ratio, tenant allocation.
- **User Management** — Tenant column + tenant selector; Active-From date (future = "Scheduled"); Tenant admins manage their own tenant's users with permissions.
- **Tenant Management** — add tenant, company logo upload, active period + status, multi-floor carpark assignment (no gate), per-tenant whitelist/blacklist plates.
- **Vehicle Management** — categories + soft-delete/audit; Add Vehicle with plate-correction linkage to the original mis-read ANPR record; per-vehicle Manual Gate Open.
- **In/Out Records** — In / Out / Manual Gate / Truck Trip tabs; inline LPN edit; Manual Gate Open = LIVE view → Screen Capture → snapshot attached → open gate; CCTV photo per row.
- **Carpark & POS** — POS Records (default) + Configuration; Octopus / WeChat / Alipay / Visa·Master with per-gateway transaction numbers; dual-mode plate correction (amend before settlement / linked amended receipt after); bilingual (EN/中文) receipt printed via browser to a real printer; customer receipt stays clean.
- **CCTV Liveview** — per-gate live feeds; each camera opens only its own gate; manual open can link to a vehicle record (list shows plate + entry time).
- **Reports** — 6 reports; financial ones (Revenue, Payment Status & Financial) are BMO-only; Tenant/FM see the four non-financial reports.
- **Audit Log** + **System Log** (separate).

Audit linkage chain
- ANPR mis-read → manual gate open (logs an event) → corrected vehicle record / amended POS receipt, all cross-referenced for audit. Customer-facing receipts never disclose the correction.

> Backend & hardware (auth, live data, gate relay, charts, Excel export) are stubbed in an `api` object for later integration.

## Deploy to GitHub Pages (no local Node needed)

1. Create a new repository on GitHub and push this folder to it:
   ```bash
   git init
   git add .
   git commit -m "Cainiao VMS prototype"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
2. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The included workflow (`.github/workflows/deploy.yml`) builds and deploys automatically
   on every push. Watch progress under the **Actions** tab.
4. When it finishes, your public URL appears at **Settings → Pages**:
   `https://<your-username>.github.io/<your-repo>/`
5. Send that link to anyone — it runs entirely in the browser (login, filters, PDF export all work).

## Run locally (optional, needs Node 18+)

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
```

## Notes
- This is a front-end prototype: accounts and data live in browser memory and reset on refresh.
- Anyone with the URL can open it — use the demo accounts, do not put real data here.
- For a private review, deploy to Vercel/Netlify instead and enable password protection.
