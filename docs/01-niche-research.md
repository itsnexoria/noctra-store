# Stage 1 — Niche research (Noctra)

Research date: 26 Oct 2026. Labels: **[SOURCED]** = stated by a named source; **[ESTIMATE]** = my judgement; **[UNVERIFIED]** = not confirmed, check before relying on it.

## Honest headline

I could not measure niche-level demand. Paid keyword tools (eRank, Google Trends exports, marketplace sales data) were not available, and I will not invent search volumes, sales or revenue. What the evidence does support:

- Generic categories are huge and crowded: "shirt", "wall art" and "tshirt" sit among the top Etsy searches in 2026 (eRank quarterly reports). **[SOURCED]** That is demand for the category, not for any niche, and it implies heavy competition.
- Etsy's 2026 trend commentary points to celestial jewellery/zodiac themes and bookish home items (personalised bookshelf prints, bookish candles). **[SOURCED, via Etsy-trend blogs; secondary]**
- Typical Printify blank + print cost for a tee is roughly US$7.50–13.50 plus US$3.50–5 first-item US shipping; international shipping is higher. **[SOURCED from third-party blogs (podvector.ai); treat as ESTIMATE until you read real quotes from the Printify catalog API]**

Therefore the recommendation below is a **provisional pick plus a validation experiment**, not a proven winner.

## Scoring method

Six hypotheses × ten criteria, scored 1–5 (5 = best for a solo, low-budget launch; for IP risk and acquisition difficulty, 5 = safest / easiest). Weights sum to 100. Weighted score = Σ(weight × score) / 5, i.e. % of the maximum. **Scores are my judgement from the evidence above, not measurements.** A gap under ~8 points is within noise.

| Criterion | Weight |
|---|---|
| Evidence of demand | 10 |
| Competition / ease of differentiation | 15 |
| Plausible contribution margin | 15 |
| Product quality available via POD | 10 |
| Shipping cost & delivery to target countries | 5 |
| IP / trademark safety | 10 |
| Original designs without paid tools | 10 |
| Customer-acquisition ease | 10 |
| Repeat purchase & collection coherence | 5 |
| Solo manageability | 10 |

## Results

| Hypothesis | Dem | Diff | Mgn | Qual | Ship | IP | Design | Acq | Rpt | Solo | **Score** |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **A. Dark-sky / stargazing editorial** (tees, sweats, prints; original star-chart art from public astronomical data) | 3 | 3 | 3 | 4 | 3 | 5 | 5 | 2 | 4 | 4 | **71** |
| D. Minimal typographic label for a defined tribe | 2 | 3 | 3 | 4 | 3 | 4 | 4 | 3 | 3 | 5 | 68 |
| E. Original hobby designs (tabletop / cozy gaming) | 3 | 3 | 3 | 4 | 3 | 2 | 3 | 3 | 4 | 4 | 63 |
| B. Bookish "night reading" | 4 | 2 | 3 | 4 | 3 | 2 | 3 | 3 | 4 | 4 | 62 |
| C. Outdoor-inspired everyday | 3 | 2 | 3 | 3 | 3 | 4 | 3 | 2 | 3 | 4 | 59 |
| F. Design-led wall art & home | 4 | 1 | 3 | 3 | 2 | 4 | 4 | 2 | 3 | 4 | 59 |

### Why A leads, and what could be wrong

- **Fit with the brand you already have**: the Noctra wordmark carries a four-point star; "night" is the brand idea. This lowers the cost of coherent art direction. **[ESTIMATE]**
- **IP safety and free design pipeline**: star positions and constellation geometry are facts/ancient figures; I can generate original SVG/PNG artwork with scripts at R0. Avoid NASA/ESA logos, mission patches, and branded imagery. **[ESTIMATE — confirm any dataset licence before use]**
- **Weakest scores**: acquisition (2) and demand evidence (3). A new label has no audience; organic reach to astronomy-adjacent communities is slow and moderation rules matter. Margin is only "3" because contribution depends on real costs I have not yet retrieved.
- **Risk of being wrong**: A beat D by 3 points — not a meaningful difference. If validation (below) is flat, switch to **D** (backup), which is the lowest-ops option.
- **Why not B (bookish)** despite the best demand signal: crowded, and title/quote/character use drifts quickly into trademark and copyright trouble.

## Per-criterion notes for A (what must be verified)

1. **Demand** — no niche volume data. Validate with the experiment below.
2. **Competition** — many generic "constellation" and "zodiac" sellers exist on marketplaces **[UNVERIFIED — check Etsy/Redbubble listings by hand]**; differentiation must come from art direction, not subject matter.
3. **Price/margin** — set from real Printify quotes (API catalog + shipping endpoints) and the contribution calculator in `src/lib/contribution.ts`.
4. **Quality** — premium blanks such as Comfort Colors 1717 and Bella+Canvas 3001 are in Printify's catalog **[SOURCED]**; availability varies by provider.
5. **Shipping** — Printify catalog API returns per-country shipping profiles (US / EU-UK / rest of world tiers) **[SOURCED: developers.printify.com]**; read real numbers for your chosen provider.
6. **IP** — see above; run a trademark search for "Noctra" in the classes you will sell in (apparel, printed matter) **[UNVERIFIED]**.
7. **Free design tools** — Python/SVG scripts, Inkscape, Krita (all free) **[ESTIMATE]**.
8. **Acquisition** — organic only until contribution margin is proven; paid ads are an optional later cost.
9. **Repeat** — collections by season/hemisphere/constellation family; accessories (tote, mug, poster) as add-ons.
10. **Solo** — print-to-order, no inventory; the main workload is customer service and reconciliation.

## Validation experiment (before spending on stock photography or ads)

Duration 3–4 weeks, R0 software:

1. Design **6** pieces for Collection 01; create real mockups via Printify's free mockup generator (label them "mockup" on site).
2. Publish a waitlist page (this repo + a `waitlist` table in Supabase) with a price-range preview — **no fake reviews or scarcity**.
3. Post original work in 2–3 relevant communities **within each community's self-promotion rules**; log which designs get saves/clicks.
4. Order **2–3 real samples** yourself to check print quality, delivery time to a US/UK address (ask a friend) and actual landed cost.
5. Decision rule (arbitrary starting thresholds, adjust to taste): proceed if ≥ ~5% of unique visitors join the waitlist *and* sample quality is acceptable *and* modelled contribution margin ≥ 35% at the price customers tolerate. Otherwise move to hypothesis D.

## Sources consulted
- eRank quarterly Etsy trend reports Q1–Q3 2026 (help.erank.com)
- Printify "Leading trends for Etsy sellers in 2026" (printify.com/blog)
- Printify developer docs (developers.printify.com)
- podvector.ai Printify cost articles (secondary, estimates only)
