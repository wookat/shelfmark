# Shelfmark Continuous Iteration — Round 4 live QA (PR #5)

Live production pass on https://shelfmark.zalize.com (recorded browser run, desktop + 375px mobile; curl for sitemap check). Plan: `test-plan-iter4.md`. Code refs: src/index.ts:443-467 (/new route), src/index.ts:269 (Share chip), public/app.js:92-105 (share/clipboard handler), src/index.ts:604 (/new in sitemap chunk 1).

## Results

### 1. /new page — ✅ passed
Clicked "New" in the header nav → `/new` renders "New & Upcoming Series Books" with a **2026** H2 section; rows show cover thumbnails or initial-letter placeholder tiles; clicked a series link ("The Fragrant Flower Blooms with Dignity") → correct series page loaded. Footer shows "New releases"; `/new` is present in `/sitemaps/1.xml` (curl-verified).

| /new top (2026 section) | Rows with covers/placeholders + series links |
|---|---|
| ![/new page](https://app.devin.ai/attachments/c424af95-31c2-4cc6-9a94-7a1902dc9186/ss_fccac646.png) | ![/new rows](https://app.devin.ai/attachments/4392b181-5064-40a5-9a46-7de3987d37e2/ss_0bf12ec0.png) |

**P2 observation (data curation):** the 2026 section leads with ~15 xkcd entries by Randall Munroe ("16-Part Epoxy", "Aurora Coolness", …) and includes items like "Singapore as Model for Ukraine Russia Peace" — dataset-style noise dominates the flagship new-releases list.

Clicked series link target:

![Series page reached from /new](https://app.devin.ai/attachments/88657df3-6683-4504-a87b-05af3abcb2f1/ss_f9a3855b.png)

### 2. Share button — ✅ passed
On `/series/mistborn`, "Share" chip sits next to the book-count pill. Click → text becomes "**Link copied ✓**" and reverts to "Share" after ~2s (desktop Chrome has no navigator.share, clipboard path used). Clipboard verified by pasting into the search box: exactly `https://shelfmark.zalize.com/series/mistborn`.

| "Link copied ✓" feedback | Clipboard pasted = page URL |
|---|---|
| ![Link copied](https://app.devin.ai/attachments/16413871-19de-432b-b3b9-10440395441a/ss_zoom_c875b66f.png) | ![Pasted URL](https://app.devin.ai/attachments/1c704a92-06c3-4f53-86cf-192c78175135/ss_zoom_bcf1fed3.png) |

navigator.share sheet path not testable on this desktop browser (no Web Share API) — clipboard fallback is the intended desktop behavior per app.js:96-104.

### 3. Round-3 fix: search "Nothing found" — ✅ passed
`/search?q=The Final Empire` shows only the Books section; the "Nothing found. Try a different spelling…" line is gone.

![Books-only search, no Nothing found](https://app.devin.ai/attachments/de82c0ed-a126-45b0-8cff-5ab2b69e9529/ss_98f00543.png)

### 4. Round-3 fix: print preview — ✅ passed
Ctrl+P on `/series/mistborn`: the "2 of 8 read (25%)" pill and the "☑️ Tick a book…" tip line no longer print; header/footer/forms/checkboxes/progress bar remain hidden; white background; Share chip also hidden (print:hidden).

![Clean print preview](https://app.devin.ai/attachments/11a1638f-e92c-4b6c-9ab4-2a72a6e1cd44/ss_zoom_9ad0db88.png)

### 5. Mobile 375px — ✅ passed
`/new` stacks in one column, no horizontal overflow (scrollWidth 485 ≤ innerWidth 500). As designed, "New" is absent from the <sm header nav (reachable via footer "New releases").

![Mobile /new](https://app.devin.ai/attachments/0197fe22-afba-44e9-b410-717623fd1334/ss_beaf15e3.png)

### Not tested
- IndexNow / server-side scripts — no UI path.
- navigator.share native sheet (unavailable on desktop Chrome).

## Artifacts
- Recording: `/home/ubuntu/screencasts/rec-045838c6-d3e4-45d5-b92f-05507796d99e/rec-045838c6-d3e4-45d5-b92f-05507796d99e-edited.mp4`
