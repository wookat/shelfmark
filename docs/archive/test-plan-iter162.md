# R162: discovery — new-user UX + visual polish (production worker 2552e13b)

Discovery pass at acceptance-officer bar; report P0/P1/P2 with screenshots, no fixes. Against https://shelfmark.wookat520.workers.dev, cache-busted fresh contexts. Code refs: /studies routes index.ts L310-396; /book route L876+; GENRE_LABELS L1025-1038 (12 mappings incl. R161 additions); wildcard search guard L1162-1200 (R161); tracker entries `shelfmark_read_v1` = {id: {t,title,series,slug}} (app.js change handler); goal key `shelfmark:goal:{year}`; saved key `shelfmark_saved_v1`.

## D1. /studies as first-time visitor
- 1440 light+dark screenshots of /studies, /studies/longest-series, /studies/series-length-by-genre; visual review: table readability, dark-mode contrast of table borders/zebra, header row legibility. Judge: index with only 2 cards — thin? Any onward CTAs?
- Print: emulate media print on longest-series; expect header search/nav chrome hidden (print:hidden pattern) and the table printable without clipping; screenshot.
- Verify R161 genre labels now render in the table (e.g. "school life (anime & manga)", "philosophical dialogue") and the rank-1 years fallback (was "—").

## D2. /book detail polish
- Pick 2 fixtures: a mid-series book with cover (e.g. /book of Mistborn #2 via series page link) and a book w/o cover if found. 1440 light+dark + 375px screenshots; check: cover sizing, prev/next pills truncation, "Also enjoy" cards, breadcrumbs wrap at 375, no horizontal overflow, no NaN/undefined.

## D3. Seeded /shelf + /year-in-books
- Seed localStorage shelfmark_read_v1 with ~8 entries across 2 series (mistborn ids from page DOM, discworld few) with dated timestamps spread over this year + goal key set to 12. Reload /shelf: stats grid (books read=8, series followed=2, read in {year}, most-read), goal progress bar correct (8/12), series sections ordered, no overflow 1440+375; screenshots light/dark.
- /year-in-books: year sections render, counts match seed, reading-card PNG button works (click → download or canvas render), screenshots.

## D4. Full new-user journey (fresh context, UI-only)
- Home → type "murderbot" in hero search → Enter → results page → click series → tick books 1-2 (coach tip + Up next + sr-live) → header My Shelf → shelf shows 2 read + stats → Save for later on series → shelf Share this list → Link copied ✓. Judge friction/coherence at each step; screenshots of any rough spots.

## D5. Dark-mode spot-checks
- /lists/duologies and /similar/mistborn at 1440 dark: screenshot review for contrast/progress-bar/chip issues.

## Output
- Prioritized P0/P1/P2 findings with location + direction; verified-fine list; zero pageerrors expected throughout.
