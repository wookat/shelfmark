# R164: most-prolific-authors study regression (production worker 8c4b64f8)

Against https://shelfmark.wookat520.workers.dev, cache-busted fresh contexts. Code refs: src/index.ts L389-420 (route: authors series_count>=2, aggregate names excluded via LOWER(name) NOT IN ('various authors','various','anonymous','unknown'), ORDER BY book_count DESC LIMIT 50; columns #/Author/Series/Books; author links /authors/{slug}; ItemList JSON-LD), L324 third index card, L1813 llms line.

## T1. New page data
- /studies/most-prolific-authors: 200, h1 "The most prolific series authors in the catalog", exactly 50 rows, ranks 1–50, Books col non-increasing, Series col all >=2, rank 1 = "R. L. Stine"; zero rows named Various Authors/Various/Anonymous/Unknown (case-insensitive); no "NaN"/"undefined" in body text; ItemList JSON-LD with 50 items.

## T2. Links + index
- Click rank-1 author link → /authors/r-l-stine (200, h1 contains "R. L. Stine"); back; click one mid-table author (row ~25) → its /authors/ page 200 with matching h1.
- /studies index: exactly 3 study cards (longest-series, series-length-by-genre, most-prolific-authors), provenance blurb visible, 4-pill onward row present (R163); click the new card → new study page.

## T3. Visual/mobile/axe
- 1440 light + dark screenshots of new page; axe fresh loads light+dark → 0 violations each.
- 375px: document.scrollingElement.scrollWidth == 375 (no page-level horizontal scroll); screenshot.

## T4. Regression: longest-series rank-1 years
- /studies/longest-series row 1 (Kuroko's Basketball) Years cell = "2009–2014" (not "—").

Pass = exact values; zero pageerrors.
