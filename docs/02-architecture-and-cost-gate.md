# Stage 2 — Architecture verification and cost gate

Verified 26 Oct 2026 against the sources named. **[OFFICIAL]** = vendor page; **[SECONDARY]** = third-party; **[UNVERIFIED]** = open question.

## 1. Blocking finding — Paystack South Africa settles and charges in ZAR only

Paystack's own support page lists **ZAR as the only currency for South African businesses**; USD acceptance exists only for Nigeria and Kenya. Customers abroad can pay with Visa/Mastercard/Amex, but their bank converts into rand. **[OFFICIAL: support.paystack.com/en/articles/2130690]**

Consequences you should decide on before Stage 7:

| Option | What it means | Trade-off |
|---|---|---|
| **1. Charge in ZAR, show approximate USD/GBP** | One gateway, settles in rand, no FX on your side for revenue | Foreign shoppers see rand at checkout (conversion friction, possible card FX fees); you carry USD cost / ZAR revenue FX risk against Printify's USD billing |
| **2. Different gateway or merchant-of-record** | Could allow USD/GBP checkout | I have **not** verified any alternative's availability for SA sellers; each needs its own research |
| **3. Validate first with sample orders only** | No live payments needed | Delays revenue, costs only samples |

Default recommendation: build the payment layer provider-neutral (as specified), keep Paystack as the first adapter, and **do not enable live payments until you have tried a real foreign-card test purchase** and seen exactly what the buyer sees.

## 2. Paystack (payments) — facts

