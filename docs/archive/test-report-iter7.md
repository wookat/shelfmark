# Shelfmark Rounds 6b+7 Live QA — Discworld FAQ fix + homepage "New & upcoming" (deploy 04d831eb, PR #6)

Tested live on https://shelfmark.zalize.com (recorded browser pass, desktop + ~375px mobile). Plan: test-plan-iter7.md. Code refs: commit b3fd6bb (orderedBooks FAQ fix), commit cf5883d (homepage `fresh` query + section markup in src/index.ts).

## Summary

All 7 planned checks passed. No escalations.

| # | Check | Result |
|---|---|---|
| 1 | Discworld FAQ first-book answer matches list row #1 (fix re-verify) | ✅ passed |
| 2 | Homepage "New & upcoming" section: placement, 6 cards, no dataset noise | ✅ passed |
| 3 | Card navigation → correct series page | ✅ passed |
| 4 | "All new releases →" → /new | ✅ passed |
| 5 | Covers / initial placeholders render | ✅ passed (all 6 current cards use initial-letter tiles; no cover among them, no broken images) |
| 6 | Mobile ~375px no horizontal overflow | ✅ passed (scrollWidth 517 ≤ innerWidth 532) |
| 7 | Regression: tracker tick persists after reload | ✅ passed |

## 1. Discworld FAQ fix (Round 6 P1) — ✅

Visible FAQ card now reads **"The series starts with “The Light Fantastic” (1986)"**, matching the page's own list row #1 (1. The Light Fantastic (1986); Mort is #2). Count (55, 1986–2015), most-recent (The Shepherd's Crown 2015) and author (Terry Pratchett) answers unchanged and correct.

![Discworld FAQ now says The Light Fantastic (1986)](https://app.devin.ai/attachments/f6bbf0c2-2440-4bf5-a5a3-94f11cb28a5e/ss_zoom_2276b190.png)

## 2. Homepage "New & upcoming" — ✅

Section renders between "Popular series" and "Prolific authors" with the "All new releases →" link and exactly 6 cards, all genuine 2026 series installments: Yona of the Dawn Vol 47, Sateenvarjomies (Vares), Adachi and Shimamura: Short Stories 3, Real Vol 17, The Apothecary Diaries Palace Chronicles, The Way of the Househusband Vol 17. No xkcd/Munroe, pamphlet, or bulk self-pub noise. All 6 cards currently render styled initial-letter placeholder tiles (none of the top-6 books has a cover in the catalog); tiles are aligned, none broken or blank.

![Homepage New & upcoming between Popular series and Prolific authors](https://app.devin.ai/attachments/f746cf06-cf64-4483-9aaa-ce6ae61dbad2/ss_6ed2f6ba.png)

## 3–4. Navigation — ✅

- Clicked the "Yona of the Dawn, Volume 47 (2026)" card → landed on /series/yona-of-the-dawn; its list contains row 47 "Yona of the Dawn, Volume 47 (2026)".
- Clicked "All new releases →" → /new renders; its 2026 section's first 6 entries match the homepage cards exactly (same curated query confirmed live).

| Card → correct series page | /new via section link |
|---|---|
| ![Yona series page](https://app.devin.ai/attachments/d0c9664a-5ae6-4620-aa8c-df085ab07b79/ss_6d77e836.png) | ![/new page](https://app.devin.ai/attachments/cb1e550e-dd6b-4444-b572-70fa55016fca/ss_da0405b2.png) |

## 6. Mobile ~375px — ✅

Window resized to 375px outer width; New & upcoming cards stack single-column, no clipping. Console: `scrollWidth 517 ≤ innerWidth 532` (same accepted measurement convention as prior rounds — outer 375px window reports a larger inner width in this environment).

![Homepage section at ~375px](https://app.devin.ai/attachments/5ad0c311-42ac-4cb4-b064-af06bb4adafd/ss_6e5aa402.png)

## 7. Regression: tracker persistence — ✅

On /series/mistborn ticked "Mistborn: Shadows of Self" → count changed 4 of 8 (50%) → **5 of 8 read (63%)**; after F5 the tick and count persisted.

| After tick | After reload |
|---|---|
| ![Tick → 5 of 8](https://app.devin.ai/attachments/8836330d-fea8-4c81-b002-c534d27d4a66/ss_zoom_1f8008e0.png) | ![Persisted](https://app.devin.ai/attachments/9a25d322-e87b-44b6-b81b-a320e7a01429/ss_zoom_dc621d96.png) |

## Untested / notes

- Cover-image rendering path in the new section untested at runtime: none of the current top-6 curated books has a cover_url, so only the placeholder branch was exercised (cover branch is the same 38×57 img markup as /new, which passed in Round 4).
- Incidental: /new no longer leads with the Round-5 pamphlet/bulk noise in its visible top entries (Singapore/Spyrou rows gone from the head of the 2026 list); deeper /new curation was not re-audited this round.

## Artifacts

- Recording: /home/ubuntu/screencasts/rec-6d54ecb4-6e07-41e4-893c-92857fd82acd/rec-6d54ecb4-6e07-41e4-893c-92857fd82acd-edited.mp4
- Plan: /home/ubuntu/repos/shelfmark/test-plan-iter7.md
