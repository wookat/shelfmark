# Shelfmark Rounds 101–105 — live production QA (deploy 5bd481b2, PR #15)

Tested against https://shelfmark.zalize.com (authoritative checks via https://shelfmark.wookat520.workers.dev + cache-bust). Recorded browser pass of /pricing, header Beta pill, series-page Where-to-start / breadcrumb / Find-a-copy, tracker + save-for-later regression, dark mode; shell verification of metadata, sitemap, copy, security headers, axe light+dark, and mobile viewport (Playwright 375×812).

## Escalations

1. **Mobile header nav horizontally overflows at 375px (pre-existing, worsened by the Beta badge).** On both `/` and `/pricing` at 375×812, `document.documentElement.scrollWidth = 500` vs viewport 375 — the primary nav ("Genres" clipped, "New"/"My Shelf" pushed offscreen). Removing `.beta-badge` still leaves scrollWidth 437 (so the base nav overflowed before R101–105); the badge adds ~63px making it worse. Pricing *cards* themselves stack fine with no card overflow, and the "Pricing" nav link is correctly `display:none` below `sm`. Suggested fix: hide or shrink more nav items below `sm`, or allow the badge to hide on very narrow widths.

   ![🔴 Mobile 375px header: Genres clipped, nav overflows](https://app.devin.ai/attachments/54f2f43e-a1f1-48bf-b2aa-bfe47c62032e/mobile_pricing.png)

2. **"Find a copy" click destination could not be visually verified** — bookshop.org's Cloudflare blocked this datacenter IP ("Sorry, you have been blocked"), and this testing browser's instrumentation strips `target="_blank"`, so the same-tab navigation seen in the recording is a harness artifact, not the product. The served HTML (curl, both origins) confirms `href="https://bookshop.org/search?keywords=…"`, `rel="nofollow noopener"`, `target="_blank"` on all 8 links.

## R101 — /pricing page

| Check | Result |
|---|---|
| Reader card "$0 forever" | ✅ |
| Shelfmark Plus "$2.99/month" | ✅ |
| "or $24/year — planned pricing, not charged during beta" | ✅ |
| "Free during beta" badge on Plus card | ✅ |
| "Start free beta trial" CTA → clicked → landed on /shelf | ✅ |
| Pricing FAQ: 3 items (pay today / data locked / beta end) | ✅ |
| Breadcrumb visible (Home / Pricing) + BreadcrumbList JSON-LD (2 ListItems, /pricing item) | ✅ |
| /sitemaps/1.xml includes /pricing | ✅ |

| 🟢 /pricing light (via Beta pill click) | 🟢 /pricing dark (emulated) |
|---|---|
| ![Pricing light](https://app.devin.ai/attachments/cbea5c82-49c6-4c00-9bfc-e5ba0dbcdb86/ss_95b32dfc.png) | ![Pricing dark](https://app.devin.ai/attachments/53fb85aa-32c4-4172-98ea-8afac018861d/ss_6460b932.png) |

## R102 — Header / footer navigation

- Beta pill next to logo, links to /pricing (title "Free while in beta — see planned pricing"), clicked through live — ✅
- `.beta-badge` present in cache-busted styles.css (amber border/text, `:hover{background:amber;color:#fff}`) — ✅
- "Pricing" nav link on desktop; `hidden sm:inline` → computed `display:none` at 375px — ✅
- Footer Explore column has Pricing link — ✅

| 🟢 Homepage header with Beta pill (light) | 🟢 Dark hover: white BETA on amber |
|---|---|
| ![Header light](https://app.devin.ai/attachments/a4c39ebe-abdb-4729-bb00-bdf471e0cbd3/ss_78ce6e73.png) | ![Dark hover](https://app.devin.ai/attachments/d69e0441-98e6-45fb-963a-a27b72014034/ss_zoom_72dfda36.png) |

## R103 — Copy repositioning (shell, workers.dev + cache-bust)

- Home title: `Shelfmark — Book Series in Order + No-Signup Reading Tracker` — ✅
- "free tracker" absent on /, /pricing, /series, /popular, /genres (0 hits each) — ✅
- Updated descriptions: /series "built-in no-signup progress tracker", /popular "no account needed (free while in beta)", /genres genre copy — ✅
- OpenSearch: "reading orders and a no-signup tracker" — ✅
- /llms.txt lists `[Pricing](https://shelfmark.zalize.com/pricing)` + beta wording in summary — ✅

## R104 — Series pages

- /series/mistborn "Where to start" aside: "Start with "Mistborn: The Final Empire" (2006)" + publication-order text ("8 books published 2006–2022") — ✅ (Mistborn card has no cover; /series/discworld markup confirms cover `<img>` renders when available — ✅)
- Visible 4-level breadcrumb Home / Series / Brandon Sanderson / Mistborn + BreadcrumbList JSON-LD positions 1–4 incl. author — ✅
- 8 "Find a copy" links, one per book row → `bookshop.org/search?keywords=<title>+<author>`, `rel="nofollow noopener"`, `target="_blank"`, class `print:hidden`; styles.css has `@media print{.print\:hidden{display:none}}` — ✅ (click-through blocked by bookshop Cloudflare; see escalation 2)
- Author page /authors/brandon-sanderson: 59 bookshop.org links incl. standalone sections — ✅ (shell)

![🟢 Series page: Where to start + 4-level breadcrumb + Find a copy per row](https://app.devin.ai/attachments/b8562048-7196-4a98-9bd0-3d571eea4ca6/ss_f1619837.png)

## Regression (main profile, non-destructive)

- Tracker: baseline 6/8 (75%) → tick The Lost Metal → **7/8 (88%)** → untick → **6/8 (75%)** exact restore — ✅
- Save for later: ☆ → "★ Saved for later" → ☆ again; `shelfmark_saved_v1` back to `{}` — ✅
- Main profile left canonical: 10 books read, Mistborn 6/8, saved `{}`, no goal key (verified via localStorage) — ✅

| 🟢 Ticked 7/8 (88%) | 🟢 Restored 6/8 (75%) |
|---|---|
| ![Tick](https://app.devin.ai/attachments/d23fa298-69b9-4615-bfb3-580ecf14ee4e/ss_zoom_5e9515ed.png) | ![Restore](https://app.devin.ai/attachments/e1c8a77f-aace-4d41-ab3e-22e28be970f4/ss_zoom_f98902bb.png) |

- Axe-core 4.10.2 (Playwright bypass_csp): **/pricing light → 0 violations, /pricing dark → 0 violations** (`/tmp/axe_results_r105.json`) — ✅
- Dark mode rendering: dark page/cards distinct, amber Beta pill legible, hover = white-on-amber (screenshot above) — ✅
- Mobile pricing cards (375×812): single-column stack, Plus card + badge + CTA fully usable, no card overflow — ✅ (header nav overflow is escalation 1)

![🟢 Mobile Plus card stacks cleanly](https://app.devin.ai/attachments/3da61449-f5ff-4582-8e9e-b87f5bcf88ce/mobile_cards_crop.png)

- Security headers (workers.dev + cb): HSTS, CSP (frame-ancestors 'none'), Permissions-Policy, X-Frame-Options DENY, nosniff, Referrer-Policy strict-origin-when-cross-origin — all intact — ✅

## Artifacts

- Recording: `/home/ubuntu/screencasts/rec-e40e13bb-c6c0-4780-8f67-0f9a3243d771/rec-e40e13bb-c6c0-4780-8f67-0f9a3243d771-edited.mp4`
- Plan: `/home/ubuntu/repos/shelfmark/test-plan-iter105.md`
- Raw axe + mobile probes: `/tmp/axe_results_r105.json`
