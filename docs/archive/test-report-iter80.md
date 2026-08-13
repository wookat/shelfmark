# Shelfmark Rounds 76–80 live QA — test report (deploy f99f976c, PR #12 / R80 log-only PR #13)

Production: https://shelfmark.zalize.com (cache-sensitive checks via https://shelfmark.wookat520.workers.dev + cache-bust).
Recording: `/home/ubuntu/screencasts/rec-19e61ca5-0af6-4bc2-b79d-53aae55a9f82/rec-19e61ca5-0af6-4bc2-b79d-53aae55a9f82-edited.mp4` · Raw axe: `/tmp/axe_results_r80.json` · Plan: `test-plan-iter80.md`

## Summary

All requested checks passed. One behavior note (not a regression): **series-card progress bars on pure card-grid pages (homepage, /genres, /series) stay at 0%** — app.js only fills `[data-progress-bar]` via `updateSeriesUI`, which requires the same page to contain that series' checkbox list (`ol[data-series]`). This is unchanged since v1 (source comment: "progress bars on card grids … computed only for lists present", present in the initial commit 0250e4d). The bar mechanism itself is intact and was proven on /series/mistborn (75% → 88% → 75%).

## R76 — series-card cover thumbnails

- /genres/fantasy (hard-reloaded): 50 cover-backed cards render 40×56 `covers.openlibrary.org/…-M.jpg` thumbnails (`w-10 h-14 rounded object-cover`); no-cover series (Spice and Wolf, The Vampire Diaries, Mistborn…) render initial-letter placeholder boxes. Layout intact, no broken images. ✅
- Same markup confirmed on homepage Popular series, series-page related/sub-series grids ("More series by Brandon Sanderson", "If you like Mistborn"). ✅
- Card progress bar markup unchanged (`data-progress-bar="{slug}"` at width:0%, filled client-side only where the series list is present — see note above). ✅ (behavior identical to pre-R76)

