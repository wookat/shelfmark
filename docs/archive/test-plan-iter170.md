# R170: /studies/longest-gaps (production worker b95f8e54)

Regression/verification of the fourth data study. Against https://shelfmark.wookat520.workers.dev, cache-busted fresh Playwright contexts. Code ref: src/index.ts L458-491 (LAG window, rn=1, gap>=10, LIST_BASE, book_count>=3; columns rank/series/author/"N yrs"/"from–to" via fmtYear/books).

## T1. Table data integrity (1440 light)
- HTTP 200, h1 "The longest gaps between books in a series", exactly 50 tbody rows.
- Ranks 1..50 sequential; Gap column parses as "N yrs" with N >= 10 and non-increasing top→bottom.
- For every row: parse Between "from–to" (fmtYear may yield BCE — flag if any); assert from < to and to - from == gap (skip arithmetic only for BCE-formatted rows, report them).
- Rank 1 == Dream Cycle, author H. P. Lovecraft, gap 83 yrs.
- Books column all >= 3. No NaN/undefined/null text anywhere in body.
- ItemList JSON-LD present with numberOfItems == 50.
- Pixel review light + dark screenshots.

## T2. Cross-check 2-3 rows against series pages (UI clicks)
- Click rank-1 series link → /series/{slug} 200, correct h1; page's book list contains a book published in gap_from year and the next published book is in gap_to year (i.e. the two years framing the gap exist and no catalogued book year lies strictly between them).
- Repeat for one mid row (~rank 25) and one low row (~rank 50).

## T3. /studies index
- Exactly 4 cards; new card "The longest waits between books" links /studies/longest-gaps; clicking it navigates to the study. Other 3 cards intact. Pixel review.

## T4. Mobile + a11y + hygiene
- 375px: document.scrollingElement.scrollWidth == 375 (table clips inside overflow-x-auto wrapper).
- axe fresh light load → 0 violations; fresh dark load → 0.
- Zero pageerrors/console errors on all probed pages.
- Sitemap/llms mention: GET /llms.txt contains "longest-gaps"; sitemap part 1 contains the URL.
