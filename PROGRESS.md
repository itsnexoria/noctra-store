# Progress checklist

Last updated: 26 Oct 2026

## Done and verified (by running them)
- [x] Stage 1 research document with weighted comparison and validation plan (`docs/01-niche-research.md`) — *evidence limits stated*
- [x] Stage 2 architecture/cost-gate document (`docs/02-architecture-and-cost-gate.md`)
- [x] Project scaffold: Vite + React + TypeScript, clean folder-style routes (`/shop/`, `/about/`), custom 404, security headers file
- [x] Integer-money module and contribution/profit calculator with warnings (`src/lib`) — `npm test`: 7/7 passing
- [x] `npm run build` succeeds; `npm audit --omit=dev`: 0 vulnerabilities
- [x] Brand foundations: tokens, logo variants, type system (`docs/03-brand-direction.md`)

## Not done / not verified
- [ ] Nothing has been deployed. No accounts, webhooks or live payments exist.
- [ ] Not yet built: product/cart/checkout pages, SQL migrations + RLS (Stage 6), payment & fulfilment functions (Stages 7–8), admin (Stage 9), email (Stage 11)
- [ ] Visual QA in a real browser has not been done in this session (build only)

## Blockers / decisions needed from you
1. **Currency**: Paystack South Africa is ZAR-only. Choose: charge in ZAR with approximate foreign display, or research another gateway (see doc 02 §1).
2. **Printify**: confirm a South African account can register and bill. Report any refusal.
3. **Niche**: approve provisional pick A (dark-sky/stargazing), or choose D, then run the validation experiment.
4. **Domain**: decide whether to buy one now (not free) or use `*.pages.dev` while testing.
5. **Working capital**: decide your test-order budget.

## Next stage (after approval)
Stage 6 first (schema + RLS + tests), then storefront data model, then payments adapter (after reading Paystack webhook docs).