| 🟢 /genres/fantasy: covers + placeholders | 🟢 Mistborn card: "M" placeholder, bar markup intact |
|---|---|
| ![Genre cards](https://app.devin.ai/attachments/0ff32f0b-453b-4af8-b755-2f9c7b3c2901/ss_50a10b93.png) | ![Mistborn card](https://app.devin.ai/attachments/d4cdb152-0289-4772-a6ff-d2c63245da86/ss_zoom_1c47357c.png) |

## R77 — RSS enclosures (shell)

- `/new.rss` (workers.dev + cb): valid RSS 2.0, 33 items, **5 with `<enclosure … type="image/jpeg" length="0">`**, all URLs ending `-L.jpg` — incl. **Platform Decay (The Murderbot Diaries)** → `https://covers.openlibrary.org/b/id/15154430-L.jpg`. ✅
- `/new.rss?genre=fantasy`: valid XML, title "Shelfmark — New & Upcoming Fantasy Series Books", 1 item, 0 enclosures (its sole item has no cover — consistent). ✅

## R78 — author API

- `GET /api/authors/brandon-sanderson.json` → 200 JSON: `name`, `url`, `series_count: 6`, `book_count: 60`, `series[]` each with `name/genre/book_count/first_year/last_year/url/api`; `license` string. Series `api` link (skyward-series.json) resolves 200. ✅
- Headers: `access-control-allow-origin: *`, `cache-control: public, max-age=3600`. ✅
- 404s: `zzznotreal.json` → 404; `..%2Fetc.json` → 404. ✅
- /about "Open data API" section documents `/api/authors/<slug>.json` with example link; clicking it serves the JSON. ✅

| 🟢 /about Open data API docs | 🟢 Example link → author JSON |
|---|---|
| ![About](https://app.devin.ai/attachments/9cd68b24-9e56-4db3-b940-5050e69168db/ss_5c600092.png) | ![JSON](https://app.devin.ai/attachments/8c31600b-ee97-4d74-9063-e00c11c3aead/ss_ac151c6b.png) |

## R79 — homepage Continue reading strip

- Served HTML contains empty `<div id="continue-reading">`. ✅
- Main test profile: homepage renders **Continue reading** with Discworld "3 read", Mistborn "6 read", Warriors "1 read" — each "N read · pick up where you left off →"; clicking Mistborn navigates to /series/mistborn (75% bar). ✅
- Incognito (empty localStorage): no Continue reading section. ✅
- Adversarial seed (incognito, disposable): 5 series + a `standalone-foo` entry with the **newest** timestamp → exactly **4 cards in recency order** (Mistborn, Discworld 2 read, The Witcher, Shannara); 5th-oldest Xanth **and** the newest standalone-foo both excluded. ✅

| 🔴 Empty localStorage: no strip | 🟢 Seeded: 4 cards, standalone excluded |
|---|---|
| ![Empty](https://app.devin.ai/attachments/f5eb82e1-291e-4880-86f7-df4aef8fb12b/ss_1a75d85e.png) | ![Populated](https://app.devin.ai/attachments/c8db8759-a920-45a0-9144-4a67435f26d5/ss_d0eff5ab.png) |

Main-profile strip:

![Main profile strip](https://app.devin.ai/attachments/054b23ac-1c51-42b5-80d2-033971ccc067/ss_1308169e.png)

## R74 backfill — goal-met ✓ reading card (disposable incognito)

- Seeded 7 current-year reads, set goal **5** via the UI prompt → shelf goal card: **"2026 reading goal: 7 of 5 books 🎉"** with full amber bar. ✅
- Downloaded actual PNG — subline reads **"books read · 6 series · 2026 goal 7/5 ✓"**. The ✓ variant is now proven. ✅
- Incognito window closed afterwards; main profile untouched.

| 🟢 Goal met on /shelf (7 of 5 🎉) | 🟢 PNG: "2026 goal 7/5 ✓" |
|---|---|
| ![Shelf goal met](https://app.devin.ai/attachments/e300a006-1add-45bc-94b7-c1c02cce2070/ss_f11005ee.png) | ![Card](https://app.devin.ai/attachments/581cfd4a-a55c-46a8-b974-bc7528916c5c/shelfmark-reading-card%20%283%29.png) |

## Regression

- Tracker on /series/mistborn: tick The Lost Metal → **7 of 8 read (88%)**, Up next → Secret History; untick → exact restore **6 of 8 read (75%)**, Up next → The Lost Metal. ✅
- Security headers (workers.dev + cb): HSTS max-age=31536000, CSP (incl. wikimedia img-src) unchanged, Permissions-Policy, XFO DENY, nosniff, referrer strict-origin-when-cross-origin — all unchanged. ✅
- Axe 4.10.2 (Playwright bypass_csp): **/ → 0 violations, /genres/fantasy → 0 violations** — new card thumbnail/placeholder markup introduces no a11y issues. ✅

| Ticked 7/8 (88%) | Restored 6/8 (75%) |
|---|---|
| ![Tick](https://app.devin.ai/attachments/1be2bfb9-441d-43e9-ae8f-16371d357ad2/ss_zoom_1edd5362.png) | ![Restore](https://app.devin.ai/attachments/9551a277-759c-4409-8d33-e4aa5dfb8dc5/ss_zoom_1ed0880a.png) |

## Honesty notes

- The 1,198/2,590 backfill count was not enumerated; verified via representative surfaces (50 covers on genre page 1, homepage, related grids).
- Card progress-bar "still fills" was proven on the series page itself; on card-only pages bars remain 0% by long-standing design (see Summary note) — flag if the R76 intent was for card bars to fill from localStorage on listing pages.
- R80 (log-only, PR #13) had no runtime surface to test, per brief.
- State restored: main profile Mistborn 6/8, no goal key; disposable incognito state discarded.