- Fees: **3.1% + R1 for international cards; 2.9% + R1 local**, VAT-exclusive; VAT 15% is charged on Paystack's fees. Payouts free; **settlement 2 working days**. **[OFFICIAL: paystack.com/za/pricing; support.paystack.com/en/articles/2124418]**
- Sole proprietors can open a "Starter" account (personal or business bank account + owner details) with a **collection limit** higher than a standard Starter account; registered companies need CIPC documents and director details. The limit amount was **not** retrieved. **[OFFICIAL; limit UNVERIFIED]**
- International card payments must be enabled/requested from the dashboard after activation; response within ~48 working hours. **[OFFICIAL]**
- Amex is supported for SA merchants. **[OFFICIAL]**
- Not yet verified: refund/dispute (chargeback) handling and fee treatment on refunds, webhook signature scheme, whether the sales model (apparel dropshipped from abroad) is within their acceptable-use terms. **[UNVERIFIED — read Paystack's webhook + terms docs at Stage 7; I will not code the integration from memory.]**

## 3. Printify (fulfilment) — facts

- REST API for individual merchants via a **Personal Access Token** (My Profile → Connections); token valid **1 year**; scopes include orders, products, uploads, webhooks, catalog. **[OFFICIAL: developers.printify.com]**
- Rate limits: **600 requests/min** global; **catalog endpoints 100/min**; product publish 200 per 30 min. **[OFFICIAL]**
- **No CORS** — the API cannot be called from the browser; secrets stay server-side (Supabase Edge Functions). **[OFFICIAL]**
- Catalog API returns blueprints, print providers, variants, and **per-country shipping profiles + handling time** (USD). Provider list includes average production time in business days. **[OFFICIAL]**
- Webhook topics include `order:created`, `order:updated`, `order:sent-to-production`, `order:shipment:created`, `order:shipment:delivered`; signed with HMAC in an `X-Pfy-Signature` header. **[SECONDARY: integration listings — confirm in the official Webhooks section before coding]**
- Billing: you pay Printify **production + shipping when an order is placed**, from a Printify **Balance (USD only, minimum top-up US$10)** or saved card(s). Changing billing currency disables Balance and coupons. **[OFFICIAL: help.printify.com]**
- Orders created through the API: exact submit/approve-for-production behaviour (e.g. whether `send_to_production` is a separate call) **[UNVERIFIED — confirm in the Orders section]**.
- **Open question that blocks launch:** whether a South African individual/sole proprietor can register and bill from a SA card/bank without issues. I found no official statement either way. **[UNVERIFIED — try registering; stop and report if refused]**

### Alternatives (kept as fallback; one provider at launch)
- **Printful**: API with no usage fee; no subscription required; pay per order. **[SECONDARY plans file + OFFICIAL help page]**
- **Gelato**: free plan includes API access and webhooks; local production network. **[SECONDARY]**
- SA-merchant eligibility and payouts for both: **[UNVERIFIED]**.

## 4. Hosting and backend

| Service | Free-tier facts | Gotchas |
|---|---|---|
| **Cloudflare Pages** | 500 builds/month, 20,000 files, 100 custom domains/project, builds time out at 20 min **[OFFICIAL: developers.cloudflare.com/pages/platform/limits]** | Pages Functions count against **Workers** quota (100,000 requests/day on free **[SECONDARY]**); sources disagree on free CPU time (10 ms vs 30 ms) — verify before relying on Functions. Plan: keep Pages purely static; run server logic in Supabase Edge Functions |
| **Supabase** | 500 MB DB, 1 GB file storage, 50,000 MAU, 500,000 Edge Function invocations/month, 2 active projects **[OFFICIAL pricing page + SECONDARY]** | **Free projects pause after 1 week of inactivity**; **no daily backups on Free** (Pro: 7 days) **[OFFICIAL]** → you must export backups yourself and keep the project active (a scheduled ping/reconcile job) |
| **GitHub** | Source control | Private-repo Actions minutes are limited **[UNVERIFIED]** |
| **Resend (email)** | 3,000 emails/month, **100/day**, 1 verified domain **[SECONDARY, consistent across sources + Resend blog]** | Daily cap bites on busy days; sending pauses at limit; sending from your own domain requires owning one |

**Scheduler (reconciliation, anti-pause):** needs a free mechanism. Candidates: Supabase `pg_cron` + `pg_net`, or a GitHub Actions scheduled workflow. Availability/limits on free plans: **[UNVERIFIED — check at Stage 8]**.

## 5. Cost gate

Currency shown as stated by the vendor; I have not converted to ZAR (no exchange-rate source was used).

| Category | Item | Cost |
|---|---|---|
| **Free software/hosting** | React, TypeScript, Vite, Cloudflare Pages, GitHub, Supabase Free, Claude Code (your existing access) | R0 upfront |
| **Transaction-based** | Paystack intl card | 3.1% + R1 + 15% VAT on the fee |
| | Paystack payout to bank | Free (transfers API: R3 each — not needed for normal settlement) |
| | Resend | R0 within free caps |
| **Production & shipping** | Printify blank + print, tees | ~US$7.50–13.50 **[SECONDARY estimate]** — replace with API quotes |
| | Printify shipping, first item | ~US$3.50–5 US domestic; higher international **[SECONDARY]** — API gives exact profiles |
| **Working capital** | Printify charges at order time; Paystack pays you ~2 working days later | Float ≈ (production + shipping per order) × orders in flight, + cost of sample orders, + Printify minimum top-up US$10 |
| **Unavoidable/optional** | Domain name | Not free; price **[UNVERIFIED]**. Needed for branded email and a professional storefront; `*.pages.dev` works for testing |
| | Trademark search/registration | Optional; searching is free in national databases, filing costs money **[UNVERIFIED]** |
| | Tax registration/accounting | Depends on turnover and structure; check SARS rules **[UNVERIFIED]** |
| | Ads | Optional, postponable |
| **Quotas / pauses** | Supabase pause (1 week idle), Pages 500 builds/mo, Resend 100/day, Printify API rate limits | See above |

**Gate status: NOT PASSED for live payments.** Passed for: building, local testing, sample orders. Remaining blockers: (1) ZAR-only decision, (2) SA-merchant registration with Printify, (3) minimum working capital agreed, (4) Paystack activation and international-card enablement.

## 6. Cash-flow risk in plain terms

You pay Printify (USD) when the order is submitted; Paystack pays you (ZAR) about two working days after the customer paid; refunds and chargebacks can reach you after production is already paid for. Hold enough balance to cover several orders in flight plus replacements, and never auto-resubmit an order whose state is unknown.

## 7. Architecture decision

```
Browser (React/Vite on Cloudflare Pages, static)
   │  anon key, RLS-protected reads
   ▼
Supabase: Postgres + RLS + Edge Functions (server secrets live here only)
   ├─ create-checkout  → validates cart server-side → pending order → Paystack init
   ├─ payment-webhook  → verify signature + re-verify transaction → mark paid → queue job
   ├─ fulfil-worker    → Printify submit (idempotent) → record provider order id
   ├─ printify-webhook → tracking/status events
   └─ reconcile (scheduled) → resolves uncertain states; keeps project active
```
Keep it small: one database, one function runtime, one gateway adapter, one POD adapter. Nothing else until needed.
