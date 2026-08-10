# Shelfmark Rounds 16+17 — live QA report

**Deploy:** production 9ffba634 · PR #7 branch `devin/1786007000-iter3` (commits 0e42a65 "exclude 0-book container series from all listings" + 1514a25 "reading-stats cards on /shelf")
**Environment:** https://shelfmark.zalize.com, recorded browser pass (desktop + ~375px window) plus curl for counts/status.
**Plan:** /home/ubuntu/repos/shelfmark/test-plan-iter17.md

## Summary

All requested Rounds 16+17 checks passed. Stat-card numbers were cross-checked against an independent localStorage computation, R16 counts verified in the UI (272 / 2,590) with curl corroboration, and export/import smoke passed. Two coverage notes (letter views / 404 did-you-mean 0-book filtering were curl-grounded pre-checks only, and the transient import status message was not captured — see notes below).

## R17 — /shelf stats strip

### 1. Existing progress → 4 correct cards — ✅ PASSED

Console cross-check of `shelfmark_read_v1` (10 entries): `books=10 series=3 in2026=7 top=mistborn epochEntries=1`. Cards render **10 books read / 3 series followed / 7 read in 2026 / Mistborn most-read** — the old "N books read across M series" sentence is gone. The "read in 2026" count of 7 proves exclusions: 2 entries dated 8/6/2025 (Wyrd Sisters, Guards! Guards!) and 1 migrated epoch-timestamp entry (Mistborn: The Final Empire, no date shown) are correctly excluded from the 10 total.

![Shelf with 4 stat cards matching stored progress](https://app.devin.ai/attachments/9a6a56e5-38fd-4adc-848d-a018293ab0c3/ss_29491e0f.png)

### 2. Tick a new book → counts update — ✅ PASSED

Ticked Cinder on /series/the-lunar-chronicles, revisited /shelf: cards updated to **11 / 4 / 8 / Mistborn** and a "The Lunar Chronicles — 1 read" group appeared. (Unticked afterwards; localStorage restored to 10 entries.)

![Cards updated to 11/4/8 after tick](https://app.devin.ai/attachments/2faee232-68e9-4635-b1fb-6a4d8a02b494/ss_zoom_ce4eaacb.png)

### 3. Empty-shelf state — ✅ PASSED

Temporarily renamed the `shelfmark_read_v1` key and reloaded: "Your shelf is empty" card with Browse series button, **no stats grid** anywhere. Key restored afterwards.

![Empty shelf — no stats](https://app.devin.ai/attachments/242f3ef1-feac-4646-b372-4201741e59e4/ss_3f63190a.png)

### 4. 375px — 2-column grid, no overflow — ✅ PASSED

Cards render 2×2; measured `gridTemplateColumns: 220.5px 220.5px` (2 columns), `scrollWidth 485 ≤ innerWidth 500` — no horizontal overflow. Desktop view (screenshots above) shows the 4-column row at ≥sm.

![Mobile 2-col stats grid](https://app.devin.ai/attachments/c317ca8f-7bf5-4422-a4d7-fe8abe7bbc54/ss_8b7b51cd.png)

### Truncation note

"Mistborn" (8 chars) doesn't exercise the >22-char truncation; the deployed app.js contains `name.length > 22 ? name.slice(0, 21) + "…"` and the current profile has no 23+-char top series, so truncation was **code-verified only** (marked untested at runtime).

## R16 — 0-book series filtered from listings

### 5a. /genres/fantasy shows 272; last page has no 0-book cards — ✅ PASSED

Intro reads "**272** fantasy series with complete reading orders." (was 279). Page 5 (last, Previous-only) tail ends at "Dragonlance: Heroes · 1 book" — no "0 books" cards anywhere on the page (Riftwar Cycle/Ulldart/Dragonlance: Tales from Round 15 are gone); curl grep for "0 books" on page 5 returned 0 matches.

| 272 total (was 279) | Page 5 tail — smallest card is 1 book |
|---|---|
| ![Fantasy 272](https://app.devin.ai/attachments/21089599-6513-4d4c-97d2-f0e1972f19f3/ss_zoom_b2f20191.png) | ![Page 5](https://app.devin.ai/attachments/f7a399de-2563-4a25-8cf2-fbc90839e0c1/ss_9ca74c78.png) |

### 5b. /series shows 2,590 — ✅ PASSED

"**2,590** series, sorted by size. Page 1 of 44." (was 2,680).

![Series 2,590](https://app.devin.ai/attachments/32b48dd6-c369-43d8-a89d-bb4cc86a5e77/ss_zoom_b835d7a4.png)

### 5c. Search "riftwar cycle" excludes the 0-book container — ✅ PASSED

Typed in the site search box → close-match results include **The Riftwar Saga (5 books)** but NOT the 0-book "The Riftwar Cycle" container. Direct page `/series/the-riftwar-cycle` still returns HTTP 200 (curl) — parent pages remain reachable as specced.

![Riftwar search — container filtered, saga present](https://app.devin.ai/attachments/5d16312c-6c84-43a8-b7c9-27da650684c8/ss_20ed16a5.png)

### Coverage note

Letter views (`/series?letter=X`) and 404 did-you-mean 0-book filtering are covered by the same `book_count > 0` diff and my curl pre-checks, but were not separately exercised in the recorded UI pass (marked as code/curl-verified).

## 6. Export/Import smoke — ✅ PASSED

Export JSON downloaded `shelfmark-export (1).json` (1,451 B, 11 entries, valid JSON). Re-importing the same file left the shelf intact (localStorage still 11 entries, page reloaded with 11/4/8 cards and all groups). The transient "Imported 0 new books ✓ Reloading…" status auto-reloads in 1.6 s and was not captured this round (behavior verified in Round 9).

| Export downloaded (1,451 B) | Shelf intact after re-import |
|---|---|
| ![Export](https://app.devin.ai/attachments/72578eaa-f598-404d-8b59-48ae85317afb/ss_f207001d.png) | ![Import](https://app.devin.ai/attachments/28ec6fd3-dd48-40ac-b8e0-462ce48069d8/ss_856e93f0.png) |

## Artifacts

- Recording: /home/ubuntu/screencasts/rec-fc029e66-db6f-4e57-8cdf-946b50683a71/rec-fc029e66-db6f-4e57-8cdf-946b50683a71-edited.mp4
- Plan: /home/ubuntu/repos/shelfmark/test-plan-iter17.md
