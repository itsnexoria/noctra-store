# Noctra store

Premium print-on-demand label. React + TypeScript + Vite, Supabase (to be added), Cloudflare Pages.

```powershell
npm install
npm test        # unit tests (money + contribution calculator)
npm run build   # typecheck + production build
npm run dev     # local dev server
```

Start with `PROGRESS.md`, then `docs/`. Secrets never go in the repo: copy `.env.example` to `.env.local` locally and set server secrets in Supabase/Cloudflare dashboards.

Layout: `src/` app code · `src/lib/` money + profit logic · `public/` static assets, `_headers`, brand files · `docs/` research and setup · `supabase/` migrations (Stage 6).
