# Noctra setup

1. Push this folder to GitHub, then Cloudflare Pages: connect the repo, **build command: none**, **output directory: /** (root).
2. Supabase > Edge Functions > Secrets, add:
   - `PRINTIFY_API_TOKEN` (Printify > Account > Connections > API tokens)
   - `CRON_SECRET` (any long random string, for auto-fulfilment)
   - `SITE_URL` and `ALLOWED_ORIGINS` = your live site URL (already needed by store-api)
3. Open `/admin/`, sign in with your owner account, click **Sync products from Printify**.
4. Auto-send paid orders to Printify (run once in the Supabase SQL editor, swap in your secret):
```sql
create extension if not exists pg_cron; create extension if not exists pg_net;
select cron.schedule('noctra-printify', '*/10 * * * *', $$
  select net.http_post(url:='https://omzcuetbhurjwnzdufme.supabase.co/functions/v1/printify',
    headers:='{"content-type":"application/json","x-cron-secret":"YOUR_CRON_SECRET"}'::jsonb,
    body:='{"action":"run"}'::jsonb) $$);
```
Shipping prices live in Supabase table `site_settings` (key `shipping`, amounts in cents of ZAR).
