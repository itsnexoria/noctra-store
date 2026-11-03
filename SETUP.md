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
3. **Cloudflare Worker:** `wrangler.jsonc` and `src/worker.js` serve the site and add sitemap, product and journal meta tags. Keep the deploy command as `npx wrangler deploy`. The `name` in `wrangler.jsonc` must match your Worker name in the Cloudflare dashboard.
4. **Journal:** five scripture drafts are in the admin Journal tab. Read them, edit if you like, then tick Published.
5. **Hero photos:** admin > Hero photos to choose the home page slideshow.
6. **Cron jobs** (already created in Supabase): `noctra-cart-recovery` (every 30 min), `noctra-fulfilment-health` (hourly).

## v3 features: one-time setup

1. **Reviews:** nothing to configure. A review request is emailed 7 days after a South African order ships (14 days for other countries). Hide reviews under Admin > Reviews.
2. **Back-in-stock:** customers can ask to be told about a sold-out size or colour. A variant counts as sold out when Printify stops offering it, which is detected when you press Sync in the admin (or when you untick "on sale" in Products).
3. **Wishlist / accounts:** same Supabase Auth setup as in the v2 notes.
4. **Refunds:** Admin > Orders > click an order > Cancel & refund / Partial refund. Needs the `PAYSTACK_SECRET_KEY` secret (already used for payments). Full refunds also cancel the Printify order when Printify still allows it.
5. **Journal:** new posts can be scheduled with a future "Publish on" date, and each post can show a "Shop this verse" piece.
6. **Product feed (Google Merchant Center, Pinterest, Meta/Instagram):** `https://nexorealm.org/feeds/products.xml`. In Merchant Center: Products > Feeds > add a scheduled fetch of that URL, country South Africa, language English. Pinterest: Catalogs > Add data source > paste the same URL. Instagram Shopping: add it as a data feed in Meta Commerce Manager.
7. **Analytics notice (optional):** put your Cloudflare Web Analytics token in `ANALYTICS_TOKEN` in `assets/config.js`. The cookie notice and footer "Cookie settings" link then appear and analytics loads only after consent. Leave it empty for no analytics and no notice.
8. **Cron jobs** (created in Supabase): `noctra-customer-mail` (every 30 minutes: review requests and back-in-stock emails).
