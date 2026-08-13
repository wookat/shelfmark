# Shelfmark Round 12 — search close-match fallback (production, deploy 57758c55, PR #6 commit 2809d7f)

**Scope:** live QA of the new /search token-OR close-match fallback (notice "No exact match — showing close matches instead.", 12 series + 12 authors, popularity-ranked), the unchanged exact/single-word and true zero-hit paths, the Round 11 404 → search recovery flow, and 375px layout. Tested at https://shelfmark.zalize.com in a recorded browser pass (desktop maximized + ~375px window). Plan: `test-plan-iter12.md`. Code refs: src/index.ts /search route (fallback fires only when exact-phrase series+authors+bookHits are all empty and ≥2 tokens >2 chars).

## Results

| # | Test | Result |
|---|---|---|
| 1 | `?q=mistborn trilogy` → notice + Mistborn first card, clickable | ✅ passed |
| 2 | Round 11 404 → "searching" link recovers end-to-end | ✅ passed |
| 3 | `?q=brandon sandersen` → Brandon Sanderson first author | ✅ passed |
| 4 | Control `?q=discworld` → exact results, no notice | ✅ passed (Regression) |
| 5 | Garbage `?q=zzqqxx wwyyzz` → "Nothing found", no notice | ✅ passed |
| 6 | ~375px close-match results layout, no overflow | ✅ passed |

### 1. Close-match fallback for "mistborn trilogy"
Typed "mistborn trilogy" in the site search box: H1 "Results for “mistborn trilogy”" with the visible notice **"No exact match — showing close matches instead."** and a Series grid of exactly 12 popularity-ranked cards, **Mistborn (Brandon Sanderson · 8 books) first**. Clicking the Mistborn card lands on /series/mistborn with the full 8-book list (tracker state intact, "6 of 8 read (75%)"). Round 11 this same query showed "Nothing found."

| 🟢 Close matches with notice, Mistborn first | Click → /series/mistborn |
|---|---|
| ![Close matches](https://app.devin.ai/attachments/d665e833-e172-42f6-9f4a-b415c2b70f60/ss_016badf9.png) | ![Mistborn page](https://app.devin.ai/attachments/e9148000-6540-4b53-8aba-d2e5ca630551/ss_2d0ba85e.png) |

### 2. Round 11 404 flow recovery
Visited `/series/mistborn-trilogy` (still 404 with did-you-mean suggestions) → clicked the "searching" link → landed on `/search?q=mistborn%20trilogy` now showing the close-match notice + Mistborn card. The Round 11 P3 dead-end ("Nothing found" from the pre-filled search link) is resolved end-to-end.

![404 searching link now recovers](https://app.devin.ai/attachments/3619178f-261e-43bf-8c09-ff4c8f548655/ss_c1ee6a0a.png)

### 3. Author typo query
`?q=brandon sandersen`: notice shown, Authors grid with **Brandon Sanderson (6 series · 60 books) first** of 8 author cards (then Brandon Mull, Brandon Massey, …).

![Brandon Sanderson first](https://app.devin.ai/attachments/c3641bc4-2482-45a8-a7df-67cb0807cca1/ss_3cd88ca3.png)

### 4. Regression — exact match unchanged
`?q=discworld`: normal exact results (Series: Discworld, The Science of Discworld; Books section with 7 hits), **no** close-match notice.

![Discworld exact, no notice](https://app.devin.ai/attachments/16706b98-aedf-4c57-8924-2bddf925af1e/ss_893b7c56.png)

### 5. Garbage query
`?q=zzqqxx wwyyzz`: "Nothing found. Try a different spelling, or browse all authors." — no notice, no result grids (fallback ran but matched nothing, empty-state preserved).

![Nothing found](https://app.devin.ai/attachments/6036f050-d4cf-48e9-aa13-26f22ba71805/ss_8e7de67b.png)

### 6. Mobile ~375px
Close-match results at 375px width: notice readable, series cards stack single-column; `scrollWidth 485 <= innerWidth 500` — no horizontal overflow.

![375px close matches](https://app.devin.ai/attachments/88c07224-8c94-4fe5-90e3-3ab171ad9f47/ss_611239e4.png)

## Notes
- No stale edge cache encountered; no cache-buster needed (fresh results on first load for all queries).
- Books section is intentionally absent in fallback mode (fallback only re-queries series + authors) — matches the spec.

## Artifacts
- Recording: `/home/ubuntu/screencasts/rec-91994aed-908c-4cbb-b2c2-2c380ced8675/rec-91994aed-908c-4cbb-b2c2-2c380ced8675-edited.mp4`
- Plan: `/home/ubuntu/repos/shelfmark/test-plan-iter12.md`
