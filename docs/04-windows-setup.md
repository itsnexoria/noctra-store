# Windows PowerShell setup — one step at a time

Stop after each step and check the "Success looks like" line before moving on.

## Step 1 — Check tools
```powershell
node -v
npm -v
git --version
```
Success: Node **v20 or newer** (this project's router needs it), npm and Git print versions.
Missing? Install with Windows' built-in package manager, then **open a new PowerShell window**:
```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
```

## Step 2 — Unzip into a project folder
```powershell
New-Item -ItemType Directory -Force "$HOME\Projects" | Out-Null
Expand-Archive -Path "$HOME\Downloads\noctra-store.zip" -DestinationPath "$HOME\Projects" -Force
Set-Location "$HOME\Projects\noctra-store"
Get-ChildItem
```
Success: you see `package.json`, `src`, `docs`, `public`, `PROGRESS.md`.

## Step 3 — Install, test, build
```powershell
npm install
npm test
npm run build
```
Success: `7 passed`, then `built in …s`. If anything fails, copy the error text to Claude (never paste keys).

## Step 4 — Run locally
```powershell
npm run dev
```
Open the printed `http://localhost:5173/`. Success: black hero with the Noctra wordmark; `/shop/`, `/about/` and an unknown URL all render. Press `Ctrl+C` to stop.

## Step 5 — Git (local first)
```powershell
git init
git add .
git status          # confirm .env files and node_modules are NOT listed
git commit -m "Stage 1-2: research, scaffold, money + contribution logic"
```

## Step 6 — GitHub (browser)
1. github.com → **New repository** → name `noctra-store` → **Private** → no README/licence (you already have files) → Create.
2. Then:
```powershell
git branch -M main
git remote add origin https://github.com/<your-username>/noctra-store.git
git push -u origin main
```

## Step 7 — Cloudflare Pages (browser) — only after Steps 3–6 pass
Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → pick the repo.
- Build command: `npm run build`
- Build output directory: `dist`
- Environment variable: `NODE_VERSION` = `22`

Success: a `*.pages.dev` URL loads the site and direct visits to `/about/` work (single-page-app fallback — confirm this on the first deploy; report if you get a 404).
**Rollback:** Pages → Deployments → pick an earlier deployment → *Rollback*. Source rollback: `git revert <commit>` then push.

## Not yet (needs your decision/credentials)
- Supabase project, migrations and env vars → Stage 6 (I will guide you; you create the project and keep keys out of chat).
- Paystack, Printify accounts → see `PROGRESS.md` blockers.
