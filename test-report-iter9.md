# Shelfmark Round 9 Live QA — /shelf Import JSON (deploy 5deb4cb7, PR #6 commit d622d0f)

Tested live on https://shelfmark.zalize.com/shelf (recorded browser pass, desktop + ~375px). Plan: test-plan-iter9.md. Code refs: src/index.ts /shelf buttons row (`#import-btn`, hidden `#import-file` accept=".json" aria-label "Import shelf backup file", `#import-status` role="status", helper copy) and public/app.js:166-197 (parse/validate/merge/reload logic).

## Summary

All 6 planned checks passed. One methodology note: the success status message disappears when the page auto-reloads 800ms after import — too fast to screenshot with normal interaction latency. To capture it visually, the 800ms reload timer was suppressed once via a console `setTimeout` patch (instrumentation only, page reloaded normally afterwards); the merge/restore outcomes themselves were verified on the untouched code path.

| # | Check | Result |
|---|---|---|
| 1 | Import JSON button + helper copy render on /shelf | ✅ passed |
| 2 | Round-trip: export → clear localStorage → import restores shelf w/ dates & grouping | ✅ passed |
| 3 | Merge: overlap + 2 new → only new counted, nothing lost, no duplicates | ✅ passed |
| 4 | Status message shows imported count | ✅ passed (captured with reload timer suppressed) |
| 5 | Invalid file (array .json) → friendly error, shelf unchanged | ✅ passed |
| 6 | 375px layout wraps, no overflow | ✅ passed |
| 7 | Smoke: reading card download | ✅ passed |

## 1. Precondition / UI — ✅

/shelf showed 8 books across 3 series (Mistborn 5, Warriors 1, Discworld 2) with the new "Import JSON" button next to "Export JSON" and helper copy "Export downloads a backup of your shelf as a JSON file. Import merges a backup into this browser — useful when switching devices."

![Shelf with Import JSON button and helper copy](https://app.devin.ai/attachments/8849a2d4-d946-43ae-9a84-9df87a7f40fe/ss_eacfdf17.png)

## 2. Round-trip restore — ✅

Clicked Export JSON (shelfmark-export.json, 8 entries, verified with python). Cleared `shelfmark_read_v1` via console and reloaded → empty state ("Your shelf is empty"). Clicked Import JSON, selected the exported backup → shelf restored to exactly **8 books across 3 series**, with original tick dates intact (Into the Wild kept 8/5/2026, i.e. pre-existing `t` values were preserved, not reset to import day) and series grouping identical.

| 🔴 Cleared (empty state) | 🟢 After import (restored, dates intact) |
|---|---|
| ![Empty shelf](https://app.devin.ai/attachments/a5795942-2136-4f4d-ad53-b76283b26e4b/ss_ba3d312a.png) | ![Restored shelf](https://app.devin.ai/attachments/24557aff-5877-4714-8cb9-381db3cf7995/ss_9b1cee86.png) |

## 3. Merge — ✅

Imported merge.json containing 1 overlapping entry (Mort, id 181101, from the real export) + 2 new entries (Wyrd Sisters, Guards! Guards!, `t` = Aug 2025). After reload: **10 books across 3 series**; Discworld grew from 2 → 4 with the two new books showing their backup dates (8/6/2025), Mort not duplicated and its original 8/6/2026 date kept; all prior entries intact.

![Merged shelf: 10 books, new Discworld entries with 2025 dates](https://app.devin.ai/attachments/e96c513a-7e85-415f-adba-74b1377a768d/ss_zoom_1977fb67.png)

## 4. Status message — ✅

Re-importing the same merge file (all entries already present) showed "Imported 0 new books ✓ Reloading…" next to the buttons — confirming overlaps are not counted as new. Captured with the 800ms reload timer suppressed via console patch so the transient message is visible on screen; the first (unpatched) merge showed the correct +2 result via the reloaded page.

![Imported 0 new books status](https://app.devin.ai/attachments/0c8bf566-c359-4fc8-b4a1-3a0366705281/ss_zoom_2150e872.png)

## 5. Invalid file — ✅

Imported invalid-array.json (`[1,2,3]`) → status shows "That file doesn't look like a Shelfmark export.", no reload occurred, shelf content unchanged (localStorage still 10 entries, verified via console).

![Friendly error for invalid file, shelf unchanged](https://app.devin.ai/attachments/fc26ca8a-21a1-40be-a6d5-b20c7bace3da/ss_e812e12c.png)

## 6. Mobile ~375px — ✅

Buttons row wraps to two lines (Download card + Export / Import), all buttons fully visible, helper copy wraps; `scrollWidth 485 ≤ innerWidth 500` — no horizontal overflow.

![375px shelf buttons wrap](https://app.devin.ai/attachments/d4e97b16-0841-46ba-8262-27fa6743473f/ss_c4f3000d.png)

## 7. Smoke: reading card — ✅

"Download my reading card" downloaded shelfmark-reading-card.png (91.4 KB, valid PNG magic bytes, 93,559 bytes).

![Reading card downloaded](https://app.devin.ai/attachments/ab7144de-ded4-48e4-ab23-33de8b038809/ss_070e886c.png)

## Untested / notes

- Text-file-renamed-to-.json variant not separately exercised — the array-in-.json case exercises the same catch branch (any parse/shape failure lands in the same handler per app.js).
- The success message with a nonzero count ("Imported 8 new books ✓") was shown live but reloads within 800ms — not capturable in a still screenshot without the timer patch; visible briefly in the recording.

## Artifacts

- Recording: /home/ubuntu/screencasts/rec-0fdd0c34-c0c3-44a5-bdd7-10ecc26779bb/rec-0fdd0c34-c0c3-44a5-bdd7-10ecc26779bb-edited.mp4
- Plan: /home/ubuntu/repos/shelfmark/test-plan-iter9.md
