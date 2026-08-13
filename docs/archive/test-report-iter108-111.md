# Shelfmark R108–111 visual/brand upgrade — live QA report

Production https://shelfmark.zalize.com, deploy 0c3ded07, PR #16 (branch devin/1786141997-visual-upgrade, commit a8656c5).
Recorded browser pass + Playwright/shell verification (workers.dev + cache-busting). Axe-core 4.10.2, raw: /tmp/axe_results_r111.json.

## Escalation

**Hero collage counts do not match the stated spec (4 / 5 / 7).** Measured visible covers: **3** below sm (375/500px), **4** at sm (640/700px), **7** at md+ (768px). The code (`i > 3 ? "hidden md:block" : i > 2 ? "hidden sm:block"`, src/index.ts:104) makes covers 1–3 always visible, cover 4 sm+, covers 5–7 md+ — i.e. 3/4/7, one fewer than the brief's "4 ≤sm, 5 at sm, 7 at md+" at each tier. No overflow or visual defect; layout is clean (screenshot /tmp/m375_r111.png). Decide whether the spec or the index math is wrong.

## Results

- Hero (desktop light): text-6xl headline, Fraunces-italic amber "right order" (`<em>`), 7 tilted covers below search, rotations exactly −6/4/−3/5/−5/3/−4° (within ±3–6°), all linking to real /series/{slug} (discworld, the-saint, animorphs, oz-book-series, fighting-fantasy, james-bond, sune) — ✅ passed
- Hover straighten: hovering Mort cover → `rotate(0) translateY(-4px) scale(1.05)` visually straightened (before/after zooms captured) — ✅ passed
- Paper grain: body has the tiled feTurbulence data-URI background in served styles.css; subtle texture visible on desktop margins — ✅ passed
- Scroll reveal (motion-safe): html gets `js-reveal`, `[data-reveal]` opacity 0 pre-scroll → `.revealed` opacity 1 after scrolling into view (Playwright pre/post) and visually faded up in the recorded pass — ✅ passed
- Reduced motion: `reduced_motion=reduce` → **no** `js-reveal` class, section opacity 1 / transform none at load, `.card-lift:hover` transform none — ✅ passed
- No-JS: `java_script_enabled=False` → no js-reveal, section opacity 1, fully visible (screenshot /tmp/nojs_reveal.png) — ✅ passed
- Card lift + micro-tilt: Skyward card on /series/mistborn lifts with shadow and cover tilts on hover (motion-safe) — ✅ passed
- Tracker regression: tick The Lost Metal → 7/8 (88%) with checkbox pop, untick → exact 6/8 (75%); main profile canonical after run (10 read entries, saved `{}`, no goal key) — ✅ passed
- Empty-shelf illustration: fresh incognito /shelf shows the new line-art SVG (five books + amber bookmark ribbon) above "Your shelf is empty"; main (non-empty) profile shelf unaffected — ✅ passed
- Dark mode: homepage renders dark palette with italic amber headline + collage intact (emulated prefers-color-scheme: dark) — ✅ passed
- Brand assets (workers.dev + cb): /favicon.svg 200 image/svg+xml — open-book (two page shapes) + amber `#c98a2e` bookmark ribbon; referenced via `rel="icon"`; /og.png 200, PNG **1200×630** (270,598 bytes, regenerated from 34KB) — ✅ passed
- Axe 4.10.2 light+dark on /, /series/discworld, /shelf (seeded), /pricing → **0 violations in all 8 runs** — ✅ passed
- Overflow sweep 320–640 (320/360/375/380/400/414/459/460/480/640 on /, /pricing, /series/mistborn): scrollWidth == innerWidth in **all 30 probes**, including previously-failing 360 and 380 — ✅ passed (320 also clean now)
- Nav breakpoints: Genres visible ≥400, New ≥460, Pricing + Beta ≥640 — ✅ passed
- CSS slimming regressions: served styles.css 27,913 bytes; `.beta-badge`, `.year-chip`, `.up-next` all present; Up next badge, pricing links, progress bar render normally — ✅ passed
- Regression (R106 fixes): Discworld list "1. The Light Fantastic, 2. Mort" now matches book pages ("Book 1 of 55" / "Book 2 of 55"); inline series link has persistent `underline underline-offset-2` (computed textDecorationLine: underline) — ✅ passed
- Security headers (workers.dev + cb): HSTS, CSP, Permissions-Policy, XFO DENY, nosniff, Referrer-Policy all unchanged — ✅ passed

## Artifacts

- Recording: /home/ubuntu/screencasts/rec-43098d4d-d9db-455e-9b91-dcf1ea556265/rec-43098d4d-d9db-455e-9b91-dcf1ea556265-edited.mp4
- Plan: /home/ubuntu/repos/shelfmark/test-plan-iter111.md · Raw axe + sweep: /tmp/axe_results_r111.json

| Hero light | Hero dark |
|---|---|
| ![light](https://app.devin.ai/attachments/60a96e6e-b51b-4dc9-8769-de4f096d7be2/ss_524d4951.png) | ![dark](https://app.devin.ai/attachments/7dc0916c-e591-4064-adc9-f8a45d7886f1/ss_240ee76d.png) |

| Empty-shelf SVG (incognito) | Reveal panel visible (reduced motion) |
|---|---|
| ![empty](https://app.devin.ai/attachments/63e0877b-2737-4bd2-939c-bcebbf7648e5/ss_b02beeb4.png) | ![rm](https://app.devin.ai/attachments/8c189c5f-5d15-4a25-8d59-ed64d40929df/rm_reveal.png) |

| Hover straightens cover | 375px — 3 covers, no overflow |
|---|---|
| ![hover](https://app.devin.ai/attachments/9f723f7c-5c74-49c8-be22-fe27af607b9e/ss_zoom_da2ef0df.png) | ![375](https://app.devin.ai/attachments/5a2087ca-d155-4c5f-91f8-d7823d4f8a94/m375_r111.png) |
