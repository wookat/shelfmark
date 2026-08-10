# Shelfmark Round 10 — /series A–Z letter nav (production, deploy bc054f6d, PR #6 commit 49ac92c)

**Scope:** live QA of the new `/series` A–Z letter pill nav (mirrors the Round-8-verified `/authors` pattern) plus homepage + tracker smoke. Tested at https://shelfmark.zalize.com in a recorded browser pass (desktop maximized + ~375px window). Plan: `test-plan-iter10.md`.

## Results

| # | Test | Result |
|---|---|---|
| 1 | M pill → M-only, name-sorted, active pill | ✅ passed |
| 2 | Pagination preserves `letter=M` | ✅ passed |
| 3 | All pill restores size-sorted view | ✅ passed |
| 4 | Invalid `?letter=zz` falls back | ✅ passed |
| 5 | ~375px pills wrap, no overflow | ✅ passed |
| 6 | Series card navigation | ✅ passed |
| 7 | Smoke: homepage + tracker persistence | ✅ passed |
| — | Empty-letter copy "No series under this letter yet." | ⚪ untested (every letter A–Z has series) |
| — | Shelf import reload delay 1.6s | ⚪ code-verified only (`setTimeout(..., 1600)` in deployed branch); not in this round's UI scope |

### 1. Letter filter (M)
Clicking **M** in the pill nav → `/series?letter=M`, heading "All book series: M", "148 series starting with M. Page 1 of 3." All cards start with M and ascend alphabetically (Machineries of Empire → Mad Friend → Madara → MaddAddam …) with non-monotonic book counts (3, 6, 1, 3…), proving name-sort rather than size-sort. M pill inverted dark. Nav markup is `<nav aria-label="Series by letter">`.

| 🔴 Before: All view (size-sorted, All pill active) | 🟢 After: M view (name-sorted, M pill active) |
|---|---|
| ![All view](https://app.devin.ai/attachments/d60cf5ac-9beb-4b25-b70e-14a40e382acb/ss_e70672c9.png) | ![M view](https://app.devin.ai/attachments/e3133c35-17a1-4eb4-908d-a3d4dbefc40e/ss_c588ac80.png) |

### 2. Pagination keeps the filter
"Next →" → `/series?letter=M&page=2`, "Page 2 of 3", still M-only, alphabetical continuing after page 1's last entry (MedStar duology → Medabots → Medalist …); Prev/Next links both carry `letter=M`. Canonical verified via curl during planning: `<link rel="canonical" href="https://shelfmark.zalize.com/series?letter=M&page=2">`.

![M page 2](https://app.devin.ai/attachments/c89674fd-1d69-465a-a0d4-821135e3bba7/ss_d5289a25.png)

### 3. All pill restores size-sorted view
Click **All** → `/series`, "2,680 series, sorted by size. Page 1 of 45.", top card xkcd (3200 books) with descending counts, All pill inverted again (see "before" screenshot above).

### 4. Invalid letter fallback
`/series?letter=zz` renders the normal All view (2,680 series sorted by size), All pill active, no letter pill highlighted, no error.

![zz fallback](https://app.devin.ai/attachments/880e4133-f032-49a5-9432-91226ef07d8c/ss_zoom_e84c2e26.png)

### 5. Mobile ~375px
Window resized to 375px wide on `/series?letter=M`: pills wrap to 3 rows, M inverted, `document.documentElement.scrollWidth=485 <= window.innerWidth=500` — no horizontal overflow.

![375px pills wrap](https://app.devin.ai/attachments/62125d91-40fe-4983-a749-2f2be65146e1/ss_6e4fbf96.png)

### 6. Series card navigation
Clicked the "Magnus Chase and the Gods of Asgard" card on the M page → `/series/magnus-chase-and-the-gods-of-asgard`, H1 "Magnus Chase and the Gods of Asgard Books in Order" with the 5-book Rick Riordan list.

![Magnus Chase page](https://app.devin.ai/attachments/430dfc4a-3de1-4f81-a508-748c4e39d2dc/ss_343a58c6.png)

### 7. Smoke — homepage + tracker (Regression)
Homepage renders fully (hero, Popular series, New & upcoming, Prolific authors). On /series/mistborn, precondition "5 of 8 read (63%)"; ticked The Bands of Mourning → after F5 reload "6 of 8 read (75%)" with the tick persisted.

| Homepage | Tracker persisted after reload |
|---|---|
| ![Homepage](https://app.devin.ai/attachments/09dd5fe8-e9ca-4935-a530-d09fcd6af601/ss_4d07e26e.png) | ![Tracker](https://app.devin.ai/attachments/2a24a431-9438-4440-9ce1-972d101b9b63/ss_zoom_572b3566.png) |

## Coverage notes
- Empty-letter copy ("No series under this letter yet.") not reachable live — every letter currently has series; non-A–Z input is rejected before that branch.
- Shelf import 1.6s reload delay confirmed in deployed source (`public/app.js` `setTimeout(..., 1600)`, commit 3f22b19) but not re-exercised through the import UI this round per the brief's scope.

## Artifacts
- Recording: `/home/ubuntu/screencasts/rec-fd17fc7e-d143-40ea-81e3-46deed4a1ba8/rec-fd17fc7e-d143-40ea-81e3-46deed4a1ba8-edited.mp4`
- Plan: `/home/ubuntu/repos/shelfmark/test-plan-iter10.md`
