# Shelfmark live QA — R106 book detail pages + mobile overflow fix re-test

- **Deploy:** 79221be4 (commits 0f96092 mobile fix, df9b3e6 R106) · branch devin/1786129278-iter105 · PR #15
- **Targets:** https://shelfmark.zalize.com (+ https://shelfmark.wookat520.workers.dev with cache-bust for authoritative HTML)
- **Method:** recorded browser pass (main profile, reversible actions only) + shell/Playwright verification (curl, viewport probes, axe-core 4.10.2)
- **Plan:** /home/ubuntu/repos/shelfmark/test-plan-iter106.md · Raw axe: /tmp/axe_results_r106.json
- **Recording:** /home/ubuntu/screencasts/rec-7cae05d1-3061-4403-9c2e-f6541d5a2baf/rec-7cae05d1-3061-4403-9c2e-f6541d5a2baf-edited.mp4

## Summary — 3 failures, rest passed

| # | Check | Result |
|---|---|---|
| 1 | Mobile overflow 375 / 414 px on /, /pricing, /series/mistborn | ✅ scrollWidth == innerWidth on all 6 |
| 2 | Mobile overflow **360 px** (in requested scope) | ❌ 363px on all 3 routes; homepage hero button 372px |
| 3 | Header breakpoints (Beta ≥640, Genres ≥360, New ≥380, Pricing ≥640) | ✅ exactly as specified |
| 4 | (Informational) 380 px, the width where "New" appears | ❌ nav 402px vs 380 viewport |
| 5 | (Informational, exempt) 320 px | overflow 372px — known, not failed |
| 6 | /book/134080-mistborn-the-final-empire 200 + content | ✅ h1, author link ·2006, "Book 1 of 8 in Mistborn", description, CTAs (no cover in data for this book; cover proven on Mort) |
| 7 | Series title link → book page (clicked in browser) | ✅ |
| 8 | Prev/next chips | ✅ Next→Book 2 of 8; ← back to Book 1 |
| 9 | "Full reading order" CTA → /series/mistborn | ✅ |
| 10 | Checkbox regression on series page | ✅ tick 7/8 (88%), no navigation; untick 6/8 (75%) |
| 11 | Wrong slug /book/134080-x → 301 canonical | ✅ (curl 301 + browser lands on canonical URL) |
| 12 | Unknown id → styled 404 | ✅ "Page not found" with full chrome, HTTP 404 |
| 13 | Book JSON-LD isPartOf BookSeries + position 1; BreadcrumbList | ✅ |
| 14 | Find a copy attrs (served HTML) | ✅ bookshop.org/search…, rel="nofollow noopener", target="_blank" (click-through untestable: IP-blocked) |
| 15 | No-description book noindex,follow | ✅ /book/1000-v2 serves `<meta name="robots" content="noindex,follow">`; described books have no robots meta |
| 16 | Sitemap index 11 chunks; /sitemaps/11.xml has /book/ URLs | ✅ chunks 1–11; 628 book URLs in chunk 11 |
| 17 | Axe light+dark on book page | ❌ **1 serious violation each mode**: link-in-text-block — "Mistborn" series link (`text-amber-accent`, no underline) has 2.27:1 contrast vs surrounding text (needs 3:1 or non-color styling) |
| 18 | "Book N of M" ordinal consistency | ❌ **Mismatch on Discworld**: series list shows Mort=#2, Light Fantastic=#1 (year-sorted), but book pages say Mort "Book 1 of 55", Light Fantastic "Book 5 of 55" (position-sorted) |
| 19 | Security headers (regression, workers.dev+cb) | ✅ HSTS/CSP/PP/XFO DENY/nosniff/referrer unchanged |
| 20 | Main profile canonical after run | ✅ Mistborn 6/8 (75%), saved {}, no goal key |

## Failure detail

### 360px overflow (requested scope)
`scrollWidth=363` on /, /pricing, /series/mistborn (culprit: `nav.ml-auto` with "Genres · My Shelf", right edge 363). Homepage additionally has the hero "Search all series" button at right=372 (fixed-width `px-6` button, also the 320px culprit). At 380px, "New" becomes visible and the nav jumps to 402px — so the 380 breakpoint for "New" is too early. 375/414 are pixel-clean.

| 🔴 360px homepage (nav + hero button overflow) | 🟢 375px homepage clean |
|---|---|
| ![360](https://app.devin.ai/attachments/80056837-b44d-4494-9295-4e95306f082d/m360_home_culprit.png) | ![375](https://app.devin.ai/attachments/c7cd8029-7663-46ca-8793-e601fdde996c/m375_home.png) |

### Axe link-in-text-block (book page, light + dark)
The inline series link in "Book 1 of 8 in **Mistborn**" (`class="text-amber-accent hover:underline"`) has 2.27:1 contrast against `#3d3a33` body text and no persistent underline. Fix: always-underline or darker link color. Raw: /tmp/axe_results_r106.json.

### Ordinal mismatch (series list vs book page)
When a series has duplicate/null positions, the series page re-sorts by year (bookList, src/index.ts:649) while the book route ordinal uses `ORDER BY position, year, id` (src/index.ts:585). Discworld: visible list "1. The Light Fantastic, 2. Mort…" but /book/181101-mort says "Book 1 of 55" and /book/147536-the-light-fantastic says "Book 5 of 55". Mistborn (clean positions) is consistent.

## Evidence

| 🟢 Book page (title-link click landed here) | 🟢 Cover-bearing book (Mort) |
|---|---|
| ![book](https://app.devin.ai/attachments/7e2a0371-113c-4276-a246-f7c975330ea6/ss_2c0b8c71.png) | ![mort](https://app.devin.ai/attachments/858c6491-4d2e-4923-8568-6097f0a6a372/ss_65f2a147.png) |

| 🟢 Styled 404 | 🟢 Series titles are links (6/8 precondition) |
|---|---|
| ![404](https://app.devin.ai/attachments/04b2d5ad-bfd3-45a6-b84d-82ac1ef6b458/ss_86bc3ca9.png) | ![series](https://app.devin.ai/attachments/2fa7e05d-5523-485e-a6e9-efff64700255/ss_6369d12f.png) |

| 🟢 Checkbox tick → 7/8, no navigation | 🟢 Untick → restored 6/8 |
|---|---|
| ![tick](https://app.devin.ai/attachments/5b6bf0c8-6f9b-4a9f-bab5-822115909bcc/ss_5a7e5705.png) | ![restore](https://app.devin.ai/attachments/b5f0ef4c-3fbb-4f04-8992-84910d0f1e32/ss_038da52e.png) |

Shell captures: Book JSON-LD `{"@type":"Book", isPartOf:{"@type":"BookSeries",name:"Mistborn"}, position:1}` + BreadcrumbList [Home, Mistborn, title]; 301 `Location: /book/134080-mistborn-the-final-empire`; sitemap index chunks 1–11; noindex on /book/1000-v2; bookshop link `rel="nofollow noopener" target="_blank"`.

## Notes
- 134080 (the example book) has no cover_url in data — cover rendering verified on /book/181101-mort instead.
- Bookshop.org click-through untestable (Cloudflare blocks datacenter IP); attributes verified via served HTML on workers.dev per skill note.
- Breakpoint visibility probe: Beta hidden <640 / visible ≥640; Genres ≥360; New ≥380; Pricing ≥640 — matches commit 0f96092 exactly.
