# Cainiao Smart Gateway — VMS Prototype

Interactive single-page prototype of the Vehicle Management System for Smart Cainiao Hub (智慧菜鳥港).
React + Tailwind (Play CDN) + lucide-react. All data is mock / in-memory (no backend).

> Demo login (password `cainiao123`): `andy.chan` (BMO), `kaho.wong` (Guard), `priya.fm` (FM), `cainiao.admin` (Tenant).

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
