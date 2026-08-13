# Shelfmark Round 8 Live QA — /authors A–Z letter navigation (deploy 6416b4e6, PR #6 commit 013c91e)

Tested live on https://shelfmark.zalize.com (recorded browser pass, desktop + ~375px mobile; curl for canonical). Plan: test-plan-iter8.md. Code ref: src/index.ts /authors route (letter pill nav, `/^[A-Z]$/` validation, name-vs-popularity sort, `paginationQ` with letter base, canonical path).

## Summary

All 7 planned checks passed. The empty-state text ("No authors under this letter yet.") could not be exercised: every letter A–Z has authors in the catalog (Q=30, X=29, Z=104 probed) — untested at runtime.

| # | Check | Result |
|---|---|---|
| 1 | Pill nav renders on /authors (All + 26, active pill inverted) | ✅ passed |
| 2 | Click K → only K-authors, name-sorted, K pill active | ✅ passed |
| 3 | Pagination preserves letter (page 2 still K) | ✅ passed |
| 4 | All pill returns to popularity view | ✅ passed |
| 5 | Invalid ?letter=zz falls back to All view | ✅ passed |
| 6 | Mobile ~375px: pills wrap, no overflow | ✅ passed |
| 7 | Smoke: author card → author page | ✅ passed |
| — | Empty-letter state text | ⚪ untested (no empty letter exists in data) |

## 1. Nav renders — ✅

/authors shows "All authors", intro line, then the pill row (All + A–Z) inside `<nav aria-label="Authors by letter">`; the "All" pill is visually inverted (dark bg, light text). List is popularity-sorted (Randall Munroe 3260 books first).

![/authors with A–Z pill nav, All active](https://app.devin.ai/attachments/748f4dd1-5014-4616-b91c-8dd3be6ea1f0/ss_5c6ed309.png)

## 2. Letter K filter — ✅

Clicking K → `/authors?letter=K`; heading "All authors: K", intro "806 authors starting with K. Page 1 of 14."; K pill inverted; every visible card starts with K and the order is alphabetical (K B Wagers, K. A. Bedford, K. A. Wiggins, …), not popularity (book counts are non-monotonic: 10, 5, 2, 4…).

![Letter K view, name-sorted, K pill active](https://app.devin.ai/attachments/634b8b0a-85a5-47dc-9410-1b955896d660/ss_82f68d2f.png)

## 3. Pagination preserves letter — ✅

"Next →" → `/authors?letter=K&page=2`, heading still "All authors: K", "Page 2 of 14", all cards still K, alphabetical continuing (Kamarlo … after page 1's Kamalabai Kibe); Previous/Next links carry `letter=K`. Canonical verified via curl: `<link rel="canonical" href="https://shelfmark.zalize.com/authors?letter=K&page=2">`.

![Page 2 still filtered to K](https://app.devin.ai/attachments/0dee7337-2bd2-46ac-8164-5aab195daf64/ss_a794e22e.png)

## 4. All pill — ✅

Clicking All from the K view → `/authors` with popularity order restored (Munroe/Dickinson/Inamdar top) and the All pill inverted again.

![All pill restores popularity view](https://app.devin.ai/attachments/5a9b69f1-f05e-4ac2-b425-f17d0fd9745c/ss_zoom_1ce8ae5b.png)

## 5. Invalid letter — ✅

`/authors?letter=zz` renders the normal All view ("22,839 authors with series reading orders", All pill active, popularity order) — no error, no empty page.

![?letter=zz falls back to All](https://app.devin.ai/attachments/95ed4b52-1e3b-4318-9caf-7cf9cff11838/ss_zoom_a41f5e9e.png)

## 6. Mobile ~375px — ✅

On `/authors?letter=K` at 375px outer width the pill row wraps to 3 lines (All–L / M–Y / Z), K pill inverted, cards single-column. Console: `scrollWidth 517 ≤ innerWidth 532` — no horizontal overflow.

![375px: pills wrap, no overflow](https://app.devin.ai/attachments/9c9d834d-6e03-4cce-96b9-65562788c3d7/ss_0ddf055c.png)

## 7. Smoke: author card — ✅

Clicked the "K B Wagers" card on the K view → `/authors/k-b-wagers` renders "K B Wagers Books in Order" with the 10-book list.

![K B Wagers author page](https://app.devin.ai/attachments/22698690-ed72-480a-b515-4e37aea74712/ss_fd2e6c17.png)

## Untested

- Empty-letter state "No authors under this letter yet.": no letter A–Z currently has zero authors (validation rejects non-A–Z inputs before reaching the empty state), so this branch was not exercisable live.

## Artifacts

- Recording: /home/ubuntu/screencasts/rec-a28b1404-56c8-4bd5-8a48-3eac00d600d6/rec-a28b1404-56c8-4bd5-8a48-3eac00d600d6-edited.mp4
- Plan: /home/ubuntu/repos/shelfmark/test-plan-iter8.md
