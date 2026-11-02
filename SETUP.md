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

## v2 features: one-time setup

1. **Supabase Auth (customer accounts):** Authentication > URL Configuration. Set Site URL to `https://nexorealm.org` and add `https://nexorealm.org/account/` to Redirect URLs. Under Authentication > SMTP, use your Resend SMTP settings (the built-in mailer only sends a few emails per hour).
2. **Edge function secrets:** `ALLOWED_ORIGINS` must include `https://nexorealm.org` (used by `store-api`, `account-api`, `printify`). `CRON_SECRET`, `RESEND_API_KEY`, `MAIL_FROM`, `ORDER_TOKEN_SECRET`, `SITE_URL`, `ALERT_EMAIL` are shared with the existing functions.
3. **Cloudflare Pages Functions:** the `functions/` folder deploys automatically with the site (sitemap, product and journal meta tags). No build command is needed.
4. **Journal:** five scripture drafts are in the admin Journal tab. Read them, edit if you like, then tick Published.
5. **Hero photos:** admin > Hero photos to choose the home page slideshow.
6. **Cron jobs** (already created in Supabase): `noctra-cart-recovery` (every 30 min), `noctra-fulfilment-health` (hourly).
