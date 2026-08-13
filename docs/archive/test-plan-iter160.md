# R160: data-studies pages (production worker 27f1018e)

Against https://shelfmark.wookat520.workers.dev, cache-busted fresh contexts. Code refs: src/index.ts L310-327 (/studies index, 2 cards), L331-355 (longest-series, 50 rows, book_count>=2 DESC, yearsSpan or "—", genreLabel capitalize), L372-396 (series-length-by-genre, HAVING n>=10 ORDER BY avg DESC, genre links /genres/{gslug}), L58-61 yearsSpan + fmtYear BCE, L1741 llms.txt line, L1795 sitemap urls, src/html.ts L99 footer "Data studies" link in Explore column.

## T1. Three pages 200 + data sanity
- /studies: 200, h1 "Book data studies", exactly 2 cards linking to the two study URLs.
- /studies/longest-series: 200, h1 "The longest book series in the catalog", exactly 50 tbody rows; rank col 1..50; Books col numeric and non-increasing top→bottom, all >=2; zero occurrences of "NaN"/"undefined" in page text; count of "—" cells reported (some allowed for missing author/years, FAIL only if pervasive, e.g. >25% of rows); genre labels human (no raw "spokon"/"business literature"); years cells match /^\d{3,4}(–\d{3,4})?$|BCE|—/.
- /studies/series-length-by-genre: 200, h1 "How long is a book series in each genre?", every row: Series col integer >=10, Avg books decimal >0, Longest integer >= avg; sorted by avg DESC; no NaN/undefined.

## T2. Row links resolve (UI click)
- On longest-series click the rank-1 series link → /series/{slug} 200, h1 contains series name; browser back.
- On series-length-by-genre click the first genre link → /genres/{slug} 200 (not 404), h1 matches genre.

## T3. 375px overflow
- Both study pages at 375px: document.scrollingElement.scrollWidth <= innerWidth (page itself does not scroll horizontally); the table wrapper div has scrollWidth > clientWidth allowed (overflow-x-auto). Screenshots.

## T4. axe + visuals
- axe fresh loads: /studies light+dark, /studies/longest-series light+dark → 0 violations each.
- 1440 screenshots of all three pages (visual sanity: table alignment, no broken layout).

## T5. Wiring
- Footer of / contains link "Data studies" → /studies (click it, land on index). Screenshot of footer.
- /sitemaps/1.xml contains /studies, /studies/longest-series, /studies/series-length-by-genre.
- /llms.txt contains "Data studies" line.

Pass = exact values above; zero pageerrors throughout.
